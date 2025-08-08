import React from 'react'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/api';

function Signup() {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword,setConfirmPassword] = useState('');
	const [message, setMessage] = useState('');
	const navigate = useNavigate();

	const handleSubmit = async (e)=>{
		e.preventDefault();
		setMessage('');

		if (password !== confirmPassword) {
            setMessage("Passwords do not match!");
            return;
        }

		try {
			const response = await api.post('/signup', { name, email, password });
			setMessage(response.data.message);
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
			<div className='text-3xl font-bold logo mb-12 text-center'>Ping <span className='text-violet-400'>Chat.</span></div>
			
			<div className='flex flex-col justify-center items-center gap-3'>
				<div className='text-3xl sm:text-5xl font-bold'>Sign Up</div>
				<p className='text-justify text-[#a29f99]'>Already have an Account?&nbsp;
					<a href="/login" className='font-bold text-violet-400'>Login</a>
				</p>
			</div>

			<form onSubmit={handleSubmit} className='flex w-11/12 flex-col mt-8 gap-5 max-w-[400px] text-[#a29f99]'>

				<div className="flex flex-col gap-1.5">
					<label htmlFor="name" className="text-sm font-bold">Name</label>
					<input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required/>
				</div>
				<div className="flex flex-col gap-1.5">
					<label htmlFor="name" className="text-sm font-bold">Email</label>
					<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="xyz@example.com"  required/>
				</div>
				<div className="flex flex-col gap-1.5">
					<label htmlFor="password" className="text-sm font-bold">Password</label>
					<input type="password" value={password} onChange={(e) => setPassword(e.target.value)}  required/>
				</div>
				<div className="flex flex-col gap-1.5">
					<label htmlFor="confirmPassword" className="text-sm font-bold">Confirm Password</label>
					<input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required/>
				</div>

				<button type='submit' className='bg-violet-500 text-white rounded-sm mt-1 py-2 cursor-pointer'>
					Sign up
				</button>

			</form>
			{message && <p>{message}</p>}
		</div>
	</div>
	)
}

export default Signup