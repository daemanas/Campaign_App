const m = require("mongoose");
const user = new m.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    bio: { type: String, default: "" },
    savedCampaigns: [{ type: m.Schema.Types.ObjectId, ref: "Campaign" }],
    role: {
      type: String,
      enum: ["user", "moderator", "admin"],
      default: "user",
    },
  },
  { timestamps: true },
);
const campaign = new m.Schema(
  {
    creator: {
      type: m.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    category: { type: String, required: true },
    summary: { type: String, required: true, maxlength: 240 },
    story: { type: String, required: true, maxlength: 6000 },
    imageUrl: { type: String, default: "" },
    goalAmount: { type: Number, required: true, min: 100 },
    raisedAmount: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    targetAudience: { type: String, default: "Community" },
    estimatedReach: { type: Number, default: 0 },
    status: { type: String, default: "Draft", index: true },
    reviewNote: { type: String, default: "" },
    savedCount: { type: Number, default: 0 },
    contributionCount: { type: Number, default: 0 },
    submittedAt: Date,
    approvedAt: Date,
  },
  { timestamps: true },
);
campaign.index({ title: "text", summary: "text", story: "text" });
const contribution = new m.Schema(
  {
    user: { type: m.Schema.Types.ObjectId, ref: "User", required: true },
    campaign: {
      type: m.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    amount: { type: Number, required: true, min: 1 },
    estimatedReach: Number,
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    paymentProvider: { type: String, default: "demo" },
  },
  { timestamps: true },
);
const notification = new m.Schema(
  {
    user: {
      type: m.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: String,
    message: String,
    kind: { type: String, default: "system" },
    campaign: { type: m.Schema.Types.ObjectId, ref: "Campaign" },
    readAt: Date,
  },
  { timestamps: true },
);
module.exports = {
  User: m.model("User", user),
  Campaign: m.model("Campaign", campaign),
  Contribution: m.model("Contribution", contribution),
  Notification: m.model("Notification", notification),
};
