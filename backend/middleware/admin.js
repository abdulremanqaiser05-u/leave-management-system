function requireAdmin(req, res, next) {
  if (
    !req.user ||
    String(req.user.role || "").toUpperCase() !== "ADMIN"
  ) {
    return res.status(403).json({
      message:
        "Access denied. Administrator privileges required.",
    });
  }

  next();
}

module.exports = requireAdmin;