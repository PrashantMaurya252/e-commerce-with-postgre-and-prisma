import redis from "../config/redis.js";

class RedisService {
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const serializedValue = JSON.stringify(value)
    if (ttl) {
      await redis.set(key, serializedValue, "EX", ttl)
      return
    }
    await redis.set(key, serializedValue)
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(key)
    if (!value) return null
    return JSON.parse(value)
  }

  async delete(key: string): Promise<void> {
    await redis.del(key)
  }

  async exists(key: string): Promise<boolean> {
    return (await redis.exists(key)) === 1
  }

  async expire(key: string, seconds: number): Promise<void> {
    await redis.expire(key, seconds)
  }

  async addToSet(key: string, value: string): Promise<void> {
    await redis.sadd(key, value)
  }

  async removeFromSet(key: string, value: string): Promise<void> {
    await redis.srem(key, value)
  }

  async getSetMember(key: string): Promise<string[]> {
    return await redis.smember(key)
  }

  async isMember(key: string, value: string): Promise<boolean> {
    return (await redis.sismember(key, value)) === 1
  }



  async setHashValue(key: string, field: string, value: string): Promise<void> {
    await redis.hset(key, field, value)
  }

  async getHash(key: string): Promise<Record<string, string>> {
    return redis.hgetall(key)
  }

  async getHashValue(key: string, field: string): Promise<string | null> {
    return await redis.hget(key, field)
  }

  async deleteHashValue(key: string, field: string): Promise<void> {
    await await redis.hdel(key, field)
  }
}

export default new RedisService()