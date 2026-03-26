import { useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:8000";

export function useSocket() {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(SERVER_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);
  const createRoom = useCallback((teacherName, questions) => {
    socketRef.current?.emit("create-room", { teacherName, questions });
  }, []);

  const joinRoom = useCallback((roomId, studentName) => {
    socketRef.current?.emit("join-room", { roomId, studentName });
  }, []);

  const startQuiz = useCallback((roomId) => {
    socketRef.current?.emit("start-quiz", { roomId });
  }, []);

  const nextQuestion = useCallback((roomId) => {
    socketRef.current?.emit("next-question", { roomId });
  }, []);

  const submitAnswer = useCallback((roomId, questionIndex, selectedOption) => {
    socketRef.current?.emit("submit-answer", {
      roomId,
      questionIndex,
      selectedOption,
    });
  }, []);

  const pauseQuiz = useCallback((roomId) => {
    socketRef.current?.emit("pause-quiz", { roomId });
  }, []);

  const resumeQuiz = useCallback((roomId) => {
    socketRef.current?.emit("resume-quiz", { roomId });
  }, []);

  const endQuiz = useCallback((roomId) => {
    socketRef.current?.emit("end-quiz", { roomId });
  }, []);

  const kickStudent = useCallback((roomId, studentSocketId) => {
    socketRef.current?.emit("kick-student", { roomId, studentSocketId });
  }, []);

  const closeRoom = useCallback((roomId) => {
    socketRef.current?.emit("close-room", { roomId });
  }, []);

  const rejoinAsTeacher = useCallback((roomId, teacherName) => {
    socketRef.current?.emit("rejoin-as-teacher", { roomId, teacherName });
  }, []);

  const rejoinAsStudent = useCallback((roomId, studentName) => {
    socketRef.current?.emit("rejoin-as-student", { roomId, studentName });
  }, []);

  const on = useCallback((event, callback) => {
    socketRef.current?.on(event, callback);
    return () => socketRef.current?.off(event, callback);
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
  };
}
