import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  SteadfastCourierClient,
  EncryptionService,
} from '@omniflow/integrations';
import {
  CourierProvider,
  CourierSettingInput,
  OrderStatus,
  ShipmentStatus,
} from '@omniflow/shared';

@Injectable()
export class CouriersService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(tenantId: string) {
    return this.prisma.courierSetting.findMany({
      where: { tenantId },
      select: {
        id: true,
        provider: true,
        isActive: true,
        isDefault: true,
        createdAt: true,
      },
    });
  }

  async saveCourierSetting(tenantId: string, input: CourierSettingInput) {
    const apiKeyEncrypted = EncryptionService.encrypt(input.apiKey);
    const secretKeyEncrypted = input.secretKey
      ? EncryptionService.encrypt(input.secretKey)
      : undefined;

    return this.prisma.courierSetting.upsert({
      where: {
        id: (await this.prisma.courierSetting.findFirst({ where: { tenantId, provider: input.provider } }))?.id || 'none',
      },
      update: {
        apiKeyEncrypted,
        secretKeyEncrypted,
        isActive: input.isActive,
        isDefault: input.isDefault,
      },
      create: {
        tenantId,
        provider: input.provider,
        apiKeyEncrypted,
        secretKeyEncrypted,
        isActive: input.isActive,
        isDefault: input.isDefault,
      },
    });
  }

  /**
   * Dispatch an order to Steadfast Courier (Bangladesh)
   */
  async dispatchToSteadfast(tenantId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
      include: { customer: true },
    });

    if (!order) throw new NotFoundException('Order not found');

    // Retrieve merchant courier configuration
    const setting = await this.prisma.courierSetting.findFirst({
      where: { tenantId, provider: CourierProvider.STEADFAST, isActive: true },
    });

    const apiKey = setting ? EncryptionService.decrypt(setting.apiKeyEncrypted) : 'demo_key';
    const secretKey = setting?.secretKeyEncrypted
      ? EncryptionService.decrypt(setting.secretKeyEncrypted)
      : 'demo_secret';

    const client = new SteadfastCourierClient(apiKey, secretKey);

    const address = order.shippingAddress as any;
    const codAmount = order.paymentStatus === 'PAID' ? 0 : Number(order.totalAmount);

    const result = await client.createOrder({
      invoice: order.orderNumber,
      recipient_name: address?.recipientName || order.customer.name,
      recipient_phone: address?.phone || order.customer.phone || '01700000000',
      recipient_address: `${address?.address || ''}, ${address?.city || 'Dhaka'}`,
      cod_amount: codAmount,
      note: order.notes || 'Handle with care',
    });

    // Create Shipment record & update Order
    await this.prisma.$transaction([
      this.prisma.shipment.create({
        data: {
          tenantId,
          orderId: order.id,
          courier: CourierProvider.STEADFAST,
          consignmentId: String(result.consignment.consignment_id),
          trackingCode: result.consignment.tracking_code,
          status: ShipmentStatus.ACCEPTED,
          codAmount,
          rawResponse: result as any,
        },
      }),
      this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PROCESSING,
          courierName: 'Steadfast Courier',
          courierTrackingId: result.consignment.tracking_code,
        },
      }),
    ]);

    return result;
  }

  async trackParcel(tenantId: string, consignmentId: string) {
    const setting = await this.prisma.courierSetting.findFirst({
      where: { tenantId, provider: CourierProvider.STEADFAST },
    });

    const apiKey = setting ? EncryptionService.decrypt(setting.apiKeyEncrypted) : 'demo_key';
    const secretKey = setting?.secretKeyEncrypted
      ? EncryptionService.decrypt(setting.secretKeyEncrypted)
      : 'demo_secret';

    const client = new SteadfastCourierClient(apiKey, secretKey);
    return client.getDeliveryStatus(consignmentId);
  }

  async getSteadfastBalance(tenantId: string) {
    const setting = await this.prisma.courierSetting.findFirst({
      where: { tenantId, provider: CourierProvider.STEADFAST },
    });

    const apiKey = setting ? EncryptionService.decrypt(setting.apiKeyEncrypted) : 'demo_key';
    const secretKey = setting?.secretKeyEncrypted
      ? EncryptionService.decrypt(setting.secretKeyEncrypted)
      : 'demo_secret';

    const client = new SteadfastCourierClient(apiKey, secretKey);
    return client.getBalance();
  }
}
