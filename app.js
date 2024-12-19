const express = require("express");
const app= express();
require("dotenv").config();
const connectDB = require("./config/mongodb");
const indexRoutes = require("./routes/index.route");
const userRoutes = require("./routes/user.routes");

connectDB();

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use("/", indexRoutes);
app.use("/user", userRoutes);

app.listen(3000, () => {
    console.log("server is running on port 3000");
})