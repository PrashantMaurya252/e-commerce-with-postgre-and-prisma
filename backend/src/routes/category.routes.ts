import express from 'express';
import { auth } from '../middlewares/auth.js';
import { authorize } from '../middlewares/authorize.js';
import { upload } from '../utils/multer.js';
import { 
    addCategory, 
    updateCategory, 
    getAllCategories, 
    deleteCategory 
} from '../controllers/category.controller.js';

const categoryRouter = express.Router();

categoryRouter.post("/add-category", auth, authorize, upload.single("file"), addCategory);
categoryRouter.put("/update-category/:id", auth, authorize, upload.single("file"), updateCategory);
categoryRouter.get("/all-categories", getAllCategories);
categoryRouter.delete("/delete-category/:id", auth, authorize, deleteCategory);

export default categoryRouter;
