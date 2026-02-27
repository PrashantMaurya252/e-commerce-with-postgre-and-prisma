import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import fs, { existsSync } from 'fs'

const logDir = "logs"

if(!existsSync(logDir)){
    fs.mkdirSync(logDir)
}

const dailyRotateTransport = new DailyRotateFile({
    filename:"logs/application-%DATE%.log",
    datePattern:"YYYY-MM-DD",
    zippedArchive:true,
    maxSize:"20m",
    maxFiles:"14d",
    level:"info"
})

const errorRotateTransport = new DailyRotateFile({
    filename:"logs/error-%DATE%.log",
    datePattern:"YYYY-MM-DD",
    zippedArchive:true,
    maxSize:"20m",
    maxFiles:"30d",
    level:"error"
})

const logger = winston.createLogger({
    level:"info",
    format:winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({stack:true}),
        winston.format.json()
    ),
    transports:[
        new winston.transports.Console({
            format:winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        dailyRotateTransport,
        errorRotateTransport
    ]
})

export default logger