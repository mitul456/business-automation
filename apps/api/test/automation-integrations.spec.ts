import { WorkflowsService } from '../src/workflows/workflows.service';
import { PaymentsService } from '../src/payments/payments.service';
import { CouriersService } from '../src/couriers/couriers.service';
import {
  WorkflowTriggerType,
  WorkflowActionType,
  PaymentProvider,
  PaymentStatus,
  CourierProvider,
  ShipmentStatus,
  OrderStatus,
  ConversationStatus,
  LeadStage,
} from '@omniflow/shared';

describe('Phase 8-9: Automation Engine, Payment Gateways & Courier Integrations', () => {
  let workflowsService: WorkflowsService;
  let paymentsService: PaymentsService;
  let couriersService: CouriersService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      workflow: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      workflowStep: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      workflowExecution: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'exec-1', ...data })),
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      message: {
        create: jest.fn().mockResolvedValue({ id: 'msg-1' }),
      },
      conversation: {
        update: jest.fn().mockResolvedValue({ id: 'conv-1' }),
      },
      customer: {
        findFirst: jest.fn(),
        update: jest.fn().mockResolvedValue({ id: 'cust-1' }),
      },
      customerTimelineEvent: {
        create: jest.fn().mockResolvedValue({ id: 'evt-1' }),
      },
      followUp: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'fu-1', ...data })),
      },
      order: {
        findFirst: jest.fn(),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'ord-1', ...data })),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'ord-1', ...data })),
      },
      paymentIntegration: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      paymentTransaction: {
        findFirst: jest.fn(),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'tx-1', ...data })),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'tx-1', ...data })),
      },
      courierSetting: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      shipment: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'shp-1', ...data })),
        findMany: jest.fn(),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'shp-1', ...data })),
      },
      $transaction: jest.fn(async (arg) => {
        if (typeof arg === 'function') {
          return arg(mockPrisma);
        }
        return Promise.all(arg);
      }),
    };

    workflowsService = new WorkflowsService(mockPrisma);
    paymentsService = new PaymentsService(mockPrisma);
    couriersService = new CouriersService(mockPrisma);
  });

  describe('1. Automation Workflow Engine', () => {
    it('should evaluate trigger conditions and execute sequential actions', async () => {
      const activeWorkflow = {
        id: 'wf-101',
        tenantId: 'tenant-1',
        triggerType: WorkflowTriggerType.PAYMENT_RECEIVED,
        triggerConfig: { 'order.totalAmount': { operator: '>=', value: 2000 } },
        isActive: true,
        steps: [
          {
            stepOrder: 1,
            actionType: WorkflowActionType.ADD_CUSTOMER_TAG,
            actionConfig: { tag: 'VIP' },
          },
          {
            stepOrder: 2,
            actionType: WorkflowActionType.SCHEDULE_FOLLOWUP,
            actionConfig: { title: 'VIP Thank You Call', delayHours: 24 },
          },
          {
            stepOrder: 3,
            actionType: WorkflowActionType.ESCALATE_TO_HUMAN,
            actionConfig: {},
          },
        ],
      };

      mockPrisma.workflow.findMany.mockResolvedValue([activeWorkflow]);
      mockPrisma.customer.findFirst.mockResolvedValue({
        id: 'cust-1',
        tags: ['New Customer'],
      });

      const context = {
        customerId: 'cust-1',
        conversationId: 'conv-1',
        order: {
          id: 'ord-101',
          totalAmount: 3500,
        },
      };

      const results = await workflowsService.executeTrigger(
        'tenant-1',
        WorkflowTriggerType.PAYMENT_RECEIVED,
        context
      );

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('SUCCESS');
      expect(mockPrisma.customer.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cust-1' },
          data: { tags: ['New Customer', 'VIP'] },
        })
      );
      expect(mockPrisma.followUp.create).toHaveBeenCalled();
      expect(mockPrisma.conversation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'conv-1' },
          data: expect.objectContaining({ status: ConversationStatus.HUMAN_HANDOVER }),
        })
      );
      expect(mockPrisma.workflowExecution.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            workflowId: 'wf-101',
            status: 'SUCCESS',
            triggerEvent: WorkflowTriggerType.PAYMENT_RECEIVED,
          }),
        })
      );
    });

    it('should skip workflow execution when trigger condition fails', async () => {
      const activeWorkflow = {
        id: 'wf-102',
        tenantId: 'tenant-1',
        triggerType: WorkflowTriggerType.PAYMENT_RECEIVED,
        triggerConfig: { 'order.totalAmount': { operator: '>=', value: 5000 } },
        isActive: true,
        steps: [
          {
            stepOrder: 1,
            actionType: WorkflowActionType.ADD_CUSTOMER_TAG,
            actionConfig: { tag: 'SUPER_VIP' },
          },
        ],
      };

      mockPrisma.workflow.findMany.mockResolvedValue([activeWorkflow]);

      // Context with totalAmount 1500 (less than 5000)
      const context = {
        customerId: 'cust-1',
        order: { totalAmount: 1500 },
      };

      const results = await workflowsService.executeTrigger(
        'tenant-1',
        WorkflowTriggerType.PAYMENT_RECEIVED,
        context
      );

      expect(results).toHaveLength(0);
      expect(mockPrisma.customer.update).not.toHaveBeenCalled();
    });

    it('should perform dry-run workflow testing with diagnostic trace', async () => {
      mockPrisma.workflow.findFirst.mockResolvedValue({
        id: 'wf-test',
        name: 'Test Workflow',
        triggerType: WorkflowTriggerType.NEW_MESSAGE,
        triggerConfig: { 'customer.city': 'Dhaka' },
        steps: [
          {
            stepOrder: 1,
            actionType: WorkflowActionType.SEND_MESSAGE,
            actionConfig: { message: 'Welcome {{customer.name}}!' },
          },
        ],
      });

      const testRun = await workflowsService.testWorkflow('tenant-1', 'wf-test', {
        customer: { name: 'Rahat', city: 'Dhaka' },
      });

      expect(testRun.success).toBe(true);
      expect(testRun.trace).toBeDefined();
      expect(testRun.trace[0].matched).toBe(true);
      expect(testRun.trace[1].status).toBe('WOULD_EXECUTE');
    });

    it('should retry a failed execution and increment retry count', async () => {
      mockPrisma.workflowExecution.findFirst.mockResolvedValue({
        id: 'exec-fail-1',
        workflowId: 'wf-1',
        retryCount: 0,
        contextData: { customerId: 'cust-1', conversationId: 'conv-1' },
        workflow: {
          id: 'wf-1',
          triggerType: WorkflowTriggerType.NEW_MESSAGE,
          steps: [
            {
              stepOrder: 1,
              actionType: WorkflowActionType.CREATE_LEAD,
              actionConfig: { leadStage: LeadStage.QUALIFIED },
            },
          ],
        },
      });

      const retryResult = await workflowsService.retryExecution('tenant-1', 'exec-fail-1');

      expect(retryResult.status).toBe('SUCCESS');
      expect(retryResult.retryCount).toBe(1);
    });
  });

  describe('2. Payment Gateway Adapters & Idempotency', () => {
    it('should initiate payment and return gateway URL', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({
        id: 'ord-1',
        orderNumber: 'ORD-9901',
        totalAmount: 1500,
        customer: { name: 'Tanvir', phone: '01700000000' },
        items: [],
      });
      mockPrisma.paymentIntegration.findFirst.mockResolvedValue(null);

      const res: any = await paymentsService.initiatePayment({
        tenantId: 'tenant-1',
        orderId: 'ord-1',
        provider: PaymentProvider.BKASH,
        callbackUrl: 'https://omniflow.app/callback',
      });

      expect(res.paymentID).toBeDefined();
      expect(res.bkashURL).toBeDefined();
    });

    it('should verify payment server-side, create transaction, and update order status', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({
        id: 'ord-1',
        customerId: 'cust-1',
        orderNumber: 'ORD-9901',
        totalAmount: 1500,
      });
      mockPrisma.paymentIntegration.findFirst.mockResolvedValue(null);
      mockPrisma.paymentTransaction.findFirst.mockResolvedValue(null); // Not previously processed

      const verification = await paymentsService.verifyPayment({
        tenantId: 'tenant-1',
        orderId: 'ord-1',
        provider: PaymentProvider.BKASH,
        verificationId: 'TRX_TEST_12345',
      });

      expect(verification.status).toBe('SUCCESS');
      expect(mockPrisma.paymentTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orderId: 'ord-1',
            status: PaymentStatus.PAID,
            provider: PaymentProvider.BKASH,
          }),
        })
      );
      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ord-1' },
          data: { paymentStatus: PaymentStatus.PAID },
        })
      );
      expect(mockPrisma.customerTimelineEvent.create).toHaveBeenCalled();
    });

    it('should enforce idempotency and not re-process duplicate payment transaction IDs', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({
        id: 'ord-1',
        customerId: 'cust-1',
        totalAmount: 1500,
      });
      mockPrisma.paymentIntegration.findFirst.mockResolvedValue(null);

      // Existing transaction already recorded with this TRX
      mockPrisma.paymentTransaction.findFirst.mockResolvedValue({
        id: 'existing-tx-id',
        transactionId: 'TRX_DUPLICATE_999',
        status: PaymentStatus.PAID,
      });

      const result = await paymentsService.verifyPayment({
        tenantId: 'tenant-1',
        orderId: 'ord-1',
        provider: PaymentProvider.BKASH,
        verificationId: 'TRX_DUPLICATE_999',
      });

      expect(result.status).toBe('ALREADY_PROCESSED');
      expect(mockPrisma.paymentTransaction.create).not.toHaveBeenCalled();
    });

    it('should process payment refund and log timeline event', async () => {
      mockPrisma.paymentTransaction.findFirst.mockResolvedValue({
        id: 'tx-refund-1',
        orderId: 'ord-1',
        order: { customerId: 'cust-1' },
      });

      const refundResult = await paymentsService.refundPayment({
        tenantId: 'tenant-1',
        orderId: 'ord-1',
        transactionId: 'TRX_REFUND_01',
        refundAmount: 1500,
        reason: 'Customer returned item',
      });

      expect(refundResult.status).toBe('REFUNDED');
      expect(mockPrisma.paymentTransaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: PaymentStatus.REFUNDED },
        })
      );
      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { paymentStatus: PaymentStatus.REFUNDED },
        })
      );
    });
  });

  describe('3. Courier Logistics Adapters & Status Sync', () => {
    it('should create shipment on Steadfast Courier and transition order to SHIPPED', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({
        id: 'ord-ship-1',
        orderNumber: 'ORD-7712',
        customerId: 'cust-1',
        totalAmount: 2200,
        paymentStatus: 'UNPAID',
        customer: { name: 'Karim', phone: '01811223344', address: 'Banani', city: 'Dhaka' },
        shippingAddress: { address: 'House 10, Road 5', city: 'Dhaka' },
      });
      mockPrisma.courierSetting.findFirst.mockResolvedValue(null);

      const shipmentResult = await couriersService.createShipment(
        'tenant-1',
        'ord-ship-1',
        CourierProvider.STEADFAST
      );

      expect(shipmentResult.success).toBe(true);
      expect(shipmentResult.consignmentId).toBeDefined();
      expect(shipmentResult.trackingCode).toBeDefined();
      expect(mockPrisma.shipment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            courier: CourierProvider.STEADFAST,
            status: ShipmentStatus.ACCEPTED,
          }),
        })
      );
      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ord-ship-1' },
          data: expect.objectContaining({
            status: OrderStatus.SHIPPED,
            courierName: 'Steadfast Courier',
          }),
        })
      );
    });

    it('should create shipment on Pathao Courier and record consignment ID', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({
        id: 'ord-pathao-1',
        orderNumber: 'ORD-PATHAO-1',
        customerId: 'cust-2',
        totalAmount: 1800,
        paymentStatus: 'PAID',
        customer: { name: 'Ayesha', phone: '01911223344', address: 'Dhanmondi', city: 'Dhaka' },
        shippingAddress: { address: 'Road 27', city: 'Dhaka' },
      });
      mockPrisma.courierSetting.findFirst.mockResolvedValue(null);

      const result = await couriersService.createShipment(
        'tenant-1',
        'ord-pathao-1',
        CourierProvider.PATHAO
      );

      expect(result.success).toBe(true);
      expect(result.consignmentId).toBeDefined();
      expect(mockPrisma.shipment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ courier: CourierProvider.PATHAO }),
        })
      );
    });

    it('should synchronize delivery statuses for active shipments and update order to DELIVERED', async () => {
      mockPrisma.shipment.findMany.mockResolvedValue([
        {
          id: 'shp-live-1',
          orderId: 'ord-deliv-1',
          consignmentId: '109283',
          trackingCode: 'ST-109283',
          courier: CourierProvider.STEADFAST,
          status: ShipmentStatus.ACCEPTED,
          order: { customerId: 'cust-1' },
        },
      ]);
      mockPrisma.courierSetting.findFirst.mockResolvedValue(null);

      // Mock trackParcel response indicating delivered
      jest.spyOn(couriersService, 'trackParcel').mockResolvedValue({
        status: 'delivered',
        trackingCode: 'ST-109283',
      });

      const syncResult = await couriersService.syncDeliveryStatuses('tenant-1');

      expect(syncResult.syncedCount).toBe(1);
      expect(syncResult.updatedCount).toBe(1);
      expect(mockPrisma.shipment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'shp-live-1' },
          data: { status: ShipmentStatus.DELIVERED },
        })
      );
      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ord-deliv-1' },
          data: { status: OrderStatus.DELIVERED },
        })
      );
    });
  });
});
