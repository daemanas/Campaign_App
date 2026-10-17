// Demo dataset. Everything here is clearly marked `source: 'demo'` (or belongs
// to a seeded demo account) so it never blends into records the user creates.
import { artRef } from '../assets/images';

const DAY = 86400000;
const HOUR = 3600000;
const MIN = 60000;

export const GUEST_ID = 'guest';

export const CATEGORIES = [
  { id: 'Environment', label: 'Environment', icon: 'leaf' },
  { id: 'Education', label: 'Education', icon: 'school' },
  { id: 'Health', label: 'Health', icon: 'heart-pulse' },
  { id: 'Animals', label: 'Animals', icon: 'paw' },
  { id: 'Community', label: 'Community', icon: 'account-group' },
];

export const DURATIONS = [
  { id: 7, label: '1 week' },
  { id: 14, label: '2 weeks' },
  { id: 30, label: '1 month' },
  { id: 45, label: '45 days' },
  { id: 60, label: '2 months' },
  { id: 90, label: '3 months' },
];

export const DEMO_ORGANIZERS = [
  {
    id: 'og_greenearth',
    name: 'Green Earth Foundation',
    handle: '@greenearth',
    initials: 'GE',
    verified: true,
    tagline: 'Verified organizer',
    avatar: null,
    color: '#12855A',
    followers: 4820,
  },
  {
    id: 'og_brightfutures',
    name: 'Bright Futures Trust',
    handle: '@brightfutures',
    initials: 'BF',
    verified: true,
    tagline: 'Verified organizer',
    color: '#5A3EF0',
    followers: 3110,
  },
  {
    id: 'og_paws',
    name: 'Paws & Care Collective',
    handle: '@pawsandcare',
    initials: 'PC',
    verified: false,
    tagline: 'Community rescue group',
    color: '#D9622B',
    followers: 1290,
  },
  {
    id: 'og_healthreach',
    name: 'HealthReach',
    handle: '@healthreach',
    initials: 'HR',
    verified: true,
    tagline: 'Verified organizer',
    color: '#E03B57',
    followers: 2640,
  },
  {
    id: 'og_communitytable',
    name: 'Community Table',
    handle: '@communitytable',
    initials: 'CT',
    verified: false,
    tagline: 'Neighbourhood mutual aid',
    color: '#2563C4',
    followers: 940,
  },
  {
    id: 'og_solarall',
    name: 'Solar For All',
    handle: '@solarforall',
    initials: 'SA',
    verified: true,
    tagline: 'Verified organizer',
    color: '#F5A524',
    followers: 1780,
  },
];

export const DEMO_SUPPORTERS = [
  { id: 'sp_priya', name: 'Priya Sharma', avatar: artRef('avatarPriya') },
  { id: 'sp_rahul', name: 'Rahul Das', avatar: artRef('avatarRahul') },
  { id: 'sp_sneha', name: 'Sneha Khan', avatar: artRef('avatarSneha') },
  { id: 'sp_aman', name: 'Aman Verma', avatar: artRef('avatarAman') },
];

const campaign = (c) => c;

