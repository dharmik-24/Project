import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express();

//Now we have to do some configuaration settings ::

//Configuration setting for CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

//Allow express to use json
app.use(express.json({limit: "16kb"}));

//allow express to use data from url
app.use(express.urlencoded({limit: "16kb"}));

app.use(express.static("public"));

app.use(cookieParser());



//Import Routers 
import userRoute from "./routes/user.routes.js";

app.use("/api/v1/users", userRoute);

export {app};