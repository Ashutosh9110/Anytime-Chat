import { useEffect, useState } from "react";

import { supabase } from "../lib/supabase";
import API from "../api";

export default function ChatBox({ channel }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!channel) return;

    let subscription;
    const start = async () => {
      await loadHistory(); // load messages FIRST
      subscription = supabase
        .channel(`realtime-messages-${channel.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `channel_id=eq.${channel.id}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new]);
          }
        )
        .subscribe();
    };
    start();
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [channel]);
  
  

  const loadHistory = async () => {
    const res = await API.get(`/messages/${channel.id}`);
    // console.log("history returned:", res.data);

    // ensure array
    setMessages(Array.isArray(res.data) ? res.data : []);
  };


  const sendMessage = async () => {
    if (!text.trim()) return;
    await API.post("/messages", {
      content: text,
      channel_id: channel.id,
    });
    setText("");
  };
  

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto bg-white p-4 rounded shadow">
      {messages.map((msg) => (
        <div key={msg.id} className="mb-2">
          <span className="font-semibold">{msg.user_id}: </span>
          {msg.content}
        </div>
      ))}

      </div>

      <div className="mt-4 flex gap-2">
        <input
          className="flex-1 border p-2 rounded"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}
