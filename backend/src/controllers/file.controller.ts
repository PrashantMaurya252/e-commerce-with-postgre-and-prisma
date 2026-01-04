import { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { success } from "zod";
import {v2 as cloudinary} from 'cloudinary'
import { uploadToCloudinary } from "../utils/helper.js";

export const deleteFileAPI = async(req:Request,res:Response)=>{
     try {
        const {fileId} = req.params

        const file = await prisma.file.findUnique({where:{id:fileId}})
        if(!file){
            return res.status(404).json({success:false,message:"File not found for provided fileId"})
        }

        await cloudinary.uploader.destroy(file.publicId,{
            resource_type:file.type === "VIDEO" ? "video" : file.type === "IMAGE" ? "image" : "raw"
        })
        await prisma.file.delete({where:{id:fileId}})

        return res.status(200).json({success:true,message:"File deleted successfully"})
     } catch (error) {
        console.error("Delete File API Error",error)
        return res.status(500).json({success:false,message:"Internal Server Error"})
     }
}



export const updateFile = async(req:Request,res:Response)=>{
    try {
        const {fileId} = req.params
        if(!req.file){
            return res.status(400).json({success:false,message:"No file is provided to upload"})
        }
        const receivedFile = req.file
        const file = await prisma.file.findUnique({where:{id:fileId}})
        if(!file){
            return res.status(404).json({success:false,message:"No File found with provided fileId"})
        }

        await cloudinary.uploader.destroy(file.publicId,{
            resource_type:file.type === "VIDEO" ? "video" : file.type === "IMAGE" ? "image" : "raw"
        })

        const uploaded = await uploadToCloudinary(receivedFile)
        const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: {
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        type: req.file.mimetype.startsWith("video") ? "VIDEO" : "IMAGE",
      }
    });

    return res.status(200).json({message:"File Uploaded Successfully",data:updateFile,success:true})
    } catch (error) {
        console.error("update File Error",error)
        return res.status(500).json({success:false,message:"Internal server error"})
    }
}