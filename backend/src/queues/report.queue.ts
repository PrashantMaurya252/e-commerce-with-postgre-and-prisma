import { Queue } from "bullmq";
import { connection } from '../redis.js'



export const reportQueue = new Queue('sales-report', { connection })

export async function scheduleDailyReport() {
    await reportQueue.add('daily-sales-digest', {}, {
        repeat: { pattern: '0 9 * * *' },
        jobId: 'daily-sales-digest'
    })
}