const express = require("express");
const router = express.Router();
const authToken = require("../middleware/authMiddleware");
const Chat = require("../models/Chat");
const Message = require('../models/Message');


// CreateChat
router.post("/chat", authToken, async (req, res) => {
    const { userId } = req.body; 

    if (!userId) return res.status(400).json({ message: "User ID is required" });
    
    try {
        const existingChat = await Chat.findOne({ 
            isGroup: false, 
            participants: { $all: [req.user.id, userId] } 
        })
        .populate("participants", "name profilePic email")
        .populate("latestMessage");

        if (existingChat) {
            return res.status(200).json(existingChat);
        }

        const newChat = new Chat({ 
            participants: [req.user.id, userId],
            isGroup: false 
        });
        await newChat.save();

        const fullChat = await Chat.findById(newChat._id)
            .populate("participants", "name profilePic email")
            .populate("latestMessage");

        const io = req.app.get('socketio');
        io.to(userId).emit('new_chat_added', fullChat); 

        res.status(201).json(fullChat); 
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
})

//fetch chat
router.get('/chats', authToken, async (req, res) => { 
    try {
        const chats = await Chat.find({ participants: req.user.id })
            .populate("participants", "profilePic name email") 
            .populate({
                path: "latestMessage",
                populate: { path: "sender", select: "name" }
            })
            .sort({ updatedAt: -1 });

        const validChats = chats.filter(chat => {
            return chat.participants.every(p => p != null);
        });

        const chatsWithUnread = await Promise.all(chats.map(async (chat) => {
            const unreadCount = await Message.countDocuments({
                chat: chat._id,
                status: 'sent', 
                sender: { $ne: req.user.id } 
            });
            const chatObj = chat.toObject(); 
            chatObj.unreadCount = unreadCount;
            return chatObj;
        }));

        res.status(200).json(chatsWithUnread); 
    }
    catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
});

//delete chat or group
router.delete('/chats/:id', authToken, async (req, res) => {
    try {
        const chatId = req.params.id;
        const chat = await Chat.findById(chatId);

        if (!chat) return res.status(404).json({ message: "Chat not found" });

        if (chat.isGroup && chat.groupAdmin.toString() !== req.user.id) {
            return res.status(403).json({ message: "Only admins can delete the group" });
        }

        const io = req.app.get('socketio');

        chat.participants.forEach(userId => {
            io.to(userId.toString()).emit('chat_removed', { chatId });
        });

        await Chat.findByIdAndDelete(chatId);
        await Message.deleteMany({ chat: chatId });

        res.json({ message: "Chat deleted successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server Error" });
    }
});



module.exports = router