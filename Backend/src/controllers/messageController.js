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
  const { data, error } = await supabase
    .from("messages")
    .select("id, content, created_at, user_id, profiles(name,email)")
    .eq("channel_id", channel_id)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("GET MESSAGES ERROR:", error);
    const { data: fallback, error: fallbackErr } = await supabase
      .from("messages")
      .select("id, content, created_at, user_id")
      .eq("channel_id", channel_id)
      .order("created_at", { ascending: true });
    if (fallbackErr) return res.status(500).json({ error: fallbackErr.message });
    return res.json(
      fallback.map((m) => ({
        ...m,
        profiles: null,
      }))
    );
  }
  res.json(data);
};

