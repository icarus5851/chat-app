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
            .populate("chat");
        res.status(200).json(messages);
    }
    catch(err){
        console.error(err.message)
        res.status(401).send("Cant retrieve messages")
    }
})

router.post('/messages',authToken,async (req,res)=>{
    const {chatId,content} = req.body
    if (!chatId || !content) {
        return res.status(400).json({ message: "Chat ID and content are required." });
    }
    try{
        const newMessage = new Message({sender: req.user.id, content, messageType:"text", chat: chatId,});

        await newMessage.save()
        await newMessage.populate("sender","name email")
        await newMessage.populate("chat")

        await Chat.findByIdAndUpdate(chatId, { latestMessage: newMessage });

        const io = req.app.get('socketio');
        io.to(chatId).emit('message_received', newMessage);

        res.status(201).json(newMessage);
    }
    catch(err){
        console.error(err.message)
        res.status(401).send("Cant retrieve messages")
    }
})


router.delete('/messages/:messageId', authToken, async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: "Message not found." });
        }

        if (message.sender.toString() !== userId) {
            return res.status(403).json({ message: "You can only delete your own messages." });
        }

        await Message.findByIdAndDelete(messageId);

        const io = req.app.get('socketio');
        io.to(message.chat.toString()).emit('message_deleted', { 
            messageId: message._id, 
            chatId: message.chat 
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
            await newMessage.populate("sender", "name email");
            await newMessage.populate("chat");
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