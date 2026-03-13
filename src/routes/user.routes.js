import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

//Syntax : router.route(path , middleware , controller)
//Here we used a middleware code for uploading files to local server using multer..
//This code uses Multer middleware to upload multiple files (avatar and coverImage) and store 
// them in the storage location defined in multer.middleware. After the upload, 
// the request is passed to the registerUser controller...
//After uploading files are available in req.files object which looks like ::
// req.files = {
//   avatar: [
//     {
//       filename: "avatar.png",
//       path: "public/temp/avatar.png"
//     }
//   ],
//   coverImage: [
//     {
//       filename: "cover.png",
//       path: "public/temp/cover.png"
//     }
//   ]
// } 

router.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount : 1
        },
        {
            name : "coverImage",
            maxcount : 1
        }
    ])
    , registerUser);

export default router;