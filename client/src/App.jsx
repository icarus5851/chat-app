import { Routes, Route } from "react-router-dom";
import { AuthProvider } from './context/AuthContext'; 
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Login from "./pages/Login"
import Chats from "./pages/Chats";

function App() {
    return(
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/chats" element={<Chats />} />
      </Routes>
    </AuthProvider>
    )
}

export default App
