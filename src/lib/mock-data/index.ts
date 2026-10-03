import type {
  AppData,
  Business,
  CommunityPost,
  Opportunity,
  Source,
} from "@/lib/types";

export const DEMO_OPPORTUNITY_ID = "opp_001";
export const DEMO_POST =
  "Looking for a dog groomer in Cambridge tomorrow for my golden retriever. Hoping to stay under $100.";
export const DEMO_RESPONSE =
  "Hi! I'm the AI assistant for Cambridge Pet Groomers. We offer full grooming for golden retrievers starting at $85, and we have openings tomorrow at 11 AM and 3 PM. Would you like more details?";
export const SOURCES: Source[] = [
  "Facebook Group",
  "Reddit",
  "Discord",
  "Telegram",
];

const business: Business = {
  id: "biz_001",
  name: "Cambridge Pet Groomers",
  description:
    "Thoughtful grooming for your four-legged family. Locally owned in Cambridge, MA.",
  serviceArea: ["Cambridge", "Somerville", "Boston"],
  services: [
    {
      id: "svc_groom",
      name: "Full Groom Package",
      price: 85,
      description:
        "Bath, brushing, haircut, nail trimming, ear cleaning, and finishing spray.",
    },
    {
      id: "svc_bath",
      name: "Bath & Brush",
      price: 55,
      description: "A gentle bath, blow-dry, and thorough brushing.",
    },
    {
      id: "svc_nails",
      name: "Nail Trim",
      price: 20,
      description: "A quick, gentle nail trim for comfortable paws.",
    },
  ],
  acceptedPets: "Dogs",
  restrictions: "Large breeds accepted",
  hours: "9 AM – 6 PM",
  availableSlots: ["11:00 AM", "3:00 PM"],
  faqs: [
    {
      question: "Does the Full Groom Package include nail trimming?",
      answer:
        "Yes! It includes a bath, brushing, haircut, nail trimming, ear cleaning, and finishing spray.",
    },
    {
      question: "Do you accept large breeds?",
      answer:
        "Absolutely. Golden retrievers and other large breeds are welcome.",
    },
    {
      question: "What should I bring to the appointment?",
      answer:
        "Please bring your dog on a leash and their current vaccination records.",
    },
  ],
};

