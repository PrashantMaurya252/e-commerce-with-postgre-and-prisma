import jwt,{SignOptions,JsonWebTokenError} from 'jsonwebtoken'

export interface User {
    userId:string,
    email:string,
    name:string,
    isAdmin:boolean
}

export const generateAccessToken = (data:User)=>{
    
    try {
        const secret:string = process.env.JWT_ACCESS_TOKEN_SECRET || "Secret"
        // const options:SignOptions={expiresIn:process.env.JWT_EXPIRES_IN || "1d"}
        // const expiresIn = process.env.JWT_EXPIRES_IN as any || "1d"

    
    if (!secret) {
    throw new Error("JWT_ACCESS_TOKEN_SECRET is not defined");
  }
        return jwt.sign(data,secret,{expiresIn:"15d"})
    } catch (error) {
        console.error("generate token error",error)
        throw new Error("failed to generate token")
    }
}

export const generateRefreshToken = (data:User)=>{
    
    try {
        const secret:string = process.env.JWT_REFRESH_TOKEN_SECRET || "Secret"
        // const options:SignOptions={expiresIn:process.env.JWT_EXPIRES_IN || "1d"}
        // const expiresIn = process.env.JWT_EXPIRES_IN as any || "1d"

    
    if (!secret) {
    throw new Error("JWT_ACCESS_TOKEN_SECRET is not defined");
  }
        return jwt.sign(data,secret,{expiresIn:"7d"})
    } catch (error) {
        console.error("generate token error",error)
        throw new Error("failed to generate token")
    }
}