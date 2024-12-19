const mongoose = require("mongoose");

const connectDB =  () => {
    try {
        mongoose.connect(process.env.MONGO_URL).then(() => {
            console.log("connected to mongodb");
        }).catch((err) => {
            console.log(err);
        })
    } catch (err) {
        console.log(err);
    }
}

module.exports = connectDB;