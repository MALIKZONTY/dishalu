// ─────────────────────────────────────────────────────────────
// Edit this one file when you buy your domain / set up AdSense.
// ─────────────────────────────────────────────────────────────
export const SITE = {
  name: 'Dishalu',
  url: 'https://dishalu.in',
  tagline: 'Govt exam updates, results and tech news that matter',
  logoTagline: 'Updates for a brighter tomorrow',
  description:
    'Latest government job notifications, admit cards and results, plus important tech news explained simply, for students and job seekers in India.',
  author: {
    name: 'Antuparthi Manoha Malik Paul',
    photo: '/images/author.webp', // square photo; original in design/author-original.png
    bio: 'B.Tech graduate and software professional, currently preparing for government exams. I track notifications, results and tech news every day and explain them simply.',
  },
  email: 'malikantuparthi@gmail.com',
  locale: 'en_IN',
  // Paste your AdSense publisher id (ca-pub-XXXXXXXXXXXXXXXX) after you apply.
  // Leave empty until then: no ad code is added to the site.
  adsenseClient: '',
  social: {
    telegram: '',                           // e.g. https://t.me/yourchannel
    instagram: '',
    linkedin: '',
  },
};

// Set enabled: false to hide a category everywhere (menu, footer, sidebar, home,
// its page, and its posts). Flip back to true to bring it back.
export const CATEGORIES = {
  'govt-exams': {
    name: 'Govt Exams',
    enabled: true,
    color: '#c8102e', // label colour on cards
    icon: '/icons/3d/notifications.webp',
    soft: '#fdecee',
    description: 'Latest government job notifications, admit cards, answer keys and results: SSC, UPSC, RRB, banking, state PSC, GATE and PSU.',
  },
  'tech-news': {
    name: 'Tech News',
    enabled: true,
    color: '#1d4ed8',
    icon: '/icons/3d/tech.webp',
    soft: '#e8efff',
    description: 'Important tech news explained simply: launches, AI, policy changes and what they mean for you.',
  },
  careers: {
    name: 'Careers',
    enabled: true,
    color: '#047857',
    icon: '/icons/3d/careers.webp',
    soft: '#e3f6ee',
    description: 'Exam preparation strategy, placement prep, skills and career roadmaps.',
  },
  opportunities: {
    name: 'Hackathons & Internships',
    enabled: true,
    color: '#b45309',
    icon: '/icons/3d/hackathons.webp',
    soft: '#fdf1e2',
    description: 'Hackathons, competitions and internships from Unstop, Devfolio and company programs.',
  },
  'earn-grow': {
    name: 'Earn & Grow',
    enabled: false, // hidden for now, coming later
    color: '#7c3aed',
    icon: '/icons/3d/careers.webp',
    soft: '#f1eafe',
    description: 'Realistic side-income ideas for students: freelancing, paid programs, tutoring and more.',
  },
} as const;

export type CategoryKey = keyof typeof CATEGORIES;

export const ACTIVE_CATEGORIES = Object.fromEntries(
  Object.entries(CATEGORIES).filter(([, c]) => c.enabled),
) as Partial<typeof CATEGORIES>;

export const isActiveCategory = (key: string) => CATEGORIES[key as CategoryKey]?.enabled === true;

// Red strip at the very top of every page. Pin a post here until you change it.
// slug = post file name (without .md). label = short word shown before the title.
// Leave slug empty ('') to show the newest post instead.
export const TOP_STRIP = {
  slug: 'ssc-chsl-2026-last-date',
  label: 'Apply now',
};

// Home page hero.
export const HERO = {
  badge: 'Your guide to opportunities in India',
  title: 'Clear updates.',
  titleAccent: 'Brighter',
  titleRest: 'next steps.',
  text: 'Dishalu tracks government job notifications, admit cards, answer keys and results, and explains the tech news that actually matters, in simple, clear language.',
  note: ['New updates,', 'new opportunities,', 'brighter tomorrows'],
};
