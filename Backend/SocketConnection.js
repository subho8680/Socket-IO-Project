import { Server } from "node:http";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { calculateContestLeaderboard } from "./Controllers/LeaderBoard/leaderBoard.controller.js";

const myMap = new Map();
export const connectSocket = (io) => {
  // console.log("hello boy");
  io.use((socket, next) => {
    cookieParser()(socket.request, socket.request.res, async (err) => {
      const token = socket.request.cookies.token;
      if (!token) return next(new Error("Authentication Error"));
      const decode = await jwt.verify(token, process.env.SECRET_KEY);
      socket.userid = decode.userId;
      const id = decode.userId;
      next();
    });
  });
  io.on("connection", (socket) => {
    console.log("socket connected", socket.id);
    myMap.set(socket.userid, socket.id);
    socket.join(`user:${socket.userid}`);
    socket.on("join-room", async ({ contestId }) => {
      socket.join(contestId);
      console.log(`Socket ${socket.id} joined contest room: ${contestId}`);
      try {
        const leaderboard = await calculateContestLeaderboard(contestId);
        socket.emit("leaderboard-updated", { leaderboard });
      } catch (err) {
        console.error("Error sending initial leaderboard:", err);
      }
    });
  });
};
