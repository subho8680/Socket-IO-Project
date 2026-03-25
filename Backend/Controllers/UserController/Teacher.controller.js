import { quizCreate } from "../../Gemini.js";
import { quizModel } from "../../Models/Quiz/quiz.model.js";
import { teacherModel } from "../../Models/User/Teacher.model.js";
import jwt from "jsonwebtoken";
export const registerTeacher = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const cur = await teacherModel.findOne({ email: email });
    if (cur) {
      return res.status(400).json({
        msg: "User with same email already Exist",
        success: false,
      });
    }
    const newUser = await teacherModel.create({ name, email, password });
    return res.status(201).json({
      msg: "User Created Successfully",
      success: true,
      user: newUser,
    });
  } catch (e) {
    console.log(e);
  }
};

export const TeacherLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const curUser = await teacherModel.findOne({ email: email });
    if (!curUser) {
      return res.status(400).json({
        msg: "User with this email does not exist",
        success: false,
      });
    }
    if (password != curUser.password) {
      return res.status(400).json({
        msg: "Wrong Password",
        success: false,
      });
    }
    const tokenData = {
      userId: curUser._id,
      userType: "Teacher",
    };
    const day = 24 * 60 * 60 * 1000;
    const token = jwt.sign(tokenData, process.env.SECRET_KEY);
    res.cookie("token", token, { maxAge: day });
    return res.status(201).json({
      msg: "User Logged in Successfully",
      success: true,
      user: curUser,
    });
  } catch (e) {
    console.log(e);
  }
};

export const getAllQuizes = async (req, res) => {
  const userId = req.id;
};

export const createQuiz = async (req, res) => {
  try {
    const userId = req.id;
    const { topic, quesNo,description } = req.body;
    const quizQuestions = await quizCreate({ topic, quesNo,description });
    const quiz = await quizModel.create({
      name: topic,
      questions: quizQuestions,
      createdBy: userId,
    });

    return res.status(201).json({
      msg: "quiz created Successfully",
      quiz: quiz,
      success: true,
    });
  } catch (e) {
    console.log(e);
  }
};

export const logOut = async (req, res) => {
  try {
    const id = req.id;
    const user = await teacherModel.findById(id);
    res.cookie("token", "");
    return res.status(201).json({
      msg: "User Logged Out Successfully",
      success: true,
      user: user,
    });
  } catch (e) {
    console.log(e);
  }
};
export const deleteQuiz = async (req, res) => {
  try {
    const quizId = req.params.id;
    const deleted = await quizModel.findByIdAndDelete(quizId);
    return res.status(201).json({
      msg: "Quiz Deleted Successfully",
      success: true,
      deleted: deleted,
    });
  } catch (e) {
    console.log(e);
  }
};
