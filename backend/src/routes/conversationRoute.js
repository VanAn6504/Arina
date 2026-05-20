import express from "express";
import {
  createConversation,
  getConversations,
  getMessages,
  markAsSeen,
  addMembers,
  removeMember,
  leaveGroup,
  updateGroupInfo,
  getMutualGroups,
} from "../controllers/conversationController.js";
import { checkFriendship } from "../middlewares/friendMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post("/", checkFriendship, createConversation);
router.get("/", getConversations);
router.get("/:conversationId/messages", getMessages);
router.patch("/:conversationId/seen", markAsSeen);
router.get("/mutual-groups/:targetUserId", getMutualGroups);

router.put("/:conversationId/members/add", addMembers);
router.delete("/:conversationId/members/remove", removeMember);
router.delete("/:conversationId/leave", leaveGroup);
router.put("/:conversationId/group-info", upload.single("avatar"), updateGroupInfo);

export default router;
