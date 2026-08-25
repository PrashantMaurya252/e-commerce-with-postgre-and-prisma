import { Worker } from "bullmq";
import { prisma } from "../config/prisma.js";
import { connection } from "../redis.js";




new Worker('sales-report', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const [orderCount, revenue, topProducts] = await Promise.all([
        prisma.order.count({ where: { createdAt: { gte: yesterday }, status: 'PENDING' } }),
        prisma.order.aggregate({
            _sum: { total: true },
            where: { createdAt: { gte: yesterday }, status: 'PENDING' }
        }),
        prisma.orderItem.groupBy({
            by: ['productId'],
            _sum: { quantity: true },
            where: {
                order: { createdAt: { gte: yesterday }, status: "PENDING" }
            },
            orderBy: { _sum: { quantity: "desc" } },
            take: 5
        })
    ])

    const html = `
      <h2>Daily Sales Digest</h2>
      <p>Orders: ${orderCount}</p>
      <p>Revenue: ₹${revenue._sum.total ?? 0}</p>
      <p>Top products: ${topProducts.map(p => p.productId).join(', ')}</p>
    `;

    // await sendMail(process.env.ADMIN_EMAIL!, 'Daily Sales Digest', html);
}, { connection, concurrency: 1 })