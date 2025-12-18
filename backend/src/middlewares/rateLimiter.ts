import rateLimit from 'express-rate-limit'


export const rateLimiter = rateLimit({
    windowMs:15*60*1000,
    max:5,
    message:{
        success:false,
        message:"Too many request. Please try again later"
    },
    standardHeaders:true,
    legacyHeaders:true
})