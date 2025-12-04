import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import API from "../api";

export default function ChatBox({ channel }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  // simple in-memory cache: user_id -> { name, email }
  const profileCache = useRef(new Map());
  const subscriptionRef = useRef(null);
  const presenceRef = useRef(null);


  
  useEffect(() => {
    const initPresence = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const p = supabase.channel(`typing-${channel.id}`, {
        config: { presence: { key: user.id } }
      });
      await p.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await p.track({ typing: false });
        }
      });
      presenceRef.current = p;
    };
    initPresence();
    return () => {
      if (presenceRef.current) {
        supabase.removeChannel(presenceRef.current);
        presenceRef.current = null;
      }
    };
  }, [channel.id]);
  


  useEffect(() => {
    if (!channel) return;

    // cleanup previous subscription
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    let subscribed = false;

    const start = async () => {
      try {
        await loadHistory();

        // 2) subscribe to realtime inserts
        const channelName = `realtime-messages-${channel.id}`;
        const sub = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `channel_id=eq.${channel.id}`,
            },
            async (payload) => {
              // payload.new is the inserted row
              const newMsg = payload.new || {};
              let profile = profileCache.current.get(newMsg.user_id);

              // if we don't have profile cached, try to fetch name/email
              if (!profile) {
                try {
                  const { data: p } = await supabase
                    .from("profiles")
                    .select("name,email")
                    .eq("id", newMsg.user_id)
                    .single();

                  profile = p || null;
                  if (profile) profileCache.current.set(newMsg.user_id, profile);
                } catch (err) {
                  // ignore; we'll show fallback later
                }
              }

              // append message (make sure created_at present)
              setMessages((prev) => [
                ...prev,
                {
                  id: newMsg.id,
                  content: newMsg.content,
                  user_id: newMsg.user_id,
                  created_at: newMsg.created_at || new Date().toISOString(),
                  profiles: profile ? { name: profile.name, email: profile.email } : undefined,
                },
              ]);
            }
          )
          .subscribe();

        subscriptionRef.current = sub;
        subscribed = true;
      } catch (e) {
        console.error("Error starting realtime:", e);
      }
    };

    start();

    return () => {
      // safe cleanup
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [channel?.id]); // only re-run when channel changes

  const loadHistory = async () => {
    try {
      const res = await API.get(`/messages/${channel.id}`);
      // backend returns messages with profiles(name,email) when possible
      const items = Array.isArray(res.data) ? res.data : [];

      // seed cache with returned profiles
      items.forEach((m) => {
        if (m.profiles && m.user_id) {
          profileCache.current.set(m.user_id, {
            name: m.profiles.name,
            email: m.profiles.email,
          });
        }
      });

      setMessages(items.map((m) => ({
        id: m.id,
        content: m.content,
        user_id: m.user_id,
        created_at: m.created_at,
        profiles: m.profiles,
      })));
    } catch (err) {
      console.error("loadHistory error:", err);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!text.trim()) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const cached = profileCache.current.get(user.id) || { email: user.email };
    profileCache.current.set(user.id, cached);

    const optimistic = {
      id: `temp-${Date.now()}`,
      content: text,
      user_id: user.id,
      created_at: new Date().toISOString(),
      profiles: { name: cached.name, email: cached.email },
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setText("");

    try {
      const res = await API.post("/messages", {
        content: optimistic.content,
        channel_id: channel.id,
        user_id: user.id,
      });

      const saved = res.data;
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? {
          id: saved.id,
          content: saved.content,
          user_id: saved.user_id,
          created_at: saved.created_at,
          profiles: { name: cached.name, email: cached.email },
        } : m))
      );
    } catch (err) {
      console.error("Send message failed:", err);
      // mark optimistic as failed
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? { ...m, failed: true } : m)));
    }
  };

  const formatTime = (iso) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleString(); // adjust to whatever format you want
    } catch {
      return iso;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto bg-white p-4 rounded shadow">
        {messages.map((msg) => (
          <div key={msg.id} className="mb-2">
            <span className="font-semibold">
              {msg.profiles?.name || msg.profiles?.email || "Unknown"}:
            </span>{" "}
            <span>{msg.content}</span>
            <div className="text-xs text-gray-400">
              {formatTime(msg.created_at)} {msg.pending ? "(sending...)" : msg.failed ? "(failed)" : ""}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          className="flex-1 border p-2 rounded"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
          
            if (presenceRef.current) {
              presenceRef.current.track({ typing: true });
          
              setTimeout(() => {
                presenceRef.current.track({ typing: false });
              }, 2000);
            }
          }}
          
          
          placeholder="Type a message..."
          
        />
        <button onClick={sendMessage} className="bg-blue-600 text-white px-4 py-2 rounded">
          Send
        </button>
      </div>
    </div>
  );
}
