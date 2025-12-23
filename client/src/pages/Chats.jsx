import React, { useEffect, useState } from 'react'
import ChatList from '@/components/ChatList'
import ChatWindow from '@/components/ChatWindow'
import { useAuth } from '../context/AuthContext'; 
import { socket } from '../socket';
import api from '@/api';

function Chats() {
    const [chats, setChats] = useState([]);
    const { currentUser } = useAuth();
    const [selectedChat, setSelectedChat] = useState(null);
    const [loading, setLoading] = useState(true);

    const handleNewMessage = (newMessage) => {
        setChats(prevChats => {
            let chatExists = false;
            let updatedChats = prevChats.map(chat => {
                if (chat._id === newMessage.chat._id) {
                    chatExists = true;
                    const shouldIncrement = selectedChat?._id !== chat._id && newMessage.sender._id !== currentUser._id;
                    return { 
                        ...chat, 
                        latestMessage: newMessage, 
                        updatedAt: newMessage.createdAt,
                        unreadCount: shouldIncrement ? (chat.unreadCount || 0) + 1 : (chat.unreadCount || 0)
                    };
                }
                return chat;
            });

            if (!chatExists) {
                const newChat = { ...newMessage.chat, latestMessage: newMessage, updatedAt: newMessage.createdAt, unreadCount: 1 };
                updatedChats = [newChat, ...updatedChats];
            }
            updatedChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            return updatedChats;
        });
    };

    const handleChatUpdated = (updatedChat) => {
        setChats(prev => prev.map(c => c._id === updatedChat._id ? { ...c, ...updatedChat } : c));
        if (selectedChat && selectedChat._id === updatedChat._id) {
            setSelectedChat(prev => ({ ...prev, ...updatedChat }));
        }
    };

    const handleRemovedFromGroup = ({ chatId }) => {
        setChats(prev => prev.filter(c => c._id !== chatId));
        setSelectedChat(prev => (prev && prev._id === chatId ? null : prev));
    };

    const handleLeaveGroupUI = (chatId) => {
        setChats(prev => prev.filter(c => c._id !== chatId));
        setSelectedChat(null);
    };

    const handleSelectChat = (chat) => {
        setSelectedChat(chat);
        if (chat && !chat.isTemp) {
            setChats(prev => prev.map(c => c._id === chat._id ? { ...c, unreadCount: 0 } : c));
        }
    };

    const handleChatStarted = (newRealChat) => {
        setChats(prev => {
            if (prev.some(c => c._id === newRealChat._id)) return prev;
            return [newRealChat, ...prev];
        });
        setSelectedChat(newRealChat);
    };

    const handleMessagesRead = ({ chatId, readerId }) => {
        if (readerId === currentUser._id) {
             setChats(prev => prev.map(c => c._id === chatId ? { ...c, unreadCount: 0 } : c));
        } else {
             setChats(prev => prev.map(c => {
                 if (c._id === chatId && c.latestMessage && c.latestMessage.sender === currentUser._id) {
                     return { ...c, latestMessage: { ...c.latestMessage, status: 'read' } };
                 }
                 return c;
             }));
        }
    };

    useEffect(() => {
        const fetchChats = async () => {
            try {
                const response = await api.get('/chats');
                setChats(response.data);
            } catch (err) { console.error(err); } 
            finally { setLoading(false); }
        };
        if (currentUser) fetchChats();
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser) return;

        const handleMsgRecv = (msg) => handleNewMessage(msg);
        const handleMsgDel = ({ messageId, chatId, newLatestMessage }) => {
            setChats(prev => prev.map(c => c._id === chatId ? { ...c, latestMessage: c.latestMessage?._id === messageId ? newLatestMessage : c.latestMessage } : c));
        };
        
        const handleNewChat = (chat) => {
            setChats(prev => {
                if (prev.some(c => c._id === chat._id)) return prev;
                return [chat, ...prev];
            });
        };
        
        socket.on('message_received', handleMsgRecv);
        socket.on('message_deleted', handleMsgDel);
        socket.on('messages_read', handleMessagesRead);
        
        socket.on('new_chat_added', handleNewChat);
        socket.on('chat_updated', handleChatUpdated); 
        socket.on('removed_from_group', handleRemovedFromGroup);
        socket.on('chat_removed', handleRemovedFromGroup);

        return () => {
            socket.off('message_received', handleMsgRecv);
            socket.off('message_deleted', handleMsgDel);
            socket.off('messages_read', handleMessagesRead);
            socket.off('new_chat_added', handleNewChat);
            socket.off('chat_updated', handleChatUpdated);
            socket.off('removed_from_group', handleRemovedFromGroup);
            socket.off('chat_removed', handleRemovedFromGroup);
        };
    }, [currentUser, selectedChat]);

    if (!currentUser) return <div className="p-4">Loading User...</div>;
    if (loading) return (
            <div className="flex items-center justify-center h-screen text-white">
                <div className="animate-pulse flex space-x-4 p-4">
                <div className="rounded-full bg-zinc-700 h-12 w-12"></div>
                <div className="flex-1 space-y-4 py-1">
                    <div className="h-4 bg-zinc-700 rounded w-3/4"></div>
                    <div className="h-4 bg-zinc-700 rounded w-1/2"></div>
                </div>
                </div>
            </div>)

   return (
        <div className='flex w-full h-screen overflow-hidden'>

            <div className={`
                ${selectedChat ? 'hidden md:flex' : 'flex'} 
                w-full md:w-[28%] flex-col min-w-[280px] h-full border-r border-zinc-800
            `}>
                <ChatList chats={chats} setChats={setChats} onSelectChat={handleSelectChat} selectedChatId={selectedChat?._id} />
            </div>

            <div className={`
                ${!selectedChat ? 'hidden md:flex' : 'flex'} 
                flex-1 h-full min-w-0 bg-[#181A1B]
            `}>
                <ChatWindow 
                    selectedChat={selectedChat} 
                    onNewMessage={handleNewMessage} 
                    onChatStarted={handleChatStarted}
                    onChatRemoved={handleLeaveGroupUI}
                    onBack={() => setSelectedChat(null)} 
                />
            </div>
        </div>
    )
}

export default Chats;
