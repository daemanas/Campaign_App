const r = require("express").Router();
const { Notification, Contribution, Campaign } = require("../models");
const { auth, asyncRoute } = require("../middleware");
r.get(
  "/",
  auth,
  asyncRoute(async (req, res) => {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("campaign", "title status");
    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      readAt: null,
    });
    res.json({ notifications, unreadCount });
  }),
);
r.patch(
  "/:id/read",
  auth,
  asyncRoute(async (req, res) => {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { readAt: new Date() },
      { new: true },
    );
    if (!n) return res.status(404).json({ message: "Notification not found." });
    res.json({ notification: n });
  }),
);
r.get(
  "/summary",
  auth,
  asyncRoute(async (req, res) => {
    const [agg, campaignCount] = await Promise.all([
      Contribution.aggregate([
        { $match: { user: req.user._id, status: "completed" } },
        {
          $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } },
        },
      ]),
      Campaign.countDocuments({ creator: req.user._id }),
    ]);
    res.json({
      totalContributed: agg[0]?.total || 0,
      contributionCount: agg[0]?.count || 0,
      campaignCount,
    });
  }),
);
module.exports = r;
