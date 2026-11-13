import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductsService } from '../src/products/products.service';
import { CustomersService } from '../src/customers/customers.service';
import { BookingsService } from '../src/bookings/bookings.service';
import { ProductStatus, LeadStage, BookingStatus } from '@omniflow/shared';

describe('OmniFlow Business Operations Test Suite (Phase 5)', () => {
  const TENANT_ID = 'tenant-test-123';
  let mockPrisma: any;
  let productsService: ProductsService;
  let customersService: CustomersService;
  let bookingsService: BookingsService;

  beforeEach(() => {
    mockPrisma = {
      product: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        upsert: jest.fn(),
      },
      category: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
      },
      inventoryTransaction: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      customer: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      customerTimelineEvent: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      followUp: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      bookingService: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      bookingAppointment: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => (typeof cb === 'function' ? cb(mockPrisma) : cb)),
    };

    productsService = new ProductsService(mockPrisma);
    customersService = new CustomersService(mockPrisma);
    bookingsService = new BookingsService(mockPrisma);
  });

  // -------------------------------------------------------------
  // 1. Product Management & Inventory Ledger
  // -------------------------------------------------------------
  describe('Product Management & Inventory Ledger', () => {
    it('should reject product creation if SKU already exists for the workspace', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'existing-p1',
        sku: 'OXF-001',
      });

      await expect(
        productsService.createProduct(TENANT_ID, {
          name: 'Oxford Shirt',
          sku: 'OXF-001',
          price: 1850,
          stockQuantity: 10,
          images: [],
        })
      ).rejects.toThrow(ConflictException);
    });

    it('should create product with opening stock and log an initial RESTOCK inventory transaction', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);
      mockPrisma.product.create.mockResolvedValue({
        id: 'new-prod-1',
        tenantId: TENANT_ID,
        name: 'Denim Jacket',
        sku: 'JAC-001',
        price: 3200,
        stockQuantity: 15,
        status: ProductStatus.ACTIVE,
      });

      const prod = await productsService.createProduct(TENANT_ID, {
        name: 'Denim Jacket',
        sku: 'JAC-001',
        price: 3200,
        stockQuantity: 15,
        images: ['https://cdn.example.com/jacket.jpg'],
      });

      expect(prod.id).toBe('new-prod-1');
      expect(mockPrisma.inventoryTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            productId: 'new-prod-1',
            quantityDelta: 15,
            type: 'RESTOCK',
          }),
        })
      );
    });

    it('should safely adjust stock and record ledger transaction', async () => {
      mockPrisma.product.findFirst.mockResolvedValue({
        id: 'prod-adj-1',
        tenantId: TENANT_ID,
        stockQuantity: 20,
        status: ProductStatus.ACTIVE,
      });

      mockPrisma.product.update.mockResolvedValue({
        id: 'prod-adj-1',
        stockQuantity: 25,
        status: ProductStatus.ACTIVE,
      });

      const res = await productsService.adjustStock(TENANT_ID, 'prod-adj-1', {
        quantityDelta: 5,
        type: 'RESTOCK',
        notes: 'Warehouse arrival Batch #42',
      });

      expect(res.product.stockQuantity).toBe(25);
      expect(mockPrisma.inventoryTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            productId: 'prod-adj-1',
            quantityDelta: 5,
            balanceAfter: 25,
            type: 'RESTOCK',
          }),
        })
      );
    });

    it('should reject adjustment if deduction exceeds available stock (preventing negative inventory)', async () => {
      mockPrisma.product.findFirst.mockResolvedValue({
        id: 'prod-low',
        stockQuantity: 3,
        status: ProductStatus.ACTIVE,
      });

      await expect(
        productsService.adjustStock(TENANT_ID, 'prod-low', {
          quantityDelta: -10,
          type: 'DAMAGE_LOSS',
        })
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.product.update).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------
  // 2. Customer CRM & Lead Management
  // -------------------------------------------------------------
  describe('Customer CRM & Lead Pipeline', () => {
    it('should calculate customer segmentation metrics accurately', async () => {
      mockPrisma.customer.count
        .mockResolvedValueOnce(50) // Total
        .mockResolvedValueOnce(8)  // VIP
        .mockResolvedValueOnce(20) // Regular
        .mockResolvedValueOnce(22); // Leads

      mockPrisma.customer.groupBy.mockResolvedValue([
        { leadStage: LeadStage.NEW, _count: 15 },
        { leadStage: LeadStage.QUALIFIED, _count: 7 },
        { leadStage: LeadStage.WON, _count: 28 },
      ]);

      const segments = await customersService.getCustomerSegments(TENANT_ID);

      expect(segments.totalCustomers).toBe(50);
      expect(segments.segments.vip).toBe(8);
      expect(segments.segments.regular).toBe(20);
      expect(segments.segments.leads).toBe(22);
      expect(segments.stages[LeadStage.WON]).toBe(28);
    });

    it('should transition lead stage and log customer timeline event', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue({
        id: 'cust-lead-1',
        tenantId: TENANT_ID,
        name: 'Rahim Khan',
        leadStage: LeadStage.CONTACTED,
      });

      mockPrisma.customer.update.mockResolvedValue({
        id: 'cust-lead-1',
        leadStage: LeadStage.QUALIFIED,
      });

      const updated = await customersService.updateLeadStage(TENANT_ID, 'cust-lead-1', LeadStage.QUALIFIED);

      expect(updated.leadStage).toBe(LeadStage.QUALIFIED);
      expect(mockPrisma.customerTimelineEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customerId: 'cust-lead-1',
            eventType: 'STAGE_CHANGED',
            metadata: { from: LeadStage.CONTACTED, to: LeadStage.QUALIFIED },
          }),
        })
      );
    });

    it('should create and complete a follow-up reminder task', async () => {
      mockPrisma.customer.findFirst.mockResolvedValue({ id: 'cust-1', tenantId: TENANT_ID });
      mockPrisma.followUp.create.mockResolvedValue({
        id: 'task-1',
        customerId: 'cust-1',
        title: 'Call back regarding Panjabi sizing',
        dueDate: new Date('2026-11-05'),
        isCompleted: false,
      });

      const task = await customersService.createFollowUp(TENANT_ID, {
        customerId: 'cust-1',
        title: 'Call back regarding Panjabi sizing',
        dueDate: '2026-11-05T14:00:00Z',
      });

      expect(task.title).toBe('Call back regarding Panjabi sizing');

      mockPrisma.followUp.findFirst.mockResolvedValue(task);
      mockPrisma.followUp.update.mockResolvedValue({
        ...task,
        isCompleted: true,
        completedAt: new Date(),
      });

      const completed = await customersService.updateFollowUp(TENANT_ID, 'task-1', { isCompleted: true });
      expect(completed.isCompleted).toBe(true);
    });
  });

  // -------------------------------------------------------------
  // 3. Booking Management & Collision Prevention
  // -------------------------------------------------------------
  describe('Booking Management & Conflict Prevention', () => {
    it('should reject appointment creation if overlapping appointment exists in same service', async () => {
      mockPrisma.bookingService.findFirst.mockResolvedValue({
        id: 'srv-consult',
        tenantId: TENANT_ID,
        name: 'VIP Style Consultation',
      });

      // Existing overlapping booking
      mockPrisma.bookingAppointment.findFirst.mockResolvedValue({
        id: 'appt-existing-1',
        scheduledStartTime: new Date('2026-11-01T10:00:00Z'),
        scheduledEndTime: new Date('2026-11-01T10:45:00Z'),
        status: BookingStatus.CONFIRMED,
      });

      await expect(
        bookingsService.createAppointment(TENANT_ID, {
          serviceId: 'srv-consult',
          customerId: 'cust-booking',
          scheduledStartTime: '2026-11-01T10:15:00Z',
          scheduledEndTime: '2026-11-01T11:00:00Z',
        })
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.bookingAppointment.create).not.toHaveBeenCalled();
    });

    it('should create appointment when slot is available and log customer timeline event', async () => {
      mockPrisma.bookingService.findFirst.mockResolvedValue({
        id: 'srv-consult',
        tenantId: TENANT_ID,
        name: 'VIP Style Consultation',
      });
      mockPrisma.bookingAppointment.findFirst.mockResolvedValue(null); // No overlap

      mockPrisma.bookingAppointment.create.mockResolvedValue({
        id: 'appt-new-1',
        tenantId: TENANT_ID,
        serviceId: 'srv-consult',
        customerId: 'cust-booking',
        scheduledStartTime: new Date('2026-11-02T14:00:00Z'),
        scheduledEndTime: new Date('2026-11-02T14:45:00Z'),
        status: BookingStatus.CONFIRMED,
      });

      const appt = await bookingsService.createAppointment(TENANT_ID, {
        serviceId: 'srv-consult',
        customerId: 'cust-booking',
        scheduledStartTime: '2026-11-02T14:00:00Z',
        scheduledEndTime: '2026-11-02T14:45:00Z',
      });

      expect(appt.id).toBe('appt-new-1');
      expect(mockPrisma.customerTimelineEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customerId: 'cust-booking',
            eventType: 'APPOINTMENT_BOOKED',
          }),
        })
      );
    });
  });
});
