import { useState } from "react";
import LogoutButton from "../components/LogoutButton";
import ChannelList from "../components/ChannelList";
import ChatBox from "../components/ChatBox";

export default function Dashboard() {
  const [activeChannel, setActiveChannel] = useState(null);

  return (
    <div className="flex h-screen">
      <ChannelList onSelect={(ch) => setActiveChannel(ch)} />

      <div className="flex-1 bg-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">
            {activeChannel ? `#${activeChannel.name}` : "Select a channel"}
          </h1>

          <LogoutButton />
        </div>

        {!activeChannel && (
          <p className="text-gray-500">
            Choose a channel from the left to start chatting.
          </p>
        )}

        {activeChannel && <ChatBox channel={activeChannel} />}
      </div>
    </div>
  );
}
