import { Event, Speaker, ScheduleDay, Sponsor, Prize, FAQ, Ticket, Registration } from "@/types";

// ============================================
// Event Data
// ============================================
export const eventData: Event = {
  id: "ai-hackathon-2026",
  name: "AI Innovation Hackathon 2026",
  tagline: "Build the Future with AI",
  description: "Join 500+ developers, designers, and innovators for 48 hours of coding, creativity, and collaboration. Build AI-powered solutions that make a difference!",
  type: "hackathon",
  dates: {
    start: "2026-03-15T09:00:00",
    end: "2026-03-17T18:00:00",
  },
  registrationDeadline: "2026-03-10T23:59:59",
  venue: {
    name: "Tech Innovation Center",
    address: "456 Innovation Boulevard",
    city: "Tech City",
    country: "USA",
    coordinates: {
      lat: 37.7849,
      lng: -122.4094,
    },
    mapUrl: "https://maps.example.com/venue",
    directions: "Take the Metro to Central Station, then walk 5 minutes north on Main Street. The venue is on the left side, across from the plaza.",
    facilities: ["Free WiFi", "24/7 Access", "Rest Areas", "Snack Bar", "Charging Stations", "Quiet Room"],
  },
  tickets: [
    {
      id: "ticket-general",
      type: "general",
      name: "General Admission",
      price: 0,
      currency: "USD",
      perks: ["Event Access", "Swag Bag", "Meals & Snacks", "WiFi Access", "Participation Certificate"],
      available: true,
      spotsRemaining: 89,
    },
    {
      id: "ticket-student",
      type: "student",
      name: "Student Pass",
      price: 0,
      currency: "USD",
      perks: ["Event Access", "Swag Bag", "Meals & Snacks", "Student Lounge", "Career Fair Access"],
      available: true,
      spotsRemaining: 45,
    },
    {
      id: "ticket-vip",
      type: "vip",
      name: "VIP Experience",
      price: 149,
      currency: "USD",
      perks: ["Priority Seating", "1-on-1 Mentorship", "Exclusive Workshops", "VIP Lounge", "Extra Swag", "Networking Dinner"],
      available: true,
      spotsRemaining: 12,
    },
    {
      id: "ticket-early",
      type: "early-bird",
      name: "Early Bird Special",
      price: 0,
      currency: "USD",
      perks: ["Event Access", "Swag Bag", "Meals & Snacks", "Early Check-in", "Bonus Swag"],
      available: false,
      spotsRemaining: 0,
    },
  ],
  spotsTotal: 500,
  spotsRemaining: 146,
  isRegistrationOpen: true,
  heroImage: "/images/hero-bg.jpg",
  theme: {
    primaryColor: "#6366f1",
    secondaryColor: "#8b5cf6",
  },
};

