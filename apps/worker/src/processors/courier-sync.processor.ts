import { prisma } from '@omniflow/database';
import { SteadfastCourierClient, EncryptionService } from '@omniflow/integrations';
import { CourierProvider, ShipmentStatus, OrderStatus } from '@omniflow/shared';

export async function processCourierSyncJob() {
  const activeShipments = await prisma.shipment.findMany({
    where: {
      status: { in: [ShipmentStatus.ACCEPTED, ShipmentStatus.IN_TRANSIT] },
      consignmentId: { not: null },
    },
    include: {
      order: true,
      tenant: {
        include: {
          courierSettings: {
            where: { provider: CourierProvider.STEADFAST },
          },
        },
      },
    },
    take: 20,
  });

  for (const shipment of activeShipments) {
    try {
      const setting = shipment.tenant.courierSettings[0];
      const apiKey = setting ? EncryptionService.decrypt(setting.apiKeyEncrypted) : 'demo_key';
      const secretKey = setting?.secretKeyEncrypted ? EncryptionService.decrypt(setting.secretKeyEncrypted) : 'demo_secret';

      const client = new SteadfastCourierClient(apiKey, secretKey);
      const result = await client.getDeliveryStatus(shipment.consignmentId!);

      if (result.status === 'delivered') {
        await prisma.$transaction([
          prisma.shipment.update({
            where: { id: shipment.id },
            data: { status: ShipmentStatus.DELIVERED },
          }),
          prisma.order.update({
            where: { id: shipment.orderId },
            data: { status: OrderStatus.DELIVERED },
          }),
        ]);
      }
    } catch (err: any) {
      console.warn(`[Worker] Courier sync error for shipment ${shipment.id}: ${err.message}`);
    }
  }

  return { syncedCount: activeShipments.length };
}
