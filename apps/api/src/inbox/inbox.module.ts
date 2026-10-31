import { Module } from '@nestjs/common';
import { InboxController } from './inbox.controller';
import { InboxService } from './inbox.service';
import { InboxGateway } from './inbox.gateway';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [InboxController],
  providers: [InboxService, InboxGateway, PrismaService],
  exports: [InboxService, InboxGateway],
})
export class InboxModule {}
