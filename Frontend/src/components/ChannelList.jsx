import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase"; 
import API from "../api";

export default function ChannelList({ onSelect }) {
  const [channels, setChannels] = useState([]);

  const fetchChannels = () => {
    API.get("/channels")
      .then((res) => setChannels(res.data))
      .catch((err) => console.log(err));
  };

  // Load channels initially
  useEffect(() => {
    fetchChannels();
  }, []);

  // Supabase realtime listeners
  useEffect(() => {
    const chListener = supabase
      .channel("channels-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "channels" },
        (payload) => {
          console.log("Channel changed:", payload);
          fetchChannels();
        }
      )
      .subscribe();

    const memberListener = supabase
      .channel("member-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "channel_members" },
        (payload) => {
          console.log("Members changed:", payload);
          fetchChannels();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chListener);
      supabase.removeChannel(memberListener);
    };
  }, []);

  return (
    <div className="w-60 bg-gray-900 text-white h-screen p-4">
      <h3 className="text-lg font-bold mb-4">Channels</h3>

      <ul className="space-y-2">
        {channels.map((channel) => (
          <li
            key={channel.id}
            onClick={() => onSelect(channel)}
            className="cursor-pointer p-2 rounded hover:bg-gray-700"
          >
            #{channel.name}
          </li>
        ))}
      </ul>
    </div>
    
  );
}
