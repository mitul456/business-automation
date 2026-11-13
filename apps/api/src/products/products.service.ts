import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  CreateProductInput,
  ProductStatus,
  AdjustInventoryInput,
} from '@omniflow/shared';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async listProducts(params: {
    tenantId: string;
    categoryId?: string;
    status?: ProductStatus;
    search?: string;
    lowStockOnly?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { tenantId, categoryId, status, search, lowStockOnly, page = 1, limit = 25 } = params;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (lowStockOnly) {
      where.stockQuantity = { lte: 5 };
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProduct(tenantId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId },
      include: {
        category: true,
        inventoryTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async createProduct(tenantId: string, input: CreateProductInput) {
    const existing = await this.prisma.product.findUnique({
      where: { tenantId_sku: { tenantId, sku: input.sku } },
    });
    if (existing) {
      throw new ConflictException(`A product with SKU "${input.sku}" already exists`);
    }

    const initialStock = input.stockQuantity ?? 0;
    const status = initialStock > 0 ? ProductStatus.ACTIVE : ProductStatus.OUT_OF_STOCK;

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          tenantId,
          name: input.name,
          sku: input.sku,
          description: input.description,
          price: input.price,
          compareAtPrice: input.compareAtPrice,
          costPrice: input.costPrice,
          stockQuantity: initialStock,
          lowStockThreshold: input.lowStockThreshold ?? 5,
          variants: (input.variants as any) || null,
          images: (input.images as any) || [],
          visualTags: (input.visualTags as any) || [],
          categoryId: input.categoryId,
          status,
        },
        include: { category: true },
      });

      if (initialStock > 0) {
        await tx.inventoryTransaction.create({
          data: {
            tenantId,
            productId: product.id,
            quantityDelta: initialStock,
            balanceAfter: initialStock,
            type: 'RESTOCK',
            notes: 'Initial opening inventory balance',
          },
        });
      }

      return product;
    });
  }

  async updateProduct(tenantId: string, productId: string, data: Partial<CreateProductInput>) {
    const existing = await this.getProduct(tenantId, productId);

    let newStatus = existing.status;
    if (data.stockQuantity !== undefined) {
      if (data.stockQuantity <= 0 && existing.status === ProductStatus.ACTIVE) {
        newStatus = ProductStatus.OUT_OF_STOCK;
      } else if (data.stockQuantity > 0 && existing.status === ProductStatus.OUT_OF_STOCK) {
        newStatus = ProductStatus.ACTIVE;
      }
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.sku && { sku: data.sku }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.compareAtPrice !== undefined && { compareAtPrice: data.compareAtPrice }),
        ...(data.costPrice !== undefined && { costPrice: data.costPrice }),
        ...(data.stockQuantity !== undefined && { stockQuantity: data.stockQuantity }),
        ...(data.lowStockThreshold !== undefined && { lowStockThreshold: data.lowStockThreshold }),
        ...(data.variants !== undefined && { variants: data.variants as any }),
        ...(data.images !== undefined && { images: data.images as any }),
        ...(data.visualTags !== undefined && { visualTags: data.visualTags as any }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        status: newStatus,
      },
      include: { category: true },
    });
  }

  async deleteProduct(tenantId: string, productId: string) {
    await this.getProduct(tenantId, productId);
    return this.prisma.product.delete({
      where: { id: productId },
    });
  }

  /**
   * Transaction-safe stock adjustments (restocks, manual adjustments, damage/loss)
   */
  async adjustStock(tenantId: string, productId: string, input: AdjustInventoryInput) {
    const product = await this.getProduct(tenantId, productId);

    const newStock = product.stockQuantity + input.quantityDelta;
    if (newStock < 0) {
      throw new BadRequestException(
        `Insufficient stock quantity. Current: ${product.stockQuantity}, requested adjustment: ${input.quantityDelta}`
      );
    }

    const newStatus =
      newStock === 0
        ? ProductStatus.OUT_OF_STOCK
        : product.status === ProductStatus.OUT_OF_STOCK
        ? ProductStatus.ACTIVE
        : product.status;

    return this.prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          stockQuantity: newStock,
          status: newStatus,
        },
      });

      const txRecord = await tx.inventoryTransaction.create({
        data: {
          tenantId,
          productId,
          quantityDelta: input.quantityDelta,
          balanceAfter: newStock,
          type: input.type,
          notes: input.notes,
          referenceId: input.referenceId,
        },
      });

      return {
        product: updatedProduct,
        transaction: txRecord,
      };
    });
  }

  async listInventoryTransactions(tenantId: string, productId?: string) {
    const where: any = { tenantId };
    if (productId) where.productId = productId;

    return this.prisma.inventoryTransaction.findMany({
      where,
      include: { product: { select: { id: true, name: true, sku: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getLowStockAlerts(tenantId: string) {
    return this.prisma.product.findMany({
      where: {
        tenantId,
        stockQuantity: { lte: 5 },
        status: { in: [ProductStatus.ACTIVE, ProductStatus.OUT_OF_STOCK] },
      },
      include: { category: true },
      orderBy: { stockQuantity: 'asc' },
    });
  }

  async importProductsCsv(tenantId: string, csvContent: string) {
    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      throw new BadRequestException('CSV content must contain a header and at least one data row');
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const nameIdx = headers.indexOf('name');
    const skuIdx = headers.indexOf('sku');
    const priceIdx = headers.indexOf('price');
    const stockIdx = headers.indexOf('stock');

    if (nameIdx === -1 || skuIdx === -1 || priceIdx === -1) {
      throw new BadRequestException('CSV missing mandatory columns: name, sku, price');
    }

    const created: any[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      const name = cols[nameIdx];
      const sku = cols[skuIdx];
      const price = parseFloat(cols[priceIdx]);
      const stock = stockIdx !== -1 ? parseInt(cols[stockIdx] || '0', 10) : 0;

      if (!name || !sku || isNaN(price)) {
        errors.push(`Row ${i + 1}: Invalid required values`);
        continue;
      }

      try {
        const item = await this.prisma.product.upsert({
          where: { tenantId_sku: { tenantId, sku } },
          create: {
            tenantId,
            name,
            sku,
            price,
            stockQuantity: isNaN(stock) ? 0 : stock,
            images: [],
            status: stock > 0 ? ProductStatus.ACTIVE : ProductStatus.OUT_OF_STOCK,
          },
          update: {
            name,
            price,
            stockQuantity: isNaN(stock) ? 0 : stock,
          },
        });
        created.push(item);
      } catch (err: any) {
        errors.push(`Row ${i + 1} (${sku}): ${err.message}`);
      }
    }

    return {
      importedCount: created.length,
      errors,
    };
  }

  async exportProductsCsv(tenantId: string): Promise<string> {
    const products = await this.prisma.product.findMany({
      where: { tenantId },
      include: { category: true },
      orderBy: { name: 'asc' },
    });

    const headers = 'ID,Name,SKU,Category,Price,CompareAtPrice,StockQuantity,Status';
    const rows = products.map((p) =>
      [
        p.id,
        `"${p.name.replace(/"/g, '""')}"`,
        p.sku,
        p.category?.name ? `"${p.category.name}"` : '',
        p.price.toString(),
        p.compareAtPrice?.toString() || '',
        p.stockQuantity,
        p.status,
      ].join(',')
    );

    return [headers, ...rows].join('\n');
  }

  async listCategories(tenantId: string) {
    return this.prisma.category.findMany({
      where: { tenantId },
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(tenantId: string, data: { name: string; slug: string; description?: string }) {
    const existing = await this.prisma.category.findUnique({
      where: { tenantId_slug: { tenantId, slug: data.slug } },
    });
    if (existing) {
      throw new ConflictException(`Category slug "${data.slug}" already exists`);
    }

    return this.prisma.category.create({
      data: {
        tenantId,
        name: data.name,
        slug: data.slug,
        description: data.description,
      },
    });
  }

  async updateCategory(tenantId: string, categoryId: string, data: { name?: string; description?: string }) {
    const cat = await this.prisma.category.findFirst({
      where: { id: categoryId, tenantId },
    });
    if (!cat) throw new NotFoundException('Category not found');

    return this.prisma.category.update({
      where: { id: categoryId },
      data,
    });
  }

  async deleteCategory(tenantId: string, categoryId: string) {
    const cat = await this.prisma.category.findFirst({
      where: { id: categoryId, tenantId },
    });
    if (!cat) throw new NotFoundException('Category not found');

    return this.prisma.category.delete({
      where: { id: categoryId },
    });
  }
}
