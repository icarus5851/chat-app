import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import api from '@/api';
import { useAuth } from '../context/AuthContext';

function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const { refreshUser } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (password.length < 8) {
            setMessage("Password must be at least 8 characters long.");
            return;
        }

        if (password !== confirmPassword) {
            setMessage("Passwords do not match!");
            return;
        }

        try {
            const response = await api.post('/signup', { name, email, password });
            setMessage(response.data.message);
            await refreshUser();
            navigate('/chats');

        } catch (error) {
            if (error.response) {
                setMessage(error.response.data.message);
            } else {
                setMessage('Error: Could not connect to the server.');
            }
        }
    }

    return (
    <div className='flex justify-center'>
        <div className='h-screen w-full sm:w-3/5 md:w-1/2 lg:w-2/5  px-5 flex flex-col justify-center items-center'>
            <div className='text-3xl font-bold logo mb-12 text-center'>Ping <span className='text-[#8675e1]'>Chat.</span></div>
            
            <div className='flex flex-col justify-center items-center gap-3'>
                <div className='text-3xl sm:text-5xl font-bold'>Sign Up</div>
                <p className='text-justify text-[#a29f99]'>Already have an Account?&nbsp;
                    <a href="/login" className='font-bold text-[#8675e1]'>Login</a>
                </p>
            </div>

            <form onSubmit={handleSubmit} className='flex w-11/12 flex-col mt-8 gap-5 max-w-[400px] text-[#a29f99]'>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="name" className="text-sm font-bold">Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required/>
                </div>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="email" className="text-sm font-bold">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="xyz@example.com"  required/>
                </div>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="password" className="text-sm font-bold">Password</label>
                    <div className="relative">
                        <input 
                            id="password"
                            type={showPassword ? "text" : "password"} 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)}  
                            required
                            className="w-full pr-10"
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                        >
                            {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                        </button>
                    </div>
                    <span className="text-xs text-zinc-500">Must be at least 8 characters</span>
                </div>
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="confirmPassword" className="text-sm font-bold">Confirm Password</label>
                    <div className="relative">
                        <input 
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"} 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)} 
                            required
                            className="w-full pr-10"
                        />
                        <button 
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                        >
                            {showConfirmPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                        </button>
                    </div>
                </div>

                <button type='submit' className='bg-[#8675e1] hover:bg-[#7060c0] transition-colors text-white rounded-sm mt-1 py-2 cursor-pointer'>
                    Sign up
                </button>

            </form>
            <div className='mt-2 text-red-400 text-sm text-center'>{message && <p>{message}</p>}</div>
        </div>
    </div>
    )
}

export default Signup