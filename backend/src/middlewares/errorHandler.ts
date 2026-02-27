import { NextFunction, Request, Response } from 'express'
import logger from '../utils/logger.js'


export const globalErrorHandler =(
    err:any,
    req:Request,
    res:Response,
    next:NextFunction
)=>{
    logger.error("Unhandled Error",{
        message:err.message,
        stack:err.stack,
        method:req.method,
        url:req.originalUrl,
        ip:req.ip,
        body:req.body,
        params:req.params,
        query:req.query,
        user:req.user || "Guest"
    })

    res.status(err.statusCode || 500).json({
        success:false,
        message:process.env.NODE_ENV === "production" ? "Something went wrong" : err.message
    })
}