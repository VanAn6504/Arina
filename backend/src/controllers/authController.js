import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Session from "../models/Session.js";

const ACCESS_TOKEN_TTL = "30m"; // thuờng là dưới 15m
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; // 14 ngày

export const signUp = async (req, res) =>{
    try {
    const { username, password, email, firstName, lastName } = req.body;

    if (!username || !password || !email || !firstName || !lastName) {
      return res.status(400).json({
        message: "Không thể thiếu username, password, email, firstName, và lastName",
      });
    }

    // kiểm tra username tồn tại chưa
    const duplicate = await User.findOne({ username });

    if (duplicate) {
      return res.status(409).json({ message: "username đã tồn tại" });
    }

    // mã hoá password
    const hashedPassword = await bcrypt.hash(password, 10); // salt = 10

    // tạo user mới
    await User.create({
      username,
      hashedPassword,
      email,
      displayName: `${lastName} ${firstName}`,
    });

    // return
    return res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi gọi signUp", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
}

export const signIn = async(req, res) =>{
  
  try {
    //lay input
    const {username, password} = req.body;

    if(!username || !password){
      return res.status(400).json({ message: "Thiếu username hoặc password." });
    }
    //lay hashpassword trong db de so vs password ng dung nhap vao
    const user = await User.findOne({username});
    //kiem tra password
    if(!user){
      return res.status(400).json({ message: "Thiếu username hoặc password." });
    }
    
    const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);

    if(!passwordCorrect){
      return res.status(400).json({ message: "Thiếu username hoặc password." });
    }

    //neu khop tao accesstoken voi jwt
    const accessToken = jwt.sign(
      {userId: user._id}, 
      process.env.ACCESS_TOKEN_SECRET, 
      {expiresIn: REFRESH_TOKEN_TTL}   
    )
    //tao request token
      const refreshToken = crypto.randomBytes(64).toString("hex");

    //tao session moi de luu request token
    await Session.create({
      userId: user._id,
      refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });

    //tra request token ve cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",  //backend, frontend deploy rieng
      maxAge: REFRESH_TOKEN_TTL,
    });
    //tra access token ve trong res
    return res.status(200).json({message: `User ${user.displayName} da logged in!`, accessToken})

  } catch (error) {
    console.error("Lỗi khi gọi signIn", error);
    return res.status(500).json({message: "Lỗi hệ thống" });
  }

}

export const signOut = async(req, res) =>{
  try {
    const token = req.cookies?.refreshToken;

    if(token){
      //xoa refreshtoken trong session
      await Session.deleteOne({refreshToken: token});
      //xoa cookie
      res.clearCookie("refreshToken");
    }
    return res.sendStatus(204);
  } catch (error) {
     console.error("Lỗi khi gọi signOut", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
}