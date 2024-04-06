import mongoose, {Schema} from "mongoose"
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"

const userSchema=new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullName:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String,//cloudinary url
        required:true,
    },
    converImage:{
        type:String,
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password:{
        type:String,
        required:[true,'password is required']
    },
    refrehToken:{
        type:String
    }
},
{
    timeseries:true
}
)

userSchema.pre("save",async function(next){
    if(!this.isModfied("password")) return next();
    this.password=bcrypt.hash(this.password,10);
    next();
});

userSchema.methods.ispasswordCorrect= async function
(password){
    return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessToken=function(){
    jwt.sign({
        _id:this._id,
        email:this.email,
        username:this.username,
        fullName:this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIN: process.env.ACCESS_TOKEN_EXPIRY
    }
    )
}

userSchema.methods.generateRefreshToken=function(){
    jwt.sign({
        _id:this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIN: process.env.REFRESH_TOKEN_EXPIRY
    }
    )
}

export const User=mongoose.model("User",userSchema);
