import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function LogoutButton() {
  const navigate = useNavigate();

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <button className="text-red-600 cursor-pointer" onClick={logout}>
      Logout
    </button>
  );
}
