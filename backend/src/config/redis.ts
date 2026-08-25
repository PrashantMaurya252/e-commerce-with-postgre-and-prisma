import Redis from 'ioredis'

const redis = new (Redis as any)(process.env.REDIS_URL as string, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    reconnectOnError: true
});

redis.on("connect", () => {
    console.log("Redis connected")
})

redis.on("ready", () => {
    console.log("Redis is ready")
})

redis.on("error", (err: any) => {
    console.error("Redis Error:", err)
})

redis.on("close", () => {
    console.log("Redis connection closed")
})

export default redis