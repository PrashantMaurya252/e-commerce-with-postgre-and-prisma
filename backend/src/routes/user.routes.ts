import express from 'express'
import { auth } from '../middlewares/auth.js'
import { getProfile } from '../controllers/user.controller.js'

const userRoutes = express.Router()


userRoutes.get("/user-profile/:userId",auth,getProfile)

export default userRoutes