import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  BkashClient,
  StripeClient,
  EncryptionService,
} from '@omniflow/integrations';
import {
  PaymentProvider,
  PaymentIntegrationInput,
  PaymentStatus,
} from '@omniflow/shared';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listIntegrations(tenantId: string) {
    return this.prisma.paymentIntegration.findMany({
      where: { tenantId },
      select: {
        id: true,
        provider: true,
        merchantId: true,
        isSandbox: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async saveIntegration(tenantId: string, input: PaymentIntegrationInput) {
    const apiKeyEncrypted = EncryptionService.encrypt(input.apiKey);
    const secretKeyEncrypted = EncryptionService.encrypt(input.secretKey);

    const existing = await this.prisma.paymentIntegration.findFirst({
      where: { tenantId, provider: input.provider },
    });

    if (existing) {
      return this.prisma.paymentIntegration.update({
        where: { id: existing.id },
        data: {
          merchantId: input.merchantId,
          apiKeyEncrypted,
          secretKeyEncrypted,
          isSandbox: input.isSandbox,
          isActive: input.isActive,
        },
      });
    }

    return this.prisma.paymentIntegration.create({
      data: {
        tenantId,
        provider: input.provider,
        merchantId: input.merchantId,
        apiKeyEncrypted,
        secretKeyEncrypted,
        isSandbox: input.isSandbox,
        isActive: input.isActive,
      },
    });
  }

  /**
   * Create bKash Payment URL for customer
   */
  async createBkashPayment(tenantId: string, orderId: string, callbackURL: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
      include: { customer: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const integration = await this.prisma.paymentIntegration.findFirst({
      where: { tenantId, provider: PaymentProvider.BKASH, isActive: true },
    });

    const appKey = integration ? EncryptionService.decrypt(integration.apiKeyEncrypted) : 'demo_bkash_key';
    const appSecret = integration ? EncryptionService.decrypt(integration.secretKeyEncrypted) : 'demo_bkash_secret';

    const bkash = new BkashClient({
      appKey,
      appSecret,
      username: integration?.merchantId || '01700000000',
      password: 'demo_password',
      isSandbox: integration?.isSandbox ?? true,
    });

    const payment = await bkash.createPayment({
      amount: Number(order.totalAmount),
      payerReference: order.customer.phone || '01700000000',
      callbackURL,
      merchantInvoiceNumber: order.orderNumber,
    });

    return payment;
  }

  /**
   * Execute bKash payment verification
   */
  async executeBkashPayment(tenantId: string, orderId: string, paymentID: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
    });
    if (!order) throw new NotFoundException('Order not found');

    const integration = await this.prisma.paymentIntegration.findFirst({
      where: { tenantId, provider: PaymentProvider.BKASH },
    });

    const appKey = integration ? EncryptionService.decrypt(integration.apiKeyEncrypted) : 'demo_bkash_key';
    const appSecret = integration ? EncryptionService.decrypt(integration.secretKeyEncrypted) : 'demo_bkash_secret';

    const bkash = new BkashClient({
      appKey,
      appSecret,
      username: integration?.merchantId || '01700000000',
      password: 'demo_password',
      isSandbox: integration?.isSandbox ?? true,
    });

    const execution = await bkash.executePayment(paymentID);

    // Save payment transaction & mark order as PAID
    await this.prisma.$transaction([
      this.prisma.paymentTransaction.create({
        data: {
          tenantId,
          orderId: order.id,
          provider: PaymentProvider.BKASH,
          transactionId: execution.trxID,
          amount: Number(execution.amount),
          currency: 'BDT',
          status: PaymentStatus.PAID,
          providerResponse: execution as any,
          verifiedAt: new Date(),
        },
      }),
      this.prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: PaymentStatus.PAID },
      }),
    ]);

    return execution;
  }

  /**
   * Create Stripe Checkout session
   */
  async createStripeSession(tenantId: string, orderId: string, successUrl: string, cancelUrl: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
      include: { customer: true, items: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const integration = await this.prisma.paymentIntegration.findFirst({
      where: { tenantId, provider: PaymentProvider.STRIPE, isActive: true },
    });

    const secretKey = integration ? EncryptionService.decrypt(integration.secretKeyEncrypted) : '';
    const stripe = new StripeClient({ secretKey });

    const session = await stripe.createCheckoutSession({
      customerEmail: order.customer.email || undefined,
      lineItems: order.items.map((i) => ({
        name: i.productName,
        amount: Number(i.unitPrice),
        quantity: i.quantity,
      })),
      successUrl,
      cancelUrl,
      metadata: { orderId: order.id, tenantId },
    });

    return session;
  }
}
