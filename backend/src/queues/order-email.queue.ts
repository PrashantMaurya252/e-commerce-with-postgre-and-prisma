import { Queue } from "bullmq";
import { connection } from "../redis.js";


export interface OrderEmailJobData{
    type:'user-confirmation' | 'admin-alert',
    orderId:string,
    recipientEmail:string,
    recipientName:string,
    total:number,
    itemCount:number
}

export const orderEmailQueue = new Queue<OrderEmailJobData>("order-email",{connection,
    defaultJobOptions:{
        attempts:5,
        backoff:{type:"exponential",delay:5000},
        removeOnComplete:500,
        removeOnFail:1000
    }
})