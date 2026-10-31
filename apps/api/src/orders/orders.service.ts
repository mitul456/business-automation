import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  CreateOrderInput,
  OrderStatus,
  PaymentStatus,
  UpdateOrderStatusInput,
} from '@omniflow/shared';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async listOrders(params: {
    tenantId: string;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    customerId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { tenantId, status, paymentStatus, customerId, search, page = 1, limit = 25 } = params;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (customerId) where.customerId = customerId;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { phone: { contains: search } } },
        { courierTrackingId: { contains: search } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          customer: true,
          items: true,
          shipments: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrder(tenantId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
      include: {
        customer: true,
        items: true,
        shipments: true,
        transactions: true,
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  /**
   * Create order with idempotency check, inventory deduction, and customer stats
   */
  async createOrder(tenantId: string, input: CreateOrderInput) {
    // 1. Idempotency check
    if (input.idempotencyKey) {
      const existing = await this.prisma.order.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        include: { items: true, customer: true },
      });
      if (existing) {
        return existing;
      }
    }

    // 2. Calculate subtotal & total
    let subtotal = 0;
    for (const item of input.items) {
      subtotal += item.unitPrice * item.quantity;
    }
    const totalAmount = subtotal + (input.shippingCost || 0) - (input.discount || 0);

    // 3. Generate sequential order number
    const year = new Date().getFullYear();
    const count = await this.prisma.order.count({ where: { tenantId } });
    const orderNumber = `ORD-${year}-${(count + 1).toString().padStart(4, '0')}`;

    return this.prisma.$transaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: {
          tenantId,
          orderNumber,
          customerId: input.customerId,
          conversationId: input.conversationId,
          channelId: input.channelId,
          status: OrderStatus.CONFIRMED,
          subtotal,
          shippingCost: input.shippingCost || 0,
          discount: input.discount || 0,
          totalAmount,
          currency: 'BDT',
          paymentStatus: PaymentStatus.UNPAID,
          paymentMethod: input.paymentMethod,
          shippingAddress: input.shippingAddress as any,
          notes: input.notes,
          idempotencyKey: input.idempotencyKey,
          items: {
            create: input.items.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              totalPrice: item.unitPrice * item.quantity,
            })),
          },
        },
        include: { items: true, customer: true },
      });

      // Decrement stock for ordered items
      for (const item of input.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { decrement: item.quantity },
          },
        });
      }

      // Update customer total metrics
      await tx.customer.update({
        where: { id: input.customerId },
        data: {
          totalOrders: { increment: 1 },
          totalSpent: { increment: totalAmount },
        },
      });

      return order;
    });
  }

  async updateOrderStatus(tenantId: string, orderId: string, input: UpdateOrderStatusInput) {
    const order = await this.getOrder(tenantId, orderId);

    return this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: input.status,
        courierName: input.courierName || order.courierName,
        courierTrackingId: input.courierTrackingId || order.courierTrackingId,
      },
      include: { customer: true, items: true },
    });
  }

  async getInvoiceData(tenantId: string, orderId: string) {
    const order = await this.getOrder(tenantId, orderId);
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });

    return {
      invoiceNumber: `INV-${order.orderNumber}`,
      date: order.createdAt,
      store: {
        name: tenant?.name,
        currency: order.currency,
      },
      customer: {
        name: order.customer.name,
        phone: order.customer.phone,
        address: order.shippingAddress,
      },
      items: order.items,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      discount: order.discount,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
    };
  }
}