export const DEMO_CAMPAIGNS = [
  campaign({
    id: 'cmp_rivers',
    title: 'Clean Rivers, Brighter Tomorrow',
    summary: 'Help communities protect local waterways and promote sustainable water management.',
    description:
      'A community-driven campaign to clean local rivers, reduce plastic waste, and protect aquatic wildlife. Our goal is to organize river cleanups, spread awareness, and build sustainable waste management solutions for a cleaner and healthier tomorrow.\n\nFunds cover cleanup kits, gloves and sacks, a shredder for collected plastic, transport to the recycling partner, and awareness sessions in five riverside schools.',
    category: 'Environment',
    organizerId: 'og_greenearth',
    baseGoal: 100000,
    baseRaised: 48500,
    baseSupporters: 342,
    views: 1240,
    days: 12,
    location: 'Pune, Maharashtra',
    cover: artRef('cleanRivers'),
    gallery: [artRef('cleanRivers'), artRef('treePlanting'), artRef('foodDrive')],
    tags: ['river cleanup', 'plastic free', 'water'],
    updates: [
      {
        id: 'up_rivers_1',
        text: 'We reached 48% of the goal! Three more schools joined the awareness programme.',
        days: 1,
      },
      {
        id: 'up_rivers_2',
        text: 'First cleanup drive completed — 640kg of plastic removed from the Mula stretch.',
        days: 6,
      },
    ],
  }),
  campaign({
    id: 'cmp_classrooms',
    title: 'Digital Classrooms for Rural Schools',
    summary: 'Provide digital learning resources to underprivileged children.',
    description:
      'Nine village schools around Nashik still teach without any working display or computer. This campaign equips each classroom with a projector, a solar-backed battery and a offline learning library loaded with NCERT content, plus teacher training so the equipment keeps being used after we leave.',
    category: 'Education',
    organizerId: 'og_brightfutures',
    baseGoal: 150000,
    baseRaised: 72300,
    baseSupporters: 1240,
    views: 3810,
    days: 8,
    location: 'Nashik, Maharashtra',
    cover: artRef('ruralClassroom'),
    gallery: [artRef('ruralClassroom'), artRef('foodDrive')],
    tags: ['digital learning', 'rural schools'],
    updates: [
      { id: 'up_cls_1', text: 'Four schools confirmed, projectors ordered.', days: 2 },
    ],
  }),
  campaign({
    id: 'cmp_strays',
    title: 'Help Stray Animals',
    summary: 'Support food, shelter and medical care for stray animals in your city.',
    description:
      'Our volunteers run two rescue vans and a night shelter for 180 dogs and 40 cattle. Contributions pay for sterilisation surgeries, tick and rabies vaccination, daily feed, and emergency transport to the partner veterinary hospital.',
    category: 'Animals',
    organizerId: 'og_paws',
    baseGoal: 50000,
    baseRaised: 15400,
    baseSupporters: 502,
    views: 1980,
    days: 18,
    location: 'Bengaluru, Karnataka',
    cover: artRef('strayDog'),
    gallery: [artRef('strayDog')],
    tags: ['rescue', 'sterilisation', 'shelter'],
    updates: [
      { id: 'up_strays_1', text: '22 sterilisations done this month thanks to supporters.', days: 3 },
    ],
  }),
  campaign({
    id: 'cmp_health',
    title: 'Mobile Health Camps',
    summary: 'Bring essential healthcare services to underserved communities.',
    description:
      'Two outfitted vans will run weekly camps in tribal blocks of Palghar, offering free consultations, screening for diabetes and hypertension, maternal check-ups, and medicines at no cost. Each camp serves around 250 patients.',
    category: 'Health',
    organizerId: 'og_healthreach',
    baseGoal: 75000,
    baseRaised: 28700,
    baseSupporters: 892,
    views: 2410,
    days: 10,
    location: 'Palghar, Maharashtra',
    cover: artRef('healthCamp'),
    gallery: [artRef('healthCamp'), artRef('foodDrive')],
    tags: ['medical camp', 'screening', 'maternal care'],
    updates: [],
  }),
  campaign({
    id: 'cmp_trees',
    title: 'Plant 5,000 Trees With Village Youth',
    summary: 'Restore a degraded hillside and give 40 young people a green-season income.',
    description:
      'The 14-hectare slope above Keswada lost its tree cover to fires. We will plant native saplings — teak, bamboo, amla, karanj — with a community nursery and a two-year watering contract that pays 40 local youth a stipend.',
    category: 'Environment',
    organizerId: 'og_greenearth',
    baseGoal: 220000,
    baseRaised: 61200,
    baseSupporters: 415,
    views: 1520,
    days: 26,
    location: 'Dangs, Gujarat',
    cover: artRef('treePlanting'),
    gallery: [artRef('treePlanting'), artRef('cleanRivers')],
    tags: ['afforestation', 'livelihood'],
    updates: [
      { id: 'up_trees_1', text: 'N nursery bed prepared, 1,800 saplings booked.', days: 4 },
    ],
  }),
  campaign({
    id: 'cmp_food',
    title: 'Weekly Rations For 300 Families',
    summary: 'A month of dry rations for daily-wage families hit by the lean season.',
    description:
      'Ration kits of rice, dal, oil and salt go to 300 families in the slum clusters near Kurla for four weeks. Kits are packed by a women self-help group we work with, so the money circulates locally.',
    category: 'Community',
    organizerId: 'og_communitytable',
    baseGoal: 90000,
    baseRaised: 43900,
    baseSupporters: 1130,
    views: 3020,
    days: 6,
    location: 'Mumbai, Maharashtra',
    cover: artRef('foodDrive'),
    gallery: [artRef('foodDrive'), artRef('womenTraining')],
    tags: ['food security', 'mutual aid'],
    updates: [],
  }),
  campaign({
    id: 'cmp_skills',
    title: 'Skill Bridge: Tailoring For 60 Women',
    summary: 'Sewing machines, three-month training and a cooperative to sell what they make.',
    description:
      'Sixty women from two wards will train on industrial machines for twelve weeks, with a childcare allowance so mothers can attend. Graduates join a stitching cooperative that already has orders from two local schools.',
    category: 'Education',
    organizerId: 'og_brightfutures',
    baseGoal: 130000,
    baseRaised: 38750,
    baseSupporters: 268,
    views: 1140,
    days: 33,
    location: 'Bhopal, Madhya Pradesh',
    cover: artRef('womenTraining'),
    gallery: [artRef('womenTraining'), artRef('ruralClassroom')],
    tags: ['livelihood', 'women'],
    updates: [],
  }),
  campaign({
    id: 'cmp_solar',
    title: 'Solar Lights For Off-Grid Hamlets',
    summary: 'Rooftop solar and battery backup for a school and 24 homes that never see power.',
    description:
      'Khandari village gets four hours of diesel generator power a day. This campaign funds a 3kW rooftop array with battery storage for the school, the health sub-centre, and street lighting for 24 homes.',
    category: 'Community',
    organizerId: 'og_solarall',
    baseGoal: 180000,
    baseRaised: 122400,
    baseSupporters: 733,
    views: 4260,
    days: 21,
    location: 'Uttarkashi, Uttarakhand',
    cover: artRef('solarVillage'),
    gallery: [artRef('solarVillage')],
    tags: ['clean energy', 'off-grid'],
    updates: [
      { id: 'up_solar_1', text: 'Site survey complete, panels arrive next week.', days: 2 },
    ],
  }),
];

