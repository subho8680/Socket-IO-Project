import jwt from "jsonwebtoken";
export const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    console.log("token", token);
    if (!token) {
      return res.status(400).json({
        msg: "User not Authenticated log in first",
        success: false,
      });
    }
    const decode = await jwt.verify(token, process.env.SECRET_KEY);
    if (!decode) {
      return res.status(400).json({
        msg: "Invalid Token",
        success: false,
      });
    }
    console.log("decode", decode);
    req.id = decode.userId;
    next();
  } catch (e) {
    console.log(e);
    return res.status(401).json({
      success: false,
      msg: "Invalid or missing auth token.",
    });
  }
};
