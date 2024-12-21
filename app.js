const express = require("express");
const app= express();
require("dotenv").config();
const connectDB = require("./config/mongodb");
const indexRoutes = require("./routes/index.route");
const userRoutes = require("./routes/user.routes");
const adminRoutes = require("./routes/admin.route");
const PORT = process.env.PORT || 4000;

//To initialize a server
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static('public'))

//MongoDb Connection
connectDB();

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use("/", indexRoutes);
app.use("/user", userRoutes);
app.use("/admin", adminRoutes);

const users = {};//To store active users and select the users to chat with
io.on('connection', (socket) => {
console.log('user connected:', socket.id);

socket.on('join', ({ email, role }) => {
    users[socket.id] = { email, role };
    console.log(`${email} joined as ${role}`);
});

socket.on('sendMessage', ({ sender, receiver, message }) => {
    const recipientSocketId = Object.keys(users).find(
        (key) => users[key].username === receiver
    );

    if (recipientSocketId) {
        io.to(recipientSocketId).emit('receivedMessage', {
            sender,
            message,
        });
    } else {
        socket.emit('error', 'User not available.');
    }
});
    //To disconnect the chat
    socket.on('disconnect', () => {
        console.log('User had disconnected:', users[socket.id]?.username);
        delete users[socket.id];
    });
});

app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
})