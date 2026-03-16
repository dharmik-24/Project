// verifyJWT middleware
// Purpose: Authenticate user using JWT token before accessing protected routes

// Steps:
// 1. Extract token from cookies or Authorization header
// 2. Verify token using jwt.verify()
// 3. Decode user ID from token
// 4. Fetch user from database
// 5. Attach authenticated user to req.user
// 6. Call next() to continue to the controller

// Why req.user?
// req.user stores the authenticated user's data so controllers
// (like logout, profile, update user) know which user made the request.

// Example:
// logout controller uses req.user._id to identify which user to log out.

import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";


export const verifyJWT = asyncHandler(async (req , _ , next) => {

    try {
        //2 Ways to get accesstoken 
        //(1) Directly form cookies 
        //(2) From Request Header
            /*In req.header object :: 
              Authorization : Bearer <token>
              Hence we remove the string "Bearer" and get the token*/
        const token = req.cookies?.accessToken || req.header("Authorization").replace("Bearer", "")
        if(!token){
            throw new ApiError(401, "Unauthorized access")
        }
    
        const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findOne({_id:decodedToken?._id}).select("-password -refreshToken")
    
        if(!user){
            throw new ApiError(401, "Invalid Access token")
        }
    
        req.user = user;
        next()

    } catch (error) {
        throw new ApiError(401 , error?.message || "Invalid access token")
    }

})