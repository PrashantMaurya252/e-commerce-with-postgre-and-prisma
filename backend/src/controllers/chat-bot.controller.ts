import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { processUserMessage } from '../services/chat.service.js';
import jwt from 'jsonwebtoken';

export const handleChat = async (req: Request, res: Response) => {
    try {
        const { message, chatId } = req.body;

        // Optional Auth
        const token = req.headers?.authorization?.split(" ")[1] || req.cookies["access-token"];
        let userId = null;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET as string) as any;
                userId = decoded.userId;
            } catch (e) {
                // ignore error for optional auth
            }
        }

        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        let activeChatId = chatId;
        let chatHistory: any[] = [];

        if (userId) {
            if (!activeChatId) {
                const newChat = await prisma.chat.create({
                    data: {
                        userId,
                        title: message.substring(0, 30) + (message.length > 30 ? '...' : ''),
                    }
                });
                activeChatId = newChat.id;
            }

            // Save user message
            await prisma.chatMessage.create({
                data: {
                    chatId: activeChatId,
                    role: 'user',
                    content: message,
                }
            });

            // Fetch history for context
            chatHistory = await prisma.chatMessage.findMany({
                where: { chatId: activeChatId },
                orderBy: { createdAt: 'asc' },
                select: { role: true, content: true },
            });
        }

        const aiResponseContent = await processUserMessage(userId, message, chatHistory);
        console.log("ai response content in line 58", aiResponseContent)

        if (userId && activeChatId && aiResponseContent) {
            await prisma.chatMessage.create({
                data: {
                    chatId: activeChatId,
                    role: 'assistant',
                    content: aiResponseContent,
                }
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                chatId: activeChatId,
                message: aiResponseContent,
            }
        });

    } catch (error) {
        console.error('Chat error', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

export const getUserChats = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const chats = await prisma.chat.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                }
            }
        });

        return res.status(200).json({ success: true, data: chats });
    } catch (error) {
        console.error('Get chats error', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
