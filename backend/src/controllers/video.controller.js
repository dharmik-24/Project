// If you want to make it a true clone later on, keep in mind that YouTube doesn't just play raw .mp4 files. If someone uploads a massive 4K video, it would buffer forever on a slow connection.
// Real streaming platforms use tools like FFmpeg to "transcode" the video. This means taking the original video and breaking it into tiny 10-second chunks at different resolutions (1080p, 720p, 360p) using a protocol called HLS (HTTP Live Streaming). This allows the video player to seamlessly drop the quality if the user's internet connection slows down.

//What we are using ::
    //Frontend sends the request to the backend.
    //Multer will handle the video uploading.
    //store it on cloudinary and just store the url in mongodb.
//Problrm :: Node.js is single-threaded, having large video files pass through your server creates a massive bottleneck. If three users upload 1GB videos at the same time, your server's RAM and network bandwidth will max out, causing requests from other users (like simply trying to load the homepage) to time out and crash.

//Better Approach :: Pre-Signed URLs..
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose"


const getAllVideos = asyncHandler(async (req , res) =>{
    
    const {
        page = 1,   //Total pages
        limit = 10, //video limits per page
        query = "",
        sortBy = "createdAt",
        sortType = "desc"
    } = req.query;

    const matchstage = {
        isPublished: true,
        title: { $regex: query , $options: "i"}
    }

    const totalVideos = await Video.countDocuments(matchstage)

    const videos = await Video.aggregate([

        {
            $match: matchstage
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline : [
                    {
                        $project: {
                            fullName: true,
                            username: true,
                            avatar: true
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1,
            }
        },
        { 
            $skip: (parseInt(page) - 1) * parseInt(limit) 
        },
        { 
            $limit: parseInt(limit) 
        },

    ])

    if(!videos?.length){
        throw new ApiError(404, "No Viddeos Found")
    }

    return res.status(200)
    .json(
        new ApiResponse(
            200,
            {
                videos,
                totalVideos,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalVideos / limit)
            },
            "Vedios Fetched Successfully"
        )
    )
})

const publishVideo = asyncHandler(async (req , res) =>{

    const {title , description} = req.body;
    if(!title){
        throw new ApiError(400 , "Please Provide Title of the Video")
    }
    if(!description){
        throw new ApiError(400 , "Please Provide Description of the Video")
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if(!videoFileLocalPath){
        throw new ApiError(400 , "Video File is required")
    }
    if(!thumbnailLocalPath){
        throw new ApiError(400 , "Thumbnail is required")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!videoFile){
        throw new ApiError(400 , "Problem occured while uploading Vedio on Cloudinary")
    }
    if(!thumbnail){
        throw new ApiError(400 , "Problem occured while uploading Thumbnail on Cloudinary")
    }

    try {
        const video = await Video.create({
            title,
            description,
            videoFile: {
                url: videoFile.url,
                publicId: videoFile.public_id
            },
            thumbnail: {
                url: thumbnail.url,
                publicId: thumbnail.public_id
            },
            duration: videoFile.duration,
            owner: req.user._id
        })

        if(!video){
            throw new ApiError(500 , "Something went wrong while uploading a Video")
        }
        return res.status(200)
        .json(
            new ApiResponse(200 , video , "Video Uploaded Successfully")
        )

    } 
    catch (error) {
        console.log(error)

        if(videoFile){
            await deleteFromCloudinary(videoFile.public_id)
        }
        if(thumbnail){
            await deleteFromCloudinary(thumbnail.public_id)
        }
        throw new ApiError(500, "Somthing went wrong while uploading Video")
    }
})

const getVideoById = asyncHandler(async (req , res) => {

    const {videoId} = req.params;
    if(!videoId){
        throw new ApiError(400 , "Give a valid Video ID")
    }
    //Increse the views by one
    //$incr is a atomic operation which will be helpful in concurrent operations.(when multiple users are watching a video at the same time)
    let video = await Video.updateOne(
        {_id: new mongoose.Types.ObjectId(videoId)},
        {$inc: {views: 1}}
    )

    video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: true,
                            fullName: true,
                            avatar: true
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "owner._id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                },
                likes: {
                    $size: "$likes"
                },
                subscribers: {
                    $size: "$subscribers"
                },
                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [req.user?._id , "$subscribers.subscriber"]
                        },
                        then: true,
                        else: false
                    }
                },
                isLiked: {
                    $cond: {
                        if: {
                            $in: [req.user?._id , "$likes.likedBy"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        }

    ])

    if(!video?.length){
        throw new ApiError(404 , "Video Not Found")
    }
    return res.status(200)
    .json(new ApiResponse(200 , video[0] , "Video Fateched Successfully"))

})

const updateVideo = asyncHandler(async (req, res) => {

    const {videoId} = req.params;
    const {title , description} = req.body;
    const newThumbnailLocalPath = req.file?.path;

    if(!videoId){
        throw new ApiError(400 , "Give a Valid Video ID")
    }
    if(!title){
        throw new ApiError(400 , "Title field is required")
    }
    if(!description){
        throw new ApiError(400 , "Descrption Field is reqiured")
    }
    if(!newThumbnailLocalPath){
        throw new ApiError(400 , "Thumbnail is reqiured")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404 , "Video Not Found")
    }

    //Make sure that no other user can change video..
    if(!video.owner.equals(req.user._id)){
        throw new ApiError(403 , "You are not allowed to update vidoe")
    }

    //Delete old thumbnail from Cloudinary
    await deleteFromCloudinary(video.thumbnail.publicId)

    const newThumbnail = await uploadOnCloudinary(newThumbnailLocalPath)
    if(!newThumbnail){
        throw new ApiError(400, "Error while uploading Thumbnail")
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: {
                    url: newThumbnail.url,
                    publicId: newThumbnail.public_id 
                }
            }
        },
        {
            new: true
        }
    )
    
    return res.status(200)
    .json(
        new ApiResponse(200 , updatedVideo , "Video Updated Successfully")
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const {videoId} = req.params;

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400 , "Video Not Found")
    }

    if(!video.owner.equals(req.user._id)){
        throw new ApiError(403 , "You are not allowed to delette Video")
    }

    const deletedVideoFile = await deleteFromCloudinary(video.videoFile.publicId)
    if(!deletedVideoFile){
        throw new ApiError(500 , "Error while deleting VideoFile")
    }
    
    const deletedThumbnail = await deleteFromCloudinary(video.thumbnail.publicId)
    if(!deletedThumbnail){
        throw new ApiError(500 , "Error while deleting Thumbnail")
    }

    const deletedVideo = await Video.findByIdAndDelete(videoId)
    if(!deletedVideo){
        throw new ApiError(500 , "Error while deleting video")
    }
    return res.status(200)
    .json(new ApiResponse(200 , {} , "Video Deleted Successfully"))

})

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video id is required");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(500, "Video not found");
  }

  if (!video.owner.equals(req.user._id)) {
    throw new ApiError(
      403,
      "You are not allowed to update another user's video"
    );
  }

  const videoPublishStatus = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video.isPublished,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        videoPublishStatus,
        "Video published status modified"
      )
    );
});

export {publishVideo , getAllVideos , getVideoById , updateVideo , deleteVideo , togglePublishStatus}