const express = require("express");
const router = express.Router();
const authToken = require("../middleware/authMiddleware");
const bcrypt = require("bcrypt")
const User = require("../models/User");
const upload = require('../config/cloudinaryConfig');

router
    .get('/profile', authToken, async (req,res)=>{
        const user = await User.findById(req.user.id).select('-password')
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "Protected route accessed", user: user });
    })
    .put('/profile',authToken,async (req,res)=>{
        const userId = req.user.id
        const { name, email, password } = req.body;
        try{
            updates={}
            if(name) updates.name = name
            if(email) updates.email = email
            if(password){
                const salt = 10;
                updates.password = await bcrypt.hash(password,salt)
            }

            const updatedUser = await User.findByIdAndUpdate(userId,{ $set: updates },{ new: true, select: "-password" });

            if (!updatedUser) return res.status(404).json({ message: "User not found" });     
            res.json({ message: "User updated", user: updatedUser }); 
        }
        catch (err) {
            console.error(err.message);
            res.status(500).json({ error: "Server error" });
        }
    })
    .delete('/profile', authToken, async (req,res)=>{
        try {
            await User.findByIdAndDelete(req.user.id);
            res.clearCookie('token'); 
            return res.json({ message: "User deleted successfully" });
        } 
        catch (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed to delete user" });
        }
    })

router.get("/users/search", authToken, async (req, res) => {
    const query = req.query.query || "";

    try {
        const users = await User.find({
            $or: [
                { name: { $regex: query, $options: "i" } },
                { email: { $regex: query, $options: "i" } },
            ],
            _id: { $ne: req.user.id },
        }).select("-password");

        res.json(users);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Server Error");
    }
});

router.post('/profile/pfp', authToken , upload.single('pfp'), async (req,res)=>{
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }
        const imageUrl = req.file.path;
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { profilePic: imageUrl },
            { new: true, select: '-password' } 
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({
            message: 'Avatar updated successfully.',
            user: updatedUser,
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error while updating avatar.' });
    }
});

router.delete('/profile/pfp', authToken, async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { $unset: { profilePic: "" } }, 
            { new: true, select: '-password' }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.json({
            message: 'Avatar removed successfully.',
            user: updatedUser,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error while removing avatar.' });
    }
});

module.exports = router;