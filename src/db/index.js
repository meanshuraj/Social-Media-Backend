import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB=async()=>{
    try{
        //mongoose give return object so below database afteer connection can store in database
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        //connectionInstance ->console is doing b/c 
        //it is taken if we connect to other database then we can know which host it is.
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.Connection.host}`)
    }catch(error){
        console.log("MONGODB connection error ",error);
        //can throw the error as we done in 1st approach 
        //but here process.exit used it is various type in nodjs
        process.exit(1);
    }
}

export default connectDB