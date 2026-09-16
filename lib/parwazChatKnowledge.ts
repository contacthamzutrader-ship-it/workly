/**
 * ParwazChat Knowledge Base & Scope Guardrails Engine
 * 
 * STRICT PRIVACY GUARANTEE:
 * - ParwazChat has NO access to personal user data (passwords, CNIC/ID photos,
 *   personal bank numbers, or confidential private user chats).
 * - Only knows public platform architecture, workflows, policies, and navigation.
 */

export interface KnowledgeTopic {
  id: string;
  title: string;
  keywords: string[];
  summary: string;
  quickAction?: {
    label: string;
    href: string;
  };
  details: string[];
}

export const PARWAZ_SYSTEM_PROMPT = `
You are ParwazChat, the official, intelligent, and friendly animated assistant for Parwaz.pk (Pakistan's smarter freelancing marketplace).
Your avatar is a cute, animated smiling emoji. You speak in fluent, professional, and warm English.

PRIMARY MANDATE & SCOPE:
1. You assist users EXCLUSIVELY with the Parwaz.pk platform (tasks, bidding, hiring, AI skill interviews, verified badges, trust scoring, fraud protection, wallets & payouts, profiles, and platform policies).
2. OUT-OF-SCOPE ENFORCEMENT: If a user asks about ANY topic unrelated to Parwaz.pk (such as weather, cooking recipes, general trivia, politics, math homework, general external coding tasks, entertainment, or other platforms), you MUST NOT throw an error. Instead, respond politely and firmly with:
"I'm sorry, but I cannot help you with that. I am ParwazChat, your dedicated Parwaz.pk assistant, and I can only assist with questions regarding our platform, hiring, freelancing, and account features."
3. PRIVACY & SECURITY: You do not possess, store, or share any personal user data (passwords, CNIC/ID documents, personal banking numbers, or private user chats). Always uphold user privacy.
4. TONE & STYLE: Helpful, concise, well-structured (using bullet points and clickable markdown links when guiding users to pages like /post, /browse, /interview, /badges, /wallet, /settings, /help).
`;

