
import rateLimit, { Options } from 'express-rate-limit';

interface RateLimiterConfig {
    windowMs: number;
    max: number;
    message?: string;
    skipSuccessfulRequests?: boolean;
}

export const createRateLimiter = ({
    windowMs,
    max,
    message = "Too many requests. Please try again later.",
    skipSuccessfulRequests = false,
}: RateLimiterConfig) => {
    return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests,
        message: {
            success: false,
            message,
        },

        keyGenerator: (req, res) => {
            return (req as any).user?.id || req.ip;
        },
    });
};




export const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, 
  max: 5,
  message: "Too many login attempts. Please try again after 15 minutes.",
  skipSuccessfulRequests: true, 
});


export const signupLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Too many accounts created from this IP. Try again later.",
});


export const searchLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: "Too many search requests. Slow down a bit.",
});


export const otpLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 3,
  message: "Too many OTP requests. Please try again after 10 minutes.",
});


export const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP. Please slow down.",
});