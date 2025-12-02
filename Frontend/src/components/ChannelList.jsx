import React, { useEffect, useState } from "react";
import API from "../api";

export default function ChannelList({ onSelect }) {
  const [channels, setChannels] = useState([]);

  useEffect(() => {
    API.get("/channels")
      .then((res) => setChannels(res.data))
      .catch((err) => console.log(err));
  }, []);

  useEffect(() => {
    API.get("/channels")
      .then((res) => {
        console.log("Channels response:", res.data);
        setChannels(res.data);
      })
      .catch((err) => console.log("Channels ERROR:", err));
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
