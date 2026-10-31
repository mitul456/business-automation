import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { ChannelsModule } from './channels/channels.module';
import { InboxModule } from './inbox/inbox.module';
import { AiAgentModule } from './ai-agent/ai-agent.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { CouriersModule } from './couriers/couriers.module';
import { PaymentsModule } from './payments/payments.module';
import { CustomersModule } from './customers/customers.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { BookingsModule } from './bookings/bookings.module';
import { BillingModule } from './billing/billing.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SuperAdminModule } from './super-admin/super-admin.module';

@Module({
  imports: [
    AuthModule,
    TenantsModule,
    ChannelsModule,
    InboxModule,
    AiAgentModule,
    KnowledgeModule,
    ProductsModule,
    OrdersModule,
    CouriersModule,
    PaymentsModule,
    CustomersModule,
    WorkflowsModule,
    BookingsModule,
    BillingModule,
    AnalyticsModule,
    SuperAdminModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
