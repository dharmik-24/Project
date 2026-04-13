import mongoose from "mongoose"
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";


const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: [true, "UserName is must"],
        unique: [true, "Username should be Unique"],
        lowercase: [true, "UserName should be in lowercase"],
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: [true, "Email is must"],
        unique: [true, "Email should be Unique"],
        lowercase: [true, "Email should be in lowercase"],
        trim: true,
    },
    fullName: {
        type: String,
        required: [true, "fullName is must"],
        lowercase: [true, "fullName should be in lowercase"],
        trim: true,
        index: true
    },
    avatar: {
        url : {
            type: String,
            required: [true, "Avatar URL is must"]  
        },
        publicId : {
            type: String,
            required: [true, "Avatar Public ID is must"]
        }
    },
    coverImage: {
        url : {
            type: String,
        },
        publicId : {
            type: String,
        }
    },
    watchHistory: [
        {
            type: mongoose.Schema.ObjectId,
            ref: "Vedio"
        }
    ],
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    refreshToken: {
        type: String
    }


}, {timestamps: true})



userSchema.pre("save", async function () {
    if(!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 10)

})
//Why we have used function() instead of arrow function here?? BCS we want to use this keyword here and this keyword in arrow function is not defined it will give us undefined error...
//There are 2 styles of middleware : 
//(1) callback Style : function(next) { next() }
//(2) Promise Style : async function() { await something() }
//mongoose automatically waits for the promise to resolve before moving to the next middleware in the stack. So we can use async-await in mongoose middleware without any problem.
//Here we are using promise style middleware and in this style.

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password)
}


userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
export const User = mongoose.model("User", userSchema)