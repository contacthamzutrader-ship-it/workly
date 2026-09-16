/**
 * ParwazChat Knowledge Base, Language Detection & Scope Guardrails Engine
 * 
 * STRICT PRIVACY & PLATFORM INTEGRITY GUARANTEES:
 * 1. Exclusively answers questions about Parwaz.pk (Pakistan's smarter freelancing marketplace).
 * 2. Politely rejects out-of-scope queries (general trivia, recipes, weather, politics, external coding homework).
 * 3. Bilingual Intelligence:
 *    - Automatically detects Roman Urdu queries -> answers in natural, fluent, courteous Roman Urdu.
 *    - Automatically detects English queries -> answers in clear, professional, friendly English.
 * 4. Deep Platform Insights:
 *    - Legitimacy & Escrow guarantees (Held funds, Easypaisa, JazzCash, local banks)
 *    - Proven strategies to get clients fast & win high-value orders
 *    - AI Skill Interview evaluation & Verified Badges
 *    - Trust Score optimization (0–100)
 *    - Direct client/freelancer navigation links
 */

import type { EmojiEmotion } from "@/components/ParwazEmojiAvatar";

export interface ChatResponseResult {
  reply: string;
  isOutOfScope: boolean;
  emotion: EmojiEmotion;
  suggestedQuestions?: string[];
  quickAction?: { label: string; href: string };
}

export const DEFAULT_SUGGESTIONS_EN = [
  "Is this platform legit and safe?",
  "How to get clients fast on Parwaz?",
  "How does the AI Skill Interview work?",
  "How do payments and withdrawals work?",
  "How do I post a project on Parwaz?",
];

export const DEFAULT_SUGGESTIONS_UR = [
  "Kya ye platform legit aur safe hai?",
  "Is platform par jaldi clients kaise milenge?",
  "AI Skill Interview kaise kaam karta hai?",
  "Easypaisa aur JazzCash se payment kaise milegi?",
  "Parwaz par task kaise post karein?",
];

export const DEFAULT_SUGGESTIONS = DEFAULT_SUGGESTIONS_EN;

/**
 * Robust Roman Urdu Language Detector
 * Accurately detects whether a message is written in Roman Urdu / Hindi or English.
 */
export function isRomanUrdu(text: string): boolean {
  const normalized = text.toLowerCase().trim();

  // Words uniquely characteristic of Roman Urdu / Pakistani conversational speech
  const urduPatterns = [
    /\b(kya|kia|kaise|kese|kaisa|kaisi|karna|karein|kren|krna|krte|karte|karo|krdo|kardo)\b/i,
    /\b(hai|hain|ho|hun|hoon|hoga|hogi|hoge|tha|thi|the)\b/i,
    /\b(mujhe|muja|meri|mera|mere|apna|apni|apne|aap|ap|tum|tumhara|tumhari)\b/i,
    /\b(batao|bataiye|batayein|bataen|bata|btao|btayein|chahiye|chahye|chaye)\b/i,
    /\b(milenge|milega|milegi|milta|milti|jaldi|jldi|pehle|pehlay)\b/i,
    /\b(paise|paisa|kaam|kam|pesy|rupay|rupaye|kuch|koch|koi|bhi|sath)\b/i,
    /\b(ye|yeh|wo|woh|acha|achha|theek|thik|shukriya|shukria|bohat|bht|zyada|ziada)\b/i,
    /\b(salam|assalam|aoa|wale|wali|walay|dekh|dekho|pe|par|per|mein|main|se|sy|ko|ka|ki|ke)\b/i,
    /\b(legit hai|real hai|fake hai|scam hai|safe hai|kaise milega|kaise hoga)\b/i,
  ];

  let matches = 0;
  for (const re of urduPatterns) {
    if (re.test(normalized)) {
      matches++;
    }
  }

  const wordCount = normalized.split(/\s+/).length;
  if (wordCount <= 3) {
    return matches >= 1;
  }
  return matches >= 2 || (matches >= 1 && (normalized.includes(" hai") || normalized.includes("kya ") || normalized.includes("kaise ") || normalized.includes("kese ")));
}

/**
 * Strict Out-Of-Scope Regex Patterns
 * Identifies questions totally unrelated to Parwaz.pk platform.
 */
const OUT_OF_SCOPE_REGEX = [
  /\b(recipe|recipes|cook|cooking|bake|cake|biryani|pulao|pasta|pizza|roti|nihari|ingredient)\b/i,
  /\b(weather|temperature|forecast|rain today|climate|monsoon|humidity)\b/i,
  /\b(cricket score|fifa|world cup|psl match|babar azam|virat kohli|football score)\b/i,
  /\b(imran khan|nawaz sharif|shehbaz|biden|trump|putin|election|parliament|politics)\b/i,
  /\b(solve math|integral of|derivative of|solve x\^|algebra equation|calculus|chemistry|physics formula)\b/i,
  /\b(write a poem|tell me a joke|write song lyrics|who won the oscar|movie review)\b/i,
  /\b(write python code for binary search|leetcode|fibonacci in c\+\+|bubble sort)\b/i,
  /\b(fiverr gig ranking|upwork connect price|daraz seller center|netflix plan|spotify discount|crypto price|bitcoin)\b/i,
  /\b(capital of|president of|meaning of life)\b/i,
];