type Seed = [
  string,
  string,
  Source,
  string,
  string,
  string,
  string,
  number,
  number,
  "high" | "medium",
];
const seeds: Seed[] = [
  [
    "Alex Morgan",
    DEMO_POST,
    "Facebook Group",
    "Cambridge Community",
    "Cambridge",
    "Golden Retriever",
    "Tomorrow",
    100,
    0.96,
    "high",
  ],
  [
    "Jamie Chen",
    "Anyone know a good groomer around Somerville? My little terrier could use a bath and brush this weekend.",
    "Reddit",
    "r/Somerville",
    "Somerville",
    "Terrier",
    "This weekend",
    70,
    0.89,
    "medium",
  ],
  [
    "Sam Rivera",
    "Need someone to trim my dog's nails today if possible. We're in Boston and can come by this afternoon.",
    "Discord",
    "Boston Dog Parents",
    "Boston",
    "Labrador",
    "Today",
    30,
    0.92,
    "high",
  ],
  [
    "Taylor Brooks",
    "Looking for full grooming for my poodle in Cambridge tomorrow. Budget around $100.",
    "Telegram",
    "Cambridge Neighbors",
    "Cambridge",
    "Poodle",
    "Tomorrow",
    100,
    0.95,
    "high",
  ],
  [
    "Jordan Lee",
    "Any appointments for a lab bath in Somerville tomorrow? Under $60 would be ideal.",
    "Facebook Group",
    "Somerville Dog Lovers",
    "Somerville",
    "Labrador",
    "Tomorrow",
    60,
    0.91,
    "high",
  ],
  [
    "Casey Patel",
    "Our spaniel needs a proper groom this week in Boston. Can spend $90.",
    "Reddit",
    "r/Boston",
    "Boston",
    "Spaniel",
    "This week",
    90,
    0.9,
    "high",
  ],
  [
    "Riley Kim",
    "Need a nail trim for my beagle in Cambridge this week. Any suggestions?",
    "Discord",
    "Cambridge Pet Club",
    "Cambridge",
    "Beagle",
    "This week",
    25,
    0.93,
    "high",
  ],
  [
    "Drew Scott",
    "Searching for a groomer in Cambridge for my golden tomorrow. Happy to pay up to $100.",
    "Telegram",
    "Cambridge Neighbors",
    "Cambridge",
    "Golden Retriever",
    "Tomorrow",
    100,
    0.94,
    "high",
  ],
  [
    "Morgan Davis",
    "Need a bath and brush for my collie in Boston tomorrow. Hoping for $60.",
    "Facebook Group",
    "Boston Dog Parents",
    "Boston",
    "Collie",
    "Tomorrow",
    60,
    0.92,
    "high",
  ],
  [
    "Avery Wilson",
    "What are the best grooming options for a small dog around Cambridge?",
    "Reddit",
    "r/CambridgeMA",
    "Cambridge",
    "Small dog",
    "Flexible",
    100,
    0.83,
    "medium",
  ],
  [
    "Quinn Adams",
    "Thinking about a bath for my terrier in Somerville. Recommendations welcome.",
    "Discord",
    "Somerville Neighbors",
    "Somerville",
    "Terrier",
    "Flexible",
    65,
    0.86,
    "medium",
  ],
  [
    "Sky Ellis",
    "Comparing full grooming packages in Boston for my husky. Any local favorites?",
    "Telegram",
    "Boston Pet People",
    "Boston",
    "Husky",
    "Flexible",
    110,
    0.87,
    "medium",
  ],
];
const opportunities: Opportunity[] = seeds.map((s, i) => {
  const service =
    i === 2 || i === 6
      ? business.services[2]
      : i === 1 || i === 4 || i === 8 || i === 10
        ? business.services[1]
        : business.services[0];
  return {
    id: `opp_${String(i + 1).padStart(3, "0")}`,
    postId: `post_${i + 1}`,
    customer: s[0],
    originalPost: s[1],
    source: s[2],
    community: s[3],
    intent: {
      service: service.id === "svc_groom" ? "Full Dog Grooming" : service.name,
      pet: s[5],
      location: s[4],
      date: s[6],
      budget: s[7],
      purchaseIntent: s[9],
      confidence: i === 0 ? 0.94 : 0.87,
    },
    match: {
      score: s[8],
      serviceId: service.id,
      service: service.name,
      price: service.price,
      availableSlots: s[6] === "Tomorrow" ? [...business.availableSlots] : [],
      checks: [
        { label: "Service Match", passed: true },
        { label: "Location Match", passed: true },
        { label: "Budget Match", passed: s[7] >= service.price },
        { label: "Breed Accepted", passed: true },
        { label: "Availability", passed: s[6] === "Tomorrow" },
      ],
    },
    intentScore: s[9] === "high" ? 0.94 : 0.68,
    status: "new",
    detectedAt: i === 0 ? "Just now" : `${i * 7} min ago`,
    suggestedResponse:
      i === 0
        ? DEMO_RESPONSE
        : `Hi! I'm the AI assistant for ${business.name}. Our ${service.name} is ${service.price} dollars. Would you like us to check an appointment for your ${s[5].toLowerCase()}?`,
  };
});
const posts: CommunityPost[] = [
  {
    id: "post_1",
    author: "Alex Morgan",
    initials: "AM",
    source: "Facebook Group",
    community: "Cambridge Community",
    content: DEMO_POST,
    intent: "high",
    confidence: 0.94,
    time: "2 min ago",
    opportunityId: "opp_001",
    explanation: "Specific service, location, date, and budget. Ready to book.",
  },
  {
    id: "post_2",
    author: "Jamie Chen",
    initials: "JC",
    source: "Reddit",
    community: "r/Somerville",
    content: "Anyone know a good groomer around Somerville?",
    intent: "medium",
    confidence: 0.87,
    time: "8 min ago",
    opportunityId: "opp_002",
    explanation:
      "Seeking a recommendation. Timing and budget need clarification.",
  },
  {
    id: "post_social",
    author: "Chris Park",
    initials: "CP",
    source: "Discord",
    community: "Boston Dog Parents",
    content: "My dog absolutely hates baths 😂",
    intent: "low",
    confidence: 0.96,
    time: "12 min ago",
    explanation: "Casual conversation with no request for a service. Ignored.",
  },
  {
    id: "post_vet",
    author: "Nina Shah",
    initials: "NS",
    source: "Telegram",
    community: "Cambridge Neighbors",
    content: "Moving to Cambridge next month. Any recommendations for vets?",
    intent: "irrelevant",
    confidence: 0.98,
    time: "18 min ago",
    explanation:
      "Veterinary care is outside this business's grooming services.",
  },
  {
    id: "post_3",
    author: "Sam Rivera",
    initials: "SR",
    source: "Discord",
    community: "Boston Dog Parents",
    content: "Need someone to trim my dog's nails today if possible.",
    intent: "high",
    confidence: 0.92,
    time: "22 min ago",
    opportunityId: "opp_003",
    explanation:
      "A specific service with urgency. Check same-day availability before sending.",
  },
];
export const conversationScript = [
  [
    { role: "customer" as const, content: "Does that include nail trimming?" },
    {
      role: "assistant" as const,
      content:
        "Yes! The Full Groom Package includes a bath, brushing, haircut, nail trimming, ear cleaning, and finishing spray.",
    },
  ],
  [
    { role: "customer" as const, content: "Awesome. Can I do 3?" },
    {
      role: "assistant" as const,
      content: "Yes, 3 PM is still available. Would you like me to reserve it?",
    },
  ],
  [{ role: "customer" as const, content: "Yes." }],
];

