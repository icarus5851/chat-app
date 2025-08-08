import React, { useEffect, useState } from 'react'
import ChatList from '@/components/ChatList'
import ChatWindow from '@/components/ChatWindow'
import { useAuth } from '../context/AuthContext'; 
import api from '@/api';

function Chats() {
    const [chats, setChats] = useState(null);
    const { currentUser } = useAuth();
    const [selectedChat,setSelectedChat] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const handleNewMessage = (newMessage) => {
        const updatedChats = chats.map(chat => {
            if (chat._id === newMessage.chat._id) {
                return { ...chat, latestMessage: newMessage };
            }
            return chat;
        });
        updatedChats.sort((a, b) => new Date(b.latestMessage?.createdAt || 0) - new Date(a.latestMessage?.createdAt || 0));
        
        setChats(updatedChats);
    };

    useEffect(()=>{
        const fetchChats = async ()=>{
            try {
                const response = await api.get('/chat');
                setChats(response.data);
            } catch (err) {
                setError('Failed to load chats. Please try logging in again.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchChats();

    }, [])


    if (!currentUser) {
        return (
            <div className="flex flex-col border-r border-zinc-800 min-h-screen p-4">
                <p className="text-zinc-400">Loading User...</p>
            </div>
        );
    }

    if (loading) {
        return <div className="flex items-center justify-center h-screen text-white">Loading chats...</div>;
    }
    
    if (error) {
        return <div className="flex items-center justify-center h-screen text-red-400">{error}</div>;
    }

    return (
        <div className='flex w-full'>
            <div className='w-3/10 min-h-screen'>
                <ChatList chats={chats} setChats={setChats} onSelectChat={setSelectedChat} selectedChatId={selectedChat?._id}></ChatList>
            </div>
            <div className='w-full h-screen'><ChatWindow selectedChat={selectedChat} onNewMessage={handleNewMessage}></ChatWindow></div>
        </div>
    )
}

export default Chats