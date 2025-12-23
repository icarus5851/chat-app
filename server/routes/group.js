const express = require("express");
const router = express.Router();
const authToken = require("../middleware/authMiddleware");
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const upload = require('../config/cloudinaryConfig');

const notifyParticipants = (io, participants, event, data, currentUserId) => {
    participants.forEach(p => {
        // Send to everyone 
        io.to(p._id.toString()).emit(event, data);
    });
};

// Create Group
router.post("/group", authToken, async (req, res) => {
    const { users, name } = req.body;
    if (!users || !name) return res.status(400).json({ message: "Fill all fields" });
    if (users.length < 2) return res.status(400).json({ message: "Min 2 users required" });

    users.push(req.user.id);

    try {
        const groupChat = await Chat.create({
            groupName: name,
            participants: users,
            isGroup: true,
            groupAdmin: req.user.id,
        });

        const fullChat = await Chat.findOne({ _id: groupChat._id })
            .populate("participants", "-password")
            .populate("groupAdmin", "-password");

        const io = req.app.get('socketio');
        
        fullChat.participants.forEach(user => {
            if (user._id.toString() !== req.user.id) {
                io.to(user._id.toString()).emit('new_chat_added', fullChat);
            }
        });

        res.status(200).json(fullChat);
    } catch (error) { res.status(400).json({ error: error.message }); }
});

//Rename Group
router.put("/group/rename", authToken, async (req, res) => {
    const { chatId, chatName } = req.body;
    try {
        const updatedChat = await Chat.findByIdAndUpdate(chatId, { groupName: chatName }, { new: true })
            .populate("participants", "-password")
            .populate("groupAdmin", "-password");
        
        const io = req.app.get('socketio');
        notifyParticipants(io, updatedChat.participants, 'chat_updated', updatedChat);

        res.json(updatedChat);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

//Group PFP
router.put("/group/pfp", authToken, upload.single("pfp"), async (req, res) => {
    const { chatId } = req.body;
    if (!req.file) return res.status(400).json({ message: "No image" });
    try {
        const updatedChat = await Chat.findByIdAndUpdate(
            chatId, 
            { groupPic: req.file.path }, 
            { new: true }
        ).populate("participants", "-password")
         .populate("groupAdmin", "-password");

        const io = req.app.get('socketio');
        notifyParticipants(io, updatedChat.participants, 'chat_updated', updatedChat);

        res.json(updatedChat);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

//Add User
router.put("/group/add", authToken, async (req, res) => {
    const { chatId, userId } = req.body;
    try {
        const updatedChat = await Chat.findByIdAndUpdate(chatId, { $push: { participants: userId } }, { new: true })
            .populate("participants", "-password")
            .populate("groupAdmin", "-password");

        const io = req.app.get('socketio');
        
        io.to(userId.toString()).emit('new_chat_added', updatedChat);
        
        notifyParticipants(io, updatedChat.participants, 'chat_updated', updatedChat);

        res.json(updatedChat);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// Remove User
router.put("/group/remove", authToken, async (req, res) => {
    const { chatId, userId } = req.body;
    try {
        //Remove user
        const chat = await Chat.findByIdAndUpdate(chatId, { $pull: { participants: userId } }, { new: true })
            .populate("participants", "-password")
            .populate("groupAdmin", "-password");

        if (!chat) return res.status(404).json({ message: "Chat not found" });

        //Delete messages
        await Message.deleteMany({ chat: chatId, sender: userId });

        const io = req.app.get('socketio');
        
        io.to(userId.toString()).emit('removed_from_group', { chatId });

        notifyParticipants(io, chat.participants, 'chat_updated', chat);

        res.json(chat);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

//Leave Group
router.put("/group/leave", authToken, async (req, res) => {
    const { chatId } = req.body;
    try {
        const chat = await Chat.findByIdAndUpdate(chatId, { $pull: { participants: req.user.id } }, { new: true })
            .populate("participants", "-password")
            .populate("groupAdmin", "-password");

        await Message.deleteMany({ chat: chatId, sender: req.user.id });

        const io = req.app.get('socketio');
        
        notifyParticipants(io, chat.participants, 'chat_updated', chat);

        res.json({ message: "Left group", chatId });
    } catch (error) { res.status(400).json({ error: error.message }); }
});

module.exports = router;