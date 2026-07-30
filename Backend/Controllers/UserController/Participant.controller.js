import jwt from "jsonwebtoken";
import { participantModel } from "../../Models/User/Participant.model.js";

const cookieOptions = {
  maxAge: 24 * 60 * 60 * 1000,
};

const issueToken = (res, user) => {
  const token = jwt.sign({ userId: user._id, userType: "participant" }, process.env.SECRET_KEY);
  console.log("token issued", token)
  res.cookie("token", token, cookieOptions);
};

export const registerParticipant = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ success: false, msg: "Name, email, and password are required." });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (await participantModel.findOne({ email: normalizedEmail })) {
      return res.status(400).json({ success: false, msg: "An account with this email already exists." });
    }
    const user = await participantModel.create({ name: name.trim(), email: normalizedEmail, password });
    issueToken(res, user);
    return res.status(201).json({ success: true, msg: "Account created successfully.", user });
  } catch (error) {
    return res.status(500).json({ success: false, msg: "Unable to create your account." });
  }
};

export const loginParticipant = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await participantModel.findOne({ email: email?.trim().toLowerCase() });
    if (!user || user.password !== password) {
      return res.status(400).json({ success: false, msg: "Incorrect email or password." });
    }
    issueToken(res, user);
    return res.status(200).json({ success: true, msg: "Welcome back.", user });
  } catch (error) {
    return res.status(500).json({ success: false, msg: "Unable to sign in." });
  }
};

export const logoutParticipant = (_req, res) => {
  res.clearCookie("token");
  return res.status(200).json({ success: true, msg: "Signed out successfully." });
};
