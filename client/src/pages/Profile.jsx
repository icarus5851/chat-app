import {React, useEffect, useState,useRef} from 'react'
import { useNavigate } from 'react-router-dom';
import { MdEdit } from "react-icons/md";
import { MdDeleteForever } from "react-icons/md";
import { IoArrowBackOutline } from "react-icons/io5";
import { IoClose } from "react-icons/io5";
import { IoMdKey } from "react-icons/io";
import { MdCancel } from 'react-icons/md';
import { MdSave } from 'react-icons/md';
import { FiPaperclip } from 'react-icons/fi';
import api from '@/api';

function Profile() {
    const navigate = useNavigate();

	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error,setError] = useState('');
	const [message,setMessage] = useState('')

	const [editingField, setEditingField] = useState(null);
	const [tempValue, setTempValue] = useState('');

	const [showModal, setShowModal] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

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
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
			setUser(response.data.user);
            console.log(response.data);

        } catch (error) {
            console.error("Image upload failed:", error);
        }
    };

	const handleEdit = (field, currentValue) => {
        setEditingField(field);
        setTempValue(currentValue);
    };

    const handleCancel = () => {
        setEditingField(null);
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

	const handleLogout = async ()=>{
      	if (window.confirm("Are you sure you want to logout?")){  
			try {
				await api.post('/logout');
				navigate('/login'); 
			} catch (err) {
				console.error("Failed to log out", err);
			}
		}
	}

	const handleDelete = async ()=>{
		if (window.confirm("Are you sure you want to delete this account? \nThis action can't be undone.")) {
        	try {
				const response = await api.delete('/profile');
				console.log(response.data.message)
				navigate('/login');
			} catch (error) {
				console.error("Failed to delete account", err);
			}
	    }
	}


	const handlePassword = async ()=>{
		if (password !== confirmPassword) {
			alert("Passwords do not match");
			return;
		}
		try {
			await api.put('/profile', { password });
			setMessage('Password updated');

		} catch (err) {
			console.error(err);
		}
	}

	if (loading) return <div className='flex justify-center items-center h-screen cursor-progress'>Loading...</div>;
	if(error) return <div className='flex justify-center items-center h-screen'>{error}</div>;
    if (!user) return <div className='flex justify-center items-center h-screen'>No user data found.</div>;


	return (
	<div className='flex justify-center'>
		{showModal && (
			<div className="fixed inset-0 z-50 bg-black/700 backdrop-blur-sm flex justify-center items-center">
				<div className="bg-[#181A1B] relative border border-[#373c3e] text-white p-6 rounded-xs w-[90%] max-w-md flex flex-col gap-8">
					<button className="absolute top-1.5 right-1.5 cursor-pointer" onClick={() => {setShowModal(false); setConfirmPassword(''); setPassword('');}}>
						<IoClose className='text-2xl'/>
					</button>
					<h2 className='text-lg font-bold mb-2'>Change Password</h2>
					<input type="password" placeholder="New Password" value={password} onChange={(e) => setPassword(e.target.value)} />
					<input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
					<button onClick={()=>{ handlePassword; setShowModal(false); setConfirmPassword(''); setPassword(''); }} className='bg-violet-500 text-white py-1 rounded-xs'>Save Password</button>
				</div>
			</div>
		)}

		<div className=' min-h-screen w-full sm:w-3/5 md:w-1/2 lg:w-2/5  px-5 py-5 flex flex-col justify-center items-center'>

			<div className='w-full relative text-3xl px-18 font-bold logo mb-12 text-center'>Your <span className=''>Profile</span>
            	<a href="/chats" className="absolute top-1 left-0 bg-[#2c2f30] px-2 py-0.5 rounded-xs cursor-pointer hover:bg-[#202122] border border-[#373c3e]"><IoArrowBackOutline className='text-2xl'/></a>
			</div>

			<div className="w-30 h-30 rounded-full bg-violet-600 text-white flex items-center justify-center text-4xl font-bold">
                    {user.profilePic ? (
                        <img src={user.profilePic} alt="Profile Avatar" className="w-full h-full rounded-full object-cover" />
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
			
			<button onClick={handleAttachmentClick} className="p-3 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg">
				<FiPaperclip size={22} />
			</button>

			<div className='flex w-11/12 flex-col mt-10 gap-8 max-w-[400px] text-[#a29f99]'>
				<div className="flex flex-col gap-1.5">
					<label className="text font-bold">Name</label>
					<div className="flex justify-between items-center text-white">
						{editingField === 'name' ? (
							<input type="text" value={tempValue} className='w-full' onChange={(e) => setTempValue(e.target.value)} required />
						) : (
							<div className="px-1.5 py-2">{user.name}</div>
						)}
						
						{editingField === 'name' ? (
							<div className='flex gap-2 items-center ml-2'>
								<button onClick={handleSave} className="cursor-pointer bg-[#2c2f30] px-2 py-1 rounded-xs hover:bg-[#202122] border border-[#373c3e] text-2xl text-green-600"><MdSave /></button>
								<button onClick={handleCancel} className="cursor-pointer bg-[#2c2f30] px-2 py-1 rounded-xs hover:bg-[#202122] border border-[#373c3e] text-2xl text-red-300"><MdCancel /></button>
							</div>
						) : (
							<button className="cursor-pointer bg-[#2c2f30] px-2 py-1 rounded-xs hover:bg-[#202122] border border-[#373c3e]" onClick={() => handleEdit('name', user.name)}>
								<MdEdit className='text-[1.1rem]' />
							</button>
						)}
					</div>
				</div>
				<div className="flex flex-col gap-1.5">
					<label className="text font-bold">Email</label>
					<div className="flex justify-between items-center text-white">
						{editingField === 'email' ? (
							<input type="email" value={tempValue} className='w-full' onChange={(e) => setTempValue(e.target.value)} required />
						) : (
							<div className="px-1.5 py-2">{user.email}</div>
						)}
						{editingField === 'email' ? (
							<div className='flex gap-2 items-center ml-2'>
								<button onClick={handleSave} className="cursor-pointer bg-[#2c2f30] px-2 py-1 rounded-xs hover:bg-[#202122] border border-[#373c3e] text-2xl text-green-600"><MdSave /></button>
								<button onClick={handleCancel} className="cursor-pointer bg-[#2c2f30] px-2 py-1 rounded-xs hover:bg-[#202122] border border-[#373c3e] text-2xl text-red-300"><MdCancel /></button>
							</div>
						) : (
							<button className="cursor-pointer bg-[#2c2f30] px-2 py-1 rounded-xs hover:bg-[#202122] border border-[#373c3e]" onClick={() => handleEdit('email', user.email)}>
								<MdEdit className='text-[1.1rem]' />
							</button>
						)}
					</div>
				</div>

				
				<button onClick={()=>setShowModal(true)} className='bg-[#202122] border border-[#373c3e] text-white rounded-xs flex justify-center items-center gap-2 mt-3 py-2 cursor-pointer'>
					<span>Change Password</span> <IoMdKey className='text-2xl' />
				</button>

				<div className="flex flex-col gap-6 mt-6">
					<div className="text-white text-[1.2rem] font-bold"> Account Actions</div>
					<button onClick={handleLogout} className='border border-rose-700 text-rose-700 bg-transparent rounded-xs mt-1 py-2 cursor-pointer'>
						Log Out
					</button>

					<button onClick={handleDelete} className='bg-rose-700 text-white rounded-xs mt-1 py-2 cursor-pointer flex justify-center items-center gap-2'>
						<span>Delete Account</span> <MdDeleteForever className='text-2xl'></MdDeleteForever>
					</button>
				</div>
			</div>
			{message && <p>{message}</p>}
		</div>
	</div>
	)
}

export default Profile


