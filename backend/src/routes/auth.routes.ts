import express from 'express'
import { googleAuth, login, logout, me, refreshToken, sendEmailVerificationOtp, sendForgotPasswordOtp, signUp, verifyEmailOtp, verifyForgotPasswordOtp } from '../controllers/auth.controller.js'
import { auth } from '../middlewares/auth.js'
import { rateLimiter } from '../middlewares/rateLimiter.js'

const authRouter = express.Router()



authRouter.post('/signup',signUp)
authRouter.post('/login',login)
authRouter.post('/google-login',googleAuth)
authRouter.post("/send-email-verification-otp",rateLimiter,auth,sendEmailVerificationOtp)
authRouter.post("/verify-email-otp",rateLimiter,auth,verifyEmailOtp)
authRouter.post("/send-forgot-password-otp",rateLimiter,sendForgotPasswordOtp)
authRouter.post("/verify-forgot-password-otp",rateLimiter,verifyForgotPasswordOtp)

authRouter.get("/me",auth,me)
authRouter.post("/logout",auth,logout)
authRouter.get("/refresh-token",refreshToken)


export default authRouter