import express from "express";

import {
  sendDirectMessage,
  sendGroupMessage,
  deleteMessage,
  editMessage,
  reactMessage,
  uploadFile,
  searchMessages,
} from "../controllers/messageController.js";
import {
  checkFriendship,
  checkGroupMembership,
} from "../middlewares/friendMiddleware.js";
import { uploadMessageFile } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/search", searchMessages);
router.post("/direct", checkFriendship, sendDirectMessage);
router.post("/group", checkGroupMembership, sendGroupMessage);
router.delete("/:messageId/delete", deleteMessage);
router.put("/:messageId/edit", editMessage);
router.post("/:messageId/react", reactMessage);
router.post("/upload", uploadMessageFile.single("file"), uploadFile);

export default router;
