import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
//import {User, user} from "../models/user.model.js"
import{User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens=async(userId)=>{
    try{
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()

        user.refreshToken=refreshToken;
        //user.accessToken=accessToken;
        await user.save({validateBeforeSave:false})

        return {accessToken,refreshToken}

    } catch(error){
        throw new ApiError(500,"Something went wrong while generting Access and RefreshToken")
    }
}

const registerUser=asyncHandler(async (req,res)=>{
    // res.status(200).json({
    //     message:"ok"
    // })

    const {fullName,email,username,password}=req.body
    //console.log("email: ",email);

    // if(fullname==""){
    //     throw ApiError(400,"fullname is required")
    // }
    if (
        [fullName,email,username,password].some((field)=>{
            field?.trim()===""
        })
    ) {
        throw new ApiError(400,"All fields are required")
    }

    const existedUser=await User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409,"User already exit")
    }

    const avatarLocalPath=req.files?.avatar[0]?.path;
    //const coverImageLocalPath=req.files?.coverImage[0]?.path;
    // let avatarLocalPath;
    // if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length >0){
    //     avatarLocalPath=req.files.avatar[0].path
    // }
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0){
        coverImageLocalPath=req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar files is required")
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar files is required")
    }

    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage ?.url || "",
        password,
        email,
        username:username.toLowerCase()
    })
    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something while wrong while created Error");
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully")
    )
})

const loginUser=asyncHandler(async(req,res)=>{
    const {email,username,password}=req.body;

    if(!(username || email)){
        throw new ApiError(400,"username or email required")
    }

    const user=await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"User not exit")
    }

    const isPasswordValid=await user.ispasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401,"username/email or password wrong")
    }

    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)
    const loggedInUser=await User.findById(user._id).
    select("-password -refreshToken")

    const options={
        httpOnly:true,
        secure:true
    }

    return res.status(200).
    cookie("accessToken",accessToken,options).
    cookie("refreshToken",refreshToken,options).
    json(
        new ApiResponse(
            200,{
                user:loggedInUser,accessToken,refreshToken
            },
            "user loggedIn successfully"
        )
    )
})

const logoutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )

    const options={
        httpOnly:true,
        secure:true
    }


    const { accessToken, refreshToken } = req.cookies;

    return res.status(200)
    .clearCookie(accessToken,options)
    .clearCookie(refreshToken,options)
    .json(new ApiResponse(200,{},"User logout Successfully"))
})

const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken
 
    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }


    try {
        const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    
        const user=await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid refreshToken")
        }
    
        if(incomingRefreshToken!==user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
        }
        const options={
            httpOnly:true,
            secure:true
        }
    
        const {accessToken,newRefreshToken}=await generateAccessAndRefreshTokens(user._id)
    
        return res.
        status(200).
        cookie("accessToken",accessToken,options).
        cookie("refreshToken",newRefreshToken,options).
        json(new ApiResponse(
            200,{
                accessToken,refreshToken:newRefreshToken
            },
            "Access token refreshed"
        ))
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh Token")
    }
})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body

    const user=await User.findById(req.user?._id)
    const isPasswordCorrect=await user.ispasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(404,"Invald old password")
    }

    user.password=newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"password changed successfully"))
})

const getCurrentUser=asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(200,req.user,"current user fethched successfully")
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullName,email}=req.body

    if(!fullName || !email){
        throw new ApiError(400,"All fields are required")
    }

    const user= User.findByIdAndUpdate(req.user?._id,
    {
        $set:{
            fullName,
            email:email
        }
    },
     {new:true}).select("-password")

     return res.status(200)
     .json(new ApiResponse(200,use,"Acount details updste successfully"))
})

const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path

    if (!avatarLocalPath) {
        throw ApiError(400,"Avatar File is missing while taking from local")
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"Avatar File is missing while uploading avatar on cloudinary")
    }

    user=await User.findByIdAndUpdate(req.user?._id,
    {
        $set:{
            avatar:avatar.url
        }
    },{new:true}).select("-password")

    return res.status(200)
    .json(new ApiResponse(200,user," Avatar Image updated Successfully"))
})


const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path

    if (!coverImageLocalPath) {
        throw ApiError(400,"CoverImage File is missing while taking from local")
    }

    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400,"coverImage File is missing while uploading coverImage on cloudinary")
    }

    const user=await User.findByIdAndUpdate(req.user?._id,
    {
        $set:{
            coverImage:coverImage.url
        }
    },{new:true}).select("-password")

    return res.status(200)
    .json(new ApiResponse(200,user,"COverImage updated Successfully"))
})


export {registerUser,loginUser,
    logoutUser,refreshAccessToken,
    changeCurrentPassword,getCurrentUser,
    updateAccountDetails,updateUserAvatar,updateUserCoverImage}