const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// Hardcoded Admin Credentials
const adminEmail = "admin@bitmesra.ac.in";
const adminPassword = process.env.ADMIN_PASSWORD; // Store hashed password in .env file

// Admin Login
module.exports.adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    if (email !== adminEmail) {
      return res.status(401).json({
        success: false,
        message: "Invalid email",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, adminPassword);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1h" });

    const options = {
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };

    res.cookie("token", token, options).status(200).json({
      success: true,
      token,
      message: "Admin login successful.",
    });
  } catch (err) {
    next(err);
  }
};

// Admin Logout
module.exports.adminLogout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    res.clearCookie("token");
    res.status(200).json({
      message: "Admin logout successful",
    });
  } catch (err) {
    next(err);
  }
};

// Middleware to Verify Admin
module.exports.verifyAdmin = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Not an admin.",
      });
    }

    next();
  } catch (err) {
    res.status(401).json({
      message: "Invalid or expired token.",
    });
  }
};
