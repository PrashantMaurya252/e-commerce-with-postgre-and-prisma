import { tryCatch } from "bullmq";
import { Request, Response } from "express";
import { generateEmbedding } from "../utils/gemeni-helper.js";
import { prisma } from "../config/prisma.js";


export const createFaq = async(req:Request,res:Response)=>{
    try {
        const {question,answer} = req.body

        if(!question || !answer){
            return res.status(400).json({ success: false, message: "question and answer is required" })
        }
        const contentText = `${question}\n${answer}`;
        const faqEmbedding = await generateEmbedding(contentText);

        const faq = await prisma.faq.create({data:{
            question,answer
        }})

        await prisma.$executeRaw`
        INSERT INTO faq_embeddings
        (id, faid, content, embedding, "updatedAt")
        VALUES(
        ${crypto.randomUUID()},
        ${faq.id},
        ${contentText},
        ${`[${faqEmbedding.join(",")}]`}::vector,
        NOW()
        )`

        return res.status(200).json({success:true,message:"Faq is created"})
    } catch (error:any) {
        console.log("Create Faq Error",error)
        return res.status(500).json({success:false,message:"Internal Server Error"})
    }
}

export const getAllFaqs = async(req:Request,res:Response)=>{
    try {
        const allFaqs = await prisma.faq.findMany({})
        return res.status(200).json({success:false,message:"All Faqs",data:allFaqs})
    } catch (error) {
        return res.status(500).json({success:false,message:"Internal Server Error"})
    }
}

export const deleteFaq = async(req:Request,res:Response)=>{
    try {
        const {id} = req.params
        const faq = await prisma.faq.findUnique({where:{id}})
        if(!faq){
            return res.status(404).json({success:false,message:"Faq deleted successfully"})
        }

        await prisma.faq.delete({where:{id}})
        return res.status(200).json({success:true,message:"Faq deleted successfully"})
    } catch (error) {
        return res.status(500).json({success:false,message:"Internal Server Error"})
    }
}

export const updateFaq = async(req:Request,res:Response)=>{
    try {
        const {question,answer} = req.body
        const {id} = req.params
        const query:any = {}
        if(question) query.question = question
        if(answer) query.answer = answer

        const faq = await prisma.faq.findUnique({where:{id}})
        if(!faq){
            return res.status(400).json({success:false,message:"Faq not found"})
        }

        const updatedFaq = await prisma.faq.update({where:{id},data:query})
        const contentText = `${updatedFaq.question}\n${updatedFaq.answer}`;
        const updatedEmbedding = await generateEmbedding(contentText)

        await prisma.$executeRaw`
            UPDATE faq_embeddings
            SET embedding = ${`[${updatedEmbedding.join(",")}]`}::vector,
                content = ${contentText},
                "updatedAt" = NOW()
            WHERE faid = ${updatedFaq.id}`

        return res.status(200).json({success:true,message:"Faq updated successfully"})
    } catch (error) {
        return res.status(500).json({success:false,message:"Internal Server Error"})
    }
}