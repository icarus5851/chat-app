import React, {useState,useEffect} from 'react'
import { useAuth } from '../context/AuthContext'; 
import api from '@/api';

function ChatList({setChats, chats, onSelectChat, selectedChatId}) {
    
    const { currentUser } = useAuth();

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        const debounceTimer = setTimeout(() => {
            api.get(`/users/search?query=${searchTerm}`)
               .then(res => setSearchResults(res.data))
               .catch(err => console.error("Search failed", err))
               .finally(() => setIsSearching(false));
        }, 300); 
        return () => clearTimeout(debounceTimer);
    }, [searchTerm]);
    
    const getChatPartner = (chat, currentUser) => {
        if (!currentUser) return null;
        return chat.participants.find(p => p._id !== currentUser._id);
    };

    const handleSelectUser = async (user) => {
        try {
            const response = await api.post('/chat', { userId: user._id });
            const newChat = response.data;

            if (!chats.some(chat => chat._id === newChat._id)) {
                setChats(prevChats => [newChat, ...prevChats]);
            }
            onSelectChat(newChat); 
            setSearchTerm('');
            setSearchResults([]);
        } catch (error) {
            console.error("Failed to start chat", error);
        }
    };

    if (!currentUser) {
        return (
            <div className="flex flex-col border-r border-zinc-800 min-h-screen p-4">
                <p className="text-zinc-400">Loading User...</p>
            </div>
        );
    }


    return (
        <div className='flex flex-col border-r border-zinc-800 min-h-screen'>
            
            <div className='px-5 py-3 border-b border-zinc-800 flex flex-col'>
                <div className="flex justify-between items-center py-4 mb-4">
                    <div className='flex gap-3 items-center'>
                        <div className="w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center text-4xl font-bold">
                                {currentUser.profilePic ? (
                                    <img src={currentUser.profilePic} alt="Profile Avatar" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    currentUser.name[0].toUpperCase()
                                )}
                        </div>

                        <a href='/profile' className="flex flex-col">
                            <p className="font-semibold text-white">{currentUser.name}</p>
                            <p className="text-xs text-zinc-400">
                                {currentUser.email}
                            </p>
                        </a>
                    </div>
                </div>

                <input 
                    type="search" 
                    placeholder="Search or start new chat" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="w-full p-2 bg-[#2c2f30] rounded-lg border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
            </div>

            <div className='flex flex-col w-full'>
                    {searchTerm.trim().length > 0 ? (
        <div>
            {isSearching && <p className="p-4 text-zinc-400">Searching...</p>}
            {!isSearching && searchResults.map(user => (
                <div key={user._id} onClick={() => handleSelectUser(user)} className="p-3 flex items-center gap-4 cursor-pointer hover:bg-zinc-700 border-b border-zinc-800">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-xl">
                        {user.name[0].toUpperCase()}
                    </div>
                    <div className="font-bold text-white">{user.name}</div>
                </div>
            ))}
            {!isSearching && searchResults.length === 0 && <p className="p-4 text-zinc-400">No users found.</p>}
        </div>
    ) : (chats.map(chat=>{
                    const partner = getChatPartner(chat, currentUser);
                    const isSelected = chat._id === selectedChatId;
                    return(
                        <div 
                            key={chat._id} 
                            onClick={() => onSelectChat(chat)}
                            className={`p-3 flex items-center gap-4 border-b border-zinc-800 cursor-pointer transition-colors ${isSelected? 'bg-[#5f50ae]/60 ' : ' hover:bg-zinc-800'}`}
                        >
                            <div className="w-10 aspect-square h-10 rounded-full bg-violet-600 text-white flex items-center justify-center">
                                {partner.profilePic ? (
                                    <img src={partner.profilePic} alt="Profile Avatar" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    partner.name[0].toUpperCase()
                                )}
                            </div>
                            <div className='flex flex-col w-full  flex-1 min-w-0'>
                                <div className="flex justify-between items-center ">
                                    <p className="font-semibold text-white min-w-0">{partner.name}</p>
                                    <p className="text-xs text-zinc-400 flex-shrink-0">
                                        {new Date(chat.latestMessage ? chat.latestMessage.createdAt : chat.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <div className="flex justify-between  items-center mt-1">
                                    <p className="text-sm text-zinc-400 truncate flex items-center gap-1">
                                        {chat.latestMessage ? 
                                            (chat.latestMessage.messageType === 'image' ? (<>📷 Image</>) : chat.latestMessage.content)
                                            : 'Tap to start chatting'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
            </div>
        </div>
    )
}

export default ChatList