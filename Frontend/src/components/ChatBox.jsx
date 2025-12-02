import { useEffect, useState } from "react";
import axios from "axios";
import { supabase } from "../lib/supabase";

export default function ChatBox({ channel }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!channel) return;
  
    let realtime;

    loadHistory();
    realtime = supabase
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
    return () => {
      supabase.removeChannel(realtime);
    };
  }, [channel]);
  

  const loadHistory = async () => {
    const res = await axios.get(`/messages/${channel.id}`);
    console.log("history returned:", res.data);

    // ensure array
    setMessages(Array.isArray(res.data) ? res.data : []);
  };

  const subscribeToRealtime = () => {
    return supabase
      .channel(`messages-${channel.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages_realtime",
          filter: `channel_id=eq.${channel.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();
  };

  const sendMessage = async () => {
    await axios.post(`/messages/${channel.id}`, { message: text });
    setText("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto bg-white p-4 rounded shadow">
        {messages.map((msg, idx) => (
          <div key={idx} className="mb-2">
            <span className="font-semibold">{msg.user}: </span>
            {msg.message}
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
