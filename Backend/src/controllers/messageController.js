import { supabase } from "../server/supabase.js";

export const sendMessage = async (req, res) => {
  const { content, channel_id, user_id } = req.body;
  if (!content || !channel_id || !user_id) {
    return res.status(400).json({ error: "Missing fields" });
  }
  // console.log("REQ USER:", req.user);
  // console.log("REQ BODY:", req.body);

  const { data, error } = await supabase
    .from("messages")
    .insert({ user_id, channel_id, content })
    .select("id, content, created_at, user_id")
    .single();
    console.log("MESSAGE ERROR:", error);

  if (error) return res.status(500).json({ error: error.message });

  const { data: profile } = await supabase
    .from("profiles")
    .select("name,email")
    .eq("id", user_id)
    .single();

  res.json({ ...data, profiles: profile || null });
};

export const getMessages = async (req, res) => {
  const channel_id = req.params.id;
  const limit = parseInt(req.query.limit) || 20;
  const before = req.query.before;
  let query = supabase
    .from("messages")
    .select("id, content, created_at, user_id, profiles(name,email)")
    .eq("channel_id", channel_id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (before) {
    query = query.lt("created_at", before);
  }
  const { data, error } = await query;
  if (error) {
    console.error("GET MESSAGES ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
  res.json(data.reverse());
};


