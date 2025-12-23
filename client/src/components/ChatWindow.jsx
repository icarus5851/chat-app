import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '@/api';
import MessageBubble from './MessageBubble';
import { socket } from '@/socket';
import { MdGroup, MdOutlineCall, MdOutlineSearch, MdOutlineEmojiEmotions, MdDeleteForever, MdReply, MdContentCopy, MdForward, MdClose, MdSaveAlt } from "react-icons/md";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaArrowDown } from "react-icons/fa"; 
import { FiPaperclip, FiImage } from 'react-icons/fi';
import { IoArrowBack, IoSend } from 'react-icons/io5'; 
import TextareaAutosize from 'react-textarea-autosize';
import EmojiPicker from 'emoji-picker-react'; 
import ContactDetails from './ContactDetails';
import ContextMenu from './ContextMenu';

const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
};

const DateDivider = ({ date }) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    let dateText = '';
    if (isSameDay(date, today)) {
        dateText = 'Today';
    } else if (isSameDay(date, yesterday)) {
        dateText = 'Yesterday';
    } else {
        dateText = new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    return (
        <div className="flex justify-center items-center my-4 z-0 pointer-events-none">
            <span className="bg-zinc-800/80 backdrop-blur-sm text-zinc-300 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                {dateText}
            </span>
        </div>
    );
};

