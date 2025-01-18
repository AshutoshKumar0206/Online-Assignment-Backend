const express = require("express");
const app= express();
require("dotenv").config();
const cors = require("cors");
const connectDB = require("./config/mongodb");
const {cloudinaryConnect } = require("./config/cloudinary");
const fileUpload = require("express-fileupload");
const indexRoutes = require("./routes/index.route");
const userRoutes = require("./routes/user.routes");
const adminRoutes = require("./routes/admin.route");
const assignmentRoutes = require("./routes/assignment.route");
const PORT = process.env.PORT || 8000;
const { createSubject } = require("./controllers/subject.controller");
//To initialize a server
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server, {
    cors:{
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
    }
});

app.use(express.static('public'))
const allowedOrigins = ['http://localhost:3000', 'http://localhost:8500']
app.use((req, res, next) =>{
    const origin = req.headers.origin;
    if(allowedOrigins.includes(origin)){
        res.setHeader('Access-Control-Allow-Origin', origin);
    }   
    res.header(
        'Access-Control-Allow-Methods', 
        'Origin, X-Requested-With, Content-Type, Accept'
    );
    next(); 
})
//MongoDb Connection
connectDB();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors());

app.use(
    fileUpload({
        useTempFiles:true,
		tempFileDir:"/tmp",
        limits: { fileSize: 50 * 1024 * 1024 }
	})
)
app.use("/", indexRoutes);
app.use("/user", userRoutes);
app.use("/admin", adminRoutes);
//cloudinary connection
cloudinaryConnect();
app.use("/assignment", assignmentRoutes);

let users = []; //To store active users and select the users to chat with
// io.on('connection', (socket) => {
//     // console.log('a user connected');
//     //Listen for the 'New Subject' event
//    socket.on('New-Subject', (notification)=>{
//     socket.emit('New-Subject', {message:notification.message});
//    })
  
//     socket.on('disconnect', () => {
//       console.log('user disconnected');
//     });
// });
// io.on('connection', (socket) => {
//     console.log('user connected:', socket.id);
    
// socket.on('join', ({ email, role }) => {
//     users[socket.id] = { email, role };
//     console.log(`${email} joined as ${role}`);
// });


// socket.on('sendMessage', ({ sender, receiver, message }) => {
//     const recipientSocketId = Object.keys(users).find(
//         (key) => users[key].username === receiver
//     );
    
//     if (recipientSocketId) {
//         io.to(recipientSocketId).emit('receivedMessage', {
//             sender,
//             message,
//         });
//     } else {
//         socket.emit('error', 'User not available.');
//     }
// });
// //To disconnect the chat
// socket.on('disconnect', () => {
//     console.log('User had disconnected:', users[socket.id]?.username);
//     delete users[socket.id];
// });
// });

server.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
})