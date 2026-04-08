import { useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import socket from "../SocketConnection.js";
const SERVER_URL = "http://localhost:8000";

export function useSocket() {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }
    socketRef.current = socket;
    return () => {};
  }, []);
  const createRoom = useCallback((teacherName, questions,teacherId) => {
    socket?.emit("create-room", { teacherName, questions, teacherId });
  }, []);

  const giveList = useCallback((roomId) => {
    socket?.emit("live-list", { roomId });
  }, []);

  const joinRoom = useCallback((roomId, studentName,studentId) => {
    console.log(`Joining room ${roomId} as ${studentName}`);
    socket?.emit("join-room", { roomId, studentName, studentId });
  }, []);

  const startQuiz = useCallback((roomId) => {
    socket?.emit("start-quiz", { roomId });
  }, []);

  const nextQuestion = useCallback((roomId) => {
    socket?.emit("next-question", { roomId });
  }, []);

  const submitAnswer = useCallback((roomId, questionIndex, selectedOption) => {
    socket?.emit("submit-answer", {
      roomId,
      questionIndex,
      selectedOption,
    });
  }, []);

  const pauseQuiz = useCallback((roomId) => {
    socket?.emit("pause-quiz", { roomId });
  }, []);

  const resumeQuiz = useCallback((roomId) => {
    socket?.emit("resume-quiz", { roomId });
  }, []);

  const endQuiz = useCallback((roomId) => {
    socket?.emit("end-quiz", { roomId });
  }, []);

  const kickStudent = useCallback((roomId, studentSocketId) => {
    socket?.emit("kick-student", { roomId, studentSocketId });
  }, []);

  const closeRoom = useCallback((roomId) => {
    socket?.emit("close-room", { roomId });
  }, []);

  const rejoinAsTeacher = useCallback((roomId, teacherName) => {
    socket?.emit("rejoin-as-teacher", { roomId, teacherName });
  }, []);

  const rejoinAsStudent = useCallback((roomId) => {
    socket?.emit("rejoin-as-student", { roomId});
  }, []);

  const on = useCallback((event, callback) => {
    socket?.on(event, callback);
    return () => socket?.off(event, callback);
  }, []);

  return {
    socket: socketRef.current,

    createRoom,
    joinRoom,
    startQuiz,
    nextQuestion,
    submitAnswer,
    pauseQuiz,
    resumeQuiz,
    endQuiz,
    kickStudent,
    closeRoom,
    rejoinAsTeacher,
    rejoinAsStudent,
    on,
    giveList
  };
}
