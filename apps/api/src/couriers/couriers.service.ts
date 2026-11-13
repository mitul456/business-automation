import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  SteadfastCourierClient,
  PathaoCourierClient,
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
  private readonly logger = new Logger(CouriersService.name);

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

    const existing = await this.prisma.courierSetting.findFirst({
      where: { tenantId, provider: input.provider },
    });

    if (existing) {
      return this.prisma.courierSetting.update({
        where: { id: existing.id },
        data: {
          apiKeyEncrypted,
          secretKeyEncrypted,
          isActive: input.isActive,
          isDefault: input.isDefault,
        },
      });
    }

    return this.prisma.courierSetting.create({
      data: {
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
   * Unified Shipment Creation (Steadfast / Pathao)
   */
  async createShipment(
    tenantId: string,
    orderId: string,
    provider: CourierProvider = CourierProvider.STEADFAST
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
      include: { customer: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const setting = await this.prisma.courierSetting.findFirst({
      where: { tenantId, provider, isActive: true },
    });

    const apiKey = setting ? EncryptionService.decrypt(setting.apiKeyEncrypted) : 'demo_key';
    const secretKey = setting?.secretKeyEncrypted
      ? EncryptionService.decrypt(setting.secretKeyEncrypted)
      : 'demo_secret';

    const address = (order.shippingAddress as any) || {};
    const codAmount = order.paymentStatus === 'PAID' ? 0 : Number(order.totalAmount);
    const recipientName = address.recipientName || order.customer.name;
    const recipientPhone = address.phone || order.customer.phone || '01700000000';
    const fullAddress = `${address.address || order.customer.address || 'Road 1, Block A'}, ${address.city || order.customer.city || 'Dhaka'}`;

    let consignmentId = '';
    let trackingCode = '';
    let rawResponse: any = {};

    if (provider === CourierProvider.STEADFAST) {
      const client = new SteadfastCourierClient(apiKey, secretKey);
      const res = await client.createOrder({
        invoice: order.orderNumber,
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        recipient_address: fullAddress,
        cod_amount: codAmount,
        note: order.notes || 'Handle with care',
      });

      consignmentId = String(res.consignment.consignment_id);
      trackingCode = res.consignment.tracking_code;
      rawResponse = res;
    } else if (provider === CourierProvider.PATHAO) {
      const client = new PathaoCourierClient({
        clientId: apiKey,
        clientSecret: secretKey,
        username: setting ? 'user@merchant.com' : 'sandbox_user',
        password: 'sandbox_password',
        isSandbox: true,
      });

      const res = await client.createOrder({
        storeId: 1,
        merchantOrderId: order.orderNumber,
        recipientName,
        recipientPhone,
        recipientAddress: fullAddress,
        recipientCity: 1, // Dhaka
        recipientZone: 1,
        amountToCollect: codAmount,
      });

      consignmentId = res.consignmentId;
      trackingCode = res.consignmentId;
      rawResponse = res;
    } else {
      throw new BadRequestException(`Unsupported courier provider: ${provider}`);
    }

    // Persist shipment and update order status
    const [shipment] = await this.prisma.$transaction([
      this.prisma.shipment.create({
        data: {
          tenantId,
          orderId: order.id,
          courier: provider,
          consignmentId,
          trackingCode,
          status: ShipmentStatus.ACCEPTED,
          codAmount,
          rawResponse,
        },
      }),
      this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.SHIPPED,
          courierName: provider === CourierProvider.STEADFAST ? 'Steadfast Courier' : 'Pathao Courier',
          courierTrackingId: trackingCode,
        },
      }),
      this.prisma.customerTimelineEvent.create({
        data: {
          tenantId,
          customerId: order.customerId,
          eventType: 'ORDER_SHIPPED',
          title: `Shipment Booked via ${provider}`,
          description: `Consignment ID: ${consignmentId}, Tracking: ${trackingCode}`,
          metadata: { orderId: order.id, consignmentId, trackingCode, provider },
        },
      }),
    ]);

    return {
      success: true,
      shipmentId: shipment.id,
      consignmentId,
      trackingCode,
      provider,
      status: ShipmentStatus.ACCEPTED,
    };
  }

  async dispatchToSteadfast(tenantId: string, orderId: string) {
    return this.createShipment(tenantId, orderId, CourierProvider.STEADFAST);
  }

  async dispatchToPathao(tenantId: string, orderId: string) {
    return this.createShipment(tenantId, orderId, CourierProvider.PATHAO);
  }

  /**
   * Track Parcel status across couriers
   */
  async trackParcel(
    tenantId: string,
    consignmentIdOrTracking: string,
    provider: CourierProvider = CourierProvider.STEADFAST
  ) {
    const setting = await this.prisma.courierSetting.findFirst({
      where: { tenantId, provider },
    });

    const apiKey = setting ? EncryptionService.decrypt(setting.apiKeyEncrypted) : 'demo_key';
    const secretKey = setting?.secretKeyEncrypted
      ? EncryptionService.decrypt(setting.secretKeyEncrypted)
      : 'demo_secret';

    if (provider === CourierProvider.STEADFAST) {
      const client = new SteadfastCourierClient(apiKey, secretKey);
      return client.getDeliveryStatus(consignmentIdOrTracking);
    } else {
      const client = new PathaoCourierClient({
        clientId: apiKey,
        clientSecret: secretKey,
        username: 'user@merchant.com',
        password: 'sandbox_password',
        isSandbox: true,
      });
      return client.getDeliveryStatus(consignmentIdOrTracking);
    }
  }

  /**
   * Synchronize delivery statuses for all active shipments
   */
  async syncDeliveryStatuses(tenantId: string) {
    const openShipments = await this.prisma.shipment.findMany({
      where: {
        tenantId,
        status: { in: [ShipmentStatus.ACCEPTED, ShipmentStatus.PICKED_UP, ShipmentStatus.IN_TRANSIT] },
      },
      include: { order: true },
    });

    const updates: any[] = [];

    for (const shipment of openShipments) {
      try {
        const liveStatus = await this.trackParcel(
          tenantId,
          shipment.consignmentId || shipment.trackingCode || '',
          shipment.courier as CourierProvider
        );
        const normalized = (liveStatus.status || '').toLowerCase();

        let newStatus: ShipmentStatus = shipment.status as ShipmentStatus;
        let newOrderStatus: OrderStatus | null = null;

        if (normalized.includes('deliver') || normalized === 'delivered') {
          newStatus = ShipmentStatus.DELIVERED;
          newOrderStatus = OrderStatus.DELIVERED;
        } else if (normalized.includes('return') || normalized.includes('cancelled')) {
          newStatus = ShipmentStatus.RETURNED;
          newOrderStatus = OrderStatus.CANCELLED;
        } else if (normalized.includes('transit') || normalized.includes('picked')) {
          newStatus = ShipmentStatus.IN_TRANSIT;
        }

        if (newStatus !== shipment.status) {
          await this.prisma.$transaction(async (tx) => {
            await tx.shipment.update({
              where: { id: shipment.id },
              data: { status: newStatus },
            });

            if (newOrderStatus) {
              await tx.order.update({
                where: { id: shipment.orderId },
                data: { status: newOrderStatus },
              });

              await tx.customerTimelineEvent.create({
                data: {
                  tenantId,
                  customerId: shipment.order.customerId,
                  eventType: newStatus === ShipmentStatus.DELIVERED ? 'ORDER_DELIVERED' : 'ORDER_RETURNED',
                  title: `Shipment ${newStatus} (${shipment.courier})`,
                  description: `Tracking: ${shipment.trackingCode}`,
                  metadata: { shipmentId: shipment.id, orderId: shipment.orderId },
                },
              });
            }
          });

          updates.push({
            shipmentId: shipment.id,
            trackingCode: shipment.trackingCode,
            previousStatus: shipment.status,
            newStatus,
          });
        }
      } catch (err: any) {
        this.logger.error(`Error syncing shipment ${shipment.id}: ${err.message}`);
      }
    }

    return {
      syncedCount: openShipments.length,
      updatedCount: updates.length,
      updates,
    };
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