// ============================================
// Speakers Data
// ============================================
export const speakersData: Speaker[] = [
  {
    id: "speaker-1",
    name: "Dr. Jane Smith",
    role: "AI Research Lead",
    company: "AI Research Labs",
    bio: "Dr. Jane Smith leads groundbreaking research in natural language processing and large language models. She has published over 50 papers and holds 12 patents in AI.",
    expertise: ["Machine Learning", "NLP", "Large Language Models"],
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=jane&backgroundColor=6366f1",
    social: {
      twitter: "https://twitter.com/example",
      linkedin: "https://linkedin.com/in/example",
      github: "https://github.com/example",
    },
    isFeatured: true,
  },
  {
    id: "speaker-2",
    name: "Michael Chen",
    role: "VP of Engineering",
    company: "TechCorp AI",
    bio: "Michael oversees the development of AI models and API infrastructure. Previously led AI initiatives at several Fortune 500 companies.",
    expertise: ["AI Infrastructure", "Scalable Systems", "API Design"],
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=michael&backgroundColor=8b5cf6",
    social: {
      twitter: "https://twitter.com/example",
      linkedin: "https://linkedin.com/in/example",
    },
    isFeatured: true,
  },
  {
    id: "speaker-3",
    name: "Sarah Williams",
    role: "Founder & CEO",
    company: "Ethical AI Foundation",
    bio: "Sarah is a pioneer in responsible AI development. Her organization has helped 100+ companies implement ethical AI practices.",
    expertise: ["AI Ethics", "Responsible AI", "Policy"],
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah&backgroundColor=ec4899",
    social: {
      twitter: "https://twitter.com/example",
      website: "https://example.com",
    },
    isFeatured: true,
  },
  {
    id: "speaker-4",
    name: "David Lee",
    role: "Principal Engineer",
    company: "Compute Systems Inc.",
    bio: "David specializes in GPU computing and has architected multiple generations of libraries for AI acceleration.",
    expertise: ["GPU Computing", "Performance Optimization", "Systems Architecture"],
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=david&backgroundColor=14b8a6",
    social: {
      github: "https://github.com/example",
      linkedin: "https://linkedin.com/in/example",
    },
  },
  {
    id: "speaker-5",
    name: "Priya Patel",
    role: "ML Platform Lead",
    company: "Enterprise Tech",
    bio: "Priya leads the ML platform team, building tools used by thousands of engineers to train and deploy AI models.",
    expertise: ["MLOps", "Model Training", "Distributed Systems"],
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=priya&backgroundColor=f59e0b",
    social: {
      twitter: "https://twitter.com/example",
      linkedin: "https://linkedin.com/in/example",
    },
  },
  {
    id: "speaker-6",
    name: "Alex Rivera",
    role: "Startup Advisor",
    company: "Venture Partners",
    bio: "Alex has mentored 50+ AI startups, with 15 reaching unicorn status. Expert in AI product-market fit.",
    expertise: ["Startups", "Product Strategy", "Fundraising"],
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex&backgroundColor=22c55e",
    social: {
      twitter: "https://twitter.com/example",
      website: "https://example.com",
    },
  },
];

