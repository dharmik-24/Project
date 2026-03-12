import{v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_key : process.env.CLOUDINARY_API_KEY,
    api_secret : process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localPath) => {
    try {
        if(!loclaPath)  return null;
        else{
        const response = cloudinary.uploader.upload(localPath , {
            resource_type : "auto"
        })

        fs.unlinkSync(localPath);
        return response;
    }
    } catch (error) {
        fs.unlinkSync(localPath);
        console.log("Error : ", error);
    }
}

export {uploadOnCloudinary};