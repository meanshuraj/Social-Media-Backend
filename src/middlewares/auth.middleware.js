// import { ApiError } from "../utils/ApiError.js";
// import { asyncHandler } from "../utils/asyncHandler.js";
// import jwt from "jsonwebtoken"
// import { User } from "../models/user.model.js";

// export const verifyJWT=asyncHandler(async(req,_,next)=>{
//     try {
        
//         const token =req.Cookies?.accessToken || req.header
//         ("Authorization")?.replace("Bearer ","")
    
//         if(!token){
//             throw new ApiError(401,"Unauthorized request")
//         }
    
//         //importing jwt,after token taken verify using 
//         const decodeToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
//         const user= await User.findById(decodeToken?._id).select("-password -refrehToken")
    
//         if(!user){
//             //TODO: discuss about fronted
//             throw new ApiError(401,"Invalid Access Token")
//         }
    
//         req.user=user;
//         next()
//     } catch (error) {
//         throw new ApiError(401,error?.mesasge || "Invalid access token")
//     }
// })