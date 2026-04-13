import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { isValidObjectId } from "mongoose";
import mongoose from "mongoose";

const createTweet = asyncHandler(async (req , res) => {
    
    const {content} = req.body
    const userId = req.user._id

    if(!content){
        throw new ApiError(400 , "Please provide content for tweet")
    }

    const tweet = await Tweet.create({
        content,
        owner: userId
    })
    if(!tweet){
        throw new ApiError(400, "Failed to create tweet")
    }

    return res.status(200)
    .json(new ApiResponse(200 , tweet , "Tweet Created Successfully"))

})

const getUserTweets = asyncHandler(async (req , res) => {
    
    const {userId} = req.params
    const {page=1 , limit=10} = req.query

    if(!userId || !isValidObjectId(userId)){
        throw new ApiError(400 , "Missing or Invalid USerId")
    }

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $sort: {
                createdAt : -1
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
                            userName: 1,
                            fullName: 1,
                            avatar: 1
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
            $project: {
                content: 1,
                owner: 1,
                createdAt: 1
            }
        },
        //pagination
        {
            $skip: (page-1)*limit
        },
        {
            $limit: parseInt(limit)
        }
    ])

    if(!tweets){
        throw new ApiError(400 , "Failed to fetch tweets")
    }

    return res.status(200)
    .json(new ApiResponse(200, tweets[0] , "Tweets Fetched Successfully"))

})

const updateTweet = asyncHandler(async (req, res) => {

  const { tweetId } = req.params;

  if (!tweetId || !isValidObjectId(tweetId)) {
    throw new ApiError(400, "Missing or Invalid Tweet ID");
  }

  const userID = req.user._id;
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Please provide some content");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(400, "No such tweet found");
  }

  if (!tweet.owner.equals(userID)) {
    throw new ApiError(403, "You are not allowed to update this tweet");
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content,
      },
    },
    { new: true }
  );

  if (!updateTweet) {
    throw new ApiError(400, "Failed to update the tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, updatedTweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {

  const { tweetId } = req.params;
  const userID = req.user._id;

  if (!tweetId || !isValidObjectId(tweetId)) {
    throw new ApiError(400, "Missing or Invalid Tweet ID");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "No such tweet not found");
  }

  if (!tweet.owner.equals(userID)) {
    throw new ApiError(403, "You are not allowed to delete this tweet");
  }

  const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

  if (!deletedTweet) {
    throw new ApiError(400, "Failed to delete the tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deletedTweet, "Tweet deleted successfully"));
});

export {createTweet , getUserTweets , updateTweet ,  deleteTweet}