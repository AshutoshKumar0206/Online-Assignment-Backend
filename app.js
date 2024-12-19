const express = require("express");
const app= express();
require("dotenv").config();
const connectDB = require("./config/mongodb");

connectDB();

app.get("/", (req, res, next) => {
    res.send("Hello bhailog");
});

app.listen(3000, () => {
    console.log("server is running on port 3000");
})