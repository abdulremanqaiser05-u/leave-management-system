const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  console.log("\n================ AUTH CHECK ================");
  console.log("Authorization header:", authHeader);

  if (!authHeader) {
    console.log("❌ NO AUTHORIZATION HEADER");

    return res.status(401).json({
      message: "Access denied. No authorization header.",
    });
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    console.log("❌ INVALID AUTHORIZATION FORMAT");

    return res.status(401).json({
      message: "Invalid authorization format.",
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    console.log("✅ JWT DECODED:");
    console.log(decoded);

    if (!decoded || !decoded.userId) {
      console.log("❌ USER ID MISSING FROM TOKEN");

      return res.status(403).json({
        message: "Invalid token. User ID is missing.",
      });
    }

    req.user = {
      userId: Number(decoded.userId),
      role: decoded.role,
    };

    console.log("✅ AUTHENTICATED USER ID:", req.user.userId);
    console.log("✅ AUTHENTICATED ROLE:", req.user.role);
    console.log("============================================\n");

    next();
  } catch (error) {
    console.error("❌ JWT verification error:", error);

    return res.status(403).json({
      message: "Invalid or expired token.",
    });
  }
}

module.exports = authenticateToken;