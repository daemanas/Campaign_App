// backend/src/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, Campaign, Notification, Contribution } = require('./models');

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/amplify_campaign_reach';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB for seeding');

  // Find or create Daem Anas
  let user = await User.findOne({ email: 'daemanas12@gmail.com' });
  if (!user) {
    const passwordHash = await bcrypt.hash('password123', 12);
    user = await User.create({
      name: 'Daem Anas',
      email: 'daemanas12@gmail.com',
      passwordHash,
      bio: 'Student | Social Impact | Open to meaningful collaborations',
      role: 'user',
    });
    console.log('Created user Daem Anas');
  }

  // Create real campaigns
  const campaignData = [
    {
      title: 'Clean Rivers, Brighter Tomorrow',
      category: 'Environment',
      summary: 'Help communities protect local waterways and promote sustainable water management.',
      story: 'A community-driven campaign to clean local rivers, reduce plastic waste, and protect aquatic wildlife. Our goal is to organize river cleanups, spread awareness, and build sustainable waste management solutions for a cleaner and healthier tomorrow.',
      goalAmount: 100000,
      raisedAmount: 48500,
      status: 'Available for Funding',
      contributionCount: 342,
      savedCount: 156,
      targetAudience: 'Local Waterways Community',
      estimatedReach: 250000,
      creator: user._id,
    },
    {
      title: 'Digital Classrooms for Rural Schools',
      category: 'Education',
      summary: 'Provide digital learning resources to underprivileged children.',
      story: 'Bridging the digital divide in rural education. We equip community schools with interactive tablets, solar power systems, and offline learning materials so every child has equal access to quality modern learning.',
      goalAmount: 150000,
      raisedAmount: 72300,
      status: 'Available for Funding',
      contributionCount: 1200,
      savedCount: 420,
      targetAudience: 'Rural Elementary Students',
      estimatedReach: 375000,
      creator: user._id,
    },
    {
      title: 'Help Stray Animals',
      category: 'Animals',
      summary: 'Support food, shelter and medical care for stray animals in your city.',
      story: 'Providing street animals with daily nutritious meals, emergency medical aid, vaccination drives, and safe foster shelters across the city.',
      goalAmount: 50000,
      raisedAmount: 15400,
      status: 'Available for Funding',
      contributionCount: 502,
      savedCount: 210,
      targetAudience: 'Animal Welfare Community',
      estimatedReach: 125000,
      creator: user._id,
    },
    {
      title: 'Mobile Health Camps',
      category: 'Health',
      summary: 'Bring essential healthcare services to underserved communities.',
      story: 'Delivering primary medical consultations, diagnostic testing, and vital medicines directly to remote communities via mobile clinic vans.',
      goalAmount: 75000,
      raisedAmount: 28700,
      status: 'Available for Funding',
      contributionCount: 892,
      savedCount: 330,
      targetAudience: 'Underserved Communities',
      estimatedReach: 187500,
      creator: user._id,
    },
  ];

  const createdCampaigns = [];
  for (const c of campaignData) {
    let existing = await Campaign.findOne({ title: c.title });
    if (!existing) {
      existing = await Campaign.create(c);
      console.log('Created campaign:', existing.title);
    }
    createdCampaigns.push(existing);
  }

  // Set user savedCampaigns
  user.savedCampaigns = createdCampaigns.map(c => c._id);
  await user.save();
  console.log('Updated user saved campaigns');

  // Seed real notifications if none exist
  const notifCount = await Notification.countDocuments({ user: user._id });
  if (notifCount === 0) {
    await Notification.create([
      {
        user: user._id,
        title: 'Priya Sharma supported your campaign',
        message: 'Contributed ₹ 2,500 towards Clean Rivers, Brighter Tomorrow',
        kind: 'support',
        campaign: createdCampaigns[0]._id,
      },
      {
        user: user._id,
        title: 'Rahul Das liked your campaign',
        message: 'Liked Clean Rivers, Brighter Tomorrow',
        kind: 'like',
        campaign: createdCampaigns[0]._id,
      },
      {
        user: user._id,
        title: 'New comment on Clean Rivers Campaign',
        message: '"This is a great initiative! Keep going!"',
        kind: 'comment',
        campaign: createdCampaigns[0]._id,
      },
      {
        user: user._id,
        title: 'Your campaign reached 500 views',
        message: 'Clean Rivers, Brighter Tomorrow passed 500 views today.',
        kind: 'milestone',
        campaign: createdCampaigns[0]._id,
      },
      {
        user: user._id,
        title: 'Aman Verma started following you',
        message: 'Aman Verma is now following your social impact journey.',
        kind: 'follow',
      },
      {
        user: user._id,
        title: 'New update on Books for Rural Kids',
        message: '"We\'ve reached 75% of our goal! Thank you all..."',
        kind: 'update',
        campaign: createdCampaigns[1]._id,
      },
      {
        user: user._id,
        title: 'Sneha Khan supported your campaign',
        message: 'Contributed ₹ 1,000 towards Help Stray Animals',
        kind: 'support',
        campaign: createdCampaigns[2]._id,
      },
    ]);
    console.log('Created notifications');
  }

  // Create demo contribution
  const contribCount = await Contribution.countDocuments({ user: user._id });
  if (contribCount === 0) {
    await Contribution.create({
      user: user._id,
      campaign: createdCampaigns[0]._id,
      amount: 2500,
      estimatedReach: 6250,
      status: 'completed',
    });
    console.log('Created contribution');
  }

  console.log('Seeding complete!');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
