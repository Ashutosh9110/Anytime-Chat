import express from "express";
import { supabaseAuth } from "../middleware/supabaseAuth.js";
import { getChannels, joinChannel, leaveChannel, listMembers} from "../controllers/channelController.js";

const router = express.Router();

router.get("/", supabaseAuth, getChannels);
router.post("/:id/join", supabaseAuth, joinChannel);
router.post("/:id/leave", supabaseAuth, leaveChannel);
router.get("/:id/members", supabaseAuth, listMembers);

export default router;
