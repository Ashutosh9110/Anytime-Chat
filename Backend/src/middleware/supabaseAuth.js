
import axios from "axios";

export const supabaseAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    // console.log("TOKEN:", token);
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

    const { data } = await axios.get(
      `${SUPABASE_URL}/auth/v1/user`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: SUPABASE_ANON_KEY,
        },
      }
    );

    req.user = data;
    next();

  } catch (err) {
    console.error("Auth error:", err?.response?.data || err.message);
    return res.status(401).json({ error: "Unauthorized" });
  }
};
