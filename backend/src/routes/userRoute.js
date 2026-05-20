import express from "express";
import {
  authMe,
  searchUserByUsername,
  uploadAvatar,
  updateProfile,
  changePassword,
  blockUser,
  unblockUser,
  getBlockedList,
  getUserProfile,
} from "../controllers/userController.js";
import {upload} from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/me", authMe);
router.get("/search", searchUserByUsername);
router.post("/uploadAvatar", upload.single("file"), uploadAvatar);
router.put("/profile", updateProfile);
router.put("/change-password", changePassword);
router.put("/block/:targetUserId", blockUser);
router.put("/unblock/:targetUserId", unblockUser);
router.get("/blocked-list", getBlockedList);
router.get("/profile/:userId", getUserProfile);

export default router;
