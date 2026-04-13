import{v2 as cloudinary} from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError.js";

cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_key : process.env.CLOUDINARY_API_KEY,
    api_secret : process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localPath) => {
    try {
        if(!localPath)  return null;
        else{
        const response = await cloudinary.uploader.upload(localPath , {
            resource_type : "auto"
        })
        fs.unlinkSync(localPath);
        return response;
    }
    } catch (error) {
        fs.unlinkSync(localPath);
        console.log("Error : ", error);
        throw new ApiError(500,"Failed to upload file on cloudinary")
    }
}

const deleteFromCloudinary = async (publicId) => {
    if(!publicId) return null;
    try{
        return await cloudinary.uploader.destroy(publicId)
    }
    catch(error){
        console.log("Cloudinary deletion failed :", error)
        throw new ApiError(500,"Failed to delete file from cloudinary")

    }
}

export {uploadOnCloudinary , deleteFromCloudinary};