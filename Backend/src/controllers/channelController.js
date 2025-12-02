import { supabase } from "../server/supabase.js";

export const getChannels = async (req, res) => {
  const { data: channels, error } = await supabase
    .from("channels")
    .select("*");

  if (error) return res.status(500).json(error);

  const result = await Promise.all(
    channels.map(async (ch) => {
      const { count } = await supabase
        .from("channel_members")
        .select("id", { count: "exact", head: true })
        .eq("channel_id", ch.id);

      return {
        ...ch,
        memberCount: count || 0,
      };
    })
  );

  res.json(result);
};


export const joinChannel = async (req, res) => {
  const channel_id = req.params.id;
  const user_id = req.user.id;

  // check if already joined
  const { data: exists } = await supabase
    .from("channel_members")
    .select("*")
    .eq("channel_id", channel_id)
    .eq("user_id", user_id);

  if (exists.length > 0) return res.json({ message: "Already joined" });

  const { error } = await supabase
    .from("channel_members")
    .insert({ channel_id, user_id });

  if (error) return res.status(500).json(error);

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
    .select("user_id");

  if (error) return res.status(500).json(error);

  res.json(data);
};
