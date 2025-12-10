import express from 'express'
import { auth } from '../middlewares/auth.js'
import { authorize } from '../middlewares/authorize.js'
import { upload } from '../utils/multer.js'
import { addProduct } from '../controllers/product.controller.js'

const productRouter = express.Router()

productRouter.post("/add-product",auth,authorize,upload.array("files",10),addProduct)

export default productRouter