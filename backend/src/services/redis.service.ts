import redis from "../config/redis.js"

class RedisService {

  // =========================
  // STRING
  // =========================

  async set<T>(
    key: string,
    value: T,
    ttl?: number
  ): Promise<void> {
    const serializedValue = JSON.stringify(value)

    if (ttl !== undefined) {
      if (ttl <= 0) {
        throw new Error("TTL must be greater than 0")
      }

      await redis.set(
        key,
        serializedValue,
        "EX",
        ttl
      )

      return
    }

    await redis.set(
      key,
      serializedValue
    )
  }

  async get<T>(
    key: string
  ): Promise<T | null> {
    const value = await redis.get(key)

    if (!value) return null

    return JSON.parse(value)
  }

  async getMany<T>(
    keys: string[]
  ): Promise<(T | null)[]> {
    if (keys.length === 0) return []

    const values = await redis.mget(...keys)

    return values.map((value: any) =>
      value ? JSON.parse(value) : null
    )
  }

  async delete(key: string): Promise<void> {
    await redis.del(key)
  }

  async deleteMany(keys: string[]): Promise<number> {
    if (keys.length === 0) return 0

    return await redis.del(...keys)
  }

  async exists(key: string): Promise<boolean> {
    return (await redis.exists(key)) === 1
  }

  async expire(
    key: string,
    seconds: number
  ): Promise<void> {
    await redis.expire(key, seconds)
  }

  async increment(key: string): Promise<number> {
    return await redis.incr(key)
  }


  // =========================
  // DELETE BY PATTERN
  // =========================

  async deleteByPattern(
    pattern: string
  ): Promise<number> {

    let cursor = "0"
    let deletedCount = 0

    do {
      const [nextCursor, keys] =
        await redis.scan(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          100
        )

      cursor = nextCursor

      if (keys.length > 0) {
        deletedCount += await redis.del(...keys)
      }

    } while (cursor !== "0")

    return deletedCount
  }


  // =========================
  // SET
  // =========================

  async addToSet(
    key: string,
    values: string[]
  ): Promise<void> {
    if (values.length === 0) return

    await redis.sadd(
      key,
      ...values
    )
  }

  async removeFromSet(
    key: string,
    value: string
  ): Promise<void> {
    await redis.srem(
      key,
      value
    )
  }

  async getSetMember(
    key: string
  ): Promise<string[]> {
    return await redis.smembers(key)
  }

  async isMember(
    key: string,
    value: string
  ): Promise<boolean> {
    return (
      await redis.sismember(
        key,
        value
      )
    ) === 1
  }

  async isMembers(
    key: string,
    values: string[]
  ): Promise<number[]> {

    if (values.length === 0) {
      return []
    }

    return await redis.smismember(
      key,
      ...values
    )
  }


  // =========================
  // HASH
  // =========================

  async setHashValue<T>(
    key: string,
    field: string,
    value: T
  ): Promise<void> {
    await redis.hset(
      key,
      field,
      JSON.stringify(value)
    )
  }

  async setHashValues(
    key: string,
    values: Record<string, unknown>
  ): Promise<void> {

    const pipeline = redis.pipeline()

    for (const [field, value] of Object.entries(values)) {
      pipeline.hset(
        key,
        field,
        JSON.stringify(value)
      )
    }

    await pipeline.exec()
  }

  async getHash<T>(
    key: string
  ): Promise<Record<string, T>> {

    const hash = await redis.hgetall(key)

    return Object.fromEntries(
      Object.entries(hash).map(
        ([field, value]) => [
          field,
          JSON.parse(value as string)
        ]
      )
    ) as Record<string, T>
  }

  async getHashValue<T>(
    key: string,
    field: string
  ): Promise<T | null> {

    const value =
      await redis.hget(
        key,
        field
      )

    if (!value) return null

    return JSON.parse(value)
  }

  async getHashValues<T>(
    key: string,
    fields: string[]
  ): Promise<(T | null)[]> {

    if (fields.length === 0) {
      return []
    }

    const values =
      await redis.hmget(
        key,
        ...fields
      )

    return values.map((value: any) =>
      value ? JSON.parse(value) : null
    )
  }

  async deleteHashValue(
    key: string,
    field: string
  ): Promise<void> {
    await redis.hdel(
      key,
      field
    )
  }

  async deleteHashValues(
    key: string,
    fields: string[]
  ): Promise<number> {

    if (fields.length === 0) {
      return 0
    }

    return await redis.hdel(
      key,
      ...fields
    )
  }
}

export default new RedisService()