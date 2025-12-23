const express = require("express");
const router = express.Router();
const authToken = require("../middleware/authMiddleware");
const Message = require("../models/Message")
const Chat = require("../models/Chat");
const upload = require('../config/cloudinaryConfig');

router.get('/messages/:id', authToken, async (req,res)=>{
    try{
        const chatId = req.params.id
        const messages = await Message.find({ chat: chatId })
            .populate("sender", "name email") 
            .populate("chat")
            .populate({
                path: "replyTo",
                select: "content messageType sender",
                populate: { path: "sender", select: "name" }
            });
        res.status(200).json(messages);
    }
    catch(err){
        console.error(err.message)
        res.status(401).send("Cant retrieve messages")
    }
})

router.post('/messages', authToken, async (req, res) => {
    const { chatId, content, replyTo } = req.body; 

    if (!chatId || !content) {
        return res.status(400).json({ message: "Chat ID and content are required." });
    }

    try {
        const newMessage = new Message({
            sender: req.user.id,
            content,
            messageType: "text",
            chat: chatId,
            replyTo: replyTo 
        });

        await newMessage.save();

        await newMessage.populate([
            { path: "sender", select: "name profilePic email" },
            { 
                path: 'chat',
                populate: { path: 'participants', select: 'name profilePic email' }
            },
            { 
                path: 'replyTo', 
                select: 'content messageType sender',
                populate: { path: 'sender', select: 'name' }
            }
        ]);

        await Chat.findByIdAndUpdate(chatId, { latestMessage: newMessage });

        const io = req.app.get('socketio');
        io.to(chatId).emit('message_received', newMessage);

        res.status(201).json(newMessage);
    } catch (err) {
        console.error(err.message);
        res.status(401).send("Cant retrieve messages");
    }
});

router.delete('/messages/:messageId', authToken, async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;
        const message = await Message.findById(messageId);

        if (!message) return res.status(404).json({ message: "Message not found." });
        if (message.sender.toString() !== userId) {
            return res.status(403).json({ message: "You can only delete your own messages." });
        }
        
        const chatId = message.chat.toString();
        
        await Message.findByIdAndDelete(messageId);

        const chat = await Chat.findById(chatId);
        let newLatestMessage = null; 

        if (chat.latestMessage && chat.latestMessage.toString() === messageId) {
            newLatestMessage = await Message.findOne({ chat: chatId })
                .sort({ createdAt: -1 }) 
                .populate("sender", "name"); 

            chat.latestMessage = newLatestMessage ? newLatestMessage._id : null;
            await chat.save();
        }

        const io = req.app.get('socketio');
        io.to(chatId).emit('message_deleted', { 
            messageId: messageId, 
            chatId: chatId,
            newLatestMessage: newLatestMessage
        });

        res.json({ message: "Message deleted successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error." });
    }
});

router.post('/messages/image', authToken, upload.single('imageFile'), async (req, res) => {
        const { chatId } = req.body;
        if (!req.file) {
            return res.status(400).json({ message: 'No image file uploaded.' });
        }
        if (!chatId) {
            return res.status(400).json({ message: 'Chat ID is required.' });
        }
        try {
            const newMessage = new Message({
                sender: req.user.id,
                chat: chatId,
                messageType: 'image',
                content: req.file.path, 
            });

            await newMessage.save();
            await newMessage.populate("sender", "name profilePic email")
            await newMessage.populate({
                path: 'chat',
                populate: {
                    path: 'participants',
                    select: 'name profilePic email' 
                }
            })
            await Chat.findByIdAndUpdate(chatId, { latestMessage: newMessage });
            
            const io = req.app.get('socketio');
            io.to(chatId).emit('message_received', newMessage);

            res.status(201).json(newMessage);

        } catch (err) {
            console.error(err.message);
            res.status(500).json({ error: "Server error while sending image" });
        }
    }
);

module.exports = router