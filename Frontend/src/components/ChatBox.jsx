import { useEffect, useState, useRef } from "react"
import { supabase } from "../lib/supabase"
import API from "../api"

export default function ChatBox({ channel }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState("")
  const [typingUsers, setTypingUsers] = useState([])
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const profileCache = useRef(new Map())
  const realtimeRef = useRef(null)
  const presenceRef = useRef(null)
  const scrollRef = useRef(null)


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

  useEffect(() => {
    if (!channel) return

    if (realtimeRef.current) {
      supabase.removeChannel(realtimeRef.current)
      realtimeRef.current = null
    }
    const start = async () => {
      await loadHistory()
      const sub = supabase
        .channel(`rt-messages-${channel.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `channel_id=eq.${channel.id}`,
          },
          handleIncomingMessage
        )
        .subscribe()
      realtimeRef.current = sub
    }
    start()
    return () => {
      if (realtimeRef.current) {
        supabase.removeChannel(realtimeRef.current)
        realtimeRef.current = null
      }
    }
  }, [channel?.id])

  const handleIncomingMessage = (payload) => {
    const msg = payload.new
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev
      return [...prev, formatMessage(msg)]
    })
    setTimeout(() => {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }, 10)
  }

  const loadHistory = async () => {
    try {
      const res = await API.get(`/messages/${channel.id}?limit=30`)
      const items = res.data
      if (items.length < 30) setHasMore(false)
      items.forEach((m) => {
        if (m.profiles) profileCache.current.set(m.user_id, m.profiles)
      })
      setMessages(items.map(formatMessage))
      setTimeout(() => {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }, 30)
    } catch (err) {
      console.error("loadHistory error", err)
    }
  }

  const loadOlder = async () => {
    if (!hasMore || loadingMore || messages.length === 0) return
    setLoadingMore(true)
    const oldest = messages[0].created_at
    const prevHeight = scrollRef.current.scrollHeight
    try {
      const res = await API.get(
        `/messages/${channel.id}?limit=30&before=${oldest}`
      )
      const older = res.data
      if (older.length < 30) setHasMore(false)
      const formatted = older.map(formatMessage)
      setMessages((prev) => [...formatted, ...prev])
      setTimeout(() => {
        const newHeight = scrollRef.current.scrollHeight
        scrollRef.current.scrollTop = newHeight - prevHeight
      }, 20)
    } catch (err) {
      console.error("loadOlder error", err)
    }
    setLoadingMore(false)
  }
  const formatMessage = (m) => ({
    id: m.id,
    content: m.content,
    user_id: m.user_id,
    created_at: m.created_at,
    profiles: m.profiles || profileCache.current.get(m.user_id),
  })

  const sendMessage = async () => {
    if (!text.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    const cached = profileCache.current.get(user.id) || { email: user.email }
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
    }, 20)

    try {
      const res = await API.post("/messages", {
        content: optimistic.content,
        channel_id: channel.id,
        user_id: user.id,
      })
      const saved = res.data
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimistic.id ? formatMessage(saved) : m
        )
      )
    } catch (err) {
      console.error("send failed", err)
    }
  }

  const handleTyping = (val) => {
    setText(val)
    if (!presenceRef.current) return
    presenceRef.current.track({ typing: true })
    if (window.__typingTimer) clearTimeout(window.__typingTimer)
    window.__typingTimer = setTimeout(() => {
      presenceRef.current.track({ typing: false })
    }, 1500)
  }
  const fmt = (iso) => new Date(iso).toLocaleTimeString()

  return (
    <div className="flex flex-col h-[calc(100vh-150px)] overflow-hidden">

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto bg-white p-4 rounded border min-h-0"
          onScroll={(e) => {
            if (e.target.scrollTop < 80) loadOlder()
          }}
        >
        {messages.map((msg) => (
          <div key={msg.id} className="mb-3">
            <span className="font-semibold">
              {msg.profiles?.name || msg.profiles?.email}
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
