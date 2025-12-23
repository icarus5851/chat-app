const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    messageType: {
        type: String,
        enum: ['text', 'image'],
        default: 'text'
    },
    content: {
        type: String,
        required: true,
    },
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat",
        required: true,
    },
    status:{
        type: String,
        enum: ['sent', 'read'],
        default:'sent'
    },
    replyTo: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Message", 
        default: null 
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
