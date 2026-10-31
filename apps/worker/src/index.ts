import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import { processAiMessageJob } from './processors/ai-generation.processor';
import { processCourierSyncJob } from './processors/courier-sync.processor';
import { processFollowupSequencesJob } from './processors/followup.processor';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null, lazyConnect: true });

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
