import express from "express";
import { loginParticipant, logoutParticipant, registerParticipant } from "../Controllers/UserController/Participant.controller.js";
import { isAuthenticated } from "../Middlewares/isAuthenticated.js";

const router = express.Router();
router.post("/register", registerParticipant);
router.post("/login", loginParticipant);
router.post("/logout", isAuthenticated, logoutParticipant);

export default router;
