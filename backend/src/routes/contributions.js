const r = require("express").Router();
const { Campaign, Contribution, Notification } = require("../models");
const { auth, asyncRoute } = require("../middleware");
r.post(
  "/",
  auth,
  asyncRoute(async (req, res) => {
    const amount = Number(req.body.amount),
      c = await Campaign.findById(req.body.campaignId);
    if (!c || !["Approved", "Available for Funding"].includes(c.status))
      return res
        .status(409)
        .json({ message: "Campaign is not accepting contributions." });
    if (!Number.isFinite(amount) || amount < 50 || amount > 1000000)
      return res
        .status(400)
        .json({ message: "Amount must be between ₹50 and ₹10,00,000." });
    if (process.env.DEMO_CHECKOUT === "false")
      return res
        .status(501)
        .json({
          message: "Real payment gateway not configured. No money charged.",
        });
    const item = await Contribution.create({
      user: req.user._id,
      campaign: c._id,
      amount,
      estimatedReach: Math.round(amount * 2.5),
      status: "completed",
      paymentProvider: "demo",
    });
    c.raisedAmount += amount;
    c.contributionCount++;
    if (c.status === "Approved") c.status = "Available for Funding";
    await c.save();
    await Notification.create({
      user: req.user._id,
      title: "Demo contribution recorded",
      message: `₹${amount} was recorded for ${c.title}. No real payment was taken.`,
      kind: "contribution",
      campaign: c._id,
    });
    await Notification.create({
      user: c.creator,
      title: "Campaign supported",
      message: `A community member contributed ₹${amount} to ${c.title}.`,
      kind: "contribution",
      campaign: c._id,
    });
    res
      .status(201)
      .json({
        contribution: item,
        campaign: c,
        demo: true,
        message: "Demo only: no real payment was taken.",
      });
  }),
);
r.get(
  "/mine",
  auth,
  asyncRoute(async (req, res) =>
    res.json({
      contributions: await Contribution.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .populate("campaign", "title imageUrl status"),
    }),
  ),
);
module.exports = r;
