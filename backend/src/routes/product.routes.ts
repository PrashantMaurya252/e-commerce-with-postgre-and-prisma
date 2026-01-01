import express from 'express'
import { auth } from '../middlewares/auth.js'
import { authorize } from '../middlewares/authorize.js'
import { upload } from '../utils/multer.js'
import { addProduct, deleteAllProducts, getAllProducts, productDetails, productSeeder, updateProduct } from '../controllers/product.controller.js'

const productRouter = express.Router()

productRouter.post("/add-product",auth,authorize,upload.array("files",10),addProduct)
productRouter.put("/update-product/:productId",auth,authorize,updateProduct)
productRouter.get("/seeding-products",auth,authorize,productSeeder)
productRouter.delete("/delete-all-products",auth,authorize,deleteAllProducts)
productRouter.get("/all-products",auth,getAllProducts)
productRouter.get("/product-details/:productId",auth,productDetails)


export default productRouter