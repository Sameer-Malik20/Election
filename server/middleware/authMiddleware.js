import jwt from "jsonwebtoken";

const authenticate = (roles = []) => {
  return async (req, res, next) => {
    try {
      let token = null;

      // Check all possible token locations
      const authHeader = req.headers["authorization"];
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      } else if (req.cookies?.refreshToken) {
        token = req.cookies.refreshToken;
      } else if (req.body?.accessToken) {
        token = req.body.accessToken;
      } else if (req.query?.accessToken) {
        token = req.query.accessToken;
      }

      if (!token) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      if (roles.length && !roles.includes(decoded.role)) {
        return res
          .status(403)
          .json({ message: "Forbidden - Insufficient permissions" });
      }

      req.user = decoded;
      req.userId = decoded.id || decoded._id;

      next();
    } catch (error) {
      console.error("Authentication error:", error);

      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired" });
      }

      return res.status(403).json({
        message: "Invalid token",
        error: error.message,
      });
    }
  };
};

export default authenticate;
