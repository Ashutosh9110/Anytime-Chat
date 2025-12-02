import { supabase } from "../server/supabase.js";

export const sendMessage = async (req, res) => {
  const { content, channel_id } = req.body;
  const user_id = req.user.id;

  if (!content || !channel_id) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({ user_id, channel_id, content })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
};

export const getMessages = async (req, res) => {
  const channel_id = req.params.id;

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("channel_id", channel_id)
    .order("created_at", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
};
