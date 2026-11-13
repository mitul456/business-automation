import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma.service';
import IORedis from 'ioredis';

@ApiTags('System')
@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('health')
  @ApiOperation({ summary: 'Basic Liveness & Readiness Probe' })
  @ApiResponse({ status: 200, description: 'Application is healthy and ready' })
  async getHealth() {
    const startTime = Date.now();
    let dbStatus = 'healthy';
    let dbLatencyMs = 0;

    try {
      const dbStart = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - dbStart;
    } catch {
      dbStatus = 'degraded';
    }

    let redisStatus = 'not_configured';
    let redisLatencyMs = 0;
    try {
      const redisStart = Date.now();
      const client = process.env.REDIS_URL
        ? new IORedis(process.env.REDIS_URL, {
            connectTimeout: 1500,
            maxRetriesPerRequest: 1,
            lazyConnect: true,
          })
        : new IORedis({
            host: process.env.REDIS_HOST || 'localhost',
            port: Number(process.env.REDIS_PORT) || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            connectTimeout: 1500,
            maxRetriesPerRequest: 1,
            lazyConnect: true,
          });

      await client.connect();
      await client.ping();
      await client.quit();
      redisStatus = 'healthy';
      redisLatencyMs = Date.now() - redisStart;
    } catch {
      redisStatus = 'standby';
    }

    const memory = process.memoryUsage();

    return {
      status: dbStatus === 'healthy' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      responseTimeMs: Date.now() - startTime,
      services: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
          engine: 'MySQL',
        },
        redis: {
          status: redisStatus,
          latencyMs: redisLatencyMs,
        },
        memory: {
          heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
          heapTotalMb: Math.round(memory.heapTotal / 1024 / 1024),
          rssMb: Math.round(memory.rss / 1024 / 1024),
        },
      },
    };
  }

  @Get('api/v1/health')
  @ApiOperation({ summary: 'API v1 Detailed Health Endpoint' })
  async getApiV1Health() {
    return this.getHealth();
  }
}
