import {useState, useEffect, useMemo, useRef} from 'react'
import { useAuth } from '../context/AuthContext'; 
import api from '@/api';
import { FiMenu, FiX, FiCheck } from 'react-icons/fi';
import { RiCheckLine, RiCheckDoubleLine, RiGroupLine } from 'react-icons/ri'; 
import { MdDelete, MdMarkChatRead, MdGroupAdd, MdPerson, MdSettings, MdLogout } from 'react-icons/md';
import ContextMenu from './ContextMenu';
import { socket } from '@/socket';
import { useNavigate } from 'react-router-dom';

const formatTimestamp = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
};

function ChatList({setChats, chats, onSelectChat, selectedChatId}) {
    const { currentUser } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [menu, setMenu] = useState({ visible: false, x: 0, y: 0, options: [], chatId: null });
    const listRef = useRef(null); 
    const closeTimeoutRef = useRef(null); 
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [groupSearchTerm, setGroupSearchTerm] = useState("");
    const navigate = useNavigate();
    
    const longPressTimer = useRef(null);

    const handleTouchStart = (e, chat) => {
        longPressTimer.current = setTimeout(() => {
            const touch = e.touches[0];
            setMenu({ 
                visible: true, 
                x: touch.pageX, 
                y: touch.pageY, 
                chatId: chat._id,
                options: [
                    { label: 'Mark as read', icon: <MdMarkChatRead size={18}/>, action: () => handleMarkRead(chat._id) },
                    { label: chat.isGroup && chat.groupAdmin !== currentUser._id ? 'Leave Group' : 'Delete chat', icon: <MdDelete size={18}/>, action: () => handleDeleteChat(chat), danger: true },
                ]
            });
        }, 500); 
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };

    const availableContacts = useMemo(() => {
        const contacts = [];
        const seenIds = new Set();
        chats.forEach(chat => {
            if (!chat.isGroup) {
                const partner = chat.participants.find(p => p._id !== currentUser._id);
                if (partner && !seenIds.has(partner._id)) {
                    seenIds.add(partner._id);
                    contacts.push(partner);
                }
            }
        });
        return contacts;
    }, [chats, currentUser]);

    const groupAddCandidates = useMemo(() => {
        if (!groupSearchTerm.trim()) return availableContacts;
        return availableContacts.filter(c => 
            c.name.toLowerCase().includes(groupSearchTerm.toLowerCase()) || 
            c.email.toLowerCase().includes(groupSearchTerm.toLowerCase())
        );
    }, [availableContacts, groupSearchTerm]);

    const existingPartnerMap = useMemo(() => {
        if (!chats || !currentUser) return new Map();
        const map = new Map();
        for (const chat of chats) {
            if (!chat.isGroup) {
                const partner = chat.participants.find(p => p._id !== currentUser._id);
                if (partner) map.set(partner._id, chat);
            }
        }
        return map;
    }, [chats, currentUser]);

    useEffect(() => {
        if (!searchTerm.trim()) { setSearchResults([]); return; }
        setIsSearching(true);
        const debounceTimer = setTimeout(() => {
            api.get(`/users/search?query=${searchTerm}`)
               .then(res => setSearchResults(res.data))
               .catch(err => console.error("Search failed", err))
               .finally(() => setIsSearching(false));
        }, 300); 
        return () => clearTimeout(debounceTimer);
    }, [searchTerm]);

    useEffect(() => {
        if (menu.visible) {
            if (listRef.current) listRef.current.style.overflowY = 'hidden';
            const handleGlobalClick = () => setMenu(prev => ({ ...prev, visible: false }));
            window.addEventListener('click', handleGlobalClick);
            return () => {
                if (listRef.current) listRef.current.style.overflowY = 'overlay';
                window.removeEventListener('click', handleGlobalClick);
            };
        }
    }, [menu.visible]);

    const startCloseTimer = () => {
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = setTimeout(() => { setMenu(prev => ({ ...prev, visible: false })); }, 300);
    };
    const stopCloseTimer = () => { if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current); };
    
    const handleSelectUser = (user) => {
        const tempChat = { _id: `temp_${user._id}`, participants: [currentUser, user], isTemp: true, unreadCount: 0, messages: [] };
        onSelectChat(tempChat);
        setSearchTerm('');
        setSearchResults([]);
    };

    const openGroupModal = () => {
        setSelectedUsers([]); setGroupName(""); setGroupSearchTerm(""); setShowGroupModal(true);
    };

    const toggleUserSelection = (user) => {
        if (selectedUsers.find(u => u._id === user._id)) setSelectedUsers(prev => prev.filter(u => u._id !== user._id));
        else setSelectedUsers(prev => [...prev, user]);
    };

    const handleCreateGroup = async () => {
        if (!groupName || selectedUsers.length < 2) return alert("Please provide name and 2+ users.");
        try {
            const userIds = selectedUsers.map(u => u._id);
            const response = await api.post("/group", { users: userIds, name: groupName });
            setChats(prev => [response.data, ...prev]); 
            onSelectChat(response.data); 
            setShowGroupModal(false);
        } catch (err) { alert(err.response?.data?.message || "Failed to create group"); }
    };

    const handleDeleteChat = async (chat) => { 
        const isGroupMember = chat.isGroup && chat.groupAdmin !== currentUser._id;
        if (!window.confirm(isGroupMember ? "Leave group?" : "Delete chat permanently?")) return;

        try {
            if (selectedChatId === chat._id) onSelectChat(null);
            if (isGroupMember) await api.put("/group/leave", { chatId: chat._id });
            else await api.delete(`/chats/${chat._id}`);
            setChats(prev => prev.filter(c => c._id !== chat._id));
        } catch (err) {
            if (err.response && err.response.status !== 404) alert("Failed to delete.");
            else setChats(prev => prev.filter(c => c._id !== chat._id));
        }
    };

    const handleMarkRead = (chatId) => {
        setChats(prev => prev.map(c => c._id === chatId ? { ...c, unreadCount: 0 } : c));
        socket.emit('mark_as_read', { chatId, userId: currentUser._id });
    };

    const handleLogout = async () => {
            if (window.confirm("Are you sure you want to logout?")) {
                try {
                    await api.post('/logout');
                    navigate('/login');
                } catch (err) {
                    console.error("Failed to log out", err);
                }
            }
    }

    const handleHamburgerClick = (e) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setMenu({ 
            visible: true, x: rect.left, y: rect.bottom + 5, chatId: null,
            options: [
                { label: 'Profile', icon: <MdPerson size={18}/>, action: () => window.location.href = '/profile' },
                { label: 'New Group', icon: <MdGroupAdd size={18}/>, action: openGroupModal },
                { label: 'Settings', icon: <MdSettings size={18}/>, action: () => console.log('Settings') },
                { label: 'Logout', icon: <MdLogout size={18} className="text-red-400"/>, action: handleLogout, danger: true },
            ] 
        });
        stopCloseTimer();
    };

    const handleChatContextMenu = (e, chat) => {
        e.preventDefault();
        setMenu({ 
            visible: true, x: e.pageX, y: e.pageY, chatId: chat._id,
            options: [
                { label: 'Mark as read', icon: <MdMarkChatRead size={18}/>, action: () => handleMarkRead(chat._id) },
                { label: chat.isGroup && chat.groupAdmin !== currentUser._id ? 'Leave Group' : 'Delete chat', icon: <MdDelete size={18}/>, action: () => handleDeleteChat(chat), danger: true },
            ]
        });
        stopCloseTimer();
    };

    if (!currentUser) return <div className="p-4 text-zinc-400">Loading...</div>;

    return (
        <div className='flex flex-col h-full border-r border-zinc-800 bg-[#202120] relative'>
            
            {showGroupModal && (
                <div className="absolute inset-0 z-40 bg-[#202120] flex flex-col p-5 animate-in slide-in-from-left duration-200">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2"><MdGroupAdd className="text-violet-500" /> New Group</h2>
                        <button onClick={() => setShowGroupModal(false)} className="p-2 hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-white transition-colors"><FiX size={24} /></button>
                    </div>
                    <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase ml-1 mb-1 block">Group Name</label>
                            <input type="text" placeholder="Enter group name" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="w-full bg-[#2c2f30] text-white p-3 rounded-xl border border-zinc-700 focus:outline-none focus:border-violet-500 transition-all placeholder-zinc-500" autoFocus />
                        </div>
                        <div className="flex-1 flex flex-col min-h-0">
                            <label className="text-xs font-bold text-zinc-500 uppercase ml-1 mb-1 block">Add Members</label>
                            <input type="text" placeholder="Search contacts..." value={groupSearchTerm} onChange={(e) => setGroupSearchTerm(e.target.value)} className="w-full bg-[#2c2f30] text-white p-3 rounded-xl border border-zinc-700 mb-3 focus:outline-none transition-colors placeholder-zinc-500" />
                            {selectedUsers.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3 max-h-24 overflow-y-auto telegram-scroll pr-1">
                                    {selectedUsers.map(u => (
                                        <div key={u._id} className="bg-violet-600/30 text-violet-200 px-3 py-1 rounded-full text-sm flex items-center gap-2 border border-violet-500/30 animate-in zoom-in duration-150">
                                            <span>{u.name}</span><FiX size={14} className="cursor-pointer hover:text-white" onClick={() => toggleUserSelection(u)} />
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="flex-1 overflow-y-auto telegram-scroll pr-1">
                                {groupAddCandidates.length === 0 ? <div className="text-zinc-500 text-center mt-10 text-sm">No contacts found</div> : (
                                    groupAddCandidates.map(user => {
                                        const isSelected = selectedUsers.find(u => u._id === user._id);
                                        return (
                                            <div key={user._id} onClick={() => toggleUserSelection(user)} className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-zinc-700/50 rounded-xl mb-1 transition-all border border-transparent ${isSelected ? 'bg-violet-600/10 border-violet-500/30' : ''}`}>
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm transition-colors ${isSelected ? 'bg-violet-600' : 'bg-zinc-600'}`}>
                                                    {isSelected ? <FiCheck size={18} /> : (user.profilePic ? <img src={user.profilePic} className="w-full h-full rounded-full object-cover"/> : user.name[0].toUpperCase())}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={`text-sm font-medium ${isSelected ? 'text-violet-200' : 'text-zinc-200'}`}>{user.name}</span>
                                                    <span className="text-xs text-zinc-500">{user.email}</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                    <button onClick={handleCreateGroup} className="w-full bg-violet-600 hover:bg-violet-500 text-white p-3 rounded-xl font-bold mt-4 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-[0.98]" disabled={!groupName.trim() || selectedUsers.length < 2}>Create Group ({selectedUsers.length})</button>
                </div>
            )}

            <div className='px-5 py-3 flex flex-col flex-shrink-0' onMouseLeave={menu.visible && !menu.chatId ? startCloseTimer : undefined} onMouseEnter={menu.visible && !menu.chatId ? stopCloseTimer : undefined}>
                <div className="flex justify-between items-center py-4 mb-4">
                    <div className='flex gap-3 items-center'>
                        <div className="w-13 h-13 rounded-full bg-purple-400 text-white text-[18px] flex items-center justify-center font-bold">
                            {currentUser.profilePic ? <img src={currentUser.profilePic} alt="Avatar" className="w-full h-full rounded-full object-cover" /> : currentUser.name[0].toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-white">{currentUser.name}</span>
                            <span className="text-xs text-zinc-400">{currentUser.email}</span>
                        </div>
                    </div>
                    <div onClick={handleHamburgerClick}><FiMenu className="cursor-pointer" /></div>
                </div>
                <input type="search" className='search' placeholder="Search or start new chat" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            <div ref={listRef} className='flex-1 px-2 overflow-y-auto telegram-scroll'>
                {searchTerm.trim().length > 0 ? (
                    <div>
                        {isSearching ?
                            <div className="flex justify-center items-center py-8">
                                <div className="w-8 h-8 border-4 border-zinc-700 border-t-violet-500 rounded-full animate-spin"></div>
                            </div>
                        : 
                            (searchResults.length === 0 ? <p className="p-4 text-zinc-400">No users found.</p> :
                                searchResults.map(user => {
                                    const existingChat = existingPartnerMap.get(user._id);
                                    return (
                                        <div key={user._id} onClick={() => existingChat ? onSelectChat(existingChat) : handleSelectUser(user)} className="p-3 flex items-center justify-between gap-4 cursor-pointer hover:bg-zinc-700 rounded-[9px]">
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="w-13 h-13 rounded-full bg-purple-400 text-[18px] font-bold flex-shrink-0 flex items-center justify-center">
                                                    {user.profilePic ? <img src={user.profilePic} alt="Avatar" className="w-full h-full rounded-full object-cover" /> : user.name[0].toUpperCase()}
                                                </div>
                                                <div className="flex flex-col flex-1 min-w-0">
                                                    <div className="font-bold text-white truncate">{user.name}</div>
                                                    <div className="text-xs text-zinc-500 truncate">{user.email}</div>
                                                    {existingChat && <p className="text-sm text-zinc-400 truncate">{existingChat.latestMessage ? (existingChat.latestMessage.messageType === 'image' ? '📷 Image' : existingChat.latestMessage.content) : 'Tap to chat'}</p>}
                                                </div>
                                            </div>
                                            {existingChat ? <span className="text-xs text-zinc-400">Contact</span> : <span className="text-xs text-blue-400">New</span>}
                                        </div>
                                    );
                                })
                            )
                        }
                    </div>
                ) : (
                    chats.map(chat => {
                        let name, pic;
                        if (chat.isGroup) {
                            name = chat.groupName; 
                            pic = chat.groupPic;
                            if(!pic) pic = "/group.jpg"
                        } else {
                            const partner = chat.participants.find(p => p._id !== currentUser._id);
                            if (!partner) return null;
                            name = partner.name; pic = partner.profilePic;
                        }
                        const isSelected = (chat._id === selectedChatId);
                        const isContextMenuActive = (menu.visible && menu.chatId === chat._id);

                        return (
                            <div 
                                key={chat._id} 
                                onClick={() => onSelectChat(chat)} 
                                onContextMenu={(e) => handleChatContextMenu(e, chat)}
                                onTouchStart={(e) => handleTouchStart(e, chat)}
                                onTouchEnd={handleTouchEnd}
                                onTouchMove={handleTouchEnd}
                                onMouseLeave={isContextMenuActive ? startCloseTimer : undefined}
                                onMouseEnter={isContextMenuActive ? stopCloseTimer : undefined}
                                className={`p-3 flex items-center gap-3 cursor-pointer transition-colors rounded-[9px] select-none ${isSelected ? 'bg-[#8675e1]' : (isContextMenuActive ? 'bg-zinc-800' : 'hover:bg-zinc-800')}`}
                            >
                                <div className={`w-13 h-13 rounded-full flex items-center justify-center text-white text-[18px] font-bold  bg-purple-400`}>
                                    {pic ? <img src={pic} alt="Avatar" className="w-full h-full rounded-full object-cover" /> : name[0].toUpperCase()}
                                </div>
                                <div className='flex flex-col w-full flex-1 min-w-0'>
                                    <div className="flex justify-between items-center">
                                        <p className="text-[16px] text-white min-w-0 flex items-center gap-1">
                                            {name} {chat.isGroup && <RiGroupLine className="text-zinc-300 text-sm" />}
                                        </p>
                                        <p className={`text-xs ${isSelected ? 'text-white' : 'text-gray-400'} flex-shrink-0`}>{formatTimestamp(chat.latestMessage ? chat.latestMessage.createdAt : chat.updatedAt)}</p>
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                        <p className={`text-[15px] truncate flex items-center gap-1 ${isSelected ? 'text-gray-100' : 'text-gray-400'}`}>
                                            {chat.isGroup && chat.latestMessage?.sender && chat.latestMessage.sender._id !== currentUser._id && (
                                                <span className="font-bold text-xs mr-1">{chat.latestMessage.sender.name}:</span>
                                            )}
                                            {chat.latestMessage?.sender?._id === currentUser._id && (
                                                <span className="text-base mr-1">{chat.latestMessage.status === 'read' ? <RiCheckDoubleLine/> : <RiCheckLine />}</span>
                                            )}
                                            {chat.latestMessage ? (chat.latestMessage.messageType === 'image' ? '📷 Image' : chat.latestMessage.content) : 'Tap to start chatting'}
                                        </p>
                                        {chat.unreadCount > 0 && <span className="bg-violet-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">{chat.unreadCount}</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {menu.visible && (
                <ContextMenu 
                    x={menu.x} y={menu.y} options={menu.options} 
                    onClose={() => setMenu({ ...menu, visible: false })} 
                    onMouseEnter={stopCloseTimer} onMouseLeave={startCloseTimer}
                />
            )}
        </div>
    )
}

export default ChatList;