/**
 * Keywords strictly confirming Parwaz platform scope
 */
const PLATFORM_OVERRIDE_REGEX = [
  /\b(parwaz|task|tasks|freelancer|freelancing|client|hire|bidding|bid|bids|proposal|interview|test|badge|badges|trust score|fraud|wallet|payment|payments|easypaisa|jazzcash|profile|portfolio|education|login|signup|onboarding|dispute|refund|cancel|support|platform|earn|money|paisa|kaam|order|orders)\b/i,
];

/**
 * Main AI Engine for ParwazChat
 */
export function processParwazChatMessage(userQuery: string): ChatResponseResult {
  const rawText = userQuery.trim();
  const query = rawText.toLowerCase();
  const urdu = isRomanUrdu(rawText);

  // -------------------------------------------------------------
  // 1. GREETINGS
  // -------------------------------------------------------------
  if (/^(hi|hello|hey|salam|assalam|aoa|good (morning|afternoon|evening)|hey there|kese ho|kaise ho)[\s!.]*$/i.test(query)) {
    if (urdu) {
      return {
        reply: "Walaikum Assalam! 😊 Main hoon **ParwazChat**, aapka official Parwaz.pk assistant!\n\nMain aapko tasks post karne, verified badges hasil karne, jaldi clients dhoondne aur Easypaisa/JazzCash payments ke baray mein mukammal guide kar sakta hoon.\n\nAaj main aapki kya madad kar sakta hoon?",
        isOutOfScope: false,
        emotion: "happy",
        suggestedQuestions: DEFAULT_SUGGESTIONS_UR.slice(0, 3),
      };
    }
    return {
      reply: "Hello! 😊 I'm **ParwazChat**, your official Parwaz.pk assistant!\n\nI can help you with anything regarding our platform: posting tasks, getting verified badges, winning clients fast, and managing milestone payments.\n\nHow can I help you today?",
      isOutOfScope: false,
      emotion: "happy",
      suggestedQuestions: DEFAULT_SUGGESTIONS_EN.slice(0, 3),
    };
  }

  // -------------------------------------------------------------
  // 2. APPRECIATION / THANKS
  // -------------------------------------------------------------
  if (/^(thank you|thanks|shukriya|shukria|jazakallah|great|awesome|good job|bohat shukriya)[\s!.]*$/i.test(query)) {
    if (urdu) {
      return {
        reply: "Aapka bohat shukriya! 😊 Agar Parwaz.pk ke baray mein koi bhi mazeed sawal ho, to main hamesha yahan aapki rehnumai ke liye tayyar hoon!",
        isOutOfScope: false,
        emotion: "wink",
      };
    }
    return {
      reply: "You're very welcome! 😊 If you have any other questions about Parwaz.pk, winning clients, or taking skill tests, I'm always right here to assist you!",
      isOutOfScope: false,
      emotion: "wink",
    };
  }

  // -------------------------------------------------------------
  // 3. STRICT OUT-OF-SCOPE GUARDRAIL
  // -------------------------------------------------------------
  const isOutOfScopeQuery = OUT_OF_SCOPE_REGEX.some((re) => re.test(query));
  const hasPlatformContext = PLATFORM_OVERRIDE_REGEX.some((re) => re.test(query));

  if (isOutOfScopeQuery && !hasPlatformContext) {
    if (urdu) {
      return {
        reply: "Maazrat chahta hoon! Main sirf **Parwaz.pk platform** se mutaliq sawalaat mein aapki madad kar sakta hoon 😊\n\nMain aapko tasks post karne, proposals bhejne, AI skill interview pass karne, verified badges lene aur Easypaisa/JazzCash payments ke baray mein mukammal guide kar sakta hoon.\n\nAap platform ke baray mein kya poochna chahte hain?",
        isOutOfScope: true,
        emotion: "apologetic",
        suggestedQuestions: DEFAULT_SUGGESTIONS_UR.slice(0, 3),
      };
    }
    return {
      reply: "I'm sorry, but I can only answer questions related to the **Parwaz.pk platform**! 😊\n\nI am your dedicated Parwaz guide, here to assist with posting tasks, winning clients, taking AI skill interviews, earning verified badges, and milestone payments.\n\nWhat would you like to know about our platform?",
      isOutOfScope: true,
      emotion: "apologetic",
      suggestedQuestions: DEFAULT_SUGGESTIONS_EN.slice(0, 3),
    };
  }

  // -------------------------------------------------------------
  // 4. TOPIC 1: PLATFORM LEGITIMACY, SAFETY & ESCROW
  // -------------------------------------------------------------
  const isLegitQuery =
    /\b(legit|leget|real|fake|scam|safe|safety|trusted|trustable|legal|dhoka|fraud|fraud to nahi|real hai)\b/i.test(query);

  if (isLegitQuery) {
    if (urdu) {
      return {
        reply: `### Jee Bilkul, Parwaz.pk 100% Real aur Mehfooz Platform Hai! 🛡️

**Parwaz.pk Pakistan ka smarter freelancing marketplace hai**, jo clients aur freelancers donon ko dhoke aur payment ke nuqsaan se mukammal tahaffuz deta hai:

• **Held Milestone Funds (Escrow)**: Client kaam shuru honay se pehle funds platform par hold karwata hai. Freelancer ka paisa 100% mehfooz rehta hai aur kaam mukammal honay par hi release hota hai.
• **Pakistani Local Payments**: Kisi teesray mulk ya PayPal ka jhanjhat nahi—direct **Easypaisa**, **JazzCash**, aur **Pakistani Banks (IBAN)** se payments aur withdrawals hotay hain.
• **AI Skill Verification**: Freelancers 10 sawalaat ka AI technical test pass kar ke **Verified Badges** hasil kartay hain, jis se clients ko authentic talent milta hai.
• **Dynamic Trust Score (0–100)**: Har user ka verified reputation score hota hai jo unke pichle kaam aur 5-star reviews par mabni hota hai.
• **Fair Dispute Resolution**: Agar kisi project mein masla aye to Parwaz ki support team donon parties ke saboot dekh kar foran insaaf se faisla karti hai.

👉 **Platform Explore Karein**: [Kaise Kaam Karta Hai](/how-it-works) • [Live Tasks Dekhein](/browse)`,
        isOutOfScope: false,
        emotion: "smile",
        quickAction: { label: "Learn How It Works", href: "/how-it-works" },
        suggestedQuestions: [
          "Is platform par jaldi clients kaise milenge?",
          "Easypaisa aur JazzCash se payment kaise milegi?",
          "AI Skill Interview kaise kaam karta hai?",
        ],
      };
    }

    return {
      reply: `### Yes, Parwaz.pk is 100% Legitimate & Safe! 🛡️

**Parwaz.pk is Pakistan's premier smarter freelancing marketplace**, purposefully built to eliminate freelance payment delays, fraud, and non-delivery:

• **Milestone Escrow (Held Funds)**: Before work begins, the client's budget is locked securely in platform custody. Freelancers can work with complete peace of mind knowing the funds are guaranteed upon delivery.
• **Direct Local Payouts**: Seamless integration with **Easypaisa**, **JazzCash**, and **Local Pakistani Banks (IBAN)**—no PayPal or overseas conversion roadblocks.
• **AI-Verified Talent**: Freelancers take an automated 10-question voice & technical interview to unlock **Verified Skill Badges**.
• **Trust Score Engine (0–100)**: Every client and freelancer maintains a transparent reputation score driven by authentic reviews and completion track records.
• **Dedicated Dispute Protection**: If any disagreement occurs, our moderation team reviews delivery records to ensure fair resolution.

👉 **Quick Links**: [How Parwaz Works](/how-it-works) • [Browse Opportunities](/browse)`,
      isOutOfScope: false,
      emotion: "smile",
      quickAction: { label: "Explore Platform Safety", href: "/how-it-works" },
      suggestedQuestions: [
        "How to get clients fast on Parwaz?",
        "How do payments and withdrawals work?",
        "How does the AI Skill Interview work?",
      ],
    };
  }

  // -------------------------------------------------------------
  // 5. TOPIC 2: HOW TO GET CLIENTS FAST / FREELANCER SUCCESS TIPS
  // -------------------------------------------------------------
  const isFastClientQuery =
    /\b(get client|get clients|find client|find clients|fast|jaldi|quick|first order|order kaise|clients kaise|earn fast|more jobs|win bid|win proposal|client milenge|clients milte)\b/i.test(query);

  if (isFastClientQuery) {
    if (urdu) {
      return {
        reply: `### Parwaz.pk Par Jaldi Clients Hasil Karne Ke 5 Behtareen Tareeqay 🚀

Agar aap Parwaz par tezi se orders aur high-paying clients jeetna chahte hain, to yeh 5 zaroori tips follow karein:

1. **AI Skill Interview Pass Karke Badge Lagayein**: Clients verified freelancers par sab se pehle bharosa kartay hain. [/interview](/interview) par 10 sawalaat ka AI test dein aur apne profile par **Verified Badge** unlock karein.
2. **Pehle 15–30 Minute Mein Offer Submit Karein**: [/browse](/browse) par naye tasks check kartay rahein. Jo freelancer pehle 3 offers mein aata hai, client usay foran interview ke liye consider karta hai.
3. **Tailored Proposal Likhein (Copy-Paste Se Bachein)**: Client ka masla samajh kar wazeh hal batayein ke aap unka kaam kitni der mein aur kaisay behtareen tareeqay se mukammal karenge.
4. **Profile & Portfolio Ko 100% Mukammal Karein**: [/settings](/settings) mein ja kar apni degree, certifications, professional title, aur past case studies screenshots ke sath add karein.
5. **Trust Score Ko 80+ Par Rakhein**: Har task time par deliver karein aur 5-star ratings hasil karein. High trust score walay freelancers ki offers client ko sab se upar match percentage ke sath show hoti hain!

👉 **Abhi Action Lein**: [Browse Tasks](/browse) • [Take AI Skill Test](/interview)`,
        isOutOfScope: false,
        emotion: "happy",
        quickAction: { label: "Browse Open Tasks", href: "/browse" },
        suggestedQuestions: [
          "AI Skill Interview kaise kaam karta hai?",
          "Trust Score kaise barhta hai?",
          "Easypaisa aur JazzCash se payment kaise milegi?",
        ],
      };
    }

    return {
      reply: `### Top 5 Proven Strategies to Win Clients Fast on Parwaz.pk 🚀

To stand out on Parwaz and secure high-value clients quickly, apply these platform-tested tips:

1. **Pass the AI Skill Interview for Verified Badges**: Clients favor verified candidates. Complete our specialized 10-question evaluation at [/interview](/interview) to display a **Verified Badge** across your profile and all your offers.
2. **Submit Proposals Within 15–30 Minutes**: Monitor [/browse](/browse) frequently. Clients often select from the first 3 to 5 competitive proposals they receive.
3. **Write Custom, Problem-Solving Proposals**: Avoid generic templates. Acknowledge the client's specific task details, outline your step-by-step action plan, and specify an accurate delivery timeframe.
4. **Showcase Verified Credentials & Portfolio**: In [/settings](/settings), upload past project screenshots, list your hourly rate, and add your educational credentials to earn high trust.
5. **Maintain a High Trust Score (80+)**: Deliver on time and earn 5-star reviews. High trust scores significantly boost your AI match percentage, placing your proposal at the very top of the client's dashboard!

👉 **Quick Actions**: [Browse Open Tasks](/browse) • [Take AI Skill Test](/interview)`,
      isOutOfScope: false,
      emotion: "happy",
      quickAction: { label: "Browse Open Tasks", href: "/browse" },
      suggestedQuestions: [
        "How does the AI Skill Interview work?",
        "What is the Trust Score and how do I raise it?",
        "How do payments and withdrawals work?",
      ],
    };
  }

  // -------------------------------------------------------------
  // 6. TOPIC 3: WHAT IS THIS PLATFORM / ABOUT PARWAZ
  // -------------------------------------------------------------
  const isAboutQuery =
    /\b(what is this platform|what is parwaz|about parwaz|how does this work|overview|platform kya hai|ye platform kya hai|parwaz kya hai|batao ye kya hai)\b/i.test(query);

  if (isAboutQuery) {
    if (urdu) {
      return {
        reply: `### Parwaz.pk Kya Hai? 🌟

**Parwaz.pk Pakistan ka premier AI-powered freelancing aur task marketplace hai.** Yeh Pakistani clients aur verified freelancers ko transparent aur fixed prices par apas mein jorta hai:

• **Clients Ke Liye**: Aap asani se koi bhi project ya task post kar saktay hain ([/post](/post)), verified talent se offers le saktay hain, aur mehfooz tareeqay se kaam karwa saktay hain.
• **Freelancers Ke Liye**: Hazaron open tasks browse karein ([/browse](/browse)), AI interview pass kar ke verified badges hasil karein ([/badges](/badges)), aur direct Easypaisa/JazzCash mein kamai withdraw karein ([/wallet](/wallet)).
• **Airtasker + Upwork Ka Behtareen Imtezaaj**: Task posting ki asani aur Upwork jaisi milestone escrow security Pakistan ki apni local currency (PKR) mein!

👉 **Explore Karein**: [Tasks Dekhein](/browse) • [Task Post Karein](/post)`,
        isOutOfScope: false,
        emotion: "smile",
        quickAction: { label: "Explore Platform", href: "/how-it-works" },
        suggestedQuestions: [
          "Kya ye platform legit aur safe hai?",
          "Is platform par jaldi clients kaise milenge?",
          "Task kaise post karein?",
        ],
      };
    }

    return {
      reply: `### About Parwaz.pk 🌟

**Parwaz.pk is Pakistan's premier AI-powered freelancing and task marketplace.** It unites the simplicity of Airtasker with the contract security and milestone protection of Upwork, specifically tailored for Pakistan's digital economy:

• **For Clients**: Easily post tasks ([/post](/post)), review proposals from verified Pakistani talent, and release funds only after work is delivered to your satisfaction.
• **For Freelancers**: Browse live tasks ([/browse](/browse)), take the AI skill interview to earn verified badges ([/interview](/interview)), and withdraw earnings directly to Easypaisa, JazzCash, or your local bank.
• **Safe & Fixed-Price**: All projects operate on protected milestone escrow in Pakistani Rupees (PKR) with complete fraud protection and zero off-platform hassles.

👉 **Get Started**: [Browse Open Tasks](/browse) • [Post a Task Now](/post)`,
      isOutOfScope: false,
      emotion: "smile",
      quickAction: { label: "Explore Platform", href: "/how-it-works" },
      suggestedQuestions: [
        "Is this platform legit and safe?",
        "How to get clients fast on Parwaz?",
        "How do payments and withdrawals work?",
      ],
    };
  }

  // -------------------------------------------------------------
  // 7. TOPIC 4: POSTING A TASK (CLIENT GUIDE)
  // -------------------------------------------------------------
  const isPostTaskQuery =
    /\b(post (a |an )?(task|project|job)|how to (post|hire|create a job)|kaam karwana|task post|hire karna|post task|post project|hire freelancer)\b/i.test(query);

  if (isPostTaskQuery) {
    if (urdu) {
      return {
        reply: `### Parwaz Par Task Kaise Post Karein? 📝

Clients sirf 2 minute mein apna task post kar ke verified freelancers se offers hasil kar saktay hain:

1. Top bar mein **[Post a Task](/post)** par click karein ya [/post](/post) visit karein.
2. Apne task ka wazeh Title, Category (maslan IT & Web, Design, Cleaning, Writing), aur Description darj karein.
3. Apna fixed Budget (PKR) aur deadline select karein.
4. Task post hotay hi marketplace ([/browse](/browse)) par live ho jata hai aur freelancers proposals bhejna shuru kar dete hain.
5. Best offer select karein—funds platform par mehfooz custody mein hold ho jayenge aur private chat open ho jayegi!

👉 **Task Post Karein**: [Post a Task Now](/post)`,
        isOutOfScope: false,
        emotion: "speaking",
        quickAction: { label: "Post a Task Now", href: "/post" },
        suggestedQuestions: [
          "Kya ye platform legit aur safe hai?",
          "Easypaisa aur JazzCash se payment kaise milegi?",
          "Trust Score kaise kaam karta hai?",
        ],
      };
    }

    return {
      reply: `### How to Post a Task on Parwaz.pk 📝

Clients can easily hire verified talent in a few simple steps:

1. Click **[Post a Task](/post)** in the top navigation bar or visit [/post](/post).
2. Enter a clear project title, category (e.g. IT & Web, Design, Handyman, Writing), and detailed scope of work.
3. Set your fixed budget in Pakistani Rupees (PKR) and specify your deadline.
4. Once published, qualified Pakistani freelancers will submit bids and proposals on your project.
5. Review applicant profiles, check their **Verified Badges** and **Trust Scores**, and click **Select & hold funds** to kick off the work!

👉 **Start Hiring**: [Post a Task Now](/post)`,
      isOutOfScope: false,
      emotion: "speaking",
      quickAction: { label: "Post a Task Now", href: "/post" },
      suggestedQuestions: [
        "How do payments and withdrawals work?",
        "What is the Trust Score and how do I raise it?",
        "How to get clients fast on Parwaz?",
      ],
    };
  }

  // -------------------------------------------------------------
  // 8. TOPIC 5: BIDDING & FINDING WORK (FREELANCER GUIDE)
  // -------------------------------------------------------------
  const isBiddingQuery =
    /\b(bid|bids|bidding|proposal|proposals|find work|browse tasks|how to bid|offer kaise|bid kaise|apply kaise)\b/i.test(query);

  if (isBiddingQuery) {
    if (urdu) {
      return {
        reply: `### Tasks Dhoondna Aur Offers Bhejna 💼

Freelancers asani se marketplace par live projects par apply kar saktay hain:

1. [/browse](/browse) par ja kar apne shobay ke mutabiq open tasks dekhein.
2. Filter use karein (category, budget range, remote ya onsite).
3. Kisi bhi task ko khol kar right side par **Make an Offer** form bharein:
   - Apni offer price darj karein (kam az kam PKR 1,000).
   - Apna solid proposal likhein ke aap yeh kaam kaisay deliver karenge.
4. Jab client aapki offer select karega to funds hold ho jayenge aur direct client chat open ho jayegi!

👉 **Live Tasks Dekhein**: [Browse Tasks Now](/browse)`,
        isOutOfScope: false,
        emotion: "speaking",
        quickAction: { label: "Browse Tasks", href: "/browse" },
        suggestedQuestions: [
          "Is platform par jaldi clients kaise milenge?",
          "AI Skill Interview kaise kaam karta hai?",
          "Easypaisa aur JazzCash se payment kaise milegi?",
        ],
      };
    }

    return {
      reply: `### Browsing Tasks & Submitting Proposals 💼

Freelancers can explore hundreds of open opportunities across Pakistan:

1. Visit [/browse](/browse) to view all live, active marketplace tasks.
2. Filter by domain (IT & Web, Creative, Writing, etc.), budget, and remote vs onsite work.
3. Open any task detail page to view the client's specifications.
4. On the right side, enter your offer price (minimum PKR 1,000) and write a tailored proposal explaining your workflow.
5. Once the client awards you the task, project milestone funds are locked in platform custody and private chat activates!

👉 **Explore Opportunities**: [Browse Tasks Now](/browse)`,
      isOutOfScope: false,
      emotion: "speaking",
      quickAction: { label: "Browse Tasks", href: "/browse" },
      suggestedQuestions: [
        "How to get clients fast on Parwaz?",
        "How does the AI Skill Interview work?",
        "How do payments and withdrawals work?",
      ],
    };
  }

  // -------------------------------------------------------------
  // 9. TOPIC 6: AI SKILL INTERVIEW & VERIFIED BADGES
  // -------------------------------------------------------------
  const isInterviewQuery =
    /\b(interview|skill test|ai interview|test|badges|badge|verified badge|vetting|anti-cheat|test kaise|badge kaise)\b/i.test(query);

  if (isInterviewQuery) {
    if (urdu) {
      return {
        reply: `### AI Skill Interview Aur Verified Badges 🏆

Parwaz ka AI interview engine freelancers ki maharat ko test kar ke unhein verified badges deta hai:

• **10 Sawalaat Ka Evaluation**: Aapke chune huway shobay (React, Python, Design, Writing waghera) par 10 technical sawalaat pooche jatay hain.
• **AI Voice & Text Interviewer**: Interactive audio aur text format mein testing hoti hai.
• **Anti-Cheat Guard**: Tab switching aur copy-paste ko detect karta hai taake sirf haqeeqi talent verify ho.
• **Official Verified Badge**: Test pass kartay hi aapke public profile aur tamam bids par **Verified Badge** lag jata hai, jis se clients aapko tarjeeh dete hain!

👉 **Test Shuru Karein**: [Take AI Skill Test](/interview) • [Badges Dekhein](/badges)`,
        isOutOfScope: false,
        emotion: "happy",
        quickAction: { label: "Take Skill Interview", href: "/interview" },
        suggestedQuestions: [
          "Is platform par jaldi clients kaise milenge?",
          "Trust Score kaise barhta hai?",
          "Kya ye platform legit aur safe hai?",
        ],
      };
    }

    return {
      reply: `### AI Skill Interview & Verified Badges 🏆

Parwaz features an automated AI testing engine that verifies freelancer skills and awards badges:

• **10 Specialized Questions**: Evaluates your chosen domain (Full-Stack, React, Python, UI/UX Design, Content Writing, etc.).
• **AI Voice & Text Interaction**: Features realistic AI question delivery and smart scoring out of 100.
• **Anti-Cheat Guard**: Monitors tab switching and copy-paste attempts to maintain 100% credential integrity.
• **Verified Badge Unlocked**: Passing candidates earn the official **Verified Badge** on their public profile ([/profile](/profile)) and on every bid submitted!

👉 **Take the Test**: [Start AI Interview](/interview) • [View Badges](/badges)`,
      isOutOfScope: false,
      emotion: "happy",
      quickAction: { label: "Take Skill Interview", href: "/interview" },
      suggestedQuestions: [
        "How to get clients fast on Parwaz?",
        "What is the Trust Score and how do I raise it?",
        "How do payments and withdrawals work?",
      ],
    };
  }

  // -------------------------------------------------------------
  // 10. TOPIC 7: PAYMENTS, WALLET & WITHDRAWALS (EASYPAISA / JAZZCASH)
  // -------------------------------------------------------------
  const isPaymentQuery =
    /\b(wallet|payment|payments|withdraw|withdrawal|easypaisa|jazzcash|bank transfer|iban|fee|commission|payout|paise kaise|paisa nikalna)\b/i.test(query);

  if (isPaymentQuery) {
    if (urdu) {
      return {
        reply: `### Wallet, Payments Aur Withdrawals 💳

Parwaz par payments ka nizam 100% mehfooz aur Pakistani financial channels par mushtamil hai:

• **Milestone Escrow (Held Funds)**: Task award hotay hi client ki payment platform custody mein mehfooz ho jati hai.
• **Payment Release**: Kaam complete honay aur client ki approval ke baad funds foran aapke available wallet balance mein credit ho jatay hain.
• **Withdrawal Tareeqay**: Aap apni kamai direct **Easypaisa**, **JazzCash**, ya **Pakistani Bank Account (IBAN)** mein withdraw kar saktay hain.
• **Platform Commission**: Task mukammal honay par 15% standard platform deduction hoti hai jo platform protection aur escrow service ko cover karti hai.

👉 **Apna Wallet Dekhein**: [Open Wallet](/wallet)`,
        isOutOfScope: false,
        emotion: "smile",
        quickAction: { label: "Open Wallet", href: "/wallet" },
        suggestedQuestions: [
          "Kya ye platform legit aur safe hai?",
          "Is platform par jaldi clients kaise milenge?",
          "Trust Score kaise barhta hai?",
        ],
      };
    }

    return {
      reply: `### Wallet, Milestone Escrow & Local Payouts 💳

Payments on Parwaz operate on a safe, held milestone architecture built for Pakistan:

• **Milestone Custody**: When a client accepts an offer, task funds are locked safely in escrow before work begins.
• **Instant Release**: Once work is delivered and approved by the client, funds move immediately into your available wallet balance.
• **Direct Pakistani Payouts**: Withdraw funds via **Easypaisa**, **JazzCash**, or **Local Bank Transfer (IBAN)**.
• **Platform Fee**: A transparent 15% platform commission applies only on successfully completed tasks, funding payment protection and escrow safety.

👉 **Manage Earnings**: [Open Your Wallet](/wallet)`,
      isOutOfScope: false,
      emotion: "smile",
      quickAction: { label: "Open Your Wallet", href: "/wallet" },
      suggestedQuestions: [
        "Is this platform legit and safe?",
        "How to get clients fast on Parwaz?",
        "What is the Trust Score and how do I raise it?",
      ],
    };
  }

  // -------------------------------------------------------------
  // 11. TOPIC 8: TRUST SCORE ENGINE
  // -------------------------------------------------------------
  const isTrustQuery =
    /\b(trust score|trust rating|reputation|5 star|trust kaise|score kaise)\b/i.test(query);

  if (isTrustQuery) {
    if (urdu) {
      return {
        reply: `### Trust Score Engine (0–100) 🌟

Parwaz har account ka dynamic Trust Score calculate karta hai taake genuine users ko highlight kiya ja sakay:

• **Baseline Score**: Naye accounts ka initial score **70 points** se start hota hai.
• **+2 Points**: Har **5-star review** par aapka score 2 points barhta hai.
• **-2 Points**: 2 stars ya us se kam rating par score 2 points girta hai.
• **-20 Points Penalty**: Platform se bahar payment mangnay ya WhatsApp number share karnay par bhaari penalty lagti hai.
• **Fayda**: 80+ Trust Score walay freelancers ki offers client ko sab se pehle dikhayi jati hain!

👉 **Dashboard Dekhein**: [Open Dashboard](/dashboard)`,
        isOutOfScope: false,
        emotion: "smile",
        quickAction: { label: "View Dashboard", href: "/dashboard" },
        suggestedQuestions: [
          "Is platform par jaldi clients kaise milenge?",
          "AI Skill Interview kaise kaam karta hai?",
          "Easypaisa aur JazzCash se payment kaise milegi?",
        ],
      };
    }

    return {
      reply: `### Trust Score Engine (0–100) 🌟

Parwaz dynamically computes an authentic Trust Score for each user to promote reliability:

• **Baseline**: All active accounts start with a default Trust Score of **70 points**.
• **Positive Boost**: Every **5-star review** earned increases your score by **+2 points**.
• **Negative Penalty**: Reviews of 2 stars or lower deduct **-2 points**.
• **Violation Penalty**: Attempting off-platform escrow bypass or contact sharing triggers an immediate **-20 point deduction**.
• **Matching Advantage**: Freelancers with scores above 80 enjoy priority placement in client AI recommendation feeds!

👉 **Check Your Reputation**: [Open Dashboard](/dashboard)`,
      isOutOfScope: false,
      emotion: "smile",
      quickAction: { label: "Open Dashboard", href: "/dashboard" },
      suggestedQuestions: [
        "How to get clients fast on Parwaz?",
        "How does the AI Skill Interview work?",
        "How do payments and withdrawals work?",
      ],
    };
  }

  // -------------------------------------------------------------
  // 12. TOPIC 9: FRAUD RULES, WHATSAPP & OFF-PLATFORM POLICIES
  // -------------------------------------------------------------
  const isSafetyRulesQuery =
    /\b(whatsapp|phone number|direct contact|bypass|rules|scam|ban|policy|guidelines|contact share)\b/i.test(query);

  if (isSafetyRulesQuery) {
    if (urdu) {
      return {
        reply: `### Safety Rules Aur Contact Sharing Policy 🚫

Donon parties ki hifazat ke liye Parwaz par sakht safety rules nafiz hain:

• **Off-Platform Contacts Mamnoo Hain**: Task assign hone se pehle personal WhatsApp, phone number, ya email share karna mana hai.
• **Automated Scanners**: Chat aur proposals mein links, phone numbers aur emails ko system foran detect kar ke flag kar deta hai.
• **Direct Payment Ka Khatra**: Platform ke bahar payment lene ya dene se held escrow protection khatam ho jati hai aur account ban ho sakta hai.
• **Contract Chat**: Jab client aapki offer select kar leta hai, to platform par hi direct messaging open ho jati hai!

👉 **Guidelines Dekhein**: [Community Guidelines](/community-guidelines)`,
        isOutOfScope: false,
        emotion: "curious",
        quickAction: { label: "Community Guidelines", href: "/community-guidelines" },
        suggestedQuestions: [
          "Kya ye platform legit aur safe hai?",
          "Easypaisa aur JazzCash se payment kaise milegi?",
          "Is platform par jaldi clients kaise milenge?",
        ],
      };
    }

    return {
      reply: `### Platform Safety Rules & Anti-Fraud Policies 🚫

To protect clients and freelancers from scam attempts, Parwaz enforces strict communication rules:

• **No Pre-Contract Contact Sharing**: Exchanging personal WhatsApp numbers, personal emails, or social handles before a contract is awarded is strictly prohibited.
• **Real-Time Content Detection**: Our automated scanner flags sensitive links, phone digits, and emails to prevent fraud.
• **Payment Protection Loss**: Conducting payments outside Parwaz removes all held escrow protection and results in an immediate **-20 Trust Score penalty** or account suspension.
• **Secure In-App Chat**: Once an offer is awarded, full private real-time chat unlocks within Parwaz!

👉 **Read More**: [Community Guidelines](/community-guidelines)`,
      isOutOfScope: false,
      emotion: "curious",
      quickAction: { label: "Community Guidelines", href: "/community-guidelines" },
      suggestedQuestions: [
        "Is this platform legit and safe?",
        "How do payments and withdrawals work?",
        "What is the Trust Score and how do I raise it?",
      ],
    };
  }

  // -------------------------------------------------------------
  // 13. TOPIC 10: PROFILE, PORTFOLIO & SETTINGS
  // -------------------------------------------------------------
  const isProfileQuery =
    /\b(profile|portfolio|education|degree|photo|avatar|settings|hourly rate|bio)\b/i.test(query);

  if (isProfileQuery) {
    if (urdu) {
      return {
        reply: `### Profile Aur Portfolio Setup 🎨

Aapka Parwaz profile aapka digital identity card hai:

• **Settings Mein Jayein**: [/settings](/settings) par ja kar apna avatar, professional title, bio aur hourly rate set karein.
• **Education Verification**: Apni degree aur educational documents upload karein.
• **Portfolio Projects**: Apne pichle kaam ke screenshots aur case studies add karein taake clients aapke kaam ki quality dekh sakein.
• **Public Profile**: Clients aapka profile [/u/your-id](/profile) par dekhtay hain.

👉 **Settings Kholein**: [Edit Profile & Settings](/settings)`,
        isOutOfScope: false,
        emotion: "smile",
        quickAction: { label: "Account Settings", href: "/settings" },
        suggestedQuestions: [
          "Is platform par jaldi clients kaise milenge?",
          "AI Skill Interview kaise kaam karta hai?",
          "Kya ye platform legit aur safe hai?",
        ],
      };
    }

    return {
      reply: `### Profile, Portfolio & Education Setup 🎨

Your Parwaz profile establishes your professional presence:

• **Update Details**: In [/settings](/settings), set your profile photo, professional title, bio, hourly rate, and core skills.
• **Verified Education**: Upload degree and certificate documents to verify your educational background.
• **Showcase Portfolio**: Add case studies with project screenshots, deliverables, and client outcomes.
• **Public View**: Review how clients see your profile anytime at [/u/your-id](/profile).

👉 **Update Now**: [Account Settings](/settings)`,
      isOutOfScope: false,
      emotion: "smile",
      quickAction: { label: "Account Settings", href: "/settings" },
      suggestedQuestions: [
        "How to get clients fast on Parwaz?",
        "How does the AI Skill Interview work?",
        "What is the Trust Score and how do I raise it?",
      ],
    };
  }

  // -------------------------------------------------------------
  // 14. TOPIC 11: DISPUTES, REFUNDS & SUPPORT
  // -------------------------------------------------------------
  const isSupportQuery =
    /\b(dispute|disputes|refund|cancel|cancellation|support|help|customer service|contact|masla|shikayat)\b/i.test(query);

  if (isSupportQuery) {
    if (urdu) {
      return {
        reply: `### Disputes, Refunds Aur Support 🤝

Parwaz par har project mein fair support aur dispute resolution mojood hai:

• **Dispute Raise Karein**: Agar kaam standard ke mutabiq na ho ya koi disagreement ho, to structured dispute open kiya ja sakta hai.
• **Moderation Review**: Parwaz ki support team task details aur delivery files ka jaiza leti hai.
• **Refunds**: Agar kaam deliver na ho, to client ke held funds unke wallet balance mein wapas kar diye jatay hain.
• **Contact Us**: Kisi bhi madad ke liye aap [/help](/help) ya [/contact](/contact) par contact kar saktay hain.

👉 **Help Desk**: [Get Help & Support](/help)`,
        isOutOfScope: false,
        emotion: "speaking",
        quickAction: { label: "Get Help & Support", href: "/help" },
        suggestedQuestions: [
          "Kya ye platform legit aur safe hai?",
          "Easypaisa aur JazzCash se payment kaise milegi?",
          "Trust Score kaise kaam karta hai?",
        ],
      };
    }

    return {
      reply: `### Disputes, Cancellations & Customer Support 🤝

Parwaz provides dedicated dispute resolution to safeguard both clients and freelancers:

• **Open a Dispute**: If a deliverable does not match specifications or a conflict arises, either party can file a dispute with evidence.
• **Moderator Review**: Our support team reviews all submitted work and contract milestones.
• **Refunds**: If work is incomplete or cancelled, held escrow funds are safely returned to the client's wallet.
• **Support Access**: Reach out anytime through [/help](/help) or [/contact](/contact).

👉 **Need Assistance**: [Visit Help Center](/help)`,
      isOutOfScope: false,
      emotion: "speaking",
      quickAction: { label: "Visit Help Center", href: "/help" },
      suggestedQuestions: [
        "Is this platform legit and safe?",
        "How do payments and withdrawals work?",
        "How to get clients fast on Parwaz?",
      ],
    };
  }

  // -------------------------------------------------------------
  // 15. COMPREHENSIVE PLATFORM GENERAL ASSISTANCE
  // -------------------------------------------------------------
  if (urdu) {
    return {
      reply: `Main Parwaz.pk par aapki mukammal madad karne ke liye hazir hoon! 🌟

Aap mujh se platform ke baray mein yeh sab pooch saktay hain:

• **Clients Ke Liye**: [Task Kaise Post Karein](/post) aur verified freelancers kaise select karein.
• **Freelancers Ke Liye**: [Naye Tasks Kaise Dhoondein](/browse), [AI Skill Interview](/interview) pass karke [Verified Badges](/badges) kaise lein, aur jaldi clients kaise jeetein.
• **Payments & Safety**: [Wallet](/wallet) mein held funds, Easypaisa aur JazzCash payouts.

Aap platform ke baray mein mazeed kya janna chahte hain?`,
      isOutOfScope: false,
      emotion: "speaking",
      suggestedQuestions: DEFAULT_SUGGESTIONS_UR.slice(0, 3),
    };
  }

  return {
    reply: `I can certainly help you with that on Parwaz.pk! 🌟

Here are the key areas I specialize in:

• **For Clients**: How to [Post a Task](/post), set budgets, and select verified Pakistani freelancers.
• **For Freelancers**: How to [Browse Opportunities](/browse), take the [AI Skill Interview](/interview) to earn [Verified Badges](/badges), and win clients quickly.
• **Payments & Safety**: Held milestone funds via Easypaisa, JazzCash, and local banks in your [Wallet](/wallet).

Which specific part of the platform would you like to explore?`,
    isOutOfScope: false,
    emotion: "speaking",
    suggestedQuestions: DEFAULT_SUGGESTIONS_EN.slice(0, 3),
  };
}
