import { useEffect, useState, useRef } from "react"
import { supabase } from "../lib/supabase"
import API from "../api"

export default function ChatBox({ channel }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState("")
  const [typingUsers, setTypingUsers] = useState([])

  const profileCache = useRef(new Map())
  const realtimeRef = useRef(null)
  const presenceRef = useRef(null)
  const scrollRef = useRef(null)
  const previousChannelId = useRef(null)

  useEffect(() => {
    if (!channel) return
    let presenceChannel = null
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      presenceChannel = supabase.channel(`presence-typing-${channel.id}`, {
        config: { presence: { key: user.id } },
      })
      presenceChannel
        .on("presence", { event: "sync" }, () => {
          const state = presenceChannel.presenceState()
          const typing = []
          for (const uid in state) {
            const meta = state[uid][0]
            if (meta?.typing && uid !== user.id) typing.push(uid)
          }
          setTypingUsers(typing)
        })
        .on("presence", { event: "join" }, ({ key, newPresences }) => {
          if (newPresences[0]?.typing) {
            setTypingUsers((prev) => [...new Set([...prev, key])])
          }
        })
        .on("presence", { event: "leave" }, ({ key }) => {
          setTypingUsers((prev) => prev.filter((x) => x !== key))
        })
      await presenceChannel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({ typing: false })
        }
      })
      presenceRef.current = presenceChannel
    }
    init()
    return () => {
      if (presenceRef.current) {
        supabase.removeChannel(presenceRef.current)
        presenceRef.current = null
      }
    }
  }, [channel?.id])

  const handleTyping = (val) => {
    setText(val)
    if (!presenceRef.current) return
    presenceRef.current.track({ typing: true })
    if (window.__typingTimer) clearTimeout(window.__typingTimer)
    window.__typingTimer = setTimeout(() => {
      presenceRef.current.track({ typing: false })
    }, 1500)
  }

  useEffect(() => {
    if (!channel?.id) return
    if (previousChannelId.current !== channel.id) {
      previousChannelId.current = channel.id
      loadAllMessages()
      setupRealtime()
    }
  }, [channel?.id])

  const loadAllMessages = async () => {
    try {
      const res = await API.get(`/messages/${channel.id}`)
      const items = res.data

      // FIX 1: Hydrate cache with existing history
      items.forEach(item => {
        if (item.profiles && item.user_id) {
            profileCache.current.set(item.user_id, item.profiles)
        }
      })
      setMessages(items.map(formatMessage))

      setTimeout(() => {
        if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }, 50)
    } catch (err) {
      console.error("History load failed:", err)
    }
  }
  const setupRealtime = () => {
    if (realtimeRef.current)
      supabase.removeChannel(realtimeRef.current)

    const subscription = supabase
      .channel(`messages-${channel.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channel.id}`,
        },
        (payload) => handleIncomingMessage(payload)
      )
      .subscribe()

    realtimeRef.current = subscription
  }

  const handleIncomingMessage = async (payload) => {
    const rawMsg = payload.new
    let userProfile = profileCache.current.get(rawMsg.user_id)

    // If we don't know who this is yet, fetch them from Supabase
    if (!userProfile) {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('name, email') // Adjust columns based on your DB
          .eq('id', rawMsg.user_id)
          .single()
        
        if (data) {
          userProfile = data
          profileCache.current.set(rawMsg.user_id, data)
        }
      } catch (error) {
        console.error("Error fetching incoming user profile", error)
      }
    }

    const newMsg = {
        ...formatMessage(rawMsg),
        profiles: userProfile
    }
    setMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) return prev
      return [...prev, newMsg]
    })

    setTimeout(() => {
      if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }, 50)
  }

  const formatMessage = (m) => ({
    id: m.id,
    content: m.content,
    user_id: m.user_id,
    created_at: m.created_at,
    // Try to grab from object first, then cache
    profiles: m.profiles || profileCache.current.get(m.user_id),
  })
  
  const fmt = (iso) => new Date(iso).toLocaleTimeString()
  const sendMessage = async () => {
    if (!text.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    const cached = profileCache.current.get(user.id) || { name: user.user_metadata?.name, email: user.email }
    profileCache.current.set(user.id, cached)

    const optimistic = {
      id: `temp-${Date.now()}`,
      content: text,
      user_id: user.id,
      created_at: new Date().toISOString(),
      profiles: cached,
      pending: true,
    }

    setMessages((prev) => [...prev, optimistic])
    setText("")

    setTimeout(() => {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }, 30)

    try {
      const res = await API.post("/messages", {
        content: optimistic.content,
        channel_id: channel.id,
        user_id: user.id,
      })

      const saved = formatMessage(res.data)

      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? saved : m))
      )
    } catch (err) {
      console.error("send failed", err)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-150px)] overflow-hidden">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-white p-4 rounded border min-h-0"
      >
        {messages.map((msg) => (
          <div key={msg.id} className="mb-3">
            <span className="font-semibold">
              {msg.profiles?.name || msg.profiles?.email || "Unknown User"}
            </span>
            : {msg.content}
            <div className="text-xs text-gray-500">
              {fmt(msg.created_at)}
              {msg.pending && " (sending...) "}
            </div>
          </div>
        ))}

        {typingUsers.length > 0 && (
          <div className="italic text-gray-500 mt-2">
            {typingUsers.length === 1
              ? "Someone is typing..."
              : "Multiple people are typing..."}
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          className="flex-1 border p-2 rounded"
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              sendMessage()
            }
          }}
          placeholder="Type a message..."
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  )
}