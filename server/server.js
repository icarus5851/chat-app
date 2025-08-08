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


const app = express();
const server = http.createServer(app);

const io = new Server(server ,{ 
    cors:{
        origin:"http://localhost:5173",
        methods:["GET", "POST"]
    }
})

app.set('socketio', io);

io.on('connection',socket=>{
    console.log(`user connected: ${socket.id}`)

    socket.on('join_chat',(chatId)=>{
        socket.join(chatId);
        console.log(`User ${socket.id} joined room: ${chatId}`);
    })

    socket.on('disconnect',()=>{
        console.log('User Disconnected', socket.id);
    })
})

app.use(cors({origin: "http://localhost:5173",credentials: true,}));
app.use(express.json()); 
app.use(cookieParser())
app.use(authRoutes)
app.use(userRoutes)
app.use(chatRoutes)
app.use(messageRoutes);


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