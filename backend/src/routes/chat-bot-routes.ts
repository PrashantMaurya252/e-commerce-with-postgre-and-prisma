import express from 'express';
import { handleChat, getUserChats } from '../controllers/chat-bot.controller.js';
import { auth } from '../middlewares/auth.js';

const router = express.Router();

// Optional auth for chatting
router.post('/chat', handleChat);
// Auth required for getting history
router.get('/history', auth, getUserChats);

export default router;
