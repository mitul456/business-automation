import { OrdersService } from '../src/orders/orders.service';
import { PaymentMethod, OrderStatus } from '@omniflow/shared';

describe('OrdersService - Idempotency & Order Lifecycle', () => {
  let ordersService: OrdersService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      order: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(10),
      },
      product: {
        update: jest.fn(),
      },
      customer: {
        update: jest.fn(),
      },
      inventoryTransaction: {
        create: jest.fn(),
      },
      customerTimelineEvent: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(mockPrisma)),
    };

    ordersService = new OrdersService(mockPrisma);
  });

  it('should return existing order when idempotent key is repeated (Idempotency guarantee)', async () => {
    const existingOrder = {
      id: 'order-existing',
      orderNumber: 'ORD-2026-0005',
      idempotencyKey: 'idemp-token-abc',
      totalAmount: 2500,
      status: OrderStatus.CONFIRMED,
    };

    mockPrisma.order.findUnique.mockResolvedValue(existingOrder);

    const result = await ordersService.createOrder('tenant-1', {
      customerId: 'cust-1',
      idempotencyKey: 'idemp-token-abc',
      items: [
        {
          productId: 'prod-1',
          productName: 'Panjabi',
          unitPrice: 2500,
          quantity: 1,
        },
      ],
      shippingCost: 0,
      discount: 0,
      shippingAddress: {
        recipientName: 'Tanvir',
        phone: '01700000000',
        address: 'Uttara',
        city: 'Dhaka',
      },
      paymentMethod: PaymentMethod.COD,
    });

    expect(result.id).toBe('order-existing');
    // Ensure duplicate order was NOT created and stock was NOT decremented again
    expect(mockPrisma.order.create).not.toHaveBeenCalled();
    expect(mockPrisma.product.update).not.toHaveBeenCalled();
  });

  it('should compute correct subtotal, create order, and decrement product stock', async () => {
    mockPrisma.order.findUnique.mockResolvedValue(null);
    mockPrisma.product.update.mockResolvedValue({ id: 'prod-1', stockQuantity: 8 });
    mockPrisma.order.create.mockImplementation(({ data }) => ({
      id: 'order-new-1',
      ...data,
    }));

    const result = await ordersService.createOrder('tenant-1', {
      customerId: 'cust-1',
      items: [
        {
          productId: 'prod-1',
          productName: 'Royal Navy Panjabi',
          unitPrice: 2850,
          quantity: 2,
        },
      ],
      shippingCost: 60,
      discount: 100,
      shippingAddress: {
        recipientName: 'Tanvir',
        phone: '01712345678',
        address: 'House 42, Road 11',
        city: 'Dhaka',
      },
      paymentMethod: PaymentMethod.COD,
    });

    // Subtotal: 2850 * 2 = 5700. Total: 5700 + 60 - 100 = 5660
    expect(result.subtotal).toBe(5700);
    expect(result.totalAmount).toBe(5660);
    expect(mockPrisma.product.update).toHaveBeenCalledWith({
      where: { id: 'prod-1' },
      data: { stockQuantity: { decrement: 2 } },
    });
  });

  it('should restore inventory and log inventory transaction when order is cancelled', async () => {
    const existingOrder = {
      id: 'order-to-cancel',
      orderNumber: 'ORD-2026-0044',
      customerId: 'cust-1',
      totalAmount: 1850,
      status: OrderStatus.CONFIRMED,
      items: [
        {
          productId: 'prod-shirt',
          quantity: 2,
        },
      ],
    };

    mockPrisma.order.findFirst.mockResolvedValue(existingOrder);
    mockPrisma.order.update.mockResolvedValue({
      ...existingOrder,
      status: OrderStatus.CANCELLED,
    });
    mockPrisma.product.update.mockResolvedValue({
      id: 'prod-shirt',
      stockQuantity: 22,
    });

    const result = await ordersService.cancelOrder('tenant-1', 'order-to-cancel', 'Customer changed mind');

    expect(result.status).toBe(OrderStatus.CANCELLED);
    expect(mockPrisma.product.update).toHaveBeenCalledWith({
      where: { id: 'prod-shirt' },
      data: { stockQuantity: { increment: 2 } },
    });
    expect(mockPrisma.inventoryTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'ORDER_CANCEL_RESTORE',
          quantityDelta: 2,
        }),
      })
    );
  });
});
