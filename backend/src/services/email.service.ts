import nodemailer from 'nodemailer'
import logger from '../utils/logger.js'

export const sendEmail = async(to:string,subject:string,html:string)=>{
    try {
        const transport = nodemailer.createTransport({
            service:"gmail",
            auth:{
                user:process.env.MAIL_USER,
                pass:process.env.MAIL_PASS
            }
        })

        await transport.sendMail({
            from:process.env.MAIL_USER,
            to,
            subject,
            html
        })
    } catch (error) {
        logger.error("Send Email Service Error",error)
    }
}