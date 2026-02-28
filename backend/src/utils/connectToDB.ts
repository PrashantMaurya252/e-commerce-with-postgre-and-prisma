import {prisma} from "../config/prisma.js"
import logger from "./logger.js"

async function connectDB() {
  try {
    await prisma.$queryRaw`SELECT 1`
    console.log("Database connected successfully ✔️")
    // logger.info("Database connected successfully")
  } catch (err) {
    console.error("Database connection failed ❌", err)
    // logger.error(`Database connection failed`,err)
    process.exit(1)
  }
}

export default connectDB
