const express = require("express")
const http = require('http');
const dotenv = require("dotenv")
const mongoose = require("mongoose")
const cookieParser = require('cookie-parser')
const cors = require("cors");
const { Server } = require("socket.io");

dotenv.config()

const authRoutes = require("./routes/auth")
const userRoutes  = require("./routes/userProfile")
const chatRoutes = require("./routes/chats")
const messageRoutes = require('./routes/messages')
const groupRoutes = require("./routes/group");

const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);

const io = new Server(server ,{ 
    cors:{
        origin:process.env.FRONTEND_URL,
        methods:["GET", "POST"]
    }
})

app.set('socketio', io);

io.on('connection',socket=>{
    console.log(`user connected: ${socket.id}`)
    
    socket.on('join_user_room', (userId) => {
        socket.join(userId);
        console.log(`User ${socket.id} joined their personal room: ${userId}`);
    });

    socket.on('join_chat',(chatId)=>{
        socket.join(chatId);
        console.log(`User ${socket.id} joined room: ${chatId}`);
    })

    socket.on('mark_as_read', async ({ chatId, userId }) => {
        try {
            await Message.updateMany(
                { chat: chatId, sender: { $ne: userId }, status: 'sent' },
                { $set: { status: 'read' } }
            );

            const Chat = require("./models/Chat"); 
            const chat = await Chat.findById(chatId);

            if (chat) {
                chat.participants.forEach(participantId => {
                    io.to(participantId.toString()).emit('messages_read', { chatId, readerId: userId });
                });
            } 
        } catch (err) {
            console.error("Error marking messages as read:", err.message);
        }
    });
    
    socket.on('disconnect',()=>{
        console.log('User Disconnected', socket.id);
    })
})

app.use(cors({origin: process.env.FRONTEND_URL,credentials: true,}));
app.use(express.json()); 
app.use(cookieParser())
app.use(authRoutes)
app.use(userRoutes)
app.use(chatRoutes)
app.use(groupRoutes)
app.use(messageRoutes)


const port = process.env.PORT;
const uri = process.env.MONGO_URI;

mongoose.connect(uri)
    .then(()=>{
        console.log("mongo db connected successfully")
    })
    .catch((err)=>{
        console.log(err.message)
    })

server.listen(port,()=>{
    console.log(`Server is live & Listening to port ${port}. All set, over.`)
})