// ============================================
// Schedule Data
// ============================================
export const scheduleData: ScheduleDay[] = [
  {
    date: "2026-03-15",
    dayLabel: "Day 1 - Kickoff",
    sessions: [
      {
        id: "s1-1",
        title: "Registration & Breakfast",
        type: "break",
        startTime: "08:00",
        endTime: "09:00",
        location: "Main Lobby",
        description: "Check in, grab your badge, and enjoy breakfast while networking with fellow participants.",
      },
      {
        id: "s1-2",
        title: "Opening Ceremony",
        type: "ceremony",
        startTime: "09:00",
        endTime: "10:00",
        location: "Main Hall",
        description: "Welcome address, event rules, and theme announcement.",
      },
      {
        id: "s1-3",
        title: "Keynote: The Future of AI",
        type: "keynote",
        startTime: "10:00",
        endTime: "11:00",
        location: "Main Hall",
        speakerId: "speaker-1",
        speakerName: "Dr. Jane Smith",
        description: "Exploring the next frontiers of AI and what it means for developers.",
      },
      {
        id: "s1-4",
        title: "Team Formation & Ideation",
        type: "hackathon",
        startTime: "11:00",
        endTime: "12:30",
        location: "All Floors",
        description: "Find your team, brainstorm ideas, and start planning your project.",
      },
      {
        id: "s1-5",
        title: "Lunch & Networking",
        type: "break",
        startTime: "12:30",
        endTime: "13:30",
        location: "Cafeteria",
      },
      {
        id: "s1-6",
        title: "Workshop: Building with LLMs",
        type: "workshop",
        startTime: "14:00",
        endTime: "15:30",
        location: "Workshop Room A",
        speakerId: "speaker-2",
        speakerName: "Michael Chen",
        track: "Technical",
        description: "Hands-on session on integrating large language models into your applications.",
      },
      {
        id: "s1-7",
        title: "Panel: AI Ethics in Practice",
        type: "panel",
        startTime: "14:00",
        endTime: "15:30",
        location: "Workshop Room B",
        speakerId: "speaker-3",
        speakerName: "Sarah Williams",
        track: "Ethics",
        description: "Discussion on implementing responsible AI practices in hackathon projects.",
      },
      {
        id: "s1-8",
        title: "Hacking Begins!",
        type: "hackathon",
        startTime: "16:00",
        endTime: "23:59",
        location: "Hacking Zones",
        description: "Start building! Mentors available throughout.",
      },
    ],
  },
  {
    date: "2026-03-16",
    dayLabel: "Day 2 - Build",
    sessions: [
      {
        id: "s2-1",
        title: "Midnight Snacks",
        type: "break",
        startTime: "00:00",
        endTime: "01:00",
        location: "Snack Bar",
      },
      {
        id: "s2-2",
        title: "Breakfast & Check-in",
        type: "break",
        startTime: "08:00",
        endTime: "09:00",
        location: "Cafeteria",
      },
      {
        id: "s2-3",
        title: "Tech Talk: GPU Optimization",
        type: "talk",
        startTime: "10:00",
        endTime: "11:00",
        location: "Main Hall",
        speakerId: "speaker-4",
        speakerName: "David Lee",
        track: "Technical",
        description: "Maximize your model performance with GPU optimization techniques.",
      },
      {
        id: "s2-4",
        title: "Workshop: MLOps Best Practices",
        type: "workshop",
        startTime: "11:30",
        endTime: "13:00",
        location: "Workshop Room A",
        speakerId: "speaker-5",
        speakerName: "Priya Patel",
        track: "Technical",
        description: "Learn how to deploy and monitor ML models in production.",
      },
      {
        id: "s2-5",
        title: "Lunch",
        type: "break",
        startTime: "13:00",
        endTime: "14:00",
        location: "Cafeteria",
      },
      {
        id: "s2-6",
        title: "Mentor Office Hours",
        type: "networking",
        startTime: "14:00",
        endTime: "16:00",
        location: "Mentorship Zone",
        description: "Get 1-on-1 guidance from industry experts.",
      },
      {
        id: "s2-7",
        title: "Fireside Chat: Building AI Startups",
        type: "talk",
        startTime: "16:30",
        endTime: "17:30",
        location: "Main Hall",
        speakerId: "speaker-6",
        speakerName: "Alex Rivera",
        track: "Business",
        description: "Insights on turning hackathon projects into successful startups.",
      },
      {
        id: "s2-8",
        title: "Dinner & Networking",
        type: "networking",
        startTime: "18:00",
        endTime: "19:30",
        location: "Rooftop Terrace",
      },
      {
        id: "s2-9",
        title: "Night Hacking",
        type: "hackathon",
        startTime: "20:00",
        endTime: "23:59",
        location: "Hacking Zones",
        description: "Push through the night! Energy drinks provided.",
      },
    ],
  },
  {
    date: "2026-03-17",
    dayLabel: "Day 3 - Demo Day",
    sessions: [
      {
        id: "s3-1",
        title: "Final Sprint Breakfast",
        type: "break",
        startTime: "08:00",
        endTime: "09:00",
        location: "Cafeteria",
      },
      {
        id: "s3-2",
        title: "Code Freeze",
        type: "ceremony",
        startTime: "12:00",
        endTime: "12:00",
        location: "All Zones",
        description: "All coding must stop! Prepare your presentations.",
      },
      {
        id: "s3-3",
        title: "Lunch & Prep",
        type: "break",
        startTime: "12:00",
        endTime: "13:30",
        location: "Cafeteria",
      },
      {
        id: "s3-4",
        title: "Project Demos - Round 1",
        type: "ceremony",
        startTime: "14:00",
        endTime: "15:30",
        location: "Main Hall",
        description: "Teams present their projects to judges.",
      },
      {
        id: "s3-5",
        title: "Project Demos - Round 2",
        type: "ceremony",
        startTime: "15:45",
        endTime: "17:00",
        location: "Main Hall",
        description: "Continued project presentations.",
      },
      {
        id: "s3-6",
        title: "Judges Deliberation",
        type: "break",
        startTime: "17:00",
        endTime: "17:30",
        location: "Networking Area",
        description: "Mingle while judges make their decisions.",
      },
      {
        id: "s3-7",
        title: "Awards Ceremony",
        type: "ceremony",
        startTime: "17:30",
        endTime: "18:30",
        location: "Main Hall",
        description: "Winners announced and prizes awarded!",
      },
      {
        id: "s3-8",
        title: "Closing Party",
        type: "networking",
        startTime: "18:30",
        endTime: "21:00",
        location: "Rooftop Terrace",
        description: "Celebrate with fellow hackers, food, and music!",
      },
    ],
  },
];

