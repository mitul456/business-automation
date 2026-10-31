import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProductInput, ProductStatus } from '@omniflow/shared';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async listProducts(params: {
    tenantId: string;
    categoryId?: string;
    status?: ProductStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { tenantId, categoryId, status, search, page = 1, limit = 25 } = params;
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
      include: { category: true },
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

    return this.prisma.product.create({
      data: {
        tenantId,
        name: input.name,
        sku: input.sku,
        description: input.description,
        price: input.price,
        compareAtPrice: input.compareAtPrice,
        costPrice: input.costPrice,
        stockQuantity: input.stockQuantity ?? 0,
        images: (input.images as any) || [],
        visualTags: (input.visualTags as any) || [],
        categoryId: input.categoryId,
        status: ProductStatus.ACTIVE,
      },
    });
  }

  async updateProduct(tenantId: string, productId: string, data: Partial<CreateProductInput>) {
    await this.getProduct(tenantId, productId);
    return this.prisma.product.update({
      where: { id: productId },
      data: {
        ...data,
        images: data.images ? (data.images as any) : undefined,
        visualTags: data.visualTags ? (data.visualTags as any) : undefined,
      },
    });
  }

  async deleteProduct(tenantId: string, productId: string) {
    await this.getProduct(tenantId, productId);
    return this.prisma.product.delete({
      where: { id: productId },
    });
  }

  async listCategories(tenantId: string) {
    return this.prisma.category.findMany({
      where: { tenantId },
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(tenantId: string, data: { name: string; slug: string; description?: string }) {
    return this.prisma.category.create({
      data: {
        tenantId,
        name: data.name,
        slug: data.slug,
        description: data.description,
      },
    });
  }
}