export function createInitialData(): AppData {
  return structuredClone({
    business,
    opportunities,
    posts,
    conversations: [],
    bookings: [
      {
        id: "book_001",
        customer: "Emma Wilson",
        pet: "Poodle",
        service: "Full Groom Package",
        date: "Today",
        time: "10:00 AM",
        price: 85,
        source: "Localy",
        status: "completed",
      },
      {
        id: "book_002",
        customer: "Noah Garcia",
        pet: "Labrador",
        service: "Full Groom Package",
        date: "Today",
        time: "1:00 PM",
        price: 85,
        source: "Localy",
        status: "confirmed",
      },
      {
        id: "book_003",
        customer: "Olivia Brown",
        pet: "Terrier",
        service: "Bath & Brush",
        date: "Yesterday",
        time: "2:00 PM",
        price: 55,
        source: "Website",
        status: "completed",
      },
    ],
    activity: [
      {
        id: "act_1",
        title: "High-intent request detected",
        description: "Alex is looking for a groomer in Cambridge.",
        time: "Just now",
        kind: "detected",
      },
      {
        id: "act_2",
        title: "A 96% business match",
        description: "Full Groom Package · $85 · two openings",
        time: "Just now",
        kind: "matched",
      },
      {
        id: "act_3",
        title: "Your response is ready",
        description: "Review and approve Alex's suggested reply.",
        time: "Just now",
        kind: "message",
      },
      {
        id: "act_4",
        title: "Scanning local communities",
        description: "4 participating communities · demo activity",
        time: "3 min ago",
        kind: "detected",
      },
    ],
    settings: { agentOnline: true, enabledSources: SOURCES },
  } satisfies AppData);
}
