import React, { useState, useEffect,useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '@/api';
import MessageBubble from './MessageBubble';
import { socket } from '@/socket';
import { FiPaperclip,FiSend } from 'react-icons/fi'; 
import TextareaAutosize from 'react-textarea-autosize';


function ChatWindow({ selectedChat, onNewMessage }) {
    const { currentUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newMessageContent, setNewMessageContent] = useState('');
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    const handleAttachmentClick = () => {
        fileInputRef.current.click();
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessageContent.trim()) return;

        try {
            await api.post('/messages', {
                chatId: selectedChat._id,
                content: newMessageContent,
            });
            setNewMessageContent('');
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };
    
    useEffect(() => {
        if (!selectedChat) return;

        socket.emit('join_chat', selectedChat._id);

        const fetchMessages = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/messages/${selectedChat._id}`);
                setMessages(response.data);
            } catch (error) {
                console.error("Failed to fetch messages", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMessages();
    }, [selectedChat]);

    useEffect(()=>{
        const handleMessageReceived = (newMessage) => {
            if (selectedChat && newMessage.chat._id === selectedChat._id) {
                setMessages(prevMessages => [...prevMessages, newMessage]);
                onNewMessage(newMessage);
            }
        };
        const handleMessageDeleted = ({ messageId, chatId }) => {
            if (selectedChat && chatId === selectedChat._id) {
                setMessages(prevMessages => prevMessages.filter(msg => msg._id !== messageId));
            }
        };

        socket.on('message_received', handleMessageReceived);
        socket.on('message_deleted', handleMessageDeleted); 

        return () => {
            socket.off('message_received', handleMessageReceived);
            socket.off('message_deleted', handleMessageDeleted); 
        };
    }, [selectedChat, onNewMessage, messages])

    useEffect(()=>{
        messagesEndRef.current?.scrollIntoView({ block: 'end' });
    }, [messages,selectedChat])

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('chatId', selectedChat._id);
        formData.append('imageFile', file);

        try {
            const response = await api.post('/messages/image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            onNewMessage(response.data);

        } catch (error) {
            console.error("Image upload failed:", error);
        }
    };

    const handleDeleteMessage = async (messageId) => {
        try {
            await api.delete(`/messages/${messageId}`);
        } catch (error) {
            console.error("Failed to delete message", error);
        }
    };

    const handleKeyDown = (e) => {

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); 
            handleSendMessage(e); 
        }
    };


    if (!selectedChat) {
        return <div className="flex h-full justify-center items-center text-zinc-500">Select a conversation</div>;
    }

    const partner = selectedChat.participants.find(p => p._id !== currentUser._id);


    return (
        <div className="flex flex-col h-full w-full">

            <div className="p-3 border-b border-zinc-800 flex-shrink-0">
                <h2 className="text-xl font-bold">{partner.name}</h2>
            </div>


            <div className="flex-grow py-4 px-8 space-y-4  overflow-y-auto overflow-x-hidden">
                {loading ? <p>Loading messages...</p> : messages.map(msg => (
                    <MessageBubble key={msg._id} message={msg} isSender={msg.sender._id === currentUser._id} onDelete={handleDeleteMessage}/>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 flex items-center gap-2 border-t border-zinc-700">
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />
                
                <button onClick={handleAttachmentClick} className="p-3 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg">
                    <FiPaperclip size={22} />
                </button>
                
                <form onSubmit={handleSendMessage} className="flex-grow flex items-end gap-2">
                    <TextareaAutosize
                        placeholder="Type a message..."
                        className="flex-grow p-3 bg-[#2c2f30] rounded-lg border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"
                        value={newMessageContent}
                        onChange={(e) => setNewMessageContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        maxRows={5} 
                    />
                    <button type="submit" className="p-3 bg-violet-600 rounded-lg hover:bg-violet-500 text-white self-end">
                        <FiSend size={22} />
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ChatWindow;