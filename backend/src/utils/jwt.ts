import jwt,{SignOptions,JsonWebTokenError} from 'jsonwebtoken'

export interface User {
    email:string,
    name:string,
    isAdmin:boolean
}

export const generateToken = (data:User)=>{
    
    try {
        const secret:string = process.env.JWT_SECRET || "Secret"
        // const options:SignOptions={expiresIn:process.env.JWT_EXPIRES_IN || "1d"}
        const expiresIn = process.env.JWT_EXPIRES_IN as any || "1d"

    
    if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }
        return jwt.sign(data,secret,{expiresIn})
    } catch (error) {
        console.error("generate token error",error)
        throw new Error("failed to generate token")
    }
}