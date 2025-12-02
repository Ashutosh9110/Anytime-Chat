import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Channels() {
  const [channels, setChannels] = useState([]);

  const loadChannels = async () => {
    const res = await axios.get("/channels");
    setChannels(res.data);
  };

  const joinChannel = async (id) => {
    await axios.post(`/channels/${id}/join`);
    loadChannels();
  };

  const leaveChannel = async (id) => {
    await axios.post(`/channels/${id}/leave`);
    loadChannels();
  };

  useEffect(() => {
    loadChannels();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Channels</h1>

      {channels.map((channel) => (
        <div
          key={channel.id}
          className="border p-4 rounded mb-3 flex items-center justify-between"
        >
          <div>
            <p className="text-lg font-semibold">{channel.name}</p>
            <p className="text-sm text-gray-500">
              Members: {channel.memberCount ?? 0}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              className="bg-green-600 text-white px-4 py-1 rounded"
              onClick={() => joinChannel(channel.id)}
            >
              Join
            </button>

            <button
              className="bg-red-600 text-white px-4 py-1 rounded"
              onClick={() => leaveChannel(channel.id)}
            >
              Leave
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
