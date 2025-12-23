import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom';
import { MdEdit, MdDeleteForever, MdCancel, MdSave, MdLogout, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { IoArrowBackOutline, IoClose } from "react-icons/io5";
import { IoMdKey, IoMdImage } from "react-icons/io";
import api from '@/api';

function Profile() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('')

    const [editingField, setEditingField] = useState(null);
    const [tempValue, setTempValue] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const fileInputRef = useRef(null)

    const handleAttachmentClick = () => {
        fileInputRef.current.click();
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await api.get('/profile');
                setUser(response.data.user);
            } catch (err) {
                setError('Could not load profile. Please log in again.');
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('pfp', file);

        try {
            const response = await api.post('/profile/pfp', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setUser(response.data.user);
        } catch (error) {
            console.error("Image upload failed:", error);
        }
    };

    const handleRemovePfp = async () => {
        if (!window.confirm("Remove your profile photo?")) return;
        try {
            const response = await api.delete('/profile/pfp');
            setUser(response.data.user);
        } catch (error) {
            console.error("Failed to remove avatar:", error);
        }
    };

    const handleEdit = (field, currentValue) => {
        setEditingField(field);
        setTempValue(currentValue);
    };

    const handleCancel = () => {
        setEditingField(null);
        setMessage('');
    };

    const handleSave = async () => {
        if (tempValue === user[editingField]) {
            handleCancel();
            return;
        }
        try {
            const res = await api.put('/profile', { [editingField]: tempValue });
            setUser(res.data.user);
            setMessage(`${editingField.charAt(0).toUpperCase() + editingField.slice(1)} updated`);
            handleCancel();
        } catch (err) {
            console.error(err);
            setMessage(`Failed to update ${editingField}`);
        }
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

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this account? \nThis action can't be undone.")) {
            try {
                await api.delete('/profile');
                navigate('/login');
            } catch (error) {
                console.error("Failed to delete account", error);
            }
        }
    }

    const handlePassword = async () => {
        if (password.length < 8) {
            alert("Password must be at least 8 characters long.");
            return;
        }
        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }
        try {
            await api.put('/profile', { password });
            setMessage('Password updated');
            setShowModal(false);
            setConfirmPassword('');
            setPassword('');
        } catch (err) {
            console.error(err);
        }
    }

    if (loading) return <div className='flex justify-center items-center h-screen bg-[#181A1B] text-zinc-400'>Loading...</div>;
    if (error) return <div className='flex justify-center items-center h-screen bg-[#181A1B] text-red-400'>{error}</div>;
    if (!user) return <div className='flex justify-center items-center h-screen bg-[#181A1B] text-zinc-400'>No user data found.</div>;

    return (
        <div className='flex justify-center min-h-screen bg-[#181A1B] text-white font-sans'>
            
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-center">
                    <div className="bg-[#2c2f30] border border-zinc-700 text-white p-6 rounded-2xl w-[90%] max-w-md flex flex-col gap-6 shadow-2xl relative animate-in zoom-in duration-200">
                        <button className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors" onClick={() => { setShowModal(false); setConfirmPassword(''); setPassword(''); setShowPassword(false); }}>
                            <IoClose className='text-2xl' />
                        </button>
                        <h2 className='text-xl font-bold text-center'>Change Password</h2>
                        
                        <div className="flex flex-col gap-3">
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="New Password" 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    className="bg-[#181A1B] border border-zinc-600 rounded-xl px-4 py-3 w-full focus:outline-none focus:border-[#8675e1] focus:ring-1 focus:ring-[#8675e1] transition-all pr-10"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                                >
                                    {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                                </button>
                            </div>
                            
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Confirm Password" 
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)} 
                                    className="bg-[#181A1B] border border-zinc-600 rounded-xl px-4 py-3 w-full focus:outline-none focus:border-[#8675e1] focus:ring-1 focus:ring-[#8675e1] transition-all pr-10"
                                />
                            </div>
                            {password.length > 0 && password.length < 8 && <p className="text-red-400 text-xs">Password must be at least 8 characters</p>}
                        </div>

                        <button 
                            onClick={handlePassword} 
                            disabled={password.length < 8 || password !== confirmPassword}
                            className='bg-[#8675e1] hover:bg-[#7060c0] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-colors shadow-lg'
                        >
                            Save Password
                        </button>
                    </div>
                </div>
            )}

            <div className='w-full sm:w-[480px] px-6 py-8 flex flex-col items-center relative'>
                
                <div className='w-full flex items-center mb-8 relative'>
                    <a href="/chats" className="p-2 -ml-2 rounded-full hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors">
                        <IoArrowBackOutline className='text-2xl' />
                    </a>
                    <h1 className='text-xl font-bold ml-4'>Profile</h1>
                </div>

                <div className="relative mb-8 group">
                    <div className="w-32 h-32 rounded-full border-4 border-[#2c2f30] overflow-hidden shadow-xl bg-[#8675e1] flex items-center justify-center text-5xl font-bold text-white">
                        {user.profilePic ? (
                            <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            user.name[0].toUpperCase()
                        )}
                    </div>
                    
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                    
                    <button 
                        onClick={handleAttachmentClick} 
                        className="absolute bottom-0 right-0 bg-[#8675e1] hover:bg-[#7060c0] text-white p-2.5 rounded-full shadow-lg border-4 border-[#181A1B] transition-transform active:scale-95 flex items-center justify-center cursor-pointer"
                        title="Change Profile Picture"
                    >
                        <MdEdit size={18} />
                    </button>
                </div>

                <div className='w-full flex flex-col gap-5'>
                    
                    <div className="bg-[#2c2f30] p-4 rounded-2xl border border-zinc-700 shadow-sm">
                        <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2 block">Display Name</label>
                        <div className="flex justify-between items-center gap-2">
                            {editingField === 'name' ? (
                                <input 
                                    type="text" 
                                    value={tempValue} 
                                    onChange={(e) => setTempValue(e.target.value)} 
                                    className='bg-[#181A1B] text-white w-full px-3 py-2 rounded-lg border border-[#8675e1] focus:outline-none'
                                    autoFocus
                                />
                            ) : (
                                <span className="text-lg text-white font-medium truncate">{user.name}</span>
                            )}

                            {editingField === 'name' ? (
                                <div className='flex gap-2 shrink-0'>
                                    <button onClick={handleSave} className="p-2 text-green-400 hover:bg-zinc-700 rounded-lg transition-colors"><MdSave size={22} /></button>
                                    <button onClick={handleCancel} className="p-2 text-red-400 hover:bg-zinc-700 rounded-lg transition-colors"><MdCancel size={22} /></button>
                                </div>
                            ) : (
                                <button onClick={() => handleEdit('name', user.name)} className="p-2 text-[#8675e1] hover:bg-zinc-700 rounded-lg transition-colors">
                                    <MdEdit size={22} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="bg-[#2c2f30] p-4 rounded-2xl border border-zinc-700 shadow-sm opacity-80">
                        <label className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1 block">Email Address</label>
                        <div className="flex justify-between items-center">
                            <span className="text-lg text-zinc-300 font-medium truncate">{user.email}</span>
                        </div>
                    </div>

                    <button 
                        onClick={() => setShowModal(true)} 
                        className='flex items-center justify-between bg-[#2c2f30] hover:bg-[#323536] p-4 rounded-2xl border border-zinc-700 transition-colors group cursor-pointer'
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-zinc-800 rounded-lg text-[#8675e1] group-hover:text-white transition-colors">
                                <IoMdKey size={20} />
                            </div>
                            <span className="font-medium">Change Password</span>
                        </div>
                        <span className="text-zinc-500 text-sm group-hover:text-zinc-300">Update</span>
                    </button>

                    {user.profilePic && (
                        <button 
                            onClick={handleRemovePfp} 
                            className='flex items-center justify-between bg-[#2c2f30] hover:bg-[#323536] p-4 rounded-2xl border border-zinc-700 transition-colors group cursor-pointer'
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-zinc-800 rounded-lg text-red-400 group-hover:text-white transition-colors">
                                    <IoMdImage size={20} />
                                </div>
                                <span className="font-medium text-red-400 group-hover:text-red-300">Remove Profile Picture</span>
                            </div>
                            <span className="text-zinc-500 text-sm group-hover:text-zinc-300">Clear</span>
                        </button>
                    )}
                </div>

                {message && (
                    <div className="mt-6 px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-sm">
                        {message}
                    </div>
                )}

                <div className="w-full mt-12 pt-6 border-t border-zinc-800">
                    <h3 className="text-zinc-500 font-bold text-sm mb-4 uppercase tracking-wider">Account Actions</h3>
                    
                    <button onClick={handleLogout} className='w-full flex items-center gap-3 text-zinc-300 hover:text-white hover:bg-zinc-800 px-4 py-3 rounded-xl transition-colors cursor-pointer mb-2'>
                        <MdLogout className='text-xl' />
                        <span>Log Out</span>
                    </button>

                    <button onClick={handleDelete} className='w-full flex items-center gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 px-4 py-3 rounded-xl transition-colors cursor-pointer'>
                        <MdDeleteForever className='text-xl' />
                        <span>Delete Account</span>
                    </button>
                </div>

            </div>
        </div>
    )
}

export default Profile