// Campaigns owned by the seeded demo account so its profile is populated.
// These are ordinary user campaigns — a brand new account starts with none.
export const DEMO_USER_CAMPAIGNS = [
  campaign({
    id: 'cmp_books',
    title: 'Books for Rural Kids',
    summary: 'Provide quality education resources to underprivileged children.',
    description:
      'A reading corner in six government school libraries, with 2,400 graded story and reference books, shelves, and a weekend reading circle run by local volunteers.',
    category: 'Education',
    organizerId: 'og_brightfutures',
    ownerId: 'u_daem',
    baseGoal: 150000,
    baseRaised: 69800,
    baseSupporters: 1239,
    views: 2870,
    days: 8,
    location: 'Dhaka, Bangladesh',
    cover: artRef('ruralClassroom'),
    gallery: [artRef('ruralClassroom'), artRef('foodDrive')],
    tags: ['books', 'reading'],
    updates: [
      { id: 'up_books_1', text: "We've reached 75% of our goal! Thank you all.", days: 1 },
    ],
  }),
  campaign({
    id: 'cmp_shelter',
    title: 'Night Shelter For Street Elders',
    summary: 'Warm beds, meals and medicine for 40 elderly people sleeping rough in winter.',
    description:
      'A rented hall near the railway station fitted with 40 cots, blankets, a heater and a night attendant, running December to February, with a visiting doctor twice a week.',
    category: 'Community',
    organizerId: 'og_communitytable',
    ownerId: 'u_daem',
    baseGoal: 110000,
    baseRaised: 33100,
    baseSupporters: 387,
    views: 1490,
    days: 15,
    location: 'Dhaka, Bangladesh',
    cover: artRef('foodDrive'),
    gallery: [artRef('foodDrive')],
    tags: ['shelter', 'winter'],
    updates: [],
  }),
  campaign({
    id: 'cmp_vets',
    title: 'Vaccination Drive For Street Dogs',
    summary: 'Rabies and sterilisation camps across four wards with a follow-up vet visit.',
    description:
      'Four weekend camps covering 900 dogs with rabies vaccine and 300 sterilisations, plus a six-month follow-up visit so the population stays stable.',
    category: 'Animals',
    organizerId: 'og_paws',
    ownerId: 'u_daem',
    baseGoal: 60000,
    baseRaised: 21600,
    baseSupporters: 296,
    views: 980,
    days: 24,
    location: 'Dhaka, Bangladesh',
    cover: artRef('strayDog'),
    gallery: [artRef('strayDog')],
    tags: ['rabies', 'sterilisation'],
    updates: [],
  }),
];

