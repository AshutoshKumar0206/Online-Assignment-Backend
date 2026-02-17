const express = require("express");
const rateLimit = require("express-rate-limit");
require("dotenv").config();
const cors = require("cors");
const fileUpload = require("express-fileupload");

// Database & Config
const connectDB = require("./config/mongodb");
const { cloudinaryConnect } = require("./config/cloudinary");

// Routes
const indexRoutes = require("./routes/index.route");
const userRoutes = require("./routes/user.route");
const adminRoutes = require("./routes/admin.route");
const messageRoutes = require("./routes/message.route.js");
const assignmentRoutes = require("./routes/assignment.route");
const subjectRoutes = require("./routes/subject.route.js");
const notificationRoutes = require("./routes/notification.route.js");
const feedbackRoutes = require("./routes/feedback.route.js");

// Socket & App Initialization
const { app, server } = require("./lib/socket.js");
const PORT = process.env.PORT || 4000;

// ---------------------------------------------------------
// 1. CORS Configuration (Allows ALL sites)
// ---------------------------------------------------------
app.use(cors({
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"]
}));

// ---------------------------------------------------------
// 2. Middleware setup
// ---------------------------------------------------------
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: "/tmp",
        limits: { fileSize: 50 * 1024 * 1024 }
    })
);

// Configure rate limiter
app.set('trust proxy', 1);
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 requests per minute
    message: "Too many requests from this IP, please try again after a minute."
});
app.use(limiter);

// ---------------------------------------------------------
// 3. Database Connection
// ---------------------------------------------------------
connectDB();
cloudinaryConnect(); // Uncomment if needed

// ---------------------------------------------------------
// 4. Routes
// ---------------------------------------------------------
app.use("/", indexRoutes);
app.use("/user", userRoutes);
app.use("/message", messageRoutes);
app.use("/admin", adminRoutes);
app.use("/notification", notificationRoutes);
app.use("/assignment", assignmentRoutes);
app.use("/subject", subjectRoutes);
app.use('/api/feedback', feedbackRoutes);

// ---------------------------------------------------------
// 5. Start Server
// ---------------------------------------------------------
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
