import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from './context/AuthContext'; 
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Login from "./pages/Login"
import Chats from "./pages/Chats";

function RootRedirect() {
    const { isAuthenticated, loading } = useAuth(); 
    if (loading) {
        return <div>Loading...</div>;
    }
    return isAuthenticated ? (
        <Navigate to="/chats" replace />
    ) : (
        <Navigate to="/login" replace />
    );
}

function App() {
    return(
    <AuthProvider>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/chats" element={<Chats />} />
      </Routes>
    </AuthProvider>
    )
}

export default App
