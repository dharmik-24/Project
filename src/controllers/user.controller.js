import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

//Steps to register a user ::
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res
const registerUser = asyncHandler(async (req , res) => {
    
    //Getting data from request
    const{email, fullName, userName, password}= req.body;
    //avatar and coverimage cant be taken directly

    // validation - not empty
    if(
        [email , userName , fullName , password].some((field) => { field?.trim() === ""})
    ){
        throw new ApiError(400, "All fields are required") 
    }
    //Instead of doing this we can check by individual if conditions also...


    // check if user already exists: username, email
    //Here we are checking if either username or email already exists or not...
    const existedUser = User.findOne({
        $or : [{userName} , {email}]
    })
    if(existedUser){
        throw new ApiError(409, "User already existed with the given uername or email")
    }

    // check for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(400 , "Avatar file is required")
    }

    // upload them to cloudinary
    const avatar = uploadOnCloudinary(avatarLocalPath)
    const coverImage = uploadOnCloudinary(coverImageLocalPath)

    //Now check whether avatar is uploaded on cloudinary or not
    //BCS avatar is required field in the databse
    //Agar avatar upload nahi hua hinga to database pakka fatega !!!!
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    // create user object - create entry in db
    const user = User.create({
        fullName,
        email,
        password,
        userName : userName.tolowercase(),
        avatar : avatar.url,
        coverImage : coverImage.url
    })

    //check for user creation
    const createdUser = User.findById(user._id).select(
        "-password -refreshToken"
    )
    //This code finds user by id..
    //And We dont want to give password and refreshtiken to the user in response hence we remover it by deselecting it...

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    //return resonse
    return res.status(200).json(
        new ApiResponse(200 , createdUser, "User registered successfully")
    )
})


export { registerUser };