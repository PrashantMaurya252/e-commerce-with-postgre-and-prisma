import express from 'express'
import { getSessions, googleAuth, login, logout, logoutFromAllDevices, logoutFromParticularDevice, me, refreshToken, sendEmailVerificationOtp, sendForgotPasswordOtp, signUp, verifyEmailOtp, verifyForgotPasswordOtp } from '../controllers/auth.controller.js'
import { auth } from '../middlewares/auth.js'
import { loginLimiter, signupLimiter } from '../middlewares/rateLimiter.js'


const authRouter = express.Router()



authRouter.post('/signup', signupLimiter, signUp)
authRouter.post('/login', loginLimiter, login)
authRouter.post('/google-login', googleAuth)
authRouter.post("/send-email-verification-otp", auth, sendEmailVerificationOtp)
authRouter.post("/verify-email-otp", auth, verifyEmailOtp)
authRouter.post("/send-forgot-password-otp", sendForgotPasswordOtp)
authRouter.post("/verify-forgot-password-otp", verifyForgotPasswordOtp)

authRouter.get("/me", auth, me)
authRouter.post("/logout", auth, logout)
authRouter.post("/logout-from-device", auth, logoutFromParticularDevice)
authRouter.post("/logout-from-all-devices", auth, logoutFromAllDevices)
authRouter.get("/refresh-token", refreshToken)
authRouter.get("/sessions", auth, getSessions)


export default authRouter