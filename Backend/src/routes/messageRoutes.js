import express from "express";
import { supabaseAuth } from "../middleware/supabaseAuth.js";
import { sendMessage, getMessages } from "../controllers/messageController.js";

const router = express.Router();

router.post("/", supabaseAuth, sendMessage);
router.get("/:id", supabaseAuth, getMessages);

export default router;
