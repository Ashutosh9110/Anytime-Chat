import { supabase } from "../server/supabase.js";

export const getChannels = async (req, res) => {
  try {
    const search = req.query.search || "";
    const sort = req.query.sort || "name_asc";
    let query = supabase.from("channels").select("*");
    // Search
    if (search) query = query.ilike("name", `%${search}%`);
    // Sorting
    if (sort === "name_asc") query = query.order("name", { ascending: true });
    if (sort === "name_desc") query = query.order("name", { ascending: false });
    const { data: channels, error } = await query;
    if (error) return res.status(500).json(error);
    const result = await Promise.all(
      channels.map(async (ch) => {
        const { count } = await supabase
          .from("channel_members")
          .select("*", { count: "exact", head: true })
          .eq("channel_id", ch.id);

        return {
          ...ch,
          memberCount: count || 0,
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
    const user_id = req.user.id;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Channel name is required" });
    const { data: channel, error: createErr } = await supabase
      .from("channels")
      .insert({ name, created_by: user_id })
      .select()
      .single();
    if (createErr) return res.status(500).json(createErr);
    if (!channel) return res.status(500).json({ error: "Channel not created" });

    const { error: joinErr } = await supabase
      .from("channel_members")
      .insert({ channel_id: channel.id, user_id });

    if (joinErr) return res.status(500).json(joinErr);

    res.json({ success: true, channel });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const joinChannel = async (req, res) => {
  const channel_id = req.params.id;
  const user_id = req.user.id;
  const { data: exists } = await supabase
    .from("channel_members")
    .select("id", { head: true })
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
    .select("user_id")
    .eq("channel_id", channel_id);
  if (error) return res.status(500).json(error);
  res.json(data);
};



