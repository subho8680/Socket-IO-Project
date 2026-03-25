import express from "express"
import { logOutStudent, registerStudent, StudentLogin, submitStudentAnswer } from "../Controllers/UserController/Student.controller.js";
import { isAuthenticated } from "../Middlewares/isAuthenticated.js";
const router = express.Router();
router.route("/register").post(registerStudent);
router.route("/login").post(StudentLogin)
router.route("/logout").get(isAuthenticated,logOutStudent)
router.route("/updateScore").post(isAuthenticated,submitStudentAnswer);
export default router