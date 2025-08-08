const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');

router.post('/signup',async (req,res)=>{
    const { name, email, password } = req.body;
    try{
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        const salt = 10;
        const hashpw = await bcrypt.hash(password,salt)

        const newuser = new User({name,email,password:hashpw})
        await newuser.save()
        const token = jwt.sign({id:newuser._id , name:newuser.name, email:newuser.email}, process.env.JWT_ACCESS);
        res.cookie('token', token, {httpOnly: true, secure: process.env.NODE_ENV === 'production', 
            sameSite: 'strict',  maxAge: 24 * 60 * 60 * 1000 });
        res.status(201).json({message:"signup successful"});
    }
    catch(err){
        console.log(err.message)
        res.status(500).json({ error: "Something went wrong" });
    }  
})

router.post('/login', async (req,res)=>{
    const { email, password } = req.body;
    try{
        const existingUser = await User.findOne({ email });
        if(!existingUser){
           return res.status(400).json({ message: "You dont have an account" });
        }

        const isCorrect = await bcrypt.compare(password, existingUser.password);
        if(!isCorrect){
           return res.status(400).json({message:"Invalid credentials"})
        }
        const token = jwt.sign({id:existingUser._id , name:existingUser.name, email:existingUser.email}, process.env.JWT_ACCESS);
        res.cookie('token', token, {httpOnly: true, secure: false, 
            sameSite: 'strict',  maxAge: 24 * 60 * 60 * 1000 });
        res.status(201).json({message:"Login successful"});
    }
    catch(err){
        console.log(err.message)
        res.status(500).json({ error: "Something went wrong" });
    }
})

router.post('/logout', (req, res) => {
    res.clearCookie('token');
    return res.json({ message: "Logout successful" });
});

module.exports = router;