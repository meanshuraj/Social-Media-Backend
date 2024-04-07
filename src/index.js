//for 2nd method it is used b/c it is require that as early as possible in your application import and config dotenv
//b/c we want env file access to all as early as possible so it is keep in first file at the top
//this require give bad impression on code consistency so to avoid this using some setting
 
//---------------> require('dotenv').config({path:'./env'}) <-------------------------

import dotenv from "dotenv"
//import mongoose from "mongoose";
//import {DB_NAME } from "./constants";

//import express from "express"
//const app=express()
//function connectDB(){

//}

//connectDB()


//----->2nd method to connect database<--------

//--->config dotenv for 2nd import method
//and also add "-r dotenv/config --experimental-json-modules" in package.json in dev after nodemon as experimental features
import connectDB from "./db/index.js"
dotenv.config({
    path: './.env'
})
import app from "./app.js"

connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log("Error in app On after connectDB",error);
        throw error;
    })
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running at Port : ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("MONGO DB Connection Failed !!!",err);
})




/*
//it is first approach how to connect database

;( async()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",()=>{
            console.log("ERRR :",error);
            throw error
        })
        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on port ${process.env.PORT}`)
        })
    }
    catch(error){
        console.error("ERROR: ",error);
        throw err
    }
})()

*/