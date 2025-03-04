const express = require("express");
// const app= express();
require("dotenv").config();
const cors = require("cors");
const connectDB = require("./config/mongodb");
const {cloudinaryConnect } = require("./config/cloudinary");
const fileUpload = require("express-fileupload");
const indexRoutes = require("./routes/index.route");
const userRoutes = require("./routes/user.route");
const adminRoutes = require("./routes/admin.route");
const messageRoutes = require("./routes/message.route.js");
const assignmentRoutes = require("./routes/assignment.route");
const subjectRoutes = require("./routes/subject.route.js");
const PORT = process.env.PORT || 4000;
const { createSubject } = require("./controllers/subject.controller");
const { app, server } =require( "./lib/socket.js");
const notificationRoutes = require("./routes/notification.route.js");
//To initialize a server


app.use(express.static('public'))
// const allowedOrigins = ['https://online-assignment-frontend-pi.vercel.app', 'http://localhost:3000', 'http://localhost:8081']
const allowedOrigins = ['https://online-assignment-portal-frontend.vercel.app', 'http://localhost:3000', 'http://localhost:8081']
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
app.use("/message", messageRoutes);
app.use("/admin", adminRoutes);
app.use("/notification", notificationRoutes);
//cloudinary connection
cloudinaryConnect();
app.use("/assignment", assignmentRoutes);
app.use("/subject", subjectRoutes);



server.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
})