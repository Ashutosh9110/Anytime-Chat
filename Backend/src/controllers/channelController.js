import { supabase } from "../server/supabase.js";
import { createClient } from "@supabase/supabase-js";

export const getChannels = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { data: channels } = await supabase
      .from("channels")
      .select("*")
      .order("is_public", { ascending: false })
      .order("name", { ascending: true });
    const result = await Promise.all(
      channels.map(async (c) => {
        const { count } = await supabase
          .from("channel_members")
          .select("*", { count: "exact", head: true })
          .eq("channel_id", c.id);
        const { data: mem } = await supabase
          .from("channel_members")
          .select("id")
          .eq("channel_id", c.id)
          .eq("user_id", user_id);

        return {
          ...c,
          memberCount: count || 0,
          isMember: c.is_public ? true : mem.length > 0 // public channels always accessible
        };
      })
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};




export const createChannel = async (req, res) => {
  try {
    const { name, is_public } = req.body;
    const user = req.user;

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Missing token" });

    const subClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      }
    );
    const { data, error } = await subClient
      .from("channels")
      .insert({
        name,
        is_public,
        created_by: user.id
      })
      .select()
      .single();
    if (error) {
      console.error("Insert error:", error);
      return res.status(500).json({ error: error.message });
    }
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};





export const joinChannel = async (req, res) => {
  const channel_id = req.params.id;
  const user_id = req.user.id;
  const { data: channel } = await supabase
    .from("channels")
    .select("is_public")
    .eq("id", channel_id)
    .single();
  if (!channel) return res.status(404).json({ error: "Channel not found" });
  if (channel.is_public)
    return res.json({ message: "Public channel — no join required" });
  const { data: exists } = await supabase
    .from("channel_members")
    .select("id")
    .eq("channel_id", channel_id)
    .eq("user_id", user_id);
  if (exists.length > 0) return res.json({ message: "Already joined" });
  await supabase.from("channel_members").insert({ channel_id, user_id });
  res.json({ success: true });
};



export const leaveChannel = async (req, res) => {
  const channel_id = req.params.id;
  const user_id = req.user.id;

  const { error } = await supabase
    .from("channel_members")
    .delete()
    .eq("channel_id", channel_id)
    .eq("user_id", user_id);

  if (error) return res.status(500).json(error);

  res.json({ success: true });
};


export const listMembers = async (req, res) => {
  const channel_id = req.params.id;

  const { data, error } = await supabase
    .from("channel_members")
    .select("user_id")
    .eq("channel_id", channel_id);
  if (error) return res.status(500).json(error);
  res.json(data);
};



