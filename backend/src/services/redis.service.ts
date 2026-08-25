import redis from "../config/redis.js";

class RedisService{
    async set(key:string,value:string,ttl?:number):Promise<void>{
          const serializedValue = JSON.stringify(value)
          if(ttl){
            await redis.set(key,serializedValue,"EX",ttl)
            return
          }
          await redis.set(key,serializedValue) 
    }
}