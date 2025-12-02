import React, { useEffect, useState } from "react";
import axios from "axios";

export default function ChannelList({ onSelect }) {
  const [channels, setChannels] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
  
    axios
      .get("http://localhost:5000/channels", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setChannels(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
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
