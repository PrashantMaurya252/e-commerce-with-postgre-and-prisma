import express from 'express';
import { addAddress, getAddresses } from '../controllers/address.controller.js';
import { auth } from '../middlewares/auth.js';

const addressRouter = express.Router();

addressRouter.get('/', auth, getAddresses);
addressRouter.post('/', auth, addAddress);

export default addressRouter;
