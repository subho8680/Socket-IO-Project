import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { createServer } from "node:http";
import connectDB from "./utils/db.js";
import teacherRouter from "./Routes/TeacherRoute.js";
import studentRouter from "./Routes/StudentRoute.js";
import leaderBoardRouter from "./Routes/LeaderBoardRoute.js";
import { connectSocket } from "./SocketConnection.js";
const app = express();
const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
};
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json());
app.use("/api/v1/teacher", teacherRouter);
app.use("/api/v1/student", studentRouter);
app.use("/api/v1/all", leaderBoardRouter);
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});
connectSocket(io)
dotenv.config({});
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`server is listening at port ${port}`);
  connectDB();
});
