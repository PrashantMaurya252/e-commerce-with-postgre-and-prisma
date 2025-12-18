import express from 'express'
import { login, sendEmailVerificationOtp, sendForgotPasswordOtp, signUp, verifyEmailOtp, verifyForgotPasswordOtp } from '../controllers/auth.controller.js'
import { auth } from '../middlewares/auth.js'

const authRouter = express.Router()


authRouter.post('/sign-up',signUp)
authRouter.post('/login',login)
authRouter.post("/send-email-verification-otp",auth,sendEmailVerificationOtp)
authRouter.post("/verify-email-otp",auth,verifyEmailOtp)
authRouter.post("/send-forgot-password-otp",sendForgotPasswordOtp)
authRouter.post("/verify-forgot-password-otp",verifyForgotPasswordOtp)


export default authRouter