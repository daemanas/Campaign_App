const r = require("express").Router(),
  jwt = require("jsonwebtoken");
const { Campaign, Notification } = require("../models");
const { auth, asyncRoute } = require("../middleware");
const publicStatuses = [
  "Approved",
  "Available for Funding",
  "Distribution Preparation",
  "Promoting",
  "Completed",
];
const fields = [
  "title",
  "category",
  "summary",
  "story",
  "imageUrl",
  "goalAmount",
  "targetAudience",
];
r.get(
  "/",
  asyncRoute(async (req, res) => {
    const q = {};
    if (req.query.category && req.query.category !== "All")
      q.category = req.query.category;
    if (req.query.q) q.$text = { $search: String(req.query.q) };
    q.status = { $in: publicStatuses };
    const campaigns = await Campaign.find(q)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(req.query.limit) || 50, 100))
      .populate("creator", "name");
    res.json({ campaigns });
  }),
);
r.get(
  "/mine",
  auth,
  asyncRoute(async (req, res) =>
    res.json({
      campaigns: await Campaign.find({ creator: req.user._id }).sort({
        updatedAt: -1,
      }),
    }),
  ),
);
r.get(
  "/saved/mine",
  auth,
  asyncRoute(async (req, res) => {
    await req.user.populate({
      path: "savedCampaigns",
      populate: { path: "creator", select: "name" },
    });
    res.json({ campaigns: req.user.savedCampaigns });
  }),
);
r.post(
  "/",
  auth,
  asyncRoute(async (req, res) => {
    const p = {};
    fields.forEach((k) => {
      if (req.body[k] !== undefined) p[k] = req.body[k];
    });
    if (
      !p.title ||
      !p.category ||
      !p.summary ||
      !p.story ||
      !Number(p.goalAmount)
    )
      return res
        .status(400)
        .json({
          message: "Title, category, summary, story and goal required.",
        });
    p.goalAmount = Number(p.goalAmount);
    p.estimatedReach = Math.round(p.goalAmount * 2.5);
    res
      .status(201)
      .json({
        campaign: await Campaign.create({
          ...p,
          creator: req.user._id,
          status: "Draft",
        }),
      });
  }),
);
r.get(
  "/:id",
  asyncRoute(async (req, res) => {
    const c = await Campaign.findById(req.params.id).populate(
      "creator",
      "name bio",
    );
    if (!c) return res.status(404).json({ message: "Campaign not found." });
    if (!publicStatuses.includes(c.status)) {
      try {
        const t = (req.headers.authorization || "").replace(/^Bearer /, "");
        const p = jwt.verify(
          t,
          process.env.JWT_SECRET || "development_only_change_me",
        );
        if (String(p.sub) !== String(c.creator._id))
          return res.status(404).json({ message: "Campaign not found." });
      } catch (e) {
        return res.status(404).json({ message: "Campaign not found." });
      }
    }
    res.json({ campaign: c });
  }),
);
r.patch(
  "/:id",
  auth,
  asyncRoute(async (req, res) => {
    const c = await Campaign.findById(req.params.id);
    if (!c) return res.status(404).json({ message: "Campaign not found." });
    if (
      String(c.creator) !== String(req.user._id) &&
      !["admin", "moderator"].includes(req.user.role)
    )
      return res.status(403).json({ message: "Not allowed." });
    if (
      !["Draft", "Changes Requested"].includes(c.status) &&
      !["admin", "moderator"].includes(req.user.role)
    )
      return res
        .status(409)
        .json({ message: "Campaign can no longer be edited." });
    fields.forEach((k) => {
      if (req.body[k] !== undefined) c[k] = req.body[k];
    });
    if (req.body.submit) {
      c.status = "Submitted for Review";
      c.submittedAt = new Date();
    }
    await c.save();
    if (req.body.submit)
      await Notification.create({
        user: req.user._id,
        title: "Campaign submitted",
        message: `${c.title} has been submitted for review.`,
        kind: "campaign",
        campaign: c._id,
      });
    res.json({ campaign: c });
  }),
);
r.post(
  "/:id/save",
  auth,
  asyncRoute(async (req, res) => {
    const c = await Campaign.findById(req.params.id);
    if (!c || !publicStatuses.includes(c.status))
      return res.status(404).json({ message: "Campaign not found." });
    const exists = req.user.savedCampaigns.some(
      (x) => String(x) === String(c._id),
    );
    if (exists) {
      req.user.savedCampaigns.pull(c._id);
      c.savedCount = Math.max(0, c.savedCount - 1);
    } else {
      req.user.savedCampaigns.addToSet(c._id);
      c.savedCount++;
    }
    await Promise.all([req.user.save(), c.save()]);
    res.json({ saved: !exists, savedCount: c.savedCount });
  }),
);
module.exports = r;
