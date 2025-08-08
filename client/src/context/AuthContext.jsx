import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '@/api';
import { socket } from '../socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkLoggedIn = async () => {
            try {
                const response = await api.get('/profile');
                setCurrentUser(response.data.user);
                socket.connect();
            } catch (error) {
                setCurrentUser(null);
                socket.disconnect();
            } finally {
                setLoading(false);
            }
        };

        checkLoggedIn();
    }, []); 

    const value = {
        currentUser,
        setCurrentUser,
        isAuthenticated: !!currentUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};


export const useAuth = () => {
    return useContext(AuthContext);
};