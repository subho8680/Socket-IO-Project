import { Server } from "node:http";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import rm from "./Roommanager.js";
import { getLeaderBoard } from "./Controllers/LeaderBoard/leaderBoard.controller.js";
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
    console.log(`🔌 Connected: ${socket.id}`);
    socket.on("create-room", ({ teacherName, questions }) => {
      if (!teacherName || !questions || questions.length === 0) {
        socket.emit("error", {
          message: "Teacher name and questions are required",
        });
        return;
      }

      const room = rm.createRoom(socket.id, teacherName, questions);
      socket.join(room.roomId);
      socket.roomId = room.roomId;
      socket.role = "teacher";
      socket.teacherName = teacherName;

      console.log(`🏫 Room created: ${room.roomId} by ${teacherName}`);

      socket.emit("room-created", {
        roomId: room.roomId,
        teacherName,
        totalQuestions: questions.length,
      });
    });

    socket.on("join-room", ({ roomId, studentName }) => {
      const room = rm.getRoom(roomId);

      if (!room) {
        socket.emit("join-error", {
          message: "Room not found. Check the code.",
        });
        return;
      }

      if (room.status === "ended") {
        socket.emit("join-error", { message: "This quiz has already ended." });
        return;
      }

      if (room.status === "active") {
        socket.emit("join-error", { message: "Quiz already in progress." });
        return;
      }

      if (!studentName || studentName.trim() === "") {
        socket.emit("join-error", { message: "Name cannot be empty." });
        return;
      }

      const student = rm.addStudent(roomId, socket.id, studentName.trim());
      socket.join(roomId);
      socket.roomId = roomId;
      socket.role = "student";
      socket.studentName = studentName.trim();

      console.log(`👤 ${studentName} joined room ${roomId}`);

      socket.emit("join-success", {
        roomId,
        studentName: student.name,
        totalStudents: room.students.length,
      });
      io.to(roomId).emit("joined-list", {
        studentList: room.students.map((s) => ({
          name: s.name,
          socketId: s.socketId,
        })),
      });
      const teacherSocket = getTeacherSocket(room);
      if (teacherSocket) {
        teacherSocket.emit("student-joined", {
          studentName: student.name,
          totalStudents: room.students.length,
          studentList: room.students.map((s) => ({
            name: s.name,
            socketId: s.socketId,
          })),
        });
      }
    });

    socket.on("start-quiz", ({ roomId }) => {
      if (!isTeacher(socket, roomId)) return;
      console.log("nw quiz starting");
      const room = rm.getRoom(roomId);
      if (!room) return;

      if (room.students.length === 0) {
        // socket.emit("error", { message: "No students in room yet." });
        // return;
      }

      rm.startQuiz(roomId);
      console.log(`▶️  Quiz started in room ${roomId}`);

      io.to(roomId).emit("quiz-started", {
        totalQuestions: room.questions.length,
        message: "Quiz is starting!",
      });

      setTimeout(() => {
        broadcastQuestion(roomId, 0);
      }, 2000);
    });

    socket.on("next-question", ({ roomId }) => {
      if (!isTeacher(socket, roomId)) return;

      const room = rm.getRoom(roomId);
      if (!room || room.status !== "active") return;

      const nextIndex = room.currentQuestion + 1;

      rm.clearRoomTimers(roomId);

      if (nextIndex >= room.questions.length) {
        finishQuiz(roomId);
        return;
      }

      broadcastQuestion(roomId, nextIndex);
    });

    socket.on("submit-answer", ({ roomId, questionIndex, selectedOption }) => {
      if (!isStudent(socket, roomId)) return;

      const room = rm.getRoom(roomId);
      if (!room || room.status !== "active") {
        socket.emit("answer-too-late", {});
        return;
      }

      if (questionIndex !== room.currentQuestion) {
        socket.emit("answer-too-late", {});
        return;
      }

      const result = rm.processAnswer(
        roomId,
        socket.id,
        questionIndex,
        selectedOption,
        Date.now(),
      );

      if (!result) return;

      if (result.alreadyAnswered) {
        socket.emit("already-answered", {});
        return;
      }

      console.log(
        `✏️  ${socket.studentName} answered Q${questionIndex} — ${result.isCorrect ? "✅" : "❌"}`,
      );

      socket.emit("answer-received", {
        selectedOption,
        isCorrect: result.isCorrect,
        pointsEarned: result.pointsEarned,
        totalScore: result.totalScore,
      });

      io.to(roomId).emit("leaderboard-update", rm.getLeaderboard(roomId));
      // const allAnswered = checkAllAnswered(room, questionIndex);
      // if (allAnswered) {
      //   console.log(
      //     `⚡ All students answered — moving early in room ${roomId}`,
      //   );
      //   rm.clearRoomTimers(roomId);
      //   setTimeout(() => revealAnswerAndNext(roomId), 1500);
      // }
    });

    socket.on("pause-quiz", ({ roomId }) => {
      if (!isTeacher(socket, roomId)) return;

      rm.pauseQuiz(roomId);
      console.log(`⏸️  Quiz paused in room ${roomId}`);
      io.to(roomId).emit("quiz-paused", {
        message: "Teacher paused the quiz",
      });
    });

    socket.on("resume-quiz", ({ roomId }) => {
      if (!isTeacher(socket, roomId)) return;

      rm.resumeQuiz(roomId);
      console.log(`▶️  Quiz resumed in room ${roomId}`);
      io.to(roomId).emit("quiz-resumed", {
        message: "Quiz resumed!",
      });

      const room = rm.getRoom(roomId);
      if (room) {
        const question = room.questions[room.currentQuestion];
        startTimer(roomId, question.timeLimit);
      }
    });

    socket.on("end-quiz", ({ roomId }) => {
      if (!isTeacher(socket, roomId)) return;
      finishQuiz(roomId);
    });

    socket.on("kick-student", ({ roomId, studentSocketId }) => {
      if (!isTeacher(socket, roomId)) return;

      const room = rm.getRoom(roomId);
      const student = rm.removeStudent(roomId, studentSocketId);
      if (!student) return;

      const kickedSocket = io.sockets.sockets.get(studentSocketId);
      if (kickedSocket) {
        kickedSocket.emit("you-were-kicked", {
          message: "You were removed from the quiz by the teacher.",
        });
        kickedSocket.leave(roomId);
      }

      io.to(roomId).emit("student-left", {
        studentName: student.name,
        totalStudents: room.students.length,
      });

      console.log(`🚫 ${student.name} kicked from room ${roomId}`);
    });

    socket.on("close-room", ({ roomId }) => {
      if (!isTeacher(socket, roomId)) return;

      io.to(roomId).emit("room-closed", {
        message: "The teacher has closed this room.",
      });

      console.log(`🗑️  Room ${roomId} closed`);
      rm.deleteRoom(roomId);
    });

    socket.on("rejoin-as-teacher", ({ roomId, teacherName }) => {
      const room = rm.getRoom(roomId);
      if (!room) {
        socket.emit("join-error", { message: "Room no longer exists." });
        return;
      }

      rm.updateTeacherSocket(roomId, socket.id);
      socket.join(roomId);
      socket.roomId = roomId;
      socket.role = "teacher";
      socket.teacherName = teacherName;

      socket.emit("rejoin-success", {
        roomId,
        status: room.status,
        currentQuestion: room.currentQuestion,
        totalQuestions: room.questions.length,
        studentList: room.students.map((s) => ({
          name: s.name,
          socketId: s.socketId,
        })),
        leaderboard: rm.getLeaderboard(roomId),
      });

      io.to(roomId).emit("teacher-reconnected", {
        message: "Teacher reconnected!",
      });

      console.log(`🔄 Teacher rejoined room ${roomId}`);
    });

    socket.on("rejoin-as-student", ({ roomId, studentName }) => {
      const room = rm.getRoom(roomId);
      if (!room) {
        socket.emit("join-error", { message: "Room no longer exists." });
        return;
      }

      const existingStudent = room.students.find(
        (s) => s.name.toLowerCase() === studentName.toLowerCase(),
      );

      if (existingStudent) {
        existingStudent.socketId = socket.id;
      } else {
        rm.addStudent(roomId, socket.id, studentName);
      }

      socket.join(roomId);
      socket.roomId = roomId;
      socket.role = "student";
      socket.studentName = studentName;

      const student = rm.getStudent(roomId, socket.id);
      const question = room.questions[room.currentQuestion];

      socket.emit("rejoin-success", {
        status: room.status,
        currentQuestion: room.currentQuestion,
        totalQuestions: room.questions.length,
        question:
          room.status === "active"
            ? {
                questionIndex: room.currentQuestion,
                question: question.question,
                options: question.options,
                timeLimit: question.timeLimit,
              }
            : null,
        score: student ? student.score : 0,
        leaderboard: rm.getLeaderboard(roomId),
      });

      console.log(`🔄 Student ${studentName} rejoined room ${roomId}`);
    });

    socket.on("disconnect", () => {
      const { roomId, role, studentName, teacherName } = socket;
      if (!roomId) return;

      const room = rm.getRoom(roomId);
      if (!room) return;

      if (role === "teacher") {
        console.log(`⚠️  Teacher disconnected from room ${roomId}`);

        if (room.status === "active") {
          rm.pauseQuiz(roomId);
        }

        io.to(roomId).emit("teacher-disconnected", {
          message: "Teacher lost connection. Quiz is paused.",
        });

        room.timers["teacherTimeout"] = setTimeout(() => {
          if (rm.roomExists(roomId)) {
            io.to(roomId).emit("room-auto-closed", {
              message: "Room closed — teacher did not reconnect.",
            });
            console.log(`🗑️  Room ${roomId} auto-closed (teacher timeout)`);
            rm.deleteRoom(roomId);
          }
        }, 60000);
      } else if (role === "student") {
        const student = rm.removeStudent(roomId, socket.id);
        if (!student) return;

        console.log(`👤 ${studentName} disconnected from room ${roomId}`);

        const teacherSocket = getTeacherSocket(room);
        if (teacherSocket) {
          teacherSocket.emit("student-disconnected", {
            studentName,
            totalStudents: room.students.length,
          });
        }

        io.to(roomId).emit("leaderboard-update", rm.getLeaderboard(roomId));
      }
    });
  });

  function broadcastQuestion(roomId, questionIndex) {
    const room = rm.getRoom(roomId);
    if (!room) return;

    rm.setCurrentQuestion(roomId, questionIndex);
    const question = room.questions[questionIndex];

    console.log(`📢 Broadcasting Q${questionIndex} in room ${roomId}`);
    console.log("timelimit is", question.timeLimit);
    io.to(roomId).emit("new-question", {
      questionIndex,
      question: question.question,
      options: question.options,
      timeLimit: question.timeLimit || 30,
      totalQuestions: room.questions.length,
      questionNumber: questionIndex + 1,
    });

    startTimer(roomId, question.timeLimit);
  }

  function startTimer(roomId, timeLimit) {
    const room = rm.getRoom(roomId);
    if (!room) return;

    let timeLeft = timeLimit;

    room.timers["questionTimer"] = setInterval(() => {
      const r = rm.getRoom(roomId);
      if (!r || r.status !== "active") {
        clearInterval(room.timers["questionTimer"]);
        return;
      }

      io.to(roomId).emit("timer-tick", { timeLeft });
      timeLeft--;

      if (timeLeft < 0) {
        clearInterval(room.timers["questionTimer"]);
        revealAnswerAndNext(roomId);
      }
    }, 1000);
  }

  function revealAnswerAndNext(roomId) {
    const room = rm.getRoom(roomId);
    if (!room || room.status !== "active") return;

    const questionIndex = room.currentQuestion;
    const question = room.questions[questionIndex];

    console.log(`⏰ Time up for Q${questionIndex} in room ${roomId}`);

    io.to(roomId).emit("time-up", {
      questionIndex,
      correctAnswer: question.correctAnswer,
      correctAnswerText: question.options[question.correctAnswer],
      leaderboard: rm.getLeaderboard(roomId),
    });

    setTimeout(() => {
      const r = rm.getRoom(roomId);
      if (!r || r.status !== "active") return;

      const nextIndex = questionIndex + 1;
      if (nextIndex >= r.questions.length) {
        finishQuiz(roomId);
      } else {
        broadcastQuestion(roomId, nextIndex);
      }
    }, 3000);
  }

  function finishQuiz(roomId) {
    const room = rm.getRoom(roomId);
    if (!room) return;

    rm.endQuiz(roomId);
    const leaderboard = rm.getLeaderboard(roomId);

    console.log(`🏁 Quiz ended in room ${roomId}`);

    room.students.forEach((student) => {
      const studentSocket = io.sockets.sockets.get(student.socketId);
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
  }

  function getTeacherSocket(room) {
    if (!room) return null;
    return io.sockets.sockets.get(room.teacher.socketId) || null;
  }

  function isTeacher(socket, roomId) {
    const room = rm.getRoom(roomId);
    if (!room) return false;
    if (socket.role !== "teacher") return false;
    if (room.teacher.socketId !== socket.id) return false;
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
};
