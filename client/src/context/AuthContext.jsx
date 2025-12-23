import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '@/api';
import { socket } from '../socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = async () => {
        setLoading(true);
        try {
            const response = await api.get('/profile');
            const user = response.data.user; 
            setCurrentUser(user);
            socket.connect();
            socket.emit('join_user_room', user._id);
        } catch (error) {
            setCurrentUser(null);
            socket.disconnect();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    const value = {
        currentUser,
        setCurrentUser,
        refreshUser,     
        isAuthenticated: !!currentUser,
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
