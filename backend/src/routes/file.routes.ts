import express from 'express'
import { deleteFileAPI, updateFile } from '../controllers/file.controller.js'
import { auth } from '../middlewares/auth.js'
import { authorize } from '../middlewares/authorize.js'
import { upload } from '../utils/multer.js'


const fileRouter = express.Router()
fileRouter.delete("/delete-file/:fileId",auth,authorize,deleteFileAPI)
fileRouter.put("/update-file/:fileId",auth,authorize,upload.single('file'),updateFile)

export default fileRouter