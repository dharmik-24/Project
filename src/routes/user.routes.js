import { Router } from "express";
import { changePassword, getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateAvatar, updateCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

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

router.route("/login").post(loginUser)

//Secured Routes ::

router.route("/logout").post(verifyJWT , logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT , changePassword)
router.route("/current-user").get(verifyJWT , getCurrentUser)
router.route("/update-account").patch(verifyJWT , updateAccountDetails)
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar") , updateAvatar)
router.route("/update-coverimage").patch(verifyJWT, upload.single("coverImage") , updateCoverImage)




export default router;