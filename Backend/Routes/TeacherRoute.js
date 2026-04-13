import express from "express"
import { createQuiz, generateQuestion, getAllQuizRooms, getQuizRoomById, logOut, registerTeacher, TeacherLogin } from "../Controllers/UserController/Teacher.controller.js";
import { isAuthenticated } from "../Middlewares/isAuthenticated.js";
const router = express.Router();
router.route("/register").post(registerTeacher)
router.route("/login").post(TeacherLogin)
router.route("/createQuiz").post(isAuthenticated,createQuiz);
router.route("/logout").get(isAuthenticated,logOut);
router.route("/gen-quiz").post(isAuthenticated,generateQuestion);
router.route("/getAllQuizRooms").get(isAuthenticated,getAllQuizRooms);
router.route("/getQuizRoom/:roomId").get(isAuthenticated,getQuizRoomById);
export default router