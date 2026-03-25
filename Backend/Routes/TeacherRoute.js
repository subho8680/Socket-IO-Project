import express from "express"
import { createQuiz, logOut, registerTeacher, TeacherLogin } from "../Controllers/UserController/Teacher.controller.js";
import { isAuthenticated } from "../Middlewares/isAuthenticated.js";
const router = express.Router();
router.route("/register").post(registerTeacher)
router.route("/login").post(TeacherLogin)
router.route("/createQuiz").post(isAuthenticated,createQuiz);
router.route("/logout").get(isAuthenticated,logOut);
export default router