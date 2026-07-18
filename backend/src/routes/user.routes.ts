import express from 'express'
import { auth } from '../middlewares/auth.js'
import { getProfile, updateProfile, addAddress, editAddress, deleteAddress, getAllAddresses } from '../controllers/user.controller.js'

const userRoutes = express.Router()

userRoutes.get("/user-profile/:userId",auth,getProfile)
userRoutes.put("/user-profile",auth,updateProfile)

userRoutes.get("/address",auth,getAllAddresses)
userRoutes.post("/address",auth,addAddress)
userRoutes.put("/address/:addressId",auth,editAddress)
userRoutes.delete("/address/:addressId",auth,deleteAddress)

export default userRoutes