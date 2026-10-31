import { Module } from '@nestjs/common';
import { CouriersController } from './couriers.controller';
import { CouriersService } from './couriers.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [CouriersController],
  providers: [CouriersService, PrismaService],
  exports: [CouriersService],
})
export class CouriersModule {}
