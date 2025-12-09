import { v2 as cloudinary } from "cloudinary"

export const uploadToCloudinary =async(file:Express.Multer.File)=>{
    try {
        const fileType = file?.mimetype?.split('/')[0]

        return new Promise((resolve,reject)=>{
            cloudinary.uploader.upload_stream({
                resource_type:fileType === 'video' ? 'video' :'image',
                ...(fileType === 'image' && {
                    quality:"auto:low",
                    fetch_format:"auto"
                }),
                ...(fileType === 'video' && {
                    quality:"auto:eco",
                    transformation:[
                        {bitrate:"60000000"}
                    ]
                })
            },(err,result)=>{
                if(err) reject(err)
                resolve(result)
            }).end(file.buffer)
        })
    } catch (error) {
        console.error("uploadToCloudinary error",error)
    }
}