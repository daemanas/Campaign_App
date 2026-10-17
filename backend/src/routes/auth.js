const r = require("express").Router(),
  bcrypt = require("bcryptjs"),
  jwt = require("jsonwebtoken");
const { User } = require("../models");
const { auth, asyncRoute } = require("../middleware");
const safe = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  bio: u.bio,
  role: u.role,
});
const token = (u) =>
  jwt.sign(
    { sub: String(u._id) },
    process.env.JWT_SECRET || "development_only_change_me",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
r.post(
  "/register",
  asyncRoute(async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res
        .status(400)
        .json({ message: "Name, email and password required." });
    if (password.length < 8)
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters." });
    if (await User.findOne({ email: email.toLowerCase().trim() }))
      return res.status(409).json({ message: "Email already registered." });
    const u = await User.create({
      name,
      email: email.toLowerCase().trim(),
      passwordHash: await bcrypt.hash(password, 12),
    });
    res.status(201).json({ token: token(u), user: safe(u) });
  }),
);
r.post(
  "/login",
  asyncRoute(async (req, res) => {
    const u = await User.findOne({
      email: String(req.body.email || "")
        .toLowerCase()
        .trim(),
    }).select("+passwordHash");
    if (
      !u ||
      !(await bcrypt.compare(String(req.body.password || ""), u.passwordHash))
    )
      return res.status(401).json({ message: "Email or password incorrect." });
    res.json({ token: token(u), user: safe(u) });
  }),
);
r.get("/me", auth, (req, res) => res.json({ user: safe(req.user) }));
r.patch(
  "/me",
  auth,
  asyncRoute(async (req, res) => {
    if (typeof req.body.name === "string")
      req.user.name = req.body.name.slice(0, 80);
    if (typeof req.body.bio === "string")
      req.user.bio = req.body.bio.slice(0, 280);
    await req.user.save();
    res.json({ user: safe(req.user) });
  }),
);
module.exports = r;
