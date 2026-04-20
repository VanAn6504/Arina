import express from "express";

import {
  sendDirectMessage,
  sendGroupMessage,
  deleteMessage,
  editMessage,
  reactMessage,
} from "../controllers/messageController.js";
import {
  checkFriendship,
  checkGroupMembership,
} from "../middlewares/friendMiddleware.js";

const router = express.Router();

router.post("/direct", checkFriendship, sendDirectMessage);
router.post("/group", checkGroupMembership, sendGroupMessage);
router.delete("/:messageId/delete", deleteMessage);
router.put("/:messageId/edit", editMessage);
router.post("/:messageId/react", reactMessage);

export default router;
