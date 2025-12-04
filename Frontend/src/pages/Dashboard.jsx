import LogoutButton from "../components/LogoutButton";
import ChannelList from "../components/ChannelList";
import ChatBox from "../components/ChatBox";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Dashboard() {
  const [activeChannel, setActiveChannel] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);
  
      const presenceChannel = supabase.channel("online-users", {
        config: {
          presence: { key: user.id }
        }
      })
      presenceChannel.on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        // console.log("SYNC:", state);
        setOnlineUsers(Object.keys(state));
      });
      presenceChannel.subscribe(async (status) => {
        // console.log("STATUS:", status);
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({
            id: user.id,
            email: user.email,
            online_at: new Date().toISOString()
          });
        }
      });
    };
  
    init();
  }, []);
  
  
  

  return (
    <div className="flex h-screen bg-gray-100">

      <aside className="w-64 bg-white shadow-lg flex flex-col border-r">
        {/* User Info Box */}
        <div className="p-4 border-b flex items-center gap-3 bg-gray-50">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
            {currentUser?.email?.charAt(0).toUpperCase()}
          </div>

          <div>
            <p className="font-semibold text-gray-800">
              {currentUser?.email ?? "User"}
            </p>
            <p className="text-xs text-green-600">
              🟢 {onlineUsers.length} online
            </p>
          </div>
        </div>

        {/* Channel List */}
        <div className="flex-1 overflow-y-auto">
          <ChannelList onSelect={(ch) => setActiveChannel(ch)} />
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t">
          <LogoutButton />
        </div>
      </aside>


      <main className="flex-1 p-6">
        <div className="bg-white shadow-md rounded-xl p-5 h-full flex flex-col">

          {/* Header */}
          <div className="flex justify-between items-center mb-4 border-b pb-3">
            <h1 className="text-2xl font-bold text-gray-800">
              {activeChannel ? `#${activeChannel.name}` : "📭 Select a Channel"}
            </h1>
          </div>

      
          {!activeChannel ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Choose a channel from the left sidebar to start chatting.
            </div>
          ) : (
            <div className="flex-1">
              <ChatBox channel={activeChannel} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
