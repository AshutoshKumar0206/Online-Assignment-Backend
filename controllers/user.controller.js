const userModel = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const BlacklistModel = require("../models/blacklist.model");

module.exports.signup = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;
        if(!email || !password || !name) {
            return res.status(400).json({
                message: "All fields are required"
            });
        } 

        const isUserAlreadyExist = await userModel.findOne({email});

        if(isUserAlreadyExist) {
            return res.status(400).json({
                message: "User already exists with this email"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new userModel({
            name,
            email,
            password: hashedPassword,
            role
        });

        const token = jwt.sign({_id: user._id}, process.env.JWT_SECRET, {expiresIn: "1h"});
        
        res.status(201).json({
            message: "User created successfully",
            user, 
            token
        });

    } catch (err) {
        next(err);
    }
}


module.exports.signin = async (req, res, next) => {
    try {
        const {email, password} = req.body;

        if(!email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const user = await userModel.findOne({email});

        if(!user) {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if(!isPasswordCorrect) {
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        const token = jwt.sign({_id: user._id}, process.env.JWT_SECRET, {expiresIn: "1h"});
        
        res.json({
            message: "Logged in successfully",
            user,
            token
        });

    } catch (err) {
        next(err);
    }
}

module.exports.logout = async (req, res, next) => {
    try {
        const {token} = req.headers.authorization.split(" ")[1];

        if(!token) {
            return res.status(401).json({
                message: "No token provided"
            });
        }

        const isTokenBlacklisted = await BlacklistModel.findOne({token});

        if(isTokenBlacklisted) {
            return res.status(400).json({
                message: "Token already blacklisted"
            });
        }

        await BlacklistModel.create({token});

    } catch(err) {
        next(err);
    }
}