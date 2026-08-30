import { Queue } from "bullmq";
import { connection } from "../redis.js";

export const cartQueue = new Queue("cart-recovery",{connection})

const ReminderDelays =
    {
        first:60*60*1000,
        second:60*60*24*1000,
        third:3*24*60*60*1000,
    }


export async function scheduleCartRecovery(userId:string,cartId:string){
    
    await cancelCartRecovery(cartId)
    for(const [stage,delay] of Object.entries(ReminderDelays)){
        await cartQueue.add(
            'add-reminder',
            {cartId,userId,stage},
            {
                delay,
                jobId:`cart-${cartId}-${stage}`,
                removeOnComplete:true,
                removeOnFail:true
            }
        )
    }
}

export async function cancelCartRecovery(cartId:string){
    for(const stage of Object.keys(ReminderDelays)){
        const job = await cartQueue.getJob(`cart-${cartId}-${stage}`)
        if(job) await job.remove()
    }
}