export const PLATFORM_KNOWLEDGE: KnowledgeTopic[] = [
  {
    id: "about-parwaz",
    title: "About Parwaz.pk",
    keywords: ["what is parwaz", "about parwaz", "how does parwaz work", "airtasker", "upwork pakistan", "marketplace"],
    summary: "Parwaz.pk is Pakistan's premier AI-powered freelancing and task marketplace. It connects verified Pakistani talent with clients looking to get work done at transparent, fixed prices.",
    quickAction: { label: "Explore Platform", href: "/how-it-works" },
    details: [
      "Combines the simplicity of Airtasker with the contract security and milestone protection of Upwork.",
      "Fixed-price model with held milestone funds so both clients and freelancers are protected.",
      "AI-driven talent matching and verified skill badges earned through rigorous testing.",
      "Built specifically for Pakistan's digital economy with local payment integration (Easypaisa, JazzCash, local bank transfers)."
    ],
  },
  {
    id: "post-task",
    title: "How to Post a Task or Project",
    keywords: ["post task", "post project", "hire freelancer", "create job", "how to hire", "post job"],
    summary: "Clients can post tasks easily with a clear title, description, category, deadline, and fixed budget in PKR.",
    quickAction: { label: "Post a Task Now", href: "/post" },
    details: [
      "Click **Post a Task** from the navigation bar or visit [/post](/post).",
      "Specify your task title, category (e.g. Web Development, Design, Writing, Digital Marketing), and timeline.",
      "Enter your fixed budget in PKR (Pakistan Rupees).",
      "Once posted, your project becomes visible on the marketplace ([/browse](/browse)), and qualified freelancers will submit bids and proposals.",
      "You can review proposals, check freelancer verified badges, and select the best match."
    ],
  },
  {
    id: "browse-bidding",
    title: "Browsing Tasks & Placing Bids",
    keywords: ["browse tasks", "find work", "place bid", "submit proposal", "how to bid", "get jobs", "opportunities"],
    summary: "Freelancers can browse all open marketplace tasks, review project requirements, and place competitive bids.",
    quickAction: { label: "Browse Tasks", href: "/browse" },
    details: [
      "Visit [/browse](/browse) or [/tasks](/tasks) to view all live, open tasks in Pakistan.",
      "Filter opportunities by category, budget range, and recency.",
      "To bid on a task, open the task page, enter your offer price, and provide a clear proposal explaining your approach and timeline.",
      "Clients can accept your offer, which funds the project milestone and opens private communication."
    ],
  },
  {
    id: "ai-interview-vetting",
    title: "AI Skill Interview & Verification",
    keywords: ["ai interview", "skill test", "interview", "vetting", "anti-cheat", "test", "verification test", "take test"],
    summary: "Parwaz features an automated AI Interview engine with voice/text questions and anti-cheat monitoring to verify freelancer skills.",
    quickAction: { label: "Take Skill Interview", href: "/interview" },
    details: [
      "Freelancers complete a specialized 10-question evaluation tailored to their chosen domain.",
      "Includes an interactive AI voice interviewer, text-to-speech engine, and structured scoring out of 100.",
      "Features real-time Anti-Cheat Guard (monitoring tab switching, gaze/camera tracking, and copy-paste detection).",
      "Candidates who achieve a passing score unlock official **Verified Badges** on their profile, boosting their visibility to clients."
    ],
  },
  {
    id: "verified-badges",
    title: "Verified Skill Badges",
    keywords: ["badges", "verified badge", "skill badge", "credentials", "top talent badge"],
    summary: "Badges prove to clients that you have been tested and approved by Parwaz's rigorous evaluation system.",
    quickAction: { label: "View Skill Badges", href: "/badges" },
    details: [
      "Verified badges appear directly on your public profile ([/u/your-id](/profile)) and on all your bids.",
      "Available for key specializations: Full-Stack Development, React & Next.js, Python & AI, UI/UX Design, Content Writing, Digital Marketing, and more.",
      "Clients strongly favor freelancers who hold verified badges for high-value contracts."
    ],
  },
  {
    id: "trust-score",
    title: "Trust Score Engine",
    keywords: ["trust score", "trust rating", "how trust score works", "reputation", "5 star review"],
    summary: "Parwaz computes a dynamic Trust Score (0–100) for each user to guarantee platform reliability.",
    quickAction: { label: "View Dashboard", href: "/dashboard" },
    details: [
      "All accounts start with a baseline Trust Score of **70 points**.",
      "Every **5-star review** adds **+2 points** to your Trust Score.",
      "Reviews of **2 stars or lower** deduct **-2 points**.",
      "Attempting to share off-platform contacts or bypass held funds incurs a severe **-20 point penalty**.",
      "A higher Trust Score places your proposals higher in the AI matching algorithm."
    ],
  },
  {
    id: "fraud-protection",
    title: "Fraud Detection & Escrow Protection",
    keywords: ["fraud", "scam", "escrow bypass", "whatsapp", "phone number", "paypal", "safety", "rules", "ban"],
    summary: "Parwaz automatically scans messages to stop scams and protect payments from being stolen off-platform.",
    quickAction: { label: "Community Guidelines", href: "/community-guidelines" },
    details: [
      "Real-time fraud scanners flag attempts to share off-platform payment methods (PayPal, direct bank deposits outside contracts, Western Union).",
      "Sharing personal WhatsApp, phone numbers, or emails before an official contract is strictly prohibited to protect both parties.",
      "Contract funds are held securely until the client inspects and approves the delivered work.",
      "Violators face trust penalties (-20 points) or permanent account suspension."
    ],
  },
  {
    id: "payments-wallet",
    title: "Wallet & Held Milestone Funds",
    keywords: ["wallet", "payment", "how to get paid", "withdraw", "easypaisa", "jazzcash", "bank transfer", "payout", "deposit"],
    summary: "Payments on Parwaz operate on a held milestone model, ensuring freelancers get paid upon delivery and clients only pay for approved work.",
    quickAction: { label: "Open Wallet", href: "/wallet" },
    details: [
      "When a client hires a freelancer, the task amount is held in safe platform custody.",
      "Once work is completed and released by the client, funds move to the freelancer's available balance.",
      "Payouts can be withdrawn directly via Pakistani financial methods: **Easypaisa**, **JazzCash**, or **Local Bank Transfer (IBAN)**.",
      "Transparent platform fees are calculated upfront with no hidden deductions."
    ],
  },
  {
    id: "profile-portfolio",
    title: "Profile, Portfolio & Education",
    keywords: ["profile", "portfolio", "education", "degrees", "upload photo", "change password", "settings"],
    summary: "Your Parwaz profile is your professional brand in Pakistan and globally.",
    quickAction: { label: "Account Settings", href: "/settings" },
    details: [
      "Update your avatar, bio, hourly rate, and main skills in [/settings](/settings).",
      "Upload verified education degrees and academic credentials for trust verification.",
      "Add portfolio case studies with screenshots, live URLs, and descriptions to showcase your past projects.",
      "View your public profile as clients see it at [/u/your-id](/profile)."
    ],
  },
  {
    id: "support-disputes",
    title: "Disputes, Cancellations & Help",
    keywords: ["dispute", "cancel task", "refund", "help", "support", "contact", "customer service"],
    summary: "Parwaz provides dedicated dispute resolution, fair cancellation policies, and customer support.",
    quickAction: { label: "Get Help & Support", href: "/help" },
    details: [
      "If an issue arises during a project, either party can submit a structured dispute with evidence.",
      "Our moderation team investigates the delivery logs, task specifications, and contract terms to issue a fair decision.",
      "Check our [/cancellation-policy](/cancellation-policy) and [/terms](/terms) for full details.",
      "You can contact our support team anytime through [/contact](/contact) or [/help](/help)."
    ],
  },
];

