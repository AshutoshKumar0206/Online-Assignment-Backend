const userModel = require("../models/User");
const jwt = require("jsonwebtoken");
const blacklistModel = require("../models/blacklist");

module.exports.isAuthenticated = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1];

        const isBlackListed = await blacklistModel.findOne({token});
        if(isBlackListed) {
            return res.status(401).json({
                message: "Unauthorized"
            })
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded._id);

        if(!user) {
            return res.status(401).json({
                message: "Unauthorized"
            })
        }

        req.user = user;
        next();
    } catch (err) {
        next(err);
    }
}