// ============================================
// Sponsors Data
// ============================================
export const sponsorsData: Sponsor[] = [
  {
    id: "sponsor-1",
    name: "CloudTech Solutions",
    logo: "https://placehold.co/200x80/6366f1/white?text=CloudTech",
    website: "https://example.com",
    tier: "platinum",
    description: "Providing cloud credits and AI APIs for all participants.",
  },
  {
    id: "sponsor-2",
    name: "AI Systems Corp",
    logo: "https://placehold.co/200x80/8b5cf6/white?text=AI+Systems",
    website: "https://example.com",
    tier: "platinum",
    description: "Exclusive API access and mentorship from engineers.",
  },
  {
    id: "sponsor-3",
    name: "Compute Power Inc",
    logo: "https://placehold.co/200x80/22c55e/white?text=ComputePower",
    website: "https://example.com",
    tier: "gold",
    description: "GPU resources and hardware prizes.",
  },
  {
    id: "sponsor-4",
    name: "Enterprise Cloud",
    logo: "https://placehold.co/200x80/0ea5e9/white?text=EntCloud",
    website: "https://example.com",
    tier: "gold",
    description: "Cloud credits and services access.",
  },
  {
    id: "sponsor-5",
    name: "DevTools Pro",
    logo: "https://placehold.co/200x80/f59e0b/white?text=DevTools",
    website: "https://example.com",
    tier: "silver",
    description: "Developer tools and licenses for participants.",
  },
  {
    id: "sponsor-6",
    name: "Deploy Fast",
    logo: "https://placehold.co/200x80/ec4899/white?text=DeployFast",
    website: "https://example.com",
    tier: "silver",
    description: "Free deployment and hosting for hackathon projects.",
  },
  {
    id: "sponsor-7",
    name: "DataStore",
    logo: "https://placehold.co/200x80/14b8a6/white?text=DataStore",
    website: "https://example.com",
    tier: "bronze",
    description: "Database credits and technical support.",
  },
  {
    id: "sponsor-8",
    name: "ML Community Hub",
    logo: "https://placehold.co/200x80/a855f7/white?text=ML+Hub",
    website: "https://example.com",
    tier: "community",
    description: "Model hub access and community support.",
  },
];

// ============================================
// Prizes Data
// ============================================
export const prizesData: Prize[] = [
  {
    id: "prize-1",
    title: "Grand Prize",
    description: "Best overall project demonstrating innovation, technical excellence, and real-world impact.",
    value: "$25,000 + Cloud Credits",
    category: "Overall",
    icon: "🏆",
  },
  {
    id: "prize-2",
    title: "Best AI Innovation",
    description: "Most creative and novel use of AI technology.",
    value: "$10,000 + Hardware Prize",
    category: "Technical",
    icon: "🤖",
  },
  {
    id: "prize-3",
    title: "Best Social Impact",
    description: "Project with the greatest potential for positive social change.",
    value: "$7,500 + Mentorship Program",
    category: "Impact",
    icon: "🌍",
  },
  {
    id: "prize-4",
    title: "Best Use of LLMs",
    description: "Most impressive integration of large language models.",
    value: "$5,000 + API Credits",
    category: "Technical",
    icon: "💬",
  },
  {
    id: "prize-5",
    title: "Best UI/UX",
    description: "Project with the most intuitive and beautiful user experience.",
    value: "$5,000 + Design Tools Bundle",
    category: "Design",
    icon: "🎨",
  },
  {
    id: "prize-6",
    title: "People's Choice",
    description: "Voted by fellow participants as their favorite project.",
    value: "$3,000 + Swag Bundle",
    category: "Community",
    icon: "❤️",
  },
  {
    id: "prize-7",
    title: "Most Innovative Use of AI",
    description: "Pushing the boundaries of what's possible with AI.",
    value: "$5,000 + Conference Tickets",
    category: "Special",
    icon: "✨",
  },
];

