const jwt = require("jsonwebtoken");

function authToken(req,res,next){

    const token = req.cookies.token;

    if (!token) return res.status(401).json({ message: "Token missing" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
}
module.exports = authToken
