import { Job, Worker } from "bullmq";
import { OrderEmailJobData } from "../queues/order-email.queue.js";
import { connection } from "../redis.js";



new Worker<OrderEmailJobData>("order-email", async (job: Job<OrderEmailJobData>) => {
    const { type, orderId, recipientEmail, recipientName, total, itemCount } = job.data
    const shortId = orderId.slice(0, 8).toUpperCase()
    if (type === 'user-confirmation') {
        // await sendMail()
    }

    if (type === 'admin-alert') {
        // await sendMail()
    }
}, {
    connection, concurrency: 10
})