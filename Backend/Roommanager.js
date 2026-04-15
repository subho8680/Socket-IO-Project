const rooms = {};
let _io = null;
import { roomModel } from "./Models/Room/room.model.js";
export function init(io) {
  _io = io;
}

export function generateRoomId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${timestamp}-${random}`;
}

function getLeaderboard(roomId) {
  const room = rooms[roomId];
  if (!room) return [];
  return [...room.students]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.lastAnsweredAt - b.lastAnsweredAt;
    })
    .map((s, index) => ({
      rank: index + 1,
      userId: s.studentId,
      socketId: s.socketId,
      name: s.name,
      score: s.score,
      correctAnswers: s.correctAnswers,
      wrongAnswers: s.wrongAnswers,
      streak: s.streak,
    }));
}

function calculatePoints(timeTakenMs, timeLimit) {
  const BASE_POINTS = 100;
  const timeTakenSec = timeTakenMs / 1000;
  const speedBonus = Math.max(0, Math.floor((timeLimit - timeTakenSec) * 2));
  return BASE_POINTS + speedBonus;
}

function createRoom(teacherSocketId, teacherName, questions, teacherId) {
  const roomId = generateRoomId();
  rooms[roomId] = {
    roomId,
    teacher: {
      socketId: teacherSocketId,
      name: teacherName,
      teacherId: teacherId || null,
    },
    students: [],
    questions: questions || [],
    currentQuestion: -1,
    status: "waiting",
    questionStartedAt: null,
    timers: {},
    createdAt: Date.now(),
  };
  return rooms[roomId];
}

function getRoom(roomId) {
  return rooms[roomId] || null;
}

function roomExists(roomId) {
  return !!rooms[roomId];
}

function deleteRoom(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  clearRoomTimers(roomId);
  delete rooms[roomId];
}

function clearRoomTimers(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  Object.values(room.timers).forEach((t) => {
    clearInterval(t);
    clearTimeout(t);
  });
  room.timers = {};
}

function addStudent(roomId, socketId, studentName, studentId) {
  const room = rooms[roomId];
  if (!room) return null;

  const existing = room.students.find((s) => s.studentId === studentId);
  if (existing) {
    existing.socketId = socketId;
    existing.name = studentName;
    return existing;
  }

  const student = {
    socketId: socketId,
    name: studentName,
    score: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    streak: 0,
    lastAnsweredAt: Infinity,
    answeredQuestions: [],
    joinedAt: Date.now(),
    studentId: studentId || null,
  };
  room.students.push(student);
  return student;
}

function removeStudent(roomId, studentId) {
  const room = rooms[roomId];
  if (!room) return null;
  const student = room.students.find((s) => s.studentId === studentId);
  room.students = room.students.filter((s) => s.studentId !== studentId);
  return student;
}

function getStudent(roomId, studentId) {
  const room = rooms[roomId];
  if (!room) return null;
  return room.students.find((s) => s.studentId === studentId) || null;
}

function hasStudentAnswered(roomId, studentId, questionIndex) {
  const student = getStudent(roomId, studentId);
  if (!student) return false;
  return student.answeredQuestions.includes(questionIndex);
}

function startQuiz(roomId) {
  const room = rooms[roomId];
  if (!room) return false;
  room.status = "active";
  room.currentQuestion = 0;
  return true;
}

function setCurrentQuestion(roomId, index) {
  const room = rooms[roomId];
  if (!room) return false;
  room.currentQuestion = index;
  room.questionStartedAt = Date.now();
  return true;
}

function pauseQuiz(roomId) {
  const room = rooms[roomId];
  if (!room) return false;
  room.status = "paused";
  clearRoomTimers(roomId);
  return true;
}

function resumeQuiz(roomId) {
  const room = rooms[roomId];
  if (!room) return false;
  room.status = "active";
  return true;
}

const endQuiz = async (roomId) => {
  const room = rooms[roomId];
  if (!room) return false;
  room.status = "ended";
  clearRoomTimers(roomId);
  const RoomId = room._id;
  const db_room = await roomModel.findOne({ roomCode: RoomId });
  if (db_room) {
    db_room.status = "finished";
    await db_room.save();
  }
  return true;
};

function processAnswer(
  roomId,
  studentId,
  questionIndex,
  selectedOption,
  answeredAt,
) {
  const room = rooms[roomId];
  const student = getStudent(roomId, studentId);
  if (!room || !student) return null;

  if (hasStudentAnswered(roomId, studentId, questionIndex)) {
    return { alreadyAnswered: true };
  }

  const question = room.questions[questionIndex];
  const isCorrect = question.correct === selectedOption;
  const timeTaken = answeredAt - room.questionStartedAt;

  student.answeredQuestions.push(questionIndex);
  student.lastAnsweredAt = answeredAt;
  student.lastSelectedOption = selectedOption;

  if (isCorrect) {
    const points = calculatePoints(timeTaken, question.timeLimit);
    student.score += points;
    student.correctAnswers += 1;
    student.streak += 1;
    return { isCorrect: true, pointsEarned: points, totalScore: student.score };
  } else {
    student.wrongAnswers += 1;
    student.streak = 0;
    return { isCorrect: false, pointsEarned: 0, totalScore: student.score };
  }
}

function updateTeacherSocket(roomId, newSocketId) {
  const room = rooms[roomId];
  if (!room) return false;
  room.teacher.socketId = newSocketId;
  return true;
}

function broadcastQuestion(roomId, questionIndex) {
  const room = getRoom(roomId);
  if (!room) return;

  setCurrentQuestion(roomId, questionIndex);
  const question = room.questions[questionIndex];

  console.log(`📢 Broadcasting Q${questionIndex} in room ${roomId}`);
  console.log("timelimit is", question?.timeLimit);

  _io.to(roomId).emit("new-question", {
    questionIndex,
    question: question.question,
    options: question.options,
    timeLimit: question.timeLimit || 30,
    totalQuestions: room.questions.length,
    questionNumber: questionIndex + 1,
  });

  startTimer(roomId, question.timeLimit || 30);
}

function startTimer(roomId, timeLimit) {
  const room = getRoom(roomId);
  if (!room) return;

  let timeLeft = timeLimit;

  room.timers["questionTimer"] = setInterval(() => {
    const r = getRoom(roomId);
    if (!r || r.status !== "active") {
      clearInterval(room.timers["questionTimer"]);
      return;
    }

    _io.to(roomId).emit("timer-tick", { timeLeft });
    timeLeft--;

    if (timeLeft < 0) {
      clearInterval(room.timers["questionTimer"]);
      revealAnswerAndNext(roomId);
    }
  }, 1000);
}

function revealAnswerAndNext(roomId) {
  const room = getRoom(roomId);
  if (!room || room.status !== "active") return;

  const questionIndex = room.currentQuestion;
  const question = room.questions[questionIndex];

  console.log(`⏰ Time up for Q${questionIndex} in room ${roomId}`);

  _io.to(roomId).emit("time-up", {
    questionIndex,
    correctAnswer: question.correct,
    correctAnswerText: question.options[question.correct],
    leaderboard: getLeaderboard(roomId),
  });

  setTimeout(() => {
    const r = getRoom(roomId);
    if (!r || r.status !== "active") return;

    const nextIndex = questionIndex + 1;
    if (nextIndex >= r.questions.length) {
      finishQuiz(roomId);
    } else {
      broadcastQuestion(roomId, nextIndex);
    }
  }, 3000);
}

async function finishQuiz(roomId) {
  const room = getRoom(roomId);
  if (!room) return;

  endQuiz(roomId);
  const leaderboard = getLeaderboard(roomId);

  console.log(`🏁 Quiz ended in room ${roomId}`);

  room.students.forEach((student) => {
    const studentSocket = _io.sockets.sockets.get(student.socketId);
    if (studentSocket) {
      studentSocket.emit("quiz-ended", {
        leaderboard,
        myStats: {
          totalScore: student.score,
          correctAnswers: student.correctAnswers,
          wrongAnswers: student.wrongAnswers,
          accuracy:
            student.correctAnswers + student.wrongAnswers > 0
              ? Math.round(
                  (student.correctAnswers /
                    (student.correctAnswers + student.wrongAnswers)) *
                    100,
                ) + "%"
              : "0%",
          rank:
            leaderboard.findIndex((s) => s.socketId === student.socketId) + 1,
        },
      });
    }
  });

  const teacherSocket = getTeacherSocket(room);
  if (teacherSocket) {
    teacherSocket.emit("quiz-ended", {
      leaderboard,
      myStats: null,
    });
  }
  const db_room = await roomModel.findOne({ roomCode: RoomId });
  if (db_room) {
    db_room.status = "finished";
    await db_room.save();
  }
}

function getTeacherSocket(room) {
  if (!room) return null;
  return _io.sockets.sockets.get(room.teacher.socketId) || null;
}

function isTeacher(socket, roomId) {
  const room = getRoom(roomId);
  if (!room) return false;
  if (socket.role !== "teacher") return false;
  if (room.teacher.teacherId !== socket.userid) return false;
  return true;
}

function isStudent(socket, roomId) {
  if (socket.role !== "student") return false;
  if (socket.roomId !== roomId) return false;
  return true;
}

function checkAllAnswered(room, questionIndex) {
  if (room.students.length === 0) return false;
  return room.students.every((s) =>
    s.answeredQuestions.includes(questionIndex),
  );
}

const createQuizCore = (io, room) => {
  const roomId = room.roomCode;
  if (rooms[roomId]) {
    console.log(`createQuizCore: room ${roomId} already exists, skipping`);
    return rooms[roomId];
  }
  console.log("quiz quesions are", room?.quizId?.questions);
  rooms[roomId] = {
    roomId,
    teacher: {
      teacherId: room.teacherId.toString() || null,
    },
    students: [],
    questions: room?.quizId?.questions || [],
    currentQuestion: -1,
    status: "waiting",
    scheduledAt: room.scheduledAt || null,
    questionStartedAt: null,
    timers: {},
    createdAt: Date.now(),
  };
  return rooms[roomId];
};

const startQuizCore = async (io, roomId) => {
  const room = rooms[roomId];
  if (!room) return false;

  room.status = "active";
  room.currentQuestion = 0;

  _io.to(roomId).emit("quiz-started", {
    totalQuestions: room.questions.length,
    message: "Quiz is starting!",
  });

  setTimeout(() => {
    broadcastQuestion(roomId, 0);
  }, 2000);
};

export default {
  init,
  createRoom,
  getRoom,
  roomExists,
  deleteRoom,
  addStudent,
  removeStudent,
  getStudent,
  hasStudentAnswered,
  startQuiz,
  setCurrentQuestion,
  pauseQuiz,
  resumeQuiz,
  endQuiz,
  processAnswer,
  getLeaderboard,
  updateTeacherSocket,
  clearRoomTimers,
  broadcastQuestion,
  startTimer,
  revealAnswerAndNext,
  finishQuiz,
  getTeacherSocket,
  isTeacher,
  isStudent,
  checkAllAnswered,
  createQuizCore,
  startQuizCore,
};
