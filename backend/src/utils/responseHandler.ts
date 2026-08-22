import { NextFunction, Response } from "express";
import { AuthRequest } from "../middlewares/auth.js";

export const asyncHandler=(fn:Function)=>(req:AuthRequest,res:Response,next:NextFunction)=>{
    Promise.resolve(fn(req,res,next)).catch(next)
}

export class ApiResponse{
    constructor(public statusCode:number,public data:any,public message:string="Success"){}
    send(res:Response){
        return res.status(this.statusCode).json({
            success:this.statusCode >=200 && this.statusCode <300,
            message:this.message,
            data:this.data
        })
        
    }
}

// utils/ApiError.ts
export class ApiError extends Error {
  statusCode: number;
  errors: any[];
  isOperational: boolean;

  constructor(statusCode: number, message: string, errors: any[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true; // marks this as an intentional, safe-to-show error
    Error.captureStackTrace(this, this.constructor);
  }
}