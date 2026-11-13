import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  CreateOrderInput,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
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

      // Decrement stock and record inventory transaction
      for (const item of input.items) {
        const prod = await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { decrement: item.quantity },
          },
        });

        await tx.inventoryTransaction.create({
          data: {
            tenantId,
            productId: item.productId,
            quantityDelta: -item.quantity,
            balanceAfter: prod?.stockQuantity ?? 0,
            type: 'ORDER_DEDUCTION',
            referenceId: order.id,
            notes: `Stock deducted for Order #${order.orderNumber}`,
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

      // Log Customer Timeline Event
      await tx.customerTimelineEvent.create({
        data: {
          tenantId,
          customerId: input.customerId,
          eventType: 'ORDER_CREATED',
          title: `Placed Order #${order.orderNumber}`,
          description: `Total: ৳${totalAmount.toLocaleString()} (${input.items.length} item${
            input.items.length > 1 ? 's' : ''
          })`,
          metadata: { orderId: order.id, totalAmount },
        },
      });

      return order;
    });
  }

  async updateOrderStatus(tenantId: string, orderId: string, input: UpdateOrderStatusInput) {
    const order = await this.getOrder(tenantId, orderId);

    if (input.status === OrderStatus.CANCELLED && order.status !== OrderStatus.CANCELLED) {
      return this.cancelOrder(tenantId, orderId, 'Cancelled by operator');
    }

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: input.status,
        courierName: input.courierName || order.courierName,
        courierTrackingId: input.courierTrackingId || order.courierTrackingId,
      },
      include: { customer: true, items: true },
    });

    // Record timeline event
    await this.prisma.customerTimelineEvent.create({
      data: {
        tenantId,
        customerId: order.customerId,
        eventType: 'ORDER_STATUS_CHANGED',
        title: `Order #${order.orderNumber} Status Updated`,
        description: `Status changed to ${input.status}`,
        metadata: { orderId: order.id, newStatus: input.status },
      },
    });

    return updated;
  }

  /**
   * Cancel order: restores stock quantities, logs inventory reversal, updates customer metrics
   */
  async cancelOrder(tenantId: string, orderId: string, reason?: string) {
    const order = await this.getOrder(tenantId, orderId);

    if (order.status === OrderStatus.CANCELLED) {
      return order; // Already cancelled
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Update order status
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CANCELLED,
          notes: reason ? `${order.notes ? order.notes + '\n' : ''}Cancellation reason: ${reason}` : order.notes,
        },
        include: { customer: true, items: true },
      });

      // 2. Restore inventory quantities and log transactions
      for (const item of order.items) {
        const prod = await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { increment: item.quantity },
          },
        });

        await tx.inventoryTransaction.create({
          data: {
            tenantId,
            productId: item.productId,
            quantityDelta: item.quantity,
            balanceAfter: prod.stockQuantity,
            type: 'ORDER_CANCEL_RESTORE',
            referenceId: order.id,
            notes: `Inventory restored due to cancellation of Order #${order.orderNumber}`,
          },
        });
      }

      // 3. Decrement customer total metrics
      await tx.customer.update({
        where: { id: order.customerId },
        data: {
          totalOrders: { decrement: 1 },
          totalSpent: { decrement: order.totalAmount },
        },
      });

      // 4. Log timeline event
      await tx.customerTimelineEvent.create({
        data: {
          tenantId,
          customerId: order.customerId,
          eventType: 'ORDER_CANCELLED',
          title: `Order #${order.orderNumber} Cancelled`,
          description: reason || 'Order cancelled and stock restored to inventory',
          metadata: { orderId: order.id },
        },
      });

      return updatedOrder;
    });
  }

  async updatePaymentStatus(
    tenantId: string,
    orderId: string,
    data: { paymentStatus: PaymentStatus; paymentMethod?: PaymentMethod }
  ) {
    const order = await this.getOrder(tenantId, orderId);

    return this.prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: data.paymentStatus,
        ...(data.paymentMethod && { paymentMethod: data.paymentMethod }),
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
        country: tenant?.country,
      },
      customer: {
        name: order.customer.name,
        phone: order.customer.phone,
        email: order.customer.email,
        address: order.shippingAddress,
      },
      items: order.items,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      discount: order.discount,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      courierName: order.courierName,
      courierTrackingId: order.courierTrackingId,
    };
  }
}