// ============================================
// FAQs Data
// ============================================
export const faqsData: FAQ[] = [
  {
    id: "faq-1",
    question: "Who can participate?",
    answer: "Anyone 18 or older with a passion for AI! Whether you're a student, professional, or hobbyist, you're welcome to join. Teams can have 2-5 members, or you can join as an individual and find a team at the event.",
    category: "General",
  },
  {
    id: "faq-2",
    question: "What should I bring?",
    answer: "Bring your laptop, charger, and any hardware you might need. We provide WiFi, power strips, snacks, and meals. Don't forget a sleeping bag if you plan to stay overnight!",
    category: "General",
  },
  {
    id: "faq-3",
    question: "Is there a participation fee?",
    answer: "General admission is completely free! We also offer a VIP ticket ($149) with extra perks like priority seating, 1-on-1 mentorship sessions, and exclusive workshops.",
    category: "Registration",
  },
  {
    id: "faq-4",
    question: "What are the judging criteria?",
    answer: "Projects are judged on: Innovation (25%), Technical Complexity (25%), Practical Impact (25%), and Presentation Quality (25%). Judges include industry experts and sponsors.",
    category: "Competition",
  },
  {
    id: "faq-5",
    question: "Can I start working on my project before the event?",
    answer: "No, all coding must be done during the hackathon. However, you can brainstorm ideas, form teams, and do research beforehand. Pre-existing code or projects are not allowed.",
    category: "Competition",
  },
  {
    id: "faq-6",
    question: "What APIs and tools will be available?",
    answer: "Sponsors provide free access to various AI APIs, cloud credits, and development tools. You'll receive access details at the start of the event.",
    category: "Technical",
  },
  {
    id: "faq-7",
    question: "Is food provided?",
    answer: "Yes! We provide all meals (breakfast, lunch, dinner) and snacks throughout the event. We accommodate dietary restrictions - just let us know during registration.",
    category: "General",
  },
  {
    id: "faq-8",
    question: "Can I attend virtually?",
    answer: "This is an in-person only event. We believe the collaboration, networking, and energy of being together creates the best hackathon experience.",
    category: "General",
  },
  {
    id: "faq-9",
    question: "What happens to my project after the hackathon?",
    answer: "You retain full ownership of your project and IP. We encourage you to continue developing it! Many past projects have become successful startups.",
    category: "Competition",
  },
  {
    id: "faq-10",
    question: "How do I find a team?",
    answer: "We have a team formation session on Day 1 where individuals can pitch ideas and find teammates. You can also use our Discord server before the event to connect with others.",
    category: "Registration",
  },
];

// ============================================
// Helper function to get all data
// ============================================
export const getAllEventData = () => ({
  event: eventData,
  speakers: speakersData,
  schedule: scheduleData,
  sponsors: sponsorsData,
  prizes: prizesData,
  faqs: faqsData,
});

// ============================================
// Registration Management (Mock Implementation)
// ============================================
const registrations: Registration[] = [];

export const addRegistration = (registration: Omit<Registration, "id" | "registeredAt">): Registration => {
  const newRegistration: Registration = {
    ...registration,
    id: `reg-${Date.now()}`,
    registeredAt: new Date().toISOString(),
  };
  registrations.push(newRegistration);
  return newRegistration;
};

export const isEmailRegistered = (email: string): boolean => {
  return registrations.some((r) => r.email.toLowerCase() === email.toLowerCase());
};

export const getRegistrationByEmail = (email: string): Registration | undefined => {
  return registrations.find((r) => r.email.toLowerCase() === email.toLowerCase());
};
