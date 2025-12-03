import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase"; 
import API from "../api";

export default function ChannelList({ onSelect }) {
  const [channels, setChannels] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const fetchChannels = () => {
    API.get("/channels")
      .then((res) => setChannels(res.data))
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    const chListener = supabase
      .channel("channels-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "channels" }, fetchChannels)
      .subscribe();

    return () => supabase.removeChannel(chListener);
  }, []);

  const createChannel = async () => {
    await API.post("/channels", { name, is_public: isPublic });
    setName("");
    setIsPublic(false);
    setShowCreate(false);
    fetchChannels();
  };

  return (
    <div className="w-60 bg-gray-900 text-white h-screen p-4 flex flex-col">
      <h3 className="text-lg font-bold mb-4">Channels</h3>

      {/* Add New Channel Button */}
      <button
        className="w-full bg-blue-600 text-white py-2 rounded mb-4"
        onClick={() => setShowCreate(true)}
      >
        + New Channel
      </button>

      {/* Channel List */}
      <ul className="space-y-2 flex-1 overflow-y-auto">
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

      {/* Create Channel Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white text-black p-6 rounded w-80">
            <h2 className="text-lg font-bold mb-3">Create Channel</h2>

            <input
              className="border p-2 w-full rounded mb-3"
              placeholder="Channel name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={() => setIsPublic(!isPublic)}
              />
              Public Channel
            </label>

            <div className="flex justify-between">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={createChannel}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
