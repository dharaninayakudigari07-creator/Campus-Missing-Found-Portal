const adminMiddleware = (req, res, next) => {

    if (!req.user) {
        return res.status(401).json({
            message: "Authentication required",
        });
    }

    console.log("CHECKING ADMIN ROLE:", req.user.role);

    if (String(req.user.role).toUpperCase() !== "ADMIN") {
        return res.status(403).json({
            message: "Admin access required",
        });
    }

    next();
};

module.exports = adminMiddleware;