import LogoutButton from "../components/LogoutButton"
import ChannelList from "../components/ChannelList"
import ChatBox from "../components/ChatBox"
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { Bars3Icon, UserGroupIcon,  } from '@heroicons/react/24/outline'; 

const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
}


export default function Dashboard() {
    const [activeChannel, setActiveChannel] = useState(null)
    const [onlineUsers, setOnlineUsers] = useState([])
    const [currentUser, setCurrentUser] = useState(null)

    useEffect(() => {
      const setup = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) await supabase.realtime.setAuth(session.access_token)
      }
      setup()
    }, [])
    
    useEffect(() => {
      const init = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        setCurrentUser(user)
        const presenceChannel = supabase.channel("online-users", {
          config: { presence: { key: user.id } }
        })
        presenceChannel.on("presence", { event: "sync" }, () => {
          const state = presenceChannel.presenceState()
          const users = Object.entries(state).map(([userId, instances]) => ({
            id: userId,
            name: instances[0].name, 
          }))
          setOnlineUsers(users)
        })
        presenceChannel.subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await presenceChannel.track({
              name: user.user_metadata?.name ?? "Unknown"
            })          
          }
        })
      }
      init()
    }, [])

    return (
        <div className="flex h-screen bg-gray-100 text-gray-800 font-sans">
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-lg">
                <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-lg font-semibold shadow-sm">
                        {getInitials(currentUser?.user_metadata?.name)}
                    </div>
                    <div>
                        <p className="font-bold text-gray-900 leading-tight">
                            {currentUser?.user_metadata?.name || "User"}
                        </p>
                        <p className="text-xs text-green-600 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span> Online
                        </p>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                    <ChannelList onSelect={(ch) => setActiveChannel(ch)} />
                </div>
                
                <div className="p-4 border-t border-gray-100">
                    <LogoutButton className="w-full text-left text-red-500 hover:text-red-700 transition-colors py-2 px-3 rounded-lg hover:bg-red-50/50"/>
                </div>
            </aside>
            
            <main className="flex-1 flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center shadow-sm">
                    <h1 className="text-xl font-bold text-gray-900">
                        {activeChannel ? 
                            <span className="text-blue-600">#{activeChannel.name}</span> : 
                            "Select a Channel"
                        }
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="text-sm font-medium text-gray-600 flex items-center gap-1">
                            <UserGroupIcon className="w-5 h-5 text-gray-400"/>
                            {onlineUsers.length} online
                        </div>
                       
                    </div>
                </div>
                
                <div className="flex-1 bg-gray-50 relative overflow-hidden">
                    {activeChannel ? (
                        // ChatBox will need its own styling to match the aesthetic
                        <ChatBox channel={activeChannel} />
                    ) : (
                        <div className="flex h-full items-center justify-center text-gray-500 text-lg">
                            Select a channel to start chatting or create a new one!
                        </div>
                    )}
                </div>
            </main>

            <aside className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto hidden lg:block shadow-inner">
                <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Active Users</h2>
                <ul className="space-y-3">
                    {onlineUsers.map((u) => (
                        <li
                            key={u.id}
                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                                {getInitials(u.name)}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">{u.name}</p>
                                <p className="text-xs text-green-600">Active</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </aside>
        </div>
    )
}