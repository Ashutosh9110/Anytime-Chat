import { supabase } from "../server/supabase.js"

export const signup = async (req, res) => {
  const { email, password, name } = req.body

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name }}})
  if (error) return res.status(400).json(error)
  res.json(data);
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return res.status(400).json(error);

  res.json({ 
    token: data.session.access_token, 
    user: data.user 
  })
}
