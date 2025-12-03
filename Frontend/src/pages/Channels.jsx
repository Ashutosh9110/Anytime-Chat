import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Channels() {
  const [channels, setChannels] = useState([]);
  const [newName, setNewName] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const create = async () => {
    await axios.post("/channels", { name: newName, is_public: isPublic });
    setNewName("");
    loadChannels();
  };

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
      <div className="mb-6 border p-4 rounded">
        <h2 className="font-semibold mb-2">Create New Channel</h2>
        <input
          className="border p-2 w-full rounded mb-2"
          placeholder="Channel name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />

        <label className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={() => setIsPublic(!isPublic)}
          />
          Public Channel
        </label>

        <button className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={create}
        >
          Create Channel
        </button>
      </div>


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
            disabled={channel.is_public || channel.isMember}
            onClick={() => joinChannel(channel.id)}
          >
            {channel.is_public ? "Public" : channel.isMember ? "Joined" : "Join"}
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
