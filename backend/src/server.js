require("dotenv").config();
const express = require("express"),
  mongoose = require("mongoose"),
  cors = require("cors"),
  helmet = require("helmet"),
  morgan = require("morgan"),
  rateLimit = require("express-rate-limit");
const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(
  "/api/",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.get("/api/v1/health", (req, res) =>
  res.json({ ok: true, service: "Amplify Campaign Reach API" }),
);
app.use("/api/v1/auth", require("./routes/auth"));
app.use("/api/v1/campaigns", require("./routes/campaigns"));
app.use("/api/v1/contributions", require("./routes/contributions"));
app.use("/api/v1/activity", require("./routes/activity"));
app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === 11000)
    return res.status(409).json({ message: "Email already registered" });
  res
    .status(err.status || 500)
    .json({ message: err.message || "Server error" });
});
mongoose
  .connect(
    process.env.MONGODB_URI ||
      "mongodb://127.0.0.1:27017/amplify_campaign_reach",
  )
  .then(() =>
    app.listen(process.env.PORT || 5000, "0.0.0.0", () =>
      console.log("API listening"),
    ),
  )
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
