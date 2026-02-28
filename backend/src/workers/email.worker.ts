import { Worker } from "bullmq";
import redis from "../config/redis.js";
import { sendEmail } from "../services/email.service.js";
import logger from "../utils/logger.js";


interface EmailJobData{
    to:string,
    subject:string,
    html:string
}

const worker = new Worker<EmailJobData>("emailQueue",async(job)=>{
    const {to,subject,html} = job.data;
    await sendEmail(to,subject,html)
},{
    connection:redis
});

worker.on("completed",(job)=>{
    console.log(`Job ${job.id} completed`)
    logger.info(`Job ${job.id} completed`)
})

worker.on("failed",(job,err)=>{
    console.log(`Job ${job?.id} is failed`,err.message)
    logger.error(`Job ${job?.id} is failed`,err.message)
})