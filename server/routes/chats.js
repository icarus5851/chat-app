const express = require("express");
const router = express.Router();
const authToken = require("../middleware/authMiddleware");
const Chat = require("../models/Chat");


router.post("/chat", authToken, async (req, res) => {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }
        
        try{
            const existingChat = await Chat.findOne({participants: { $all: [req.user.id, userId] }})
            if(existingChat){
            return res.status(200).json(existingChat);
            }

            const newChat = new Chat({participants: [req.user.id, userId]});
            await newChat.save();

            await newChat.populate("participants", "-password");
            res.status(201).json(newChat);
        }
        catch (err) {
            console.error(err.message);
            res.status(500).json({ error: "Server error" });
        }
    })


router.get('/chat',authToken,async (req,res)=>{
        try{
            const chats = await Chat.find({ participants: req.user.id })
                .populate("participants", "-password")
                .populate("latestMessage")
                .sort({updatedAt: -1})

            res.status(201).json(chats)
        }
        catch (err) {
            console.error(err.message);
            res.status(500).json({ error: "Server error" });
        }
    })




module.exports = router