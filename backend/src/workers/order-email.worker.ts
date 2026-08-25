import { Job, Worker } from "bullmq";
import { OrderEmailJobData } from "../queues/order-email.queue.js";
import { connection } from "../redis.js";
import { sendEmail } from "../services/email.service.js";
import { prisma } from "../config/prisma.js";


new Worker<OrderEmailJobData>("order-email", async (job: Job<OrderEmailJobData>) => {
    const { type, orderId, recipientEmail, recipientName, total, itemCount } = job.data
    const shortId = orderId.slice(0, 8).toUpperCase()
    if (type === 'user-confirmation') {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">Order Confirmation</h2>
                <p>Hi ${recipientName},</p>
                <p>Thank you for your order! Your order ID is <strong>${shortId}</strong>.</p>
                <p>You ordered ${itemCount} items for a total of ₹${total}.</p>
                <p>We'll notify you once it ships.</p>
                <br/>
                <p>Best regards,<br/>The Store Team</p>
            </div>
        `;
        await sendEmail(recipientEmail, `Order Confirmation - #${shortId}`, html)
        
        const user = await prisma.user.findUnique({ where: { email: recipientEmail } });
        if (user) {
            await prisma.notification.create({
                data: {
                    title: "Order Email Sent",
                    description: `Confirmation email for order #${shortId} has been sent.`,
                    receiverId: user.id,
                    channel: "IN_APP",
                    type: "SUCCESS",
                }
            });
        }
    }

    if (type === 'admin-alert') {
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #d9534f;">New Order Alert</h2>
                <p>Hello ${recipientName},</p>
                <p>A new order (<strong>${shortId}</strong>) has been placed.</p>
                <ul>
                    <li><strong>Total Amount:</strong> ₹${total}</li>
                    <li><strong>Items:</strong> ${itemCount}</li>
                </ul>
                <p>Please check the admin dashboard for more details.</p>
            </div>
        `;
        await sendEmail(recipientEmail, `New Order Received - #${shortId}`, html)

        const admin = await prisma.user.findUnique({ where: { email: recipientEmail } });
        if (admin) {
            await prisma.notification.create({
                data: {
                    title: "Admin Order Alert Email Sent",
                    description: `Alert email for order #${shortId} was successfully sent.`,
                    receiverId: admin.id,
                    channel: "IN_APP",
                    type: "INFO",
                }
            });
        }
    }
}, {
    connection, concurrency: 10
})