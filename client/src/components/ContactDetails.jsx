import { useState, useEffect, useRef } from 'react';
import { IoClose, IoPersonAdd, IoSearch } from 'react-icons/io5';
import { MdDeleteForever, MdEdit, MdSave, MdCameraAlt, MdAdminPanelSettings, MdExitToApp } from 'react-icons/md';
import { FiTrash2 } from 'react-icons/fi';
import api from '@/api';

function ContactDetails({ chat, currentUser, onClose, onChatRemoved }) {
    if (!chat) return null;

    const isGroup = chat.isGroup;
    const partner = !isGroup ? chat.participants.find(p => p._id !== currentUser._id) : null;
    
    const displayInfo = isGroup 
        ? { name: chat.groupName, pic: chat.groupPic? chat.groupPic : "/group.jpg", sub: `${chat.participants.length} members` } 
        : { name: partner?.name, pic: partner?.profilePic, sub: partner?.email };

    const adminId = chat.groupAdmin?._id || chat.groupAdmin;
    const isAdmin = isGroup && (adminId === currentUser._id);

    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(displayInfo.name);
    const [isAdding, setIsAdding] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [myContacts, setMyContacts] = useState([]); 
    const [filteredContacts, setFilteredContacts] = useState([]);
    const fileInputRef = useRef(null);

    const handleRename = async () => {
        if (!newName.trim() || newName === chat.groupName) return setIsEditingName(false);
        try { await api.put("/group/rename", { chatId: chat._id, chatName: newName }); setIsEditingName(false); } catch (err) { alert("Failed to rename"); }
    };

    const handleGroupPic = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        const formData = new FormData(); formData.append("pfp", file); formData.append("chatId", chat._id);
        try { await api.put("/group/pfp", formData, { headers: { 'Content-Type': 'multipart/form-data' } }); } catch (err) { alert("Failed to update Group Icon"); }
    };

    useEffect(() => {
        if (isAdding && isGroup) {
            const fetchContacts = async () => {
                try {
                    const res = await api.get('/chats');
                    const allChats = res.data;
                    const contactsMap = new Map();
                    allChats.forEach(c => { if (!c.isGroup) { const p = c.participants.find(user => user._id !== currentUser._id); if (p) contactsMap.set(p._id, p); } });
                    const currentMemberIds = chat.participants.map(p => p._id);
                    const available = Array.from(contactsMap.values()).filter(c => !currentMemberIds.includes(c._id));
                    setMyContacts(available); setFilteredContacts(available);
                } catch (err) { console.error(err); }
            };
            fetchContacts();
        }
    }, [isAdding, isGroup, chat.participants, currentUser._id]);

    const handleSearchLocal = (val) => {
        setSearchTerm(val);
        if (!val.trim()) { setFilteredContacts(myContacts); } else {
            const lower = val.toLowerCase();
            setFilteredContacts(myContacts.filter(c => c.name.toLowerCase().includes(lower) || c.email.toLowerCase().includes(lower)));
        }
    };

    const handleAddMember = async (userId) => { try { await api.put("/group/add", { chatId: chat._id, userId }); setIsAdding(false); } catch (err) { alert("Failed to add member"); } };
    const handleRemoveMember = async (userId) => { if (!window.confirm("Remove user from group?")) return; try { await api.put("/group/remove", { chatId: chat._id, userId }); } catch (err) { alert("Failed to remove"); } };

    const handleLeaveDelete = async () => {
        const action = isAdmin ? "Delete Group" : "Leave Group";
        if (!window.confirm(`Are you sure you want to ${action}?`)) return;
        try {
            if (isAdmin) await api.delete(`/chats/${chat._id}`); else await api.put("/group/leave", { chatId: chat._id });
            if (onChatRemoved) onChatRemoved(chat._id); if (onClose) onClose();
        } catch (err) { if(err.response?.status === 404 && onChatRemoved) onChatRemoved(chat._id); else alert("Action failed"); }
    };

    return (
        <div className="h-full w-full flex flex-col bg-[#181A1B]">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-[#181A1B] shrink-0">
                <h2 className="text-lg font-bold text-white tracking-wide">Contact Info</h2>
                <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"><IoClose size={24} /></button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto telegram-scroll p-4 md:p-6 flex flex-col gap-6">
                
                {/* Profile Section */}
                <div className="flex flex-col items-center">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full border-4 border-[#2c2f30] overflow-hidden shadow-xl bg-purple-400 flex items-center justify-center text-5xl font-bold text-white">
                            {displayInfo.pic ? <img src={displayInfo.pic} alt="Profile" className="w-full h-full object-cover" /> : displayInfo.name?.[0].toUpperCase()}
                        </div>
                        {isAdmin && (
                            <div onClick={() => fileInputRef.current.click()} className="absolute bottom-0 right-0 bg-[#8675e1] hover:bg-[#7060c0] text-white p-2.5 rounded-full shadow-lg border-4 border-[#181A1B] cursor-pointer transition-transform active:scale-95">
                                <MdCameraAlt size={18} /><input type="file" hidden ref={fileInputRef} onChange={handleGroupPic} accept="image/*" />
                            </div>
                        )}
                    </div>
                    <div className="mt-4 text-center w-full">
                        {isEditingName ? (
                            <div className="flex items-center justify-center gap-2 max-w-[80%] mx-auto">
                                <input autoFocus value={newName} onChange={(e)=>setNewName(e.target.value)} className="bg-[#2c2f30] text-white px-3 py-1 rounded-lg border border-[#8675e1] focus:outline-none w-full text-center font-bold text-xl" />
                                <button onClick={handleRename} className="text-green-400 hover:text-green-300 p-1"><MdSave size={24}/></button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2">
                                <h1 className="text-2xl font-bold text-white">{displayInfo.name}</h1>
                                {isAdmin && <button onClick={()=>{setNewName(displayInfo.name); setIsEditingName(true)}} className="text-zinc-500 hover:text-[#8675e1] transition-colors"><MdEdit size={18} /></button>}
                            </div>
                        )}
                        <p className="text-zinc-400 mt-1">{displayInfo.sub}</p>
                    </div>
                </div>

                {/* Group Members Section */}
                {isGroup && (
                    <div className="flex flex-col gap-4 border-t border-zinc-800 pt-6">
                        <div className="flex justify-between items-center">
                            <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Group Members</span>
                            {isAdmin && <button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-1 text-[#8675e1] hover:text-white text-sm font-semibold transition-colors bg-[#8675e1]/10 px-3 py-1.5 rounded-lg hover:bg-[#8675e1]/20"><IoPersonAdd size={16}/> Add Member</button>}
                        </div>

                        {isAdding && (
                            <div className="bg-[#2c2f30] p-3 rounded-2xl border border-zinc-700 animate-in fade-in zoom-in duration-200">
                                <div className="flex items-center gap-2 bg-[#181A1B] px-3 py-2 rounded-xl border border-zinc-600 mb-3">
                                    <IoSearch className="text-zinc-400" />
                                    <input autoFocus placeholder="Search contacts..." className="bg-transparent text-white text-sm w-full focus:outline-none" value={searchTerm} onChange={(e) => handleSearchLocal(e.target.value)} />
                                </div>
                                <div className="max-h-48 overflow-y-auto telegram-scroll flex flex-col gap-1">
                                    {filteredContacts.length === 0 && <p className="text-xs text-zinc-500 text-center py-2">No new contacts found.</p>}
                                    {filteredContacts.map(u => (
                                        <div key={u._id} onClick={() => handleAddMember(u._id)} className="flex items-center gap-3 p-2 hover:bg-zinc-700 cursor-pointer rounded-xl transition-colors">
                                            {/* FIX: Added overflow-hidden */}
                                            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden">
                                                {u.profilePic ? <img src={u.profilePic} className="w-full h-full object-cover"/> : u.name[0]}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{u.name}</p>
                                                <p className="text-xs text-zinc-400 truncate">{u.email}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            {chat.participants.map(p => (
                                <div key={p._id} className="bg-[#2c2f30] p-3 rounded-2xl border border-transparent hover:border-zinc-600 flex items-center justify-between group transition-all">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-bold text-white shrink-0 overflow-hidden">
                                            {p.profilePic ? <img src={p.profilePic} className="w-full h-full object-cover"/> : p.name[0]}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-medium text-white truncate">{p.name} {p._id === currentUser._id && <span className="text-zinc-500 font-normal">(You)</span>}</span>
                                            <span className="text-xs text-zinc-400 truncate">{p.email}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 pl-2">
                                        {(chat.groupAdmin === p._id || chat.groupAdmin?._id === p._id) ? (
                                            <span className="bg-[#8675e1]/20 text-[#8675e1] text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1"><MdAdminPanelSettings/> Admin</span>
                                        ) : (
                                            isAdmin && (
                                                <button onClick={() => handleRemoveMember(p._id)} className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Remove User"><FiTrash2 size={16} /></button>
                                            )
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {isGroup && (
                    <div className="mt-auto pt-6 border-t border-zinc-800">
                        <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Options</h3>
                        <button onClick={handleLeaveDelete} className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-colors font-medium ${isAdmin ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300' : 'bg-[#2c2f30] text-white hover:bg-red-500/10 hover:text-red-400'}`}>
                            {isAdmin ? <MdDeleteForever size={22}/> : <MdExitToApp size={22}/>}
                            <span>{isAdmin ? "Delete Group Permanently" : "Leave Group"}</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ContactDetails;