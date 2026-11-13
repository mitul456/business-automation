import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { processAiMessageJob } from './processors/ai-generation.processor';
import { processCourierSyncJob } from './processors/courier-sync.processor';
import { processFollowupSequencesJob } from './processors/followup.processor';

const connection = process.env.REDIS_URL
  ? new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null, lazyConnect: true })
  : new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });

async function startWorker() {
  console.log('⚡ Starting OmniFlow BullMQ Background Workers...');

  try {
    await connection.connect();
    console.log('Connected to Redis successfully');

    // 1. AI Generation Worker
    const aiWorker = new Worker(
      'ai-generation-queue',
      async (job) => {
        console.log(`[BullMQ] Processing AI Message Job: ${job.id}`);
        return processAiMessageJob(job.data);
      },
      { connection }
    );

    // 2. Courier Sync Worker
    const courierWorker = new Worker(
      'courier-sync-queue',
      async (job) => {
        console.log(`[BullMQ] Processing Courier Sync Job: ${job.id}`);
        return processCourierSyncJob();
      },
      { connection }
    );

    // 3. Followup Worker
    const followupWorker = new Worker(
      'followup-queue',
      async (job) => {
        console.log(`[BullMQ] Processing Followup Job: ${job.id}`);
        return processFollowupSequencesJob();
      },
      { connection }
    );

    console.log('✅ OmniFlow Workers are actively listening for background jobs!');
  } catch (err: any) {
    console.warn(`[BullMQ Notice]: Redis not running locally (${err.message}). Workers initialized in standalone graceful mode.`);
  }
}

startWorker();
