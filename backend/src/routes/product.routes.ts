import express from 'express'
import { auth } from '../middlewares/auth.js'
import { authorize } from '../middlewares/authorize.js'
import { upload } from '../utils/multer.js'
import { addProduct, deleteAllProducts, getAllProducts, productDetails, productSearch, productSeeder, updateProduct, submitProductReview, updateProductReview, getAllBrands } from '../controllers/product.controller.js'

const productRouter = express.Router()

productRouter.post("/add-product", auth, authorize, upload.array("files", 4), addProduct)
productRouter.put("/update-product/:productId", auth, authorize, upload.array("files", 4), updateProduct)
productRouter.get("/seeding-products", auth, authorize, productSeeder)
productRouter.delete("/delete-all-products", auth, authorize, deleteAllProducts)
productRouter.get("/all-products", auth, getAllProducts)
productRouter.get("/brands", auth, getAllBrands)
productRouter.get("/product-details/:productId", auth, productDetails)
productRouter.post("/product-search", productSearch)

// Review routes
productRouter.post("/review/:productId", auth, submitProductReview)
productRouter.put("/review/:productId", auth, updateProductReview)


export default productRouter
