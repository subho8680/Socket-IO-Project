import { quizModel } from "../../Models/Quiz/quiz.model.js";
import { quizPerfModel } from "../../Models/QuizPerformance/quizPerformance.js";
import { studentModel } from "../../Models/User/Student.model.js";
import jwt from "jsonwebtoken";
export const registerStudent = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const cur = await studentModel.findOne({ email: email });
    if (cur) {
      return res.status(400).json({
        msg: "User with same email already Exist",
        success: false,
      });
    }
    const newUser = await studentModel.create({ name, email, password });
    const tokenData = {
      userId: newUser._id,
      userType: "Student",
    };
    const day = 24 * 60 * 60 * 1000;
    const token = jwt.sign(tokenData, process.env.SECRET_KEY);
    res.cookie("token", token, { maxAge: day });
    return res.status(201).json({
      msg: "User Logged in Successfully",
      success: true,
      user: newUser,
    });
  } catch (e) {
    console.log(e);
  }
};

export const StudentLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const curUser = await studentModel.findOne({ email: email });
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
      userType: "Student",
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

export const logOutStudent = async (req, res) => {
  try {
    const id = req.id;
    const user = await studentModel.findById(id);
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

export const submitStudentAnswer = async (req, res) => {
  try {
    const { roomId, quizId, submitOption, index } = req.body;
    const studentId = req.id;
    const perfDetails = await quizPerfModel.findOne({
      roomId: roomId,
      createdBy: studentId,
    });

    const quizDetails = await quizModel.findById(quizId);
    if (perfDetails) {
      perfDetails.answerStat.push({
        questionName: quizDetails.questions[index].title,
        isAttempted: submitOption === -1 ? false : true,
        selectedOption: submitOption,
        isCorrect:
          submitOption === quizDetails.questions[index].correctOption.quesionNo
            ? true
            : false,
        options: quizDetails.questions[index].options,
        correctOption: quizDetails.questions[index].correctOption.quesionNo,
      });
      if (
        submitOption === quizDetails.questions[index].correctOption.quesionNo
      ) {
        perfDetails.points += 10;
      }
      await perfDetails.save();
      return res.status(201).json({
        msg: "performance Details Updated Successfully",
        success: true,
        perfDetails,
      });
    } else {
      console.log(
        submitOption +
          " " +
          quizDetails.questions[index].correctOption.quesionNo,
      );

      const details = await quizPerfModel.create({
        roomId: roomId,
        createdBy: studentId,
        answerStat: [
          {
            questionName: quizDetails.questions[index].title,
            isAttempted: submitOption === -1 ? false : true,
            selectedOption: submitOption,
            isCorrect:
              submitOption ===
              quizDetails.questions[index].correctOption.quesionNo
                ? true
                : false,
            options: quizDetails.questions[index].options,
            correctOption: quizDetails.questions[index].correctOption.quesionNo,
          },
        ],
        points:
          submitOption === quizDetails.questions[index].correctOption.quesionNo
            ? 10
            : 0,
      });
      return res.status(201).json({
        msg: "performance Status Updated Successfully",
        success: true,
        perfDetails: details,
      });
    }
  } catch (e) {
    console.log(e);
  }
};
