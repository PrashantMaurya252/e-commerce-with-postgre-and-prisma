import express from 'express'
import { auth } from '../middlewares/auth.js'
import { authorize } from '../middlewares/authorize.js'
import { upload } from '../utils/multer.js'
import { addProduct, updateProduct } from '../controllers/product.controller.js'

const productRouter = express.Router()

productRouter.post("/add-product",auth,authorize,upload.array("files",10),addProduct)
productRouter.put("/update-product/:productId",auth,authorize,updateProduct)

export default productRouter