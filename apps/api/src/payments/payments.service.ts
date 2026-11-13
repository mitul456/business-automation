import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  BkashClient,
  NagadClient,
  SSLCommerzClient,
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
  private readonly logger = new Logger(PaymentsService.name);

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
   * Universal Payment Initiation Router (bKash / Nagad / SSLCommerz / Stripe)
   */
  async initiatePayment(params: {
    tenantId: string;
    orderId: string;
    provider: PaymentProvider;
    callbackUrl: string;
    cancelUrl?: string;
  }) {
    const { tenantId, orderId, provider, callbackUrl, cancelUrl } = params;

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
      include: { customer: true, items: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const integration = await this.prisma.paymentIntegration.findFirst({
      where: { tenantId, provider, isActive: true },
    });

    const isSandbox = integration?.isSandbox ?? true;
    const apiKey = integration ? EncryptionService.decrypt(integration.apiKeyEncrypted) : 'sandbox_api_key';
    const secretKey = integration ? EncryptionService.decrypt(integration.secretKeyEncrypted) : 'sandbox_secret_key';

    if (provider === PaymentProvider.BKASH) {
      const bkash = new BkashClient({
        appKey: apiKey,
        appSecret: secretKey,
        username: integration?.merchantId || '01700000000',
        password: 'sandbox_password',
        isSandbox,
      });

      return bkash.createPayment({
        amount: Number(order.totalAmount),
        payerReference: order.customer.phone || '01700000000',
        callbackURL: callbackUrl,
        merchantInvoiceNumber: order.orderNumber,
      });
    }

    if (provider === PaymentProvider.NAGAD) {
      const nagad = new NagadClient({
        merchantId: integration?.merchantId || '683002007104225',
        merchantPrivateKey: secretKey,
        nagadPublicKey: apiKey,
        isSandbox,
      });

      return nagad.initializePayment({
        orderId: order.orderNumber,
        amount: Number(order.totalAmount),
        callbackUrl,
      });
    }

    if (provider === PaymentProvider.SSLCOMMERZ) {
      const ssl = new SSLCommerzClient({
        storeId: integration?.merchantId || 'testbox',
        storePasswd: apiKey || 'qwerty',
        isSandbox,
      });

      return ssl.initiatePayment({
        tranId: order.orderNumber,
        amount: Number(order.totalAmount),
        currency: 'BDT',
        successUrl: callbackUrl,
        failUrl: cancelUrl || callbackUrl,
        cancelUrl: cancelUrl || callbackUrl,
        customerName: order.customer.name,
        customerPhone: order.customer.phone || '01700000000',
        customerEmail: order.customer.email || undefined,
        customerAddress: order.customer.address || undefined,
        customerCity: order.customer.city || 'Dhaka',
      });
    }

    if (provider === PaymentProvider.STRIPE) {
      const stripe = new StripeClient({ secretKey });
      return stripe.createCheckoutSession({
        customerEmail: order.customer.email || undefined,
        lineItems: order.items.map((i) => ({
          name: i.productName,
          amount: Number(i.unitPrice),
          quantity: i.quantity,
        })),
        successUrl: callbackUrl,
        cancelUrl: cancelUrl || callbackUrl,
        metadata: { orderId: order.id, tenantId },
      });
    }

    throw new BadRequestException(`Unsupported payment provider: ${provider}`);
  }

  /**
   * Server-Side Payment Verification (bKash / Nagad / SSLCommerz)
   */
  async verifyPayment(params: {
    tenantId: string;
    orderId: string;
    provider: PaymentProvider;
    verificationId: string; // paymentID, val_id, or refId
  }) {
    const { tenantId, orderId, provider, verificationId } = params;

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
    });
    if (!order) throw new NotFoundException('Order not found');

    const integration = await this.prisma.paymentIntegration.findFirst({
      where: { tenantId, provider },
    });

    const isSandbox = integration?.isSandbox ?? true;
    const apiKey = integration ? EncryptionService.decrypt(integration.apiKeyEncrypted) : 'sandbox_api_key';
    const secretKey = integration ? EncryptionService.decrypt(integration.secretKeyEncrypted) : 'sandbox_secret_key';

    let transactionId = '';
    let verifiedAmount = Number(order.totalAmount);
    let rawResponse: any = {};

    if (provider === PaymentProvider.BKASH) {
      const bkash = new BkashClient({
        appKey: apiKey,
        appSecret: secretKey,
        username: integration?.merchantId || '01700000000',
        password: 'sandbox_password',
        isSandbox,
      });

      const res = await bkash.executePayment(verificationId);
      transactionId = res.trxID;
      verifiedAmount = Number(res.amount);
      rawResponse = res;
    } else if (provider === PaymentProvider.NAGAD) {
      const nagad = new NagadClient({
        merchantId: integration?.merchantId || '683002007104225',
        merchantPrivateKey: secretKey,
        nagadPublicKey: apiKey,
        isSandbox,
      });

      const res = await nagad.verifyPayment(verificationId);
      transactionId = res.issuerPaymentRefNo;
      verifiedAmount = res.amount;
      rawResponse = res;
    } else if (provider === PaymentProvider.SSLCOMMERZ) {
      const ssl = new SSLCommerzClient({
        storeId: integration?.merchantId || 'testbox',
        storePasswd: apiKey || 'qwerty',
        isSandbox,
      });

      const res = await ssl.validateTransaction(verificationId);
      if (res.status !== 'VALID') {
        throw new BadRequestException('SSLCommerz validation failed');
      }
      transactionId = res.bankTranId || res.tranId;
      verifiedAmount = res.amount;
      rawResponse = res;
    }

    // Idempotent Transaction Record
    const existingTx = await this.prisma.paymentTransaction.findFirst({
      where: { tenantId, transactionId },
    });

    if (existingTx) {
      return { status: 'ALREADY_PROCESSED', transaction: existingTx };
    }

    const [txRecord] = await this.prisma.$transaction([
      this.prisma.paymentTransaction.create({
        data: {
          tenantId,
          orderId: order.id,
          provider,
          transactionId,
          amount: verifiedAmount,
          currency: 'BDT',
          status: PaymentStatus.PAID,
          providerResponse: rawResponse,
          verifiedAt: new Date(),
        },
      }),
      this.prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: PaymentStatus.PAID },
      }),
      this.prisma.customerTimelineEvent.create({
        data: {
          tenantId,
          customerId: order.customerId,
          eventType: 'PAYMENT_RECEIVED',
          title: `Payment Received (৳${verifiedAmount} via ${provider})`,
          description: `Transaction ID: ${transactionId}`,
          metadata: { orderId: order.id, transactionId, provider },
        },
      }),
    ]);

    return { status: 'SUCCESS', transaction: txRecord };
  }

  /**
   * Process refund for a transaction
   */
  async refundPayment(params: {
    tenantId: string;
    orderId: string;
    transactionId: string;
    refundAmount: number;
    reason: string;
  }) {
    const { tenantId, orderId, transactionId, refundAmount, reason } = params;

    const tx = await this.prisma.paymentTransaction.findFirst({
      where: { tenantId, transactionId, orderId },
      include: { order: true },
    });
    if (!tx) throw new NotFoundException('Transaction record not found');

    // Update transaction and order status to REFUNDED
    await this.prisma.$transaction([
      this.prisma.paymentTransaction.update({
        where: { id: tx.id },
        data: { status: PaymentStatus.REFUNDED },
      }),
      this.prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: PaymentStatus.REFUNDED },
      }),
      this.prisma.customerTimelineEvent.create({
        data: {
          tenantId,
          customerId: tx.order.customerId,
          eventType: 'PAYMENT_REFUNDED',
          title: `Payment Refunded (৳${refundAmount})`,
          description: `Reason: ${reason}. Original TrxID: ${transactionId}`,
        },
      }),
    ]);

    return {
      status: 'REFUNDED',
      transactionId,
      refundAmount,
    };
  }
}
