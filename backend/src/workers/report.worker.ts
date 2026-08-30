import { Worker } from "bullmq";
import { prisma } from "../config/prisma.js";
import { connection } from "../redis.js";
import { sendEmail } from "../services/email.service.js";




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

    const admins = await prisma.user.findMany({
        where: {
            userRoles: {
                some: {
                    role: {
                        isSystemRole: true
                    }
                }
            }
        }
    });

    for (const admin of admins) {
        if (admin.email) {
            await sendEmail(admin.email, 'Daily Sales Digest', html);
        }
        await prisma.notification.create({
            data: {
                title: 'Daily Sales Digest',
                description: `Orders: ${orderCount} | Revenue: ₹${revenue._sum.total ?? 0}`,
                receiverId: admin.id,
                channel: "IN_APP",
                type: "INFO"
            }
        });
    }
}, {
    connection, concurrency: 1
});