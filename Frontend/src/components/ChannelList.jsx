import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase"; 
import API from "../api";
import { PlusCircleIcon, XMarkIcon, HashtagIcon, LockClosedIcon } from '@heroicons/react/24/outline'; 
import { HashtagIcon as SolidHashtagIcon } from '@heroicons/react/24/solid';

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
    };

    return (
      <div className="w-full text-gray-800 flex flex-col"> 
        <h3 className="text-lg font-bold mb-4 text-gray-900">Channels</h3>
        <button
          className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white py-2.5 rounded-lg font-semibold mb-4 shadow-md hover:bg-blue-600 transition-colors"
          onClick={() => setShowCreate(true)}
        >
          <PlusCircleIcon className="w-5 h-5"/> Create Channel
        </button>
        <ul className="space-y-1 flex-1 overflow-y-auto">
          {channels.map((channel) => (
            <li
              key={channel.id}
              onClick={() => onSelect(channel)}
              className="cursor-pointer flex items-center gap-2 p-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
            >
              <SolidHashtagIcon className="w-4 h-4 text-gray-400"/>
              <span className="truncate">{channel.name}</span>
            </li>
          ))}
        </ul>
        {showCreate && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white text-gray-900 p-8 rounded-xl w-96 shadow-2xl transform transition-transform duration-300 scale-100">
              
              <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Create New Channel</h2>
                  <button onClick={() => setShowCreate(false)} className="p-1 rounded-full text-gray-500 hover:bg-gray-100 transition-colors">
                      <XMarkIcon className="w-6 h-6"/>
                  </button>
              </div>

              <input
                className="border border-gray-300 p-3 w-full rounded-lg mb-4 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Channel name (e.g., general-chat)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <label className="flex items-center gap-3 mb-6 p-2 rounded-lg bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={() => setIsPublic(!isPublic)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                {isPublic ? (
                    <span className="flex items-center gap-1 text-green-600 font-medium">
                        <HashtagIcon className="w-4 h-4"/> Public Channel
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-red-600 font-medium">
                        <LockClosedIcon className="w-4 h-4"/> Private Channel
                    </span>
                )}
              </label>
              <div className="flex justify-end gap-3">
                <button
                  className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium shadow-md hover:bg-blue-700 transition-colors"
                  onClick={createChannel}
                  disabled={!name}
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