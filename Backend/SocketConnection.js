import { Server } from "node:http";
import jwt from "jsonwebtoken"
import cookieParser from "cookie-parser";
import { getLeaderBoard } from "./Controllers/LeaderBoard/leaderBoard.controller.js";
const myMap = new Map()
export const connectSocket = (io)=>{

    // console.log("hello boy");
    io.use((socket,next)=>{
        cookieParser()(socket.request,socket.request.res,async(err)=>{
            const token = socket.request.cookies.token;
            if(!token)return next(new Error("Authentication Error"))
            const decode = await jwt.verify(token,process.env.SECRET_KEY)
            socket.userid = decode.userId
            const id = decode.userId
            next()
        })
    })

    io.on("connection",(socket)=>{
        socket.on("join-room",({roomId,userId,userType,userName})=>{
            socket.join(roomId)
            let txt = `${userName} joined the quiz session`
            socket.to(roomId).emit("after-join",txt);
        })

        socket.on("next-ques",({roomId,quizQuestion})=>{
            socket.to(roomId).emit("deliver_ques",quizQuestion);
        })

        socket.on("give_leaderboard",async({roomId})=>{
            const leaderBoard = await getLeaderBoard(roomId);
            socket.to(roomId).emit("take_leaderBoard",leaderBoard);
        })
    })

}