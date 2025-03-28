const express = require("express");
const rateLimit = require("express-rate-limit"); // Import express-rate-limit
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
const feedbackRoutes = require("./routes/feedback.route.js");
//To initialize a server


app.use(express.static('public'))
// const allowedOrigins = ['https://online-assignment-frontend-pi.vercel.app', 'http://localhost:3000', 'http://localhost:8081']
const allowedOrigins = ['https://online-assignment-portal-frontend.vercel.app', 'http://localhost:3000', 'http://localhost:8081', 'http://localhost:5173','https://check-plagarism.vercel.app/']
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
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // allow all domains
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});
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

// Configure rate limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests in particular time period
    message: "Too many requests from this IP, please try again after 15 minutes."
});

// Apply rate limiter to all requests
app.use(limiter);
//cloudinary connection
cloudinaryConnect();

app.use("/",limiter, indexRoutes);
app.use("/user",limiter, userRoutes);
app.use("/message",limiter, messageRoutes);
app.use("/admin",limiter, adminRoutes);
app.use("/notification",limiter, notificationRoutes);
app.use("/assignment",limiter, assignmentRoutes);
app.use("/subject",limiter, subjectRoutes);
app.use('/api/feedback',limiter, feedbackRoutes);



server.listen(PORT, () => {
    // console.log(`server is running on port ${PORT}`);
})
