import express from "express";
import {createServer} from "node:http";

import {Server} from "socket.io";
import mongoose from "mongoose";
// const mongoose=require('mongoose');

import cors from "cors";

import userRoutes from "./routes/users.routes.js";

import connectToSocket from "./controllers/socketManager.js"; // importing connect to socket

const app=express();

const server=createServer(app);//creating aserver
const io=connectToSocket(server);

app.set("port",(process.env.PORT || 8080));//setting a port
app.use(cors());

app.use(express.json({limit:"40kb"}));//These two lines are middleware in Express — they handle incoming request bodies, especially for POST/PUT requests.
app.use(express.urlencoded({limit:"40kb",extended:"true"}));

app.use("/api/v1/users",userRoutes);

const start=async()=>
    {
    // const connectionDb=await mongoose.connect("mongodb+srv://kyros9876:kB3CvALcikjyvxVa@cluster0.wppqtlo.mongodb.net/");
    // console.log(`mongo connected db host:${connectionDb.connection.host}`);
        // mongoose.connect('mongodb://127.0.0.1:27017/test');
        // server.listen(app.get("port"),()=>
        // {
        //     console.log("listening on port number 8080");
        // });


        try
        {
            await mongoose.connect('mongodb://127.0.0.1:27017/zoom');
            console.log("✅ MongoDB connected");

            app.set("port", 8080);
            server.listen(app.get("port"), () =>
            {
                console.log(`🚀 Server running on http://localhost:${app.get("port")}`);
            });
        }
        catch (err)
        {
            console.error("❌ MongoDB connection failed:", err);
            process.exit(1);
        }
    } 



start();