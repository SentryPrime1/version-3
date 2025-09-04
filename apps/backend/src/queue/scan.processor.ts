import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('scan')
export class ScanProcessor extends WorkerHost {
  async process(job: Job): Promise<void> {
    const { url, userId } = job.data;
    console.log(`🔍 Processing scan for ${url} (user: ${userId})`);
    // TODO: Add puppeteer + axe-core logic
  }
}
