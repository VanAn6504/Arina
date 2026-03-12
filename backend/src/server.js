import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./libs/db.js";
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import cookieParser from "cookie-parser";
import { protectedRoute } from "./middlewares/authMeddleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

//middlewares
app.use(express.json());
app.use(cookieParser());

//public router
app.use("/api/auth", authRoute);

//private router
app.use(protectedRoute)
app.use("/api/users", userRoute)

connectDB().then(() => {
      app.listen(PORT, () => {
     console.log(`server bắt đầu trên cổng ${PORT}`);
  });
})