// List of strictly out-of-scope triggers (general knowledge, coding homework, weather, cooking, external platforms)
const OUT_OF_SCOPE_REGEX = [
  /\b(recipe|cook|bake|cake|ingredient|pasta|biryani|roti|pizza)\b/i,
  /\b(weather|temperature|forecast|rain today|tomorrow climate)\b/i,
  /\b(capital of|president of|who won|prime minister of (?!pakistan)|fifa|world cup|cricket score)\b/i,
  /\b(solve this math|integral of|derivative of|solve x\^2|chemistry|biology|physics formula)\b/i,
  /\b(write a poem about|tell me a joke|write python code for binary search|leetcode)\b/i,
  /\b(fiverr gig rank|upwork algorithm|daraz|netflix|spotify|crypto price|bitcoin)\b/i,
  /\b(what is the meaning of life|tell me a story)\b/i,
];

// Keywords explicitly indicating Parwaz.pk platform inquiries
const PLATFORM_TRIGGER_REGEX = [
  /\b(parwaz|task|tasks|freelancer|freelancing|client|hire|bidding|bid|proposal|interview|test|badge|badges|trust score|fraud|wallet|payment|payout|easypaisa|jazzcash|profile|portfolio|education|login|signup|onboarding|dispute|refund|cancel|support|pakistan)\b/i,
  /\b(how do i|how to|can i|where is|where do i|what is)\b/i,
];

export interface ChatResponseResult {
  reply: string;
  isOutOfScope: boolean;
  emotion: "idle" | "thinking" | "speaking" | "apologetic" | "happy" | "wink";
  suggestedQuestions?: string[];
  quickAction?: { label: string; href: string };
}

export const DEFAULT_SUGGESTIONS = [
  "How do I post a project on Parwaz?",
  "How does the AI Skill Interview work?",
  "What is the Trust Score and how do I raise it?",
  "How do payments and withdrawals work?",
  "How do I get verified skill badges?",
];

/**
 * Intelligent Parwaz Chatbot Synthesizer
 * Formulates accurate, polite, and helpful answers strictly for Parwaz.pk.
 */
