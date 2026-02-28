import { Queue } from "bullmq";
import redis from "../config/redis.js";

export const emailQueues = new Queue("emailQueue",{
    connection:redis
})