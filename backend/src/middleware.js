const jwt = require("jsonwebtoken");
const { User } = require("./models");
async function auth(req, res, next) {
  try {
    const h = req.headers.authorization || "";
    if (!h.startsWith("Bearer "))
      return res.status(401).json({ message: "Please sign in." });
    const p = jwt.verify(
      h.slice(7),
      process.env.JWT_SECRET || "development_only_change_me",
    );
    req.user = await User.findById(p.sub);
    if (!req.user)
      return res.status(401).json({ message: "Account not found." });
    next();
  } catch (e) {
    res.status(401).json({ message: "Session expired. Sign in again." });
  }
}
const asyncRoute = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
module.exports = { auth, asyncRoute };
