import { v2 as cloudinary } from "cloudinary"
import { uploadToCloudinaryResult } from "./types.js"

export const uploadToCloudinary =async(file:Express.Multer.File):Promise<uploadToCloudinaryResult>=>{
    try {
        const fileType = file?.mimetype?.split('/')[0]

        return new Promise((resolve,reject)=>{
            cloudinary.uploader.upload_stream({
                folder:"Desi Market",
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
                resolve(result as uploadToCloudinaryResult)
            }).end(file.buffer)
        })
    } catch (error) {
        console.error("uploadToCloudinary error",error)
        return Promise.reject(error); // important!
    }
}

export const cartTotal =(items:any[])=>{
    try {
        let subTotal =0
        for(const item of items){
            const price = item?.product?.isOfferActive && item?.product.offerPrice ? item?.product.offerPrice : item?.product.price
            subTotal += price*item.quantity
        }
        return subTotal
    } catch (error) {
        console.error("cart totals error",error)
    }
}