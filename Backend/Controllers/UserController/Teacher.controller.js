import { quizCreate } from "../../Gemini.js";
import { quizModel } from "../../Models/Quiz/quiz.model.js";
import { teacherModel } from "../../Models/User/Teacher.model.js";
import jwt from "jsonwebtoken";
import { generateRoomId } from "../../Roommanager.js";
import { roomModel } from "../../Models/Room/room.model.js";
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
    const tokenData = {
      userId: newUser._id,
      userType: "Teacher",
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
export const generateQuestion = async (req, res) => {
  try {
    const { topic, quesNo, description, difficulty } = req.body;
    const quizQuestions = await quizCreate({
      topic,
      quesNo,
      description,
      difficulty,
    });
    return res.status(200).json({
      msg: "Quiz created Successfully",
      quiz: quizQuestions,
      success: true,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Error generating quiz",
      success: false,
    });
  }
};

export const createQuiz = async (req, res) => {
  try {
    const userId = req.id;
    const { name, topic, difficulty, questions, scheduledAt } = req.body;
    const newQuiz = await quizModel.create({
      name,
      topic,
      difficulty,
      questions,
      createdBy: userId,
    });
    const roomId = generateRoomId();
    const newRoom = await roomModel.create({
      roomCode: roomId,
      quizId: newQuiz._id,
      teacherId: userId,
      scheduledAt: scheduledAt || null,
    });
    return res.status(201).json({
      msg: "Quiz and RoomID created Successfully",
      quiz: newQuiz,
      room: newRoom,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Error Finalizing quiz and RoomID",
      success: false,
    });
  }
};
export const getQuizRoomById = async (req, res) => {
  try {
    const userId = req.id;
    const quizRoomId = req.params.roomId;
    console.log("fetching quiz room with id", quizRoomId);
    const room = await roomModel.findById(quizRoomId).populate({
      path: "quizId",
    });
    if (!room) {
      return res.status(404).json({
        msg: "Quiz room not found",
        success: false,
      });
    }
    return res.status(200).json({
      msg: "Quiz Room fetched Successfully",
      room: room,
      success: true,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Error Fetching quiz",
      success: false,
    });
  }
};
export const getQuizRoomById2 = async (req, res) => {
  try {
    const userId = req.id;
    const quizRoomId = req.params.roomId;
    console.log("fetching quiz room with id", quizRoomId);
    const room = await roomModel.findOne({ roomCode: quizRoomId }).populate({
      path: "quizId",
    });
    if (!room) {
      return res.status(404).json({
        msg: "Quiz room not found",
        success: false,
      });
    }
    return res.status(200).json({
      msg: "Quiz Room fetched Successfully",
      room: room,
      success: true,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Error Fetching quiz",
      success: false,
    });
  }
};
export const updateRoom = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const { scheduledAt } = req.body;
    const room = await roomModel.findById(roomId);
    if (!room) {
      return res.status(404).json({
        msg: "Quiz room not found",
        success: false,
      });
    }
    room.scheduledAt = scheduledAt;
    await room.save();
    return res.status(200).json({
      msg: "Quiz room updated successfully",
      success: true,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Error updating quiz",
      success: false,
    });
  }
};

export const getAllQuizRooms = async (req, res) => {
  try {
    const userId = req.id;
    const rooms = await roomModel.find({ teacherId: userId }).populate({
      path: "quizId",
    });
    return res.status(200).json({
      msg: "All quiz rooms fetched Successfully",
      rooms: rooms,
      success: true,
    });
  } catch (e) {
    return res.status(500).json({
      msg: "Error Fetching quiz rooms",
      success: false,
    });
  }
};

// export const createQuiz = async (req, res) => {
//   try {
//     const userId = req.id;
//     const { topic, quesNo, description } = req.body;

//     const existingQuiz = await quizModel.findOne({
//       name: topic,
//       "meta.quesNo": quesNo,
//       "meta.description": description,
//     });

//     if (existingQuiz) {
//       return res.status(200).json({
//         msg: "Quiz fetched from database",
//         quiz: existingQuiz,
//         success: true,
//       });
//     }

//     const quizQuestions = await quizCreate({ topic, quesNo, description });

//     const quiz = await quizModel.create({
//       name: topic,
//       questions: quizQuestions,
//       createdBy: userId,
//       meta: {
//         quesNo,
//         description,
//       },
//     });

//     return res.status(201).json({
//       msg: "Quiz created Successfully",
//       quiz: quiz,
//       success: true,
//     });
//   } catch (e) {
//     console.log(e);
//   }
// };

// export const createQuiz = async (req, res) => {
//   try {
//     const quiz = await quizModel.aggregate([
//       { $match: { questions: { $exists: true, $ne: [] } } },
//       { $sample: { size: 1 } }
//     ]);

//     if (!quiz.length) {
//       return res.status(404).json({
//         msg: "No quizzes available",
//         success: false,
//       });
//     }

//     return res.status(200).json({
//       msg: "Random quiz fetched",
//       quiz: quiz[0],
//       success: true,
//     });

//   } catch (e) {
//     console.log(e);
//   }
// };
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
