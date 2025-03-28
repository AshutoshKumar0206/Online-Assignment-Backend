const mongoose = require("mongoose");

const connectDB =  () => {
    try {
        mongoose.connect(process.env.MONGO_URL).then(() => {
            // console.log("connected to mongodb");
        }).catch((err) => {
            // console.log(err);
            res.status(500).json({
                success:false,
                message:"Error in connecting to MongoDB"
        })
        })
    } catch (err) {
        // console.log(err);
        res.status(500).json({
			success:false,
			message:"Error in Processing connection request"
	})
    }
}

module.exports = connectDB;