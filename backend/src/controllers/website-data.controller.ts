import { tryCatch } from "bullmq";
import { Request, Response } from "express";
import { generateEmbedding } from "../utils/gemeni-helper.js";
import { prisma } from "../config/prisma.js";


export const createFaq = async(req:Request,res:Response)=>{
    try {
        const {question,answer} = req.body

        if(!question || !answer){
            return res.status(404).json({"question and answer is required"})
        }
        const faqEmbedding = await generateEmbedding(`${question}\n${answer}`)

        const faq = await prisma.faq.create({data:{
            question,answer
        }})

        await prisma.$executeRaw`
        INSERT INTO faq_embeddings
        (id faq_id embedding)
        VALUES(
        ${crypto.randomUUID()},
        ${faq.id},
        ${JSON.stringify(faqEmbedding)}::vector
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
        const updatedEmbedding = await generateEmbedding(`${updatedFaq.question}\n${updatedFaq.answer}`)

        prisma.$executeRaw`
            UPDATE faq_embedding
            SET embedding = ${JSON.stringify(updatedEmbedding)}::vector
            WHERE faq_id = ${updatedFaq.id}`

        return res.status(200).json({success:true,message:"Faq updated successfully"})
    } catch (error) {
        return res.status(500).json({success:false,message:"Internal Server Error"})
    }
}