function ChatWindow({ selectedChat, onNewMessage, onChatStarted, onChatRemoved, onBack }) { 
    const { currentUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newMessageContent, setNewMessageContent] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [showScrollBottom, setShowScrollBottom] = useState(false);
    const [unreadNewMessages, setUnreadNewMessages] = useState(0);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [toast, setToast] = useState('');
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [menu, setMenu] = useState({ visible: false, x: 0, y: 0, options: [], messageId: null });

    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const containerRef = useRef(null);
    const inputRef = useRef(null); 
    const isInitialLoad = useRef(true);
    const closeTimeoutRef = useRef(null); 
    const isSending = useRef(false); 

    useEffect(() => {
        if (window.innerWidth < 768) {
            window.history.pushState({ chatOpen: true }, "");
        }

        const handlePopState = (event) => {
            if (window.innerWidth < 768) {
                event.preventDefault();
                onBack(); 
            }
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, []);

    useEffect(() => {
        if (selectedChat) {
            setNewMessageContent(''); 
            setShowEmojiPicker(false); 
            setShowAttachMenu(false); 
            setReplyingTo(null);
            if (inputRef.current) inputRef.current.focus(); 
        }
    }, [selectedChat?._id]);

    useEffect(() => {
        if (containerRef.current) {
            if (menu.visible) {
                containerRef.current.style.overflowY = 'hidden'; 
            } else {
                containerRef.current.style.overflowY = 'overlay'; 
            }
        }
    }, [menu.visible]);

    useEffect(() => {
        const handleGlobalClick = (e) => {
            setMenu(prev => ({ ...prev, visible: false }));
            if (!e.target.closest('.attach-menu-container')) setShowAttachMenu(false);
            if (!e.target.closest('.emoji-picker-container') && !e.target.closest('.chat-input-area')) setShowEmojiPicker(false);
        };
        if (menu.visible || showAttachMenu || showEmojiPicker) window.addEventListener('click', handleGlobalClick);
        return () => window.removeEventListener('click', handleGlobalClick);
    }, [menu.visible, showAttachMenu, showEmojiPicker]);

    const startCloseTimer = () => { if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current); closeTimeoutRef.current = setTimeout(() => { setMenu(prev => ({ ...prev, visible: false })); }, 300); };
    const stopCloseTimer = () => { if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current); };

    const handleSaveImage = async (imageUrl) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const filename = `image-${Date.now()}.jpg`;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            setToast('Saving Image');
            setTimeout(() => setToast(''), 2000);
        } catch (error) {
            console.error('Download failed', error);
            setToast('Failed to save image');
        }
    };

    const handleContextMenu = (x, y, messageId) => {
        const targetMsg = messages.find(m => m._id === messageId);
        if (!targetMsg) return;
        const isSender = targetMsg.sender._id === currentUser._id;
        const isImage = targetMsg.messageType === 'image';

        const commonOptions = [
            { label: 'Reply', icon: <MdReply size={18} />, action: () => { setReplyingTo(targetMsg); } },
            isImage 
                ? { label: 'Save Image', icon: <MdSaveAlt size={18} />, action: () => handleSaveImage(targetMsg.content) }
                : { label: 'Copy Text', icon: <MdContentCopy size={18} />, action: async () => { await navigator.clipboard.writeText(targetMsg.content || ""); setToast('Message copied'); setTimeout(() => setToast(''), 1500); } },
            { label: 'Forward', icon: <MdForward size={18} />, action: () =>{setToast('Work in progress'); setTimeout(() => setToast(''), 2000);} },
        ];
        const senderOptions = [{ label: 'Delete', icon: <MdDeleteForever size={18} />, action: () => handleDeleteMessage(messageId), danger: true }, ...commonOptions];
        setMenu({ visible: true, x, y, options: isSender ? senderOptions : commonOptions, messageId: messageId });
        stopCloseTimer();
    };

    const isNearBottom = () => { const container = containerRef.current; if (!container) return false; return container.scrollHeight - container.scrollTop - container.clientHeight < 200; };
    const scrollToBottomInstant = () => { if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight; };
    const smoothScrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); setUnreadNewMessages(0); };
    
    const scrollToReply = (messageId) => {
        const element = document.getElementById(`msg-${messageId}`);
        if (element) { element.scrollIntoView({ behavior: 'smooth', block: 'center' }); element.classList.add('highlight-message'); setTimeout(() => element.classList.remove('highlight-message'), 5000); }
    };

    const handleScroll = () => {
        const atBottom = isNearBottom(); setShowScrollBottom(!atBottom);
        if (atBottom) { setUnreadNewMessages(0); if (selectedChat && !selectedChat.isTemp) { socket.emit('mark_as_read', { chatId: selectedChat._id, userId: currentUser._id }); } }
    };

    const handleStartChat = async () => {
        const partner = selectedChat.participants.find(p => p._id !== currentUser._id);
        try { const response = await api.post('/chat', { userId: partner._id }); const newRealChat = response.data; onChatStarted(newRealChat); } catch (error) { console.error("Error creating chat", error); }
    };

    const handleAttachmentClick = () => { setShowAttachMenu(!showAttachMenu); setShowEmojiPicker(false); };
    const handleFileSelect = () => { fileInputRef.current.click(); setShowAttachMenu(false); };
    const handleEmojiClick = (emojiData) => { setNewMessageContent(prev => prev + emojiData.emoji); };

    const handleSendMessage = async (e) => {
        e?.preventDefault(); 
        
        const contentToSend = newMessageContent.trim();
        if (!contentToSend || isSending.current) return;

        setNewMessageContent(''); 
        setReplyingTo(null); 
        setShowEmojiPicker(false); 
        isSending.current = true; // Lock sending

        const payload = { content: contentToSend, replyTo: replyingTo ? replyingTo._id : null };
        
        try {
            if (selectedChat.isTemp) {
                const partner = selectedChat.participants.find(p => p._id !== currentUser._id);
                const res = await api.post('/chat', { userId: partner._id }); 
                const realChat = res.data; 
                onChatStarted(realChat); 
                await api.post('/messages', { chatId: realChat._id, ...payload });
            } else { 
                await api.post('/messages', { chatId: selectedChat._id, ...payload }); 
            }
            setTimeout(smoothScrollToBottom, 50);
        } catch (err) { 
            console.error(err); 
        } finally {
            isSending.current = false; 
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        let targetChatId = selectedChat._id;
        if (selectedChat.isTemp) {
             const partner = selectedChat.participants.find(p => p._id !== currentUser._id);
             try { const res = await api.post('/chat', { userId: partner._id }); onChatStarted(res.data); targetChatId = res.data._id; } catch(err) { return; }
        }
        const formData = new FormData(); formData.append('chatId', targetChatId); formData.append('imageFile', file);
        try { const response = await api.post('/messages/image', formData, { headers: { 'Content-Type': 'multipart/form-data' }, }); onNewMessage(response.data); setTimeout(smoothScrollToBottom, 50); setShowAttachMenu(false); } catch (error) { console.error("Image upload failed:", error); }
    };

    const handleDeleteMessage = async (messageId) => { try { await api.delete(`/messages/${messageId}`); } catch (error) { console.error("Failed to delete message", error); } };
    const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } };

    useEffect(() => {
        if (!selectedChat) return;
        setUnreadNewMessages(0); setShowScrollBottom(false); setMessages([]); isInitialLoad.current = true;
        if (selectedChat.isTemp) { setLoading(false); return; }
        setLoading(true); socket.emit('join_chat', selectedChat._id); socket.emit('mark_as_read', { chatId: selectedChat._id, userId: currentUser._id });
        const fetchMessages = async () => { try { const response = await api.get(`/messages/${selectedChat._id}`); setMessages(response.data); } catch (error) { console.error("Failed to fetch messages", error); } finally { setLoading(false); } };
        fetchMessages();
    }, [selectedChat, currentUser._id]);

    useLayoutEffect(() => { if (messages.length > 0 && isInitialLoad.current) { scrollToBottomInstant(); isInitialLoad.current = false; } }, [messages]);

    useEffect(()=>{
        if (!selectedChat || selectedChat.isTemp) return;
        const handleMsgRecv = (newMessage) => {
            if (newMessage.chat._id === selectedChat._id) {
                const wasAtBottom = isNearBottom();
                const isMyMessage = newMessage.sender._id === currentUser._id;
                setMessages(prev => [...prev, newMessage]); onNewMessage(newMessage);
                if (isMyMessage) { smoothScrollToBottom(); } else { if (wasAtBottom) { smoothScrollToBottom(); socket.emit('mark_as_read', { chatId: selectedChat._id, userId: currentUser._id }); } else { setUnreadNewMessages(prev => prev + 1); } }
            }
        };
        const handleMsgDel = ({ messageId, chatId }) => {
            if (selectedChat && chatId === selectedChat._id) {
                setReplyingTo(prev => (prev && prev._id === messageId ? null : prev));
                setMessages(prevMessages => {
                    const filteredMessages = prevMessages.filter(msg => msg._id !== messageId);
                    return filteredMessages.map(msg => { if (msg.replyTo && msg.replyTo._id === messageId) { return { ...msg, replyTo: { ...msg.replyTo, content: "Message deleted", messageType: "text" } }; } return msg; });
                });
            }
        };
        const handleMsgRead = ({ chatId, readerId }) => {
            if (selectedChat && chatId === selectedChat._id && readerId !== currentUser._id) {
                setMessages(prevMessages => prevMessages.map(msg => msg.status === 'sent' ? { ...msg, status: 'read' } : msg));
            }
        };
        socket.on('message_received', handleMsgRecv); socket.on('message_deleted', handleMsgDel); socket.on('messages_read', handleMsgRead); 
        return () => { socket.off('message_received', handleMsgRecv); socket.off('message_deleted', handleMsgDel); socket.off('messages_read', handleMsgRead); };
    }, [selectedChat, onNewMessage, currentUser]); 

    if (!selectedChat) return (
        <div className="flex flex-col h-[100dvh] w-full justify-center items-center bg-doodle-pattern text-zinc-500 gap-4">
            <div className="w-20 h-20 rounded-full bg-zinc-800/50 animate-pulse flex items-center justify-center">
                <MdGroup size={40} className="opacity-20"/>
            </div>
            <p className="font-medium">Select a conversation to start messaging</p>
        </div>
    );
    
    let headerName, headerPic;
    if (selectedChat.isGroup) { 
        headerName = selectedChat.groupName; 
        headerPic = selectedChat.groupPic; 
        if(!headerPic) headerPic = "/group.jpg"
    } 
    else { const partner = selectedChat.participants.find(p => p._id !== currentUser._id); headerName = partner?.name || "Unknown"; headerPic = partner?.profilePic; }
    let lastMessageDate = null;

    return (
        <div className="flex h-[100dvh] w-full relative overflow-hidden">
            <div className="flex flex-col h-full bg-doodle-pattern flex-1 min-w-0 relative">
                
                {/* Header */}
                <div className='flex justify-between items-center border-b border-zinc-800 bg-[#181A1B] z-10 relative h-[70px] shrink-0'>
                     <div className="flex items-center flex-1 min-w-0">
                        <button onClick={() => { if(window.innerWidth < 768) window.history.back(); else onBack(); }} className="md:hidden p-3 text-zinc-400 hover:text-white"><IoArrowBack size={24}/></button>
                        <button onClick={() => setIsDetailsOpen(true)} className="p-3 flex items-center gap-3 hover:bg-zinc-800/50 rounded-lg transition-all ml-1 flex-1 min-w-0 justify-start">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0 bg-purple-400`}>
                                {headerPic ? <img src={headerPic} alt="Avatar" className="w-full h-full rounded-full object-cover" /> :  headerName[0]?.toUpperCase()}
                            </div>
                            <div className="flex flex-col items-start overflow-hidden">
                                <h2 className="font-bold text-white truncate w-full text-left">{headerName}</h2>
                                {selectedChat.isGroup && <span className="text-xs text-zinc-400 truncate">{selectedChat.participants.length} members</span>}
                            </div>
                        </button>
                     </div>
                    <div className='text-2xl flex gap-3 px-4 text-zinc-400'>
                        <MdOutlineCall onClick={() =>{setToast('Work in progress'); setTimeout(() => setToast(''), 2000);}} className='cursor-pointer hover:text-white transition-colors'/><MdOutlineSearch onClick={() =>{setToast('Work in progress'); setTimeout(() => setToast(''), 2000);}} className='cursor-pointer hover:text-white transition-colors'/><BsThreeDotsVertical onClick={() =>{setToast('Work in progress'); setTimeout(() => setToast(''), 2000);}} className='cursor-pointer hover:text-white transition-colors'/>
                    </div>
                </div>

                {/* Messages Area */}
                <div 
                    ref={containerRef} 
                    onScroll={handleScroll} 
                    className={`telegram-scroll flex-grow py-4 px-3 sm:px-12 md:px-20 lg:px-32 space-y-1 overflow-x-hidden relative z-0 ${loading ? 'invisible' : 'visible'}`}
                >
                    {!loading && messages.map(msg => {
                        let showDateDivider = false;
                        if (!isSameDay(lastMessageDate, msg.createdAt)) { showDateDivider = true; lastMessageDate = msg.createdAt; }
                        const isActiveForMenu = menu.messageId === msg._id;
                        return (
                            <React.Fragment key={msg._id}>
                                {showDateDivider && <DateDivider date={msg.createdAt} />}
                                <MessageBubble 
                                    message={msg} 
                                    scrollToBottom={smoothScrollToBottom} 
                                    isSender={msg.sender._id === currentUser._id} 
                                    isGroup={selectedChat.isGroup} 
                                    onContextMenu={handleContextMenu}
                                    onReplyClick={scrollToReply}
                                    onMouseEnter={isActiveForMenu ? stopCloseTimer : undefined}
                                    onMouseLeave={isActiveForMenu ? startCloseTimer : undefined}
                                />
                            </React.Fragment>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                {selectedChat.isTemp ? (
                    <div className="p-4 flex justify-center items-center bg-[#181A1B] border-t border-zinc-700 z-10 relative">
                        <button onClick={handleStartChat} className="bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all animate-in fade-in zoom-in duration-300">Start Chatting</button>
                    </div>
                ) : (
                    <div className="chat-input-area p-3 sm:p-4 flex flex-col gap-2 border-t border-zinc-700 bg-[#181A1B] z-10 relative">
                            {showEmojiPicker && (
                                <div className="absolute bottom-full left-2 sm:left-4 mb-2 z-50 shadow-2xl rounded-2xl overflow-hidden w-[95vw] sm:w-[350px]">
                                    <EmojiPicker 
                                        theme="dark" 
                                        emojiStyle="native"
                                        onEmojiClick={handleEmojiClick}
                                        autoFocusSearch={false} 
                                        searchDisabled={false}
                                        width="100%"
                                        height={350} 
                                        previewConfig={{ showPreview: false }} 
                                        skinTonesDisabled={true}
                                        emojiSize={21}
                                        categories={[
                                            { category: 'suggested', name: 'Frequently Used' },
                                            { category: 'smileys_people', name: 'Smileys & People' },
                                            { category: 'animals_nature', name: 'Animals & Nature' },
                                            { category: 'food_drink', name: 'Food & Drink' },
                                            { category: 'travel_places', name: 'Travel & Places' },
                                            { category: 'activities', name: 'Activities' },
                                            { category: 'objects', name: 'Objects' },
                                            { category: 'symbols', name: 'Symbols' },
                                            { category: 'flags', name: 'Flags' }
                                        ]}
                                    />
                                </div>
                            )}

                            {replyingTo && (
                                <div className="flex items-center justify-between bg-[#2c2f30] p-2 rounded-t-xl border-l-4 border-violet-500 animate-in slide-in-from-bottom-2">
                                    <div className="flex flex-col ml-2 overflow-hidden">
                                        <span className="text-violet-400 text-sm font-bold truncate">Replying to {replyingTo.sender.name}</span>
                                        <span className="text-zinc-400 text-xs truncate">{replyingTo.messageType === 'image' ? 'Photo' : replyingTo.content}</span>
                                    </div>
                                    <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-white"><MdClose size={18} /></button>
                                </div>
                            )}
                            <div className="flex items-end gap-2 w-full">
                                <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
                                <div className="relative attach-menu-container self-end pb-1">
                                    <button onClick={handleAttachmentClick} className="p-2 text-zinc-400 hover:cursor-pointer hover:text-white hover:bg-zinc-700 rounded-full transition-colors"><FiPaperclip size={22} /></button>
                                    {showAttachMenu && (
                                        <div className="absolute bottom-12 left-0 bg-[#2c2f30] border border-zinc-700 rounded-xl shadow-xl p-2 w-48 flex flex-col gap-1 z-30">
                                            <button onClick={handleFileSelect} className="flex items-center gap-3 p-2 hover:cursor-pointer hover:bg-zinc-700 rounded-lg text-left text-sm text-white"><div className="bg-violet-500 p-2 rounded-full text-white"><FiImage /></div><span>Photo or Video</span></button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-grow flex items-center gap-2 bg-[#2c2f30] rounded-2xl border border-zinc-700 focus-within:ring-1 focus-within:ring-violet-500 px-3 py-1.5">
                                     <div className="relative emoji-picker-container self-end ">
                                        <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={` hover:bg-zinc-600 hover:cursor-pointer rounded-2xl p-1  transition-colors ${showEmojiPicker ? 'text-violet-500' : 'text-zinc-400'}`}><MdOutlineEmojiEmotions size={26} /></button>
                                    </div>
                                    <TextareaAutosize ref={inputRef} placeholder="Message" className="telegram-scroll telegram-input-field flex-grow bg-transparent text-white placeholder-zinc-500 focus:outline-none resize-none py-1 max-h-32" value={newMessageContent} onChange={(e) => setNewMessageContent(e.target.value)} onKeyDown={handleKeyDown} maxRows={5} />
                                </div>
                                <button onClick={handleSendMessage} className="p-3 bg-violet-500 rounded-full text-center hover:cursor-pointer text-white self-end shadow-lg"><IoSend size={21} /></button> 
                            </div>
                    </div>
                )}

                {showScrollBottom && (
                    <button onClick={smoothScrollToBottom} className={`absolute right-6 p-3 bg-zinc-700 hover:bg-zinc-600 rounded-full shadow-lg border border-zinc-600 transition-all z-20 ${replyingTo ? 'bottom-40' : 'bottom-24'}`}>
                        {unreadNewMessages > 0 && <span className="absolute -top-2 -left-2 bg-violet-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">{unreadNewMessages}</span>}
                        <FaArrowDown className="text-white" />
                    </button>
                )}
            </div>
            
            {isDetailsOpen && (
                <div className="absolute inset-0 z-50 md:relative md:inset-auto md:z-0 md:block w-full md:w-80 h-full border-l border-zinc-800 shadow-xl bg-[#181A1B]">
                    <ContactDetails chat={selectedChat} currentUser={currentUser} onChatRemoved={onChatRemoved} onClose={() => setIsDetailsOpen(false)} />
                </div>
            )}

            {menu.visible && <ContextMenu x={menu.x} y={menu.y} options={menu.options} onClose={() => setMenu({ ...menu, visible: false })} onMouseEnter={stopCloseTimer} onMouseLeave={startCloseTimer} />}
            {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-sm px-4 py-2 rounded-full shadow-lg z-50 animate-in fade-in zoom-in duration-200">{toast}</div>}
        </div>
    );
}

export default ChatWindow;