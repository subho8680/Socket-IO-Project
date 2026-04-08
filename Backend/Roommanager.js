const rooms = {};

function generateRoomId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms[id] ? generateRoomId() : id;
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
    socketId,
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

function endQuiz(roomId) {
  const room = rooms[roomId];
  if (!room) return false;
  room.status = "ended";
  clearRoomTimers(roomId);
  return true;
}

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
export default {
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
};
