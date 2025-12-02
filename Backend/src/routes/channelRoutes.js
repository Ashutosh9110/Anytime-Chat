import express from "express";
import { supabaseAuth } from "../middleware/supabaseAuth.js";
import { getChannels, joinChannel, leaveChannel, listMembers, createChannel } from "../controllers/channelController.js";

const router = express.Router();

router.get("/channels", supabaseAuth, getChannels);
router.post("/channels", supabaseAuth, createChannel);
router.post("/channels/:id/join", supabaseAuth, joinChannel);
router.post("/channels/:id/leave", supabaseAuth, leaveChannel);
router.get("/channels/:id/members", supabaseAuth, listMembers);

export default router;
