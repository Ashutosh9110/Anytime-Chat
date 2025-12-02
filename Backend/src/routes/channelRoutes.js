import express from "express";
import { auth } from "../middleware/auth.js";
import { getChannels, joinChannel, leaveChannel, listMembers} from "../controllers/channelController.js";

const router = express.Router();

router.get("/", auth, getChannels);
router.post("/:id/join", auth, joinChannel);
router.post("/:id/leave", auth, leaveChannel);
router.get("/:id/members", auth, listMembers);

export default router;