export const DEMO_USERS = [
  {
    id: 'u_daem',
    name: 'Daem Anas',
    username: 'daemanas12',
    email: 'daemanas12@gmail.com',
    // Demo account for the APK submission — plain text by design, see README.
    password: 'amplify123',
    bio: 'Student | Social Impact | Open to meaningful collaborations',
    location: 'Dhaka, Bangladesh',
    avatar: artRef('daemAvatar'),
    banner: artRef('profileBanner'),
    verified: true,
    followers: 1240,
    joinedAt: Date.parse('2024-01-15T09:00:00Z'),
  },
];

export function buildSeed(now = Date.now()) {
  const campaigns = {};
  const push = (c, opts) => {
    campaigns[c.id] = {
      id: c.id,
      title: c.title,
      summary: c.summary,
      description: c.description,
      category: c.category,
      organizerId: c.organizerId,
      ownerId: opts.ownerId || c.ownerId || null,
      source: 'demo',
      status: 'active',
      goalAmount: c.baseGoal,
      baseRaised: c.baseRaised,
      baseSupporters: c.baseSupporters,
      views: c.views,
      location: c.location,
      // Bundled artwork is stored as a stable `asset://<name>` ref, never as
      // the per-build numeric id of a require().
      cover: c.cover || null,
      gallery: c.gallery || (c.cover ? [c.cover] : []),
      tags: c.tags || [],
      endDate: now + c.days * DAY,
      createdAt: now - (30 - c.days) * DAY,
      updates: (c.updates || []).map((u) => ({
        id: u.id,
        text: u.text,
        createdAt: now - u.days * DAY,
      })),
    };
  };
  DEMO_CAMPAIGNS.forEach((c) => push(c, {}));
  DEMO_USER_CAMPAIGNS.forEach((c) => push(c, { ownerId: 'u_daem' }));

  const users = {};
  DEMO_USERS.forEach((u) => {
    users[u.id] = { ...u, source: 'demo' };
  });

  const contributions = {};
  const activity = {};

  const addContribution = (id, userId, campaignId, amount, minutesAgo, name, avatar) => {
    contributions[id] = {
      id,
      userId,
      campaignId,
      amount,
      createdAt: now - minutesAgo * MIN,
      donorName: name,
      donorAvatar: avatar || null,
      demo: true,
    };
  };

  // Past support given by the demo account — feeds its profile statistics.
  addContribution('c_demo_1', 'u_daem', 'cmp_rivers', 2500, 26 * 60, 'Daem Anas');
  addContribution('c_demo_2', 'u_daem', 'cmp_food', 1000, 3 * 24 * 60, 'Daem Anas');
  addContribution('c_demo_3', 'u_daem', 'cmp_strays', 500, 9 * 24 * 60, 'Daem Anas');

  // Incoming support on the demo account's own campaigns.
  addContribution('c_demo_4', 'sp_priya', 'cmp_books', 2500, 2, 'Priya Sharma', artRef('avatarPriya'));
  addContribution('c_demo_5', 'sp_sneha', 'cmp_shelter', 1000, 24 * 60, 'Sneha Khan', artRef('avatarSneha'));

  const acts = [
    {
      id: 'a1',
      actorId: 'u_daem',
      kind: 'support',
      title: 'Priya Sharma supported your campaign',
      body: '₹2,500',
      meta: '2 minutes ago',
      amount: 2500,
      campaignId: 'cmp_books',
      avatar: artRef('avatarPriya'),
      verified: true,
      unread: true,
      minutesAgo: 2,
    },
    {
      id: 'a2',
      actorId: 'u_daem',
      kind: 'like',
      title: 'Rahul Das liked your campaign',
      body: '',
      campaignId: 'cmp_books',
      avatar: artRef('avatarRahul'),
      unread: true,
      minutesAgo: 10,
    },
    {
      id: 'a3',
      actorId: 'u_daem',
      kind: 'comment',
      title: 'New comment on Books for Rural Kids',
      body: '“This is a great initiative! Keep going!”',
      campaignId: 'cmp_books',
      unread: true,
      minutesAgo: 60,
    },
    {
      id: 'a4',
      actorId: 'u_daem',
      kind: 'views',
      title: 'Your campaign reached 500 views',
      body: '',
      campaignId: 'cmp_books',
      minutesAgo: 180,
    },
    {
      id: 'a5',
      actorId: 'u_daem',
      kind: 'follow',
      title: 'Aman Verma started following you',
      body: '',
      avatar: artRef('avatarAman'),
      minutesAgo: 300,
    },
    {
      id: 'a6',
      actorId: 'u_daem',
      kind: 'update',
      title: 'New update on Books for Rural Kids',
      body: '“We’ve reached 75% of our goal! Thank you all…”',
      campaignId: 'cmp_books',
      minutesAgo: 24 * 60,
    },
    {
      id: 'a7',
      actorId: 'u_daem',
      kind: 'support',
      title: 'Sneha Khan supported your campaign',
      body: '₹1,000',
      amount: 1000,
      campaignId: 'cmp_shelter',
      avatar: artRef('avatarSneha'),
      minutesAgo: 26 * 60,
    },
    {
      id: 'a8',
      actorId: 'u_daem',
      kind: 'mention',
      title: 'You were mentioned in a comment',
      body: '“@daemanas12 amazing work!”',
      campaignId: 'cmp_rivers',
      minutesAgo: 2880,
    },
  ];
  acts.forEach((a) => {
    const { actorId, minutesAgo, ...rest } = a;
    activity[a.id] = { ...rest, userId: actorId, createdAt: now - minutesAgo * MIN };
  });

  return {
    v: 1,
    seededAt: now,
    sessionUserId: null,
    users,
    organizers: DEMO_ORGANIZERS.reduce((m, o) => ({ ...m, [o.id]: o }), {}),
    campaigns,
    drafts: {},
    saved: { u_daem: ['cmp_rivers', 'cmp_classrooms', 'cmp_strays', 'cmp_health'] },
    contributions,
    activity,
    following: { u_daem: ['og_greenearth', 'og_brightfutures'] },
    likes: {},
    prefs: {
      notifications: true,
      showDemoTips: true,
    },
  };
}