export function processParwazChatMessage(userQuery: string): ChatResponseResult {
  const query = userQuery.trim().toLowerCase();

  // 1. Check for basic greetings
  if (/^(hi|hello|hey|salam|assalam|aoa|good (morning|afternoon|evening)|hey there)[\s!.]*$/i.test(query)) {
    return {
      reply: "Hello! 😊 I'm **ParwazChat**, your official Parwaz.pk assistant! How can I assist you with tasks, hiring, freelancing, or your account today?",
      isOutOfScope: false,
      emotion: "happy",
      suggestedQuestions: DEFAULT_SUGGESTIONS.slice(0, 3),
    };
  }

  // 2. Check for thanks or appreciation
  if (/^(thank you|thanks|shukriya|jazakallah|great|awesome|good job)[\s!.]*$/i.test(query)) {
    return {
      reply: "You're very welcome! 😊 If you have any other questions about Parwaz.pk, hiring talent, or taking skill tests, I'm always right here to help!",
      isOutOfScope: false,
      emotion: "wink",
    };
  }

  // 3. STRICT GUARDRAIL: Check if clearly out-of-scope
  const matchesOutOfScope = OUT_OF_SCOPE_REGEX.some((re) => re.test(query));
  const matchesPlatform = PLATFORM_TRIGGER_REGEX.some((re) => re.test(query));

  if (matchesOutOfScope && !matchesPlatform) {
    return {
      reply: "I'm sorry, but I cannot help you with that. I am **ParwazChat**, your dedicated Parwaz.pk assistant, and I can only assist with questions regarding our platform, hiring, freelancing, and account features.",
      isOutOfScope: true,
      emotion: "apologetic",
      suggestedQuestions: DEFAULT_SUGGESTIONS.slice(0, 3),
    };
  }

  // 4. Match against Knowledge Topics
  let bestMatch: KnowledgeTopic | null = null;
  let highestScore = 0;

  for (const topic of PLATFORM_KNOWLEDGE) {
    let score = 0;
    for (const keyword of topic.keywords) {
      if (query.includes(keyword.toLowerCase())) {
        score += keyword.split(" ").length * 3;
      }
    }
    // Also check summary and details
    if (topic.title.toLowerCase().split(" ").some((w) => query.includes(w))) {
      score += 2;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = topic;
    }
  }

  // If a solid match is found in the knowledge base
  if (bestMatch && highestScore >= 2) {
    const detailsList = bestMatch.details.map((d) => `• ${d}`).join("\n");
    const reply = `### ${bestMatch.title}\n\n${bestMatch.summary}\n\n${detailsList}\n\n${
      bestMatch.quickAction
        ? `👉 **Quick Link**: [${bestMatch.quickAction.label}](${bestMatch.quickAction.href})`
        : ""
    }`;

    return {
      reply: reply.trim(),
      isOutOfScope: false,
      emotion: "speaking",
      quickAction: bestMatch.quickAction,
      suggestedQuestions: DEFAULT_SUGGESTIONS.filter(
        (q) => !q.toLowerCase().includes(bestMatch!.title.toLowerCase())
      ).slice(0, 3),
    };
  }

  // 5. If ambiguous or low match, verify if question is platform related
  if (
    query.includes("task") ||
    query.includes("work") ||
    query.includes("hire") ||
    query.includes("freelance") ||
    query.includes("account") ||
    query.includes("money") ||
    query.includes("earn") ||
    query.includes("job") ||
    query.includes("apply") ||
    query.includes("login") ||
    query.includes("signup") ||
    query.includes("pakistan")
  ) {
    return {
      reply: `I can certainly help you with that on Parwaz.pk! 🌟\n\nHere are the main areas I can assist you with:\n\n• **For Clients**: You can [Post a Task](/post) and review bids from verified Pakistani freelancers.\n• **For Freelancers**: You can [Browse Opportunities](/browse), take our [AI Skill Interview](/interview) to earn [Verified Badges](/badges), and submit proposals.\n• **Payments & Safety**: Held milestone funds via Easypaisa, JazzCash, and local banks in your [Wallet](/wallet).\n\nWhat specific part of the platform would you like to know more about?`,
      isOutOfScope: false,
      emotion: "speaking",
      suggestedQuestions: DEFAULT_SUGGESTIONS.slice(0, 4),
    };
  }

  // 6. Default fallback for unrelated questions
  return {
    reply: "I'm sorry, but I cannot help you with that. I am **ParwazChat**, your dedicated Parwaz.pk assistant, and I can only assist with questions regarding our platform, hiring, freelancing, and account features.",
    isOutOfScope: true,
    emotion: "apologetic",
    suggestedQuestions: DEFAULT_SUGGESTIONS.slice(0, 3),
  };
}
