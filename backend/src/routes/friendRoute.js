import express from "express";

import {
  acceptFriendRequest,
  sendFriendRequest,
  declineFriendRequest,
  getAllFriends,
  getFriendRequests,
  cancelFriendRequest,
  removeFriend,
} from "../controllers/friendController.js";

const router = express.Router();

router.post("/requests", sendFriendRequest);

router.post("/requests/:requestId/accept", acceptFriendRequest);
router.post("/requests/:requestId/decline", declineFriendRequest);
router.delete("/requests/:requestId", cancelFriendRequest);

router.get("/", getAllFriends);
router.get("/requests", getFriendRequests);
router.delete("/:friendId", removeFriend);

export default router;
