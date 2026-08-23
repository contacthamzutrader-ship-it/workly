import { MCQQuestion, CodingChallenge, PracticalTask, AIInterviewQuestion, NicheCategory, CandidateProfile } from '@/types/interview';

export interface NicheTestData {
  niche: NicheCategory;
  nicheTitle: string;
  description: string;
  mcqQuestions: MCQQuestion[];
  codingChallenge?: CodingChallenge;
  practicalTask?: PracticalTask;
  aiInterviewQuestions: AIInterviewQuestion[];
}

export const NICHE_TEST_REGISTRY: Record<NicheCategory, NicheTestData> = {
  frontend: {
    niche: 'frontend',
    nicheTitle: 'Frontend Web Development (React / Next.js / TypeScript)',
    description: '30-minute balanced assessment covering performant UI rendering, state synchronization, Core Web Vitals, and TypeScript edge cases.',
    mcqQuestions: [
      {
        id: 'fe_mcq_1',
        scenario: 'A client dashboard with 500 table rows lags whenever a user types into a real-time filter search bar.',
        question: 'Which optimization pattern resolves typing latency without breaking sort order or row selection?',
        options: [
          { id: 'opt_1', text: 'Wrap the entire table in React.memo and push filter state to global Redux.' },
          { id: 'opt_2', text: 'Apply useDeferredValue / debounce to the filter query and virtualize row rendering with a windowing library.' },
          { id: 'opt_3', text: 'Switch table rows from <div> to <table> and invoke useLayoutEffect on every keystroke.' },
          { id: 'opt_4', text: 'Re-fetch table data from the REST backend on every keystroke.' },
        ],
        correctOptionId: 'opt_2',
        explanation: 'De-prioritizing the high-frequency re-render with useDeferredValue / debounce combined with virtualization directly eliminates typing lag.',
        difficulty: 'medium',
        tags: ['React', 'Performance', 'useDeferredValue', 'Virtualization'],
        points: 10,
      },
      {
        id: 'fe_mcq_2',
        scenario: 'A third-party analytics script in a Next.js App Router project must not degrade the Initial LCP (Largest Contentful Paint).',
        question: 'What is the correct Next.js Script loading strategy?',
        options: [
          { id: 'opt_1', text: '<Script strategy="lazyOnload" /> in the root layout.' },
          { id: 'opt_2', text: '<script async defer> inside document.body directly in a React useEffect hook.' },
          { id: 'opt_3', text: '<Script strategy="beforeInteractive" /> inside the main page component.' },
          { id: 'opt_4', text: 'Injecting the script in the SSR response headers via middleware.' },
        ],
        correctOptionId: 'opt_1',
        explanation: 'strategy="lazyOnload" executes non-critical third-party scripts during browser idle time after critical DOM parsing.',
        difficulty: 'medium',
        tags: ['Next.js', 'Core Web Vitals', 'Performance'],
        points: 10,
      },
      {
        id: 'fe_mcq_3',
        scenario: 'A custom modal closes when clicking the backdrop overlay, but clicking inside the modal content box also triggers the close handler.',
        question: 'What DOM event mechanism causes this bug, and how should it be fixed?',
        options: [
          { id: 'opt_1', text: 'CSS z-index is too low; increase z-index on the inner modal.' },
          { id: 'opt_2', text: 'Event bubbling propagates the click up to the backdrop listener; call e.stopPropagation() on the inner content or check e.target === e.currentTarget.' },
          { id: 'opt_3', text: 'React useState re-renders synchronously before mouseup completes.' },
          { id: 'opt_4', text: 'Set pointer-events: none on the backdrop overlay.' },
        ],
        correctOptionId: 'opt_2',
        explanation: 'Browser events bubble up the hierarchy. Stopping propagation prevents backdrop handlers from firing on child clicks.',
        difficulty: 'medium',
        tags: ['JavaScript', 'DOM Events', 'Event Bubbling'],
        points: 10,
      },
      {
        id: 'fe_mcq_4',
        scenario: 'You need to preserve user filter state across browser refreshes and allow sharing the filtered view via URL in a Next.js client component.',
        question: 'Which pattern is the most idiomatic and SEO-friendly solution?',
        options: [
          { id: 'opt_1', text: 'Save filters in localStorage on change and read in useEffect.' },
          { id: 'opt_2', text: 'Store filters in URL search params using useSearchParams and useRouter.replace with URLSearchParams.' },
          { id: 'opt_3', text: 'Write filter parameters into document.cookie with 24-hour expiration.' },
          { id: 'opt_4', text: 'Keep filters in React Context and transmit through WebSockets.' },
        ],
        correctOptionId: 'opt_2',
        explanation: 'Synchronizing state with URL search params makes the view bookmarkable, shareable, and resilient across reloads.',
        difficulty: 'medium',
        tags: ['Next.js', 'URL State', 'Client Components'],
        points: 10,
      },
      {
        id: 'fe_mcq_5',
        scenario: 'A freelance client requests that an e-commerce cart badge updates in real time across multiple open browser tabs of the same user.',
        question: 'Which native browser API provides the cleanest zero-backend solution for cross-tab communication?',
        options: [
          { id: 'opt_1', text: 'BroadcastChannel API or the "storage" event listener on window for localStorage changes.' },
          { id: 'opt_2', text: 'Continuous polling with setInterval every 100ms.' },
          { id: 'opt_3', text: 'Navigator.sendBeacon API with a service worker loop.' },
          { id: 'opt_4', text: 'WebRTC data channels paired through localhost.' },
        ],
        correctOptionId: 'opt_1',
        explanation: 'BroadcastChannel and the window storage event provide native, lightweight cross-tab pub/sub messaging without backend round-trips.',
        difficulty: 'medium',
        tags: ['Web APIs', 'State Management', 'Architecture'],
        points: 10,
      },
      {
        id: 'fe_mcq_6',
        scenario: 'A TypeScript React component receives a generic `items: T[]` prop and a render callback `renderItem: (item: T) => ReactNode`.',
        question: 'How do you declare this generic functional component properly in TypeScript (.tsx)?',
        options: [
          { id: 'opt_1', text: 'function List<T,>(props: ListProps<T>) { ... }' },
          { id: 'opt_2', text: 'const List: React.FC<T> = (props) => { ... }' },
          { id: 'opt_3', text: 'function List(props: any<T>) { ... }' },
          { id: 'opt_4', text: 'declare module List<T>' },
        ],
        correctOptionId: 'opt_1',
        explanation: 'In TSX files, generic type arguments in function declarations require `<T,>` or standard function syntax to avoid ambiguity with JSX tags.',
        difficulty: 'medium',
        tags: ['TypeScript', 'Generics', 'React'],
        points: 10,
      },
      {
        id: 'fe_mcq_7',
        scenario: 'Images on a blog page cause Cumulative Layout Shift (CLS) as they load asynchronously.',
        question: 'What is the standard CSS / HTML remedy to guarantee zero layout shift?',
        options: [
          { id: 'opt_1', text: 'Set explicit width and height attributes or CSS aspect-ratio on image containers so the browser reserves space before download.' },
          { id: 'opt_2', text: 'Hide images until window.onload fires.' },
          { id: 'opt_3', text: 'Use opacity: 0 and fade in with CSS keyframes.' },
          { id: 'opt_4', text: 'Convert all images to SVG format.' },
        ],
        correctOptionId: 'opt_1',
        explanation: 'Providing intrinsic dimensions allows the browser layout engine to allocate the exact bounding box prior to image download.',
        difficulty: 'medium',
        tags: ['CSS', 'CLS', 'Core Web Vitals'],
        points: 10,
      },
      {
        id: 'fe_mcq_8',
        scenario: 'A custom `useDebounce` hook is causing stale closure bugs where it always logs the initial state rather than the latest state.',
        question: 'How should the hook be refactored to always access the latest callback / value without restarting the timer unnecessarily?',
        options: [
          { id: 'opt_1', text: 'Store the latest callback in a `useRef` and update it on every render, while keeping the setTimeout timer stable.' },
          { id: 'opt_2', text: 'Add `Date.now()` to the useEffect dependency array.' },
          { id: 'opt_3', text: 'Use `useMemo` instead of `useCallback`.' },
          { id: 'opt_4', text: 'Execute the callback synchronously inside useState setter.' },
        ],
        correctOptionId: 'opt_1',
        explanation: 'Using a ref for the latest callback decouples the stable debounce timer from rapidly changing callback closures.',
        difficulty: 'medium',
        tags: ['React Hooks', 'useRef', 'Closures'],
        points: 10,
      },
      {
        id: 'fe_mcq_9',
        scenario: 'You are implementing an infinite scroll feed that triggers loading more items when the user scrolls near the bottom.',
        question: 'Which modern Web API provides the most battery-efficient and performant implementation compared to listening to `window.onscroll`?',
        options: [
          { id: 'opt_1', text: 'IntersectionObserver API observing a bottom sentinel element.' },
          { id: 'opt_2', text: 'MutationObserver API observing document.body childList.' },
          { id: 'opt_3', text: 'ResizeObserver API tracking viewport height.' },
          { id: 'opt_4', text: 'Web Animation API.' },
        ],
        correctOptionId: 'opt_1',
        explanation: 'IntersectionObserver runs asynchronously off the main thread and avoids continuous layout thrashing associated with scroll event listeners.',
        difficulty: 'medium',
        tags: ['IntersectionObserver', 'Performance', 'Infinite Scroll'],
        points: 10,
      },
      {
        id: 'fe_mcq_10',
        scenario: 'A critical modal contains a form that must trap keyboard focus so pressing `Tab` does not escape to background elements behind the modal.',
        question: 'What is the correct accessibility (a11y) focus management implementation?',
        options: [
          { id: 'opt_1', text: 'Listen to `keydown` for `Tab`, check first/last focusable elements inside the modal, cycle focus, and restore focus to the trigger button on modal close.' },
          { id: 'opt_2', text: 'Set tabindex="-1" on document.body.' },
          { id: 'opt_3', text: 'Disable the keyboard when the modal opens.' },
          { id: 'opt_4', text: 'Hide all background elements with display: none while open.' },
        ],
        correctOptionId: 'opt_1',
        explanation: 'Focus trapping intercepts Tab and Shift+Tab to keep focus within active modal boundaries, and returns focus to the opener button upon unmounting.',
        difficulty: 'medium',
        tags: ['Accessibility', 'a11y', 'Focus Trap', 'WCAG'],
        points: 10,
      },
    ],
    codingChallenge: {
      id: 'fe_code_1',
      title: 'Build a Resilient Rate-Limited Cache Manager',
      difficulty: 'medium',
      language: 'javascript',
      timeLimitMinutes: 12,
      realWorldContext: 'Freelance clients frequently need client-side caching with Time-To-Live (TTL) to avoid redundant API calls and respect rate limits.',
      description: `Implement a \`CacheManager\` class with \`set(key, value, ttlMs)\`, \`get(key)\`, and \`has(key)\` methods.
- \`set(key, value, ttlMs)\`: Stores a key with an expiration time. If \`ttlMs\` is omitted, it defaults to 5000ms.
- \`get(key)\`: Returns the cached value if valid, or \`null\` if expired or non-existent.
- \`has(key)\`: Returns \`true\` if key exists and is not expired, else \`false\`.
- \`clearExpired()\`: Removes all expired entries and returns the count of purged items.`,
      starterCode: `class CacheManager {
  constructor() {
    this.store = new Map();
  }

  set(key, value, ttlMs = 5000) {
    const expiresAt = Date.now() + ttlMs;
    this.store.set(key, { value, expiresAt });
  }

  get(key) {
    if (!this.store.has(key)) return null;
    const item = this.store.get(key);
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  clearExpired() {
    let count = 0;
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (now > item.expiresAt) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }
}

module.exports = CacheManager;
`,
      testCases: [
        {
          id: 'tc_1',
          input: 'const c = new CacheManager(); c.set("user", { name: "Alex" }, 10000); c.get("user")',
          expectedOutput: '{"name":"Alex"}',
          description: 'Retrieves active key within TTL',
        },
        {
          id: 'tc_2',
          input: 'const c = new CacheManager(); c.set("temp", 42, -100); c.get("temp")',
          expectedOutput: 'null',
          description: 'Returns null and cleans up expired key',
        },
        {
          id: 'tc_3',
          input: 'const c = new CacheManager(); c.set("a", 1, -1); c.set("b", 2, 5000); c.clearExpired()',
          expectedOutput: '1',
          description: 'Purges expired entries correctly',
        },
      ],
      hints: [
        'Store an object like `{ value, expiresAt: Date.now() + ttlMs }` in your Map.',
        'In get(key), check if `Date.now() > item.expiresAt`. If so, delete the key and return null.',
      ],
    },
    aiInterviewQuestions: [
      {
        id: 'fe_ai_1',
        question: 'Explain how you diagnose and optimize Core Web Vitals (specifically LCP, INP, and CLS) on a slow client website.',
        category: 'technical_depth',
        expectedKeyPoints: ['Image optimization (Next/Image, responsive sizes, priority flag)', 'Font loading with display: swap or next/font', 'Eliminating layout shifts by setting fixed width/height aspect ratios', 'Code splitting, dynamic imports, and deferring non-critical scripts'],
      },
      {
        id: 'fe_ai_2',
        question: 'How do you structure React Error Boundaries and graceful fallbacks so users never experience a blank white screen during runtime errors?',
        category: 'problem_solving',
        expectedKeyPoints: ['Component-level error boundaries with getDerivedStateFromError and componentDidCatch', 'User-friendly fallback UI with retry button', 'Reporting client runtime errors to Sentry or Datadog', 'Network offline toast and recovery states'],
      },
      {
        id: 'fe_ai_3',
        question: 'When migrating a large legacy client codebase to React Server Components (RSC) in Next.js, how do you decide what belongs on the server versus client?',
        category: 'architecture',
        expectedKeyPoints: ['Keep data fetching, secrets, heavy dependencies on the server', 'Use "use client" only at the leaf level for interactive state, event handlers, and browser APIs', 'Pass server components as children or slots to client containers to prevent full-tree client bundling'],
      },
      {
        id: 'fe_ai_4',
        question: 'How do you handle scope creep and changing client requirements during an active freelance contract without damaging the relationship?',
        category: 'freelance_delivery',
        expectedKeyPoints: ['Acknowledge and validate the client vision proactively', 'Clearly explain original scope vs new requests with transparent change orders', 'Offer Phase 2 roadmap options or trade-offs against non-critical milestones'],
      },
    ],
  },

  backend: {
    niche: 'backend',
    nicheTitle: 'Backend & API Engineering (Node.js / Python / SQL)',
    description: '30-minute balanced assessment covering concurrent transactions, rate limiting, indexing, security, and resilient microservices.',
    mcqQuestions: [
      {
        id: 'be_mcq_1',
        scenario: 'Two concurrent users attempt to purchase the last available item in an inventory system at the exact same millisecond.',
        question: 'Which database technique prevents overselling without locking the entire products table?',
        options: [
          { id: 'opt_1', text: 'Wrap the update in a Read-Uncommitted transaction.' },
          { id: 'opt_2', text: 'Use an atomic conditional update like `UPDATE inventory SET stock = stock - 1 WHERE id = :id AND stock > 0` or SELECT FOR UPDATE pessimistic locking.' },
          { id: 'opt_3', text: 'Store stock quantity in an in-memory global array before writing to database asynchronously.' },
          { id: 'opt_4', text: 'Create a database trigger that deletes the item row prior to updating.' },
        ],
        correctOptionId: 'opt_2',
        explanation: 'Atomic conditional updates (`WHERE stock > 0`) guarantee row-level consistency and eliminate race conditions.',
        difficulty: 'medium',
        tags: ['Database', 'Transactions', 'Concurrency', 'SQL'],
        points: 10,
      },
      {
        id: 'be_mcq_2',
        scenario: 'A freelance client reports that their Node.js REST API slows down dramatically under 100 concurrent requests due to heavy bcrypt password hashing.',
        question: 'Why does bcrypt impact the Node.js event loop, and what is the proper fix?',
        options: [
          { id: 'opt_1', text: 'Bcrypt uses CPU-bound crypto operations; using synchronous `bcrypt.hashSync` blocks the main thread. Solution: use asynchronous `bcrypt.hash` or offload to worker threads / auth microservice.' },
          { id: 'opt_2', text: 'Bcrypt requires raw TCP sockets that exhaust Node.js file descriptors.' },
          { id: 'opt_3', text: 'Node.js cannot handle asynchronous callbacks without Redis.' },
          { id: 'opt_4', text: 'Passwords should be hashed with MD5 instead of bcrypt for speed.' },
        ],
        correctOptionId: 'opt_1',
        explanation: 'Bcrypt is computationally intensive. Synchronous hashing halts the single-threaded event loop, whereas async methods utilize the libuv threadpool.',
        difficulty: 'medium',
        tags: ['Node.js', 'Event Loop', 'Security', 'Performance'],
        points: 10,
      },
      {
        id: 'be_mcq_3',
        scenario: 'You are designing JWT authentication for a multi-tenant SaaS application.',
        question: 'Where should sensitive access tokens be stored on the client side to prevent XSS credential theft?',
        options: [
          { id: 'opt_1', text: 'In `localStorage` with AES encryption in JavaScript.' },
          { id: 'opt_2', text: 'In `sessionStorage` with a base64 encoded header.' },
          { id: 'opt_3', text: 'In an `httpOnly`, `Secure`, `SameSite=Strict` cookie paired with CSRF protection.' },
          { id: 'opt_4', text: 'In the URL query parameters of each API request.' },
        ],
        correctOptionId: 'opt_3',
        explanation: 'HttpOnly cookies cannot be accessed by JavaScript document.cookie, neutralizing token extraction via XSS attacks.',
        difficulty: 'medium',
        tags: ['Security', 'JWT', 'Auth', 'XSS'],
        points: 10,
      },
      {
        id: 'be_mcq_4',
        scenario: 'A PostgreSQL query filtering users by `email` and sorting by `created_at` on a table with 2 million rows is taking 1400ms.',
        question: 'Which index will optimize this query most effectively?',
        options: [
          { id: 'opt_1', text: 'A single B-Tree composite index on `(email, created_at DESC)`.' },
          { id: 'opt_2', text: 'Two separate Hash indexes on `email` and `created_at`.' },
          { id: 'opt_3', text: 'A GIN index on the entire table.' },
          { id: 'opt_4', text: 'Increasing the database RAM without adding indexes.' },
        ],
        correctOptionId: 'opt_1',
        explanation: 'A composite B-Tree index covering both the filter column and sort order allows index scans without expensive disk lookups or sorting passes.',
        difficulty: 'medium',
        tags: ['PostgreSQL', 'Indexing', 'Query Optimization'],
        points: 10,
      },
      {
        id: 'be_mcq_5',
        scenario: 'An external payment webhook arrives multiple times for the same transaction due to network retries.',
        question: 'How should you architect the webhook receiver to ensure idempotency?',
        options: [
          { id: 'opt_1', text: 'Process the payment each time and refund duplicates later.' },
          { id: 'opt_2', text: 'Store the webhook transaction ID / idempotency key in a database table with a unique constraint, checking if it was already processed before applying balance changes.' },
          { id: 'opt_3', text: 'Drop all requests arriving within 5 seconds of the first.' },
          { id: 'opt_4', text: 'Disable SSL verification on the webhook endpoint.' },
        ],
        correctOptionId: 'opt_2',
        explanation: 'Using an idempotency key with unique database constraints ensures that duplicate delivery attempts are safely acknowledged without repeated state mutations.',
        difficulty: 'medium',
        tags: ['Webhooks', 'Idempotency', 'System Design'],
        points: 10,
      },
      {
        id: 'be_mcq_6',
        scenario: 'A Redis cache key expires, and 500 concurrent incoming requests simultaneously query the PostgreSQL database for the same record.',
        question: 'What is this database failure pattern called, and how is it prevented?',
        options: [
          { id: 'opt_1', text: 'Cache Stampede (Thundering Herd); resolve using probabilistic early expiration (XFetch), mutex locking (singleflight), or background cache warmers.' },
          { id: 'opt_2', text: 'SQL Injection; resolve by escaping strings.' },
          { id: 'opt_3', text: 'Memory Leak; resolve by restarting Redis.' },
          { id: 'opt_4', text: 'CORS violation; resolve by setting Access-Control-Allow-Origin.' },
        ],
        correctOptionId: 'opt_1',
        explanation: 'Cache stampede occurs when expired hot keys overwhelm the origin DB. Mutex locks or early refresh algorithms ensure only one query hits the DB.',
        difficulty: 'medium',
        tags: ['Redis', 'Caching', 'Thundering Herd', 'Scalability'],
        points: 10,
      },
      {
        id: 'be_mcq_7',
        scenario: 'A REST endpoint uploads user avatar images and saves them directly to local server disk `/uploads/avatar.png`.',
        question: 'Why does this architecture break when scaling horizontally across multiple cloud server instances behind a load balancer?',
        options: [
          { id: 'opt_1', text: 'Local disk storage is ephemeral and instance-specific; subsequent requests routed to other server instances will receive 404 Not Found. Solution: use centralized Object Storage (S3/GCS).' },
          { id: 'opt_2', text: 'PNG files cannot be transferred over HTTP/2.' },
          { id: 'opt_3', text: 'Load balancers reject multipart form data.' },
          { id: 'opt_4', text: 'Linux cannot store more than 10 files in a folder.' },
        ],
        correctOptionId: 'opt_1',
        explanation: 'Stateless backend instances require centralized durable object storage (like AWS S3 or Cloudflare R2) so any server can access uploaded assets.',
        difficulty: 'medium',
        tags: ['Cloud Architecture', 'S3', 'Stateless Backends'],
        points: 10,
      },
      {
        id: 'be_mcq_8',
        scenario: 'You need to execute an asynchronous job (generating an invoice PDF and emailing it) without making the user wait 10 seconds for the HTTP response.',
        question: 'What is the standard production backend pattern for asynchronous background jobs?',
        options: [
          { id: 'opt_1', text: 'Enqueue the job payload to a message queue (BullMQ / Redis / RabbitMQ / SQS) and return a 202 Accepted status immediately, while worker processes process jobs in the background.' },
          { id: 'opt_2', text: 'Run a `while(true)` loop on the main Express HTTP server thread.' },
          { id: 'opt_3', text: 'Send the entire email SMTP payload directly from the user browser JavaScript.' },
          { id: 'opt_4', text: 'Hold the HTTP connection open with setTimeout.' },
        ],
        correctOptionId: 'opt_1',
        explanation: 'Background task queues with worker processes decouple time-consuming tasks from the request/response lifecycle, keeping API responses instant.',
        difficulty: 'medium',
        tags: ['Message Queues', 'BullMQ', 'Async Jobs', 'Architecture'],
        points: 10,
      },
      {
        id: 'be_mcq_9',
        scenario: 'An attacker submits malicious JSON input containing `{"__proto__": {"isAdmin": true}}` to a vulnerable endpoint.',
        question: 'What vulnerability is this, and how do you protect Node.js applications against it?',
        options: [
          { id: 'opt_1', text: 'Prototype Pollution; protect by freezing Object.prototype, using `Object.create(null)` for maps, and validating inputs with strict schemas (Zod/Joi).' },
          { id: 'opt_2', text: 'SQL Injection; protect with parameterized queries.' },
          { id: 'opt_3', text: 'DNS Poisoning; protect with HTTPS.' },
          { id: 'opt_4', text: 'Man-in-the-Middle attack.' },
        ],
        correctOptionId: 'opt_1',
        explanation: 'Prototype Pollution occurs when recursive object mergers blindly assign `__proto__` properties. Input validation and prototype freezing mitigate the risk.',
        difficulty: 'medium',
        tags: ['Security', 'Prototype Pollution', 'Node.js'],
        points: 10,
      },
      {
        id: 'be_mcq_10',
        scenario: 'A microservice architecture suffers cascading failures when a downstream payment service goes down, causing upstream services to exhaust memory and threads.',
        question: 'Which resilience pattern prevents cascading system crashes by failing fast when downstream services are unhealthy?',
        options: [
          { id: 'opt_1', text: 'Circuit Breaker pattern (with states: Closed, Open, Half-Open).' },
          { id: 'opt_2', text: 'Infinite retry loops without backoff.' },
          { id: 'opt_3', text: 'Disabling error handling.' },
          { id: 'opt_4', text: 'Increasing request timeouts to 10 minutes.' },
        ],
        correctOptionId: 'opt_1',
        explanation: 'Circuit Breakers trip to an "Open" state after a failure threshold, immediately returning fallbacks and shielding upstream services from thread exhaustion.',
        difficulty: 'medium',
        tags: ['Microservices', 'Circuit Breaker', 'Resilience'],
        points: 10,
      },
    ],
    codingChallenge: {
      id: 'be_code_1',
      title: 'Implement Token Bucket Rate Limiter',
      difficulty: 'medium',
      language: 'javascript',
      timeLimitMinutes: 12,
      realWorldContext: 'Freelancers frequently implement API rate limiters to protect endpoints against abuse and DDoS.',
      description: `Implement a \`RateLimiter\` class with \`isAllowed(ip)\` using the Token Bucket algorithm.
- Capacity: \`maxTokens\` (e.g. 5 tokens per IP).
- Refill Rate: \`refillRatePerSec\` (e.g. 1 token per second).
- \`isAllowed(ip)\`: Deducts 1 token and returns \`true\` if tokens >= 1, otherwise returns \`false\` without deducting.
- Tokens must accumulate over time up to \`maxTokens\`.`,
      starterCode: `class RateLimiter {
  constructor(maxTokens = 5, refillRatePerSec = 1) {
    this.maxTokens = maxTokens;
    this.refillRatePerSec = refillRatePerSec;
    this.buckets = new Map();
  }

  isAllowed(ip) {
    const now = Date.now();
    let bucket = this.buckets.get(ip);

    if (!bucket) {
      bucket = { tokens: this.maxTokens, lastRefill: now };
      this.buckets.set(ip, bucket);
    } else {
      const elapsedSeconds = (now - bucket.lastRefill) / 1000;
      const tokensToAdd = elapsedSeconds * this.refillRatePerSec;
      bucket.tokens = Math.min(this.maxTokens, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }
    return false;
  }
}

module.exports = RateLimiter;
`,
      testCases: [
        {
          id: 'tc_be_1',
          input: 'const rl = new RateLimiter(3, 1); [rl.isAllowed("1.1.1.1"), rl.isAllowed("1.1.1.1"), rl.isAllowed("1.1.1.1"), rl.isAllowed("1.1.1.1")]',
          expectedOutput: '[true,true,true,false]',
          description: 'Allows up to max capacity and blocks the 4th immediate request',
        },
        {
          id: 'tc_be_2',
          input: 'const rl = new RateLimiter(2, 1); [rl.isAllowed("userA"), rl.isAllowed("userB")]',
          expectedOutput: '[true,true]',
          description: 'Maintains isolated state per client identifier',
        },
      ],
      hints: [
        'Tokens to add = (now - lastRefill) * (refillRatePerSec / 1000).',
        'Ensure current tokens does not exceed this.maxTokens.',
      ],
    },
    aiInterviewQuestions: [
      {
        id: 'be_ai_1',
        question: 'Walk me through how you investigate and fix an API endpoint experiencing intermittent 504 Gateway Timeouts under load.',
        category: 'problem_solving',
        expectedKeyPoints: ['Analyze APM metrics and slow query logs for unindexed table scans', 'Inspect external third-party API call timeouts and connection pool limits', 'Check Node.js event loop latency and CPU-heavy blocking operations', 'Review horizontal pod autoscaling and memory limits'],
      },
      {
        id: 'be_ai_2',
        question: 'How do you design database schema migrations in production with zero downtime for high-traffic tables?',
        category: 'architecture',
        expectedKeyPoints: ['Expand and contract migration pattern', 'Adding nullable columns first with double-writing in application layer', 'Backfilling existing rows in asynchronous batches', 'Non-blocking index creation using CREATE INDEX CONCURRENTLY'],
      },
      {
        id: 'be_ai_3',
        question: 'How do you handle API versioning (e.g., v1 to v2) when legacy mobile clients cannot be forced to update immediately?',
        category: 'architecture',
        expectedKeyPoints: ['URL path versioning (/api/v1 vs /api/v2) or header versioning', 'Backward-compatible adapter layers mapping new database models to legacy JSON schemas', 'Deprecation headers (Sunset headers) and telemetry tracking active legacy client usage'],
      },
      {
        id: 'be_ai_4',
        question: 'What is your strategy for securing REST and GraphQL APIs against brute-force credential stuffing and DDoS attacks?',
        category: 'technical_depth',
        expectedKeyPoints: ['IP and account-based rate limiting via Redis token buckets', 'Cloudflare / WAF edge protection and bot management', 'CAPTCHA challenges on repeated authentication failures', 'Query depth and complexity limiting for GraphQL'],
      },
    ],
  },

  fullstack: {
    niche: 'fullstack',
    nicheTitle: 'Full Stack Systems (Next.js / Node / SQL / React)',
    description: '30-minute balanced assessment covering end-to-end web apps, SSR caching, database optimization, and cloud storage.',
    mcqQuestions: [
      {
        id: 'fs_mcq_1',
        scenario: 'A freelance client wants a real-time collaborative document editor where multiple freelancers can edit text simultaneously.',
        question: 'Which conflict resolution architecture is best suited to prevent overwriting edits?',
        options: [
          { id: 'opt_1', text: 'HTTP Polling with Last-Write-Wins (LWW).' },
          { id: 'opt_2', text: 'CRDTs (Conflict-free Replicated Data Types like Yjs) or Operational Transformation (OT) over WebSockets.' },
          { id: 'opt_3', text: 'Locking the entire document file whenever any user opens it.' },
          { id: 'opt_4', text: 'Sending the entire document HTML string on every keystroke via REST POST.' },
        ],
        correctOptionId: 'opt_2',
        explanation: 'CRDTs allow peer-to-peer or server-mediated convergent text editing without loss or manual merge conflicts.',
        difficulty: 'medium',
        tags: ['Fullstack', 'WebSockets', 'CRDT', 'Realtime'],
        points: 10,
      },
      {
        id: 'fs_mcq_2',
        scenario: 'In Next.js, a Server Action processes an invoice creation form and redirects to the invoice detail page.',
        question: 'How do you ensure the newly created data is immediately visible on the redirected page without stale cache?',
        options: [
          { id: 'opt_1', text: 'Call `revalidatePath("/invoices")` or `revalidateTag("invoices")` inside the Server Action before redirecting.' },
          { id: 'opt_2', text: 'Force window.location.reload() inside a useEffect hook.' },
          { id: 'opt_3', text: 'Disable all caching in next.config.js entirely.' },
          { id: 'opt_4', text: 'Send an email notification to the database administrator.' },
        ],
        correctOptionId: 'opt_1',
        explanation: 'Next.js uses fine-grained cache revalidation (revalidatePath/revalidateTag) inside Server Actions to purge stale SSR caches.',
        difficulty: 'medium',
        tags: ['Next.js', 'Server Actions', 'Cache'],
        points: 10,
      },
      {
        id: 'fs_mcq_3',
        scenario: 'An app needs to upload 500MB video files directly from the browser to Amazon S3 without overloading your Node.js backend server.',
        question: 'What is the standard fullstack production pattern for this requirement?',
        options: [
          { id: 'opt_1', text: 'Upload the entire 500MB file to Node.js backend in memory, then forward to S3.' },
          { id: 'opt_2', text: 'Generate a short-lived S3 Pre-signed URL on the backend, and have the frontend PUT the file directly to cloud storage with progress tracking.' },
          { id: 'opt_3', text: 'Convert the video to Base64 in JavaScript and save in a PostgreSQL text column.' },
          { id: 'opt_4', text: 'Store the video in browser IndexedDB permanently.' },
        ],
        correctOptionId: 'opt_2',
        explanation: 'Pre-signed URLs offload upload bandwidth and storage overhead entirely to the object storage provider, bypassing the web application server.',
        difficulty: 'medium',
        tags: ['Cloud', 'S3', 'Architecture', 'File Uploads'],
        points: 10,
      },
      {
        id: 'fs_mcq_4',
        scenario: 'You notice your web app has an N+1 query problem when loading a list of 50 projects along with each project owner details.',
        question: 'How do you fix this in ORM / SQL layers?',
        options: [
          { id: 'opt_1', text: 'Use eager loading (e.g. `include: [Owner]` in Prisma/Sequelize, or an `INNER JOIN` in SQL) to fetch all relations in 1 or 2 batch queries.' },
          { id: 'opt_2', text: 'Run each query inside a setTimeout to spread out server load.' },
          { id: 'opt_3', text: 'Create 50 separate database connection pools.' },
          { id: 'opt_4', text: 'Disable indexes on the foreign key columns.' },
        ],
        correctOptionId: 'opt_1',
        explanation: 'Eager loading and joins eliminate the N+1 problem by fetching all related records in a single coordinated query rather than looping N individual SELECTs.',
        difficulty: 'medium',
        tags: ['SQL', 'ORM', 'Performance', 'Database'],
        points: 10,
      },
      {
        id: 'fs_mcq_5',
        scenario: 'A user submits an order form twice rapidly because the checkout button was not disabled during network transit.',
        question: 'What is the fullstack defense-in-depth strategy to prevent duplicate orders?',
        options: [
          { id: 'opt_1', text: 'Only frontend button disabling is needed.' },
          { id: 'opt_2', text: 'Disable button in UI on submit + generate a unique UUID idempotency key sent in request header + enforce unique idempotency key constraint on the backend order transaction.' },
          { id: 'opt_3', text: 'Delete previous orders automatically.' },
          { id: 'opt_4', text: 'Wait 10 seconds before responding to the first request.' },
        ],
        correctOptionId: 'opt_2',
        explanation: 'Defense in depth requires UI disabling for UX plus backend idempotency checks with unique database constraints to prevent race conditions.',
        difficulty: 'medium',
        tags: ['Fullstack', 'Reliability', 'Idempotency'],
        points: 10,
      },
      {
        id: 'fs_mcq_6',
        scenario: 'A client wants to ensure that all database mutations (updating order status, creating transaction, sending invoice) either all succeed or all roll back together.',
        question: 'Which database abstraction provides this all-or-nothing guarantee?',
        options: [
          { id: 'opt_1', text: 'ACID Database Transactions (BEGIN ... COMMIT / ROLLBACK).' },
          { id: 'opt_2', text: 'Running queries in asynchronous Promise.all.' },
          { id: 'opt_3', text: 'Storing data in browser localStorage.' },
          { id: 'opt_4', text: 'Restarting the database server.' },
        ],
        correctOptionId: 'opt_1',
        explanation: 'Database transactions ensure Atomicity and Consistency—if any query fails, the entire transaction is rolled back.',
        difficulty: 'medium',
        tags: ['SQL', 'ACID', 'Transactions'],
        points: 10,
      },
      {
        id: 'fs_mcq_7',
        scenario: 'A web app suffers from Cross-Site Request Forgery (CSRF) vulnerability on its cookie-authenticated API endpoints.',
        question: 'What is the standard defense to prevent CSRF attacks on authenticated mutations?',
        options: [
          { id: 'opt_1', text: 'Set cookie attribute `SameSite=Lax` or `SameSite=Strict` and validate anti-CSRF synchronizer tokens in request headers.' },
          { id: 'opt_2', text: 'Disable HTTPS.' },
          { id: 'opt_3', text: 'Allow all origins in CORS configuration (*).' },
          { id: 'opt_4', text: 'Encode requests with Base64.' },
        ],
        correctOptionId: 'opt_1',
        explanation: 'SameSite cookie attributes combined with CSRF synchronizer tokens prevent external malicious websites from forging authenticated state-changing requests.',
        difficulty: 'medium',
        tags: ['Security', 'CSRF', 'Cookies'],
        points: 10,
      },
      {
        id: 'fs_mcq_8',
        scenario: 'You are deploying a fullstack Next.js + Node app with environment variables for database credentials and API secret keys.',
        question: 'How do you prevent accidentally exposing private backend API keys to client-side bundles in Next.js?',
        options: [
          { id: 'opt_1', text: 'Do NOT prefix secret keys with `NEXT_PUBLIC_`; keep them strictly in server environment variables accessible only in Route Handlers or Server Components.' },
          { id: 'opt_2', text: 'Encrypt all keys and print them in console.log.' },
          { id: 'opt_3', text: 'Save keys in public/robots.txt.' },
          { id: 'opt_4', text: 'Send keys in URL query parameters.' },
        ],
        correctOptionId: 'opt_1',
        explanation: 'In Next.js, only variables starting with `NEXT_PUBLIC_` are baked into client JavaScript bundles. Omitting the prefix keeps secrets server-only.',
        difficulty: 'medium',
        tags: ['Next.js', 'Environment Variables', 'Security'],
        points: 10,
      },
      {
        id: 'fs_mcq_9',
        scenario: 'A PostgreSQL table with 5 million rows experiences slow search queries on a JSONB column containing user preferences.',
        question: 'Which PostgreSQL index type provides the fastest search queries on nested JSONB fields?',
        options: [
          { id: 'opt_1', text: 'GIN (Generalized Inverted Index) on the JSONB column using `jsonb_path_ops`.' },
          { id: 'opt_2', text: 'Standard Hash Index.' },
          { id: 'opt_3', text: 'BRIN index.' },
          { id: 'opt_4', text: 'Text index on table name.' },
        ],
        correctOptionId: 'opt_1',
        explanation: 'GIN indexes with `jsonb_path_ops` index all keys and values within JSONB documents, allowing sub-millisecond containment queries (`@>`).',
        difficulty: 'medium',
        tags: ['PostgreSQL', 'JSONB', 'GIN Index'],
        points: 10,
      },
      {
        id: 'fs_mcq_10',
        scenario: 'A user makes an authenticated request from their mobile phone on an unstable 3G connection that disconnects mid-flight.',
        question: 'How should the backend design handle partial connection terminations without leaving corrupted state?',
        options: [
          { id: 'opt_1', text: 'Wrap multi-step database mutations in transactions and listen for request abort signals (`req.on("close")`) to cancel in-flight operations.' },
          { id: 'opt_2', text: 'Ignore connection status and let queries run forever.' },
          { id: 'opt_3', text: 'Delete user account on disconnection.' },
          { id: 'opt_4', text: 'Write errors to a text file.' },
        ],
        correctOptionId: 'opt_1',
        explanation: 'Handling abort signals and using ACID transactions prevents orphaned queries and rollbacks partial writes cleanly when connections drop.',
        difficulty: 'medium',
        tags: ['Fullstack', 'Reliability', 'AbortController'],
        points: 10,
      },
    ],
    codingChallenge: {
      id: 'fs_code_1',
      title: 'Build a Deep Object Query Filter & Flattener',
      difficulty: 'medium',
      language: 'javascript',
      timeLimitMinutes: 12,
      realWorldContext: 'Fullstack apps often parse dynamic nested JSON filter parameters and transform them into normalized payload structures.',
      description: `Implement \`flattenAndFilter(obj, predicate)\`:
- Recursively flattens a nested object into dot-notation keys (e.g. \`{ a: { b: 2 } }\` -> \`{ "a.b": 2 }\`).
- Keeps only keys whose values satisfy the \`predicate(value)\` function (e.g. \`val => typeof val === 'number'\`).
- Omits empty objects and null/undefined if they fail the predicate.`,
      starterCode: `function flattenAndFilter(obj, predicate = (val) => val !== null && val !== undefined) {
  const result = {};

  function recurse(current, prefix = '') {
    for (const key in current) {
      if (Object.prototype.hasOwnProperty.call(current, key)) {
        const val = current[key];
        const newKey = prefix ? \`\${prefix}.\${key}\` : key;

        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          recurse(val, newKey);
        } else {
          if (predicate(val)) {
            result[newKey] = val;
          }
        }
      }
    }
  }

  recurse(obj);
  return result;
}

module.exports = flattenAndFilter;
`,
      testCases: [
        {
          id: 'tc_fs_1',
          input: 'flattenAndFilter({ user: { age: 28, meta: { active: true } }, role: "admin" }, (v) => typeof v === "number")',
          expectedOutput: '{"user.age":28}',
          description: 'Flattens nested keys and filters numbers only',
        },
        {
          id: 'tc_fs_2',
          input: 'flattenAndFilter({ a: { b: 1, c: null } }, (v) => v !== null)',
          expectedOutput: '{"a.b":1}',
          description: 'Filters out null values while preserving valid dot-paths',
        },
      ],
      hints: [
        'Check if `typeof current === "object" && current !== null && !Array.isArray(current)`. If so, iterate keys.',
        'Prefix child keys with `${prefix ? prefix + "." : ""}${key}`.',
      ],
    },
    aiInterviewQuestions: [
      {
        id: 'fs_ai_1',
        question: 'Describe how you structure a production Next.js fullstack application with authentication, database ORM, and role-based access control (RBAC).',
        category: 'architecture',
        expectedKeyPoints: ['Route middleware for session validation', 'Service/Repository layer decoupling DB logic from route handlers', 'Prisma / Drizzle ORM schema modeling', 'Zod schema validation on all inputs'],
      },
      {
        id: 'fs_ai_2',
        question: 'How do you handle real-time notifications or chat in a fullstack Next.js app without crashing under high concurrency?',
        category: 'technical_depth',
        expectedKeyPoints: ['Decoupled WebSocket / SSE servers or managed services (Pusher, Ably)', 'Redis Pub/Sub adapter across multi-instance nodes', 'Client connection heartbeat and reconnection backoff'],
      },
      {
        id: 'fs_ai_3',
        question: 'What is your process for conducting an end-to-end security audit on a freelance web application prior to production launch?',
        category: 'problem_solving',
        expectedKeyPoints: ['OWASP Top 10 checklist (SQLi, XSS, CSRF, IDOR)', 'Rate limiting and DDoS mitigation on auth endpoints', 'Security headers (CSP, HSTS, X-Frame-Options)', 'Auditing npm package dependencies with npm audit / Snyk'],
      },
      {
        id: 'fs_ai_4',
        question: 'How do you estimate freelance project milestones and manage client expectations when unexpected technical blockers arise?',
        category: 'freelance_delivery',
        expectedKeyPoints: ['Buffer 20-30% on complex unfamiliar integrations', 'Break projects into verifiable 1-2 week milestone deliverables', 'Proactive asynchronous status updates via Loom or brief notes', 'Proposing actionable solutions alongside blocker notices'],
      },
    ],
  },

  mobile: {
    niche: 'mobile',
    nicheTitle: 'Mobile App Development (React Native / Flutter / iOS / Android)',
    description: '30-minute balanced assessment covering mobile performance, offline caching, push notifications, and native architecture.',
    mcqQuestions: [
      {
        id: 'mob_mcq_1',
        scenario: 'A mobile app crashes on older Android devices when scrolling through a list of 1,000 photos.',
        question: 'What is the root cause and standard remedy in React Native / Flutter?',
        options: [
          { id: 'opt_1', text: 'Using ScrollView which renders all items in memory simultaneously; replace with FlatList / ListView.builder with image caching and downsampling.' },
          { id: 'opt_2', text: 'Android phones do not support images larger than 100KB.' },
          { id: 'opt_3', text: 'The device Bluetooth is interfering with memory.' },
          { id: 'opt_4', text: 'Set all image opacity to 0.5.' },
        ],
        correctOptionId: 'opt_1',
        explanation: 'ScrollView instantiates all child views at once, leading to OOM crashes. Virtualized lists only render on-screen elements.',
        difficulty: 'medium',
        tags: ['React Native', 'Flutter', 'Memory', 'Performance'],
        points: 10,
      },
      {
        id: 'mob_mcq_2',
        scenario: 'An app needs to work seamlessly offline, queuing user actions and syncing them to the cloud when internet reconnects.',
        question: 'Which architecture pattern achieves reliable offline-first mobile sync?',
        options: [
          { id: 'opt_1', text: 'Block the UI with an error popup whenever offline.' },
          { id: 'opt_2', text: 'Local embedded database (SQLite / WatermelonDB / Realm) acting as single source of truth, with an optimistic mutation queue dispatched on NetInfo online event.' },
          { id: 'opt_3', text: 'Keep all state in React component state variables.' },
          { id: 'opt_4', text: 'Send SMS messages to the server instead of HTTP.' },
        ],
        correctOptionId: 'opt_2',
        explanation: 'Offline-first architecture stores local mutations immediately in a durable database and drains the sync queue upon connection recovery.',
        difficulty: 'medium',
        tags: ['Mobile', 'Offline First', 'Architecture'],
        points: 10,
      },
      {
        id: 'mob_mcq_3',
        scenario: 'Push notifications fail to open the specific chat screen when tapped by the user on iOS and Android.',
        question: 'What mobile mechanism must be configured to link push notification payloads to inner screens?',
        options: [
          { id: 'opt_1', text: 'Deep Linking / Universal Links paired with navigation container linking config.' },
          { id: 'opt_2', text: 'Reloading the app binary completely.' },
          { id: 'opt_3', text: 'Setting app background permissions to unrestricted.' },
          { id: 'opt_4', text: 'Adding alert() dialogs in the app root.' },
        ],
        correctOptionId: 'opt_1',
        explanation: 'Deep linking URL schemes and Universal/App Links route notification payloads directly into nested navigator routes.',
        difficulty: 'medium',
        tags: ['Push Notifications', 'Deep Linking', 'Mobile'],
        points: 10,
      },
      {
        id: 'mob_mcq_4',
        scenario: 'A React Native app experiences dropped frames during complex screen transition animations.',
        question: 'How do you ensure 60fps animations without JavaScript thread blocking?',
        options: [
          { id: 'opt_1', text: 'Use React Native Reanimated with worklets running directly on the native UI thread and `useNativeDriver: true`.' },
          { id: 'opt_2', text: 'Run animations inside setInterval with 1ms delay.' },
          { id: 'opt_3', text: 'Disable device GPU rendering.' },
          { id: 'opt_4', text: 'Reduce screen resolution.' },
        ],
        correctOptionId: 'opt_1',
        explanation: 'Reanimated worklets execute animation frames directly on the native UI thread, bypassing JavaScript bridge congestion.',
        difficulty: 'medium',
        tags: ['React Native', 'Reanimated', 'Animations'],
        points: 10,
      },
      {
        id: 'mob_mcq_5',
        scenario: 'Sensitive API keys or user auth tokens need to be stored securely on mobile devices.',
        question: 'Where should sensitive tokens be stored on iOS and Android?',
        options: [
          { id: 'opt_1', text: 'iOS Keychain and Android Keystore / EncryptedSharedPreferences (e.g. via expo-secure-store or react-native-keychain).' },
          { id: 'opt_2', text: 'In plain AsyncStorage or SharedPreferences.' },
          { id: 'opt_3', text: 'Hardcoded in index.js file.' },
          { id: 'opt_4', text: 'In the phone photo gallery.' },
        ],
        correctOptionId: 'opt_1',
        explanation: 'Hardware-backed Keychain and Keystore provide cryptographic protection against unauthorized extraction or rooted device inspection.',
        difficulty: 'medium',
        tags: ['Security', 'Keychain', 'Mobile'],
        points: 10,
      },
    ],
    codingChallenge: {
      id: 'mob_code_1',
      title: 'Build an Optimistic Offline Action Queue',
      difficulty: 'medium',
      language: 'javascript',
      timeLimitMinutes: 12,
      realWorldContext: 'Mobile apps queue requests when offline and replay them upon reconnection.',
      description: `Implement \`OfflineQueue\`:
- \`enqueue(action)\`: Adds an action \`{ id, type, payload, status: 'pending' }\` to the queue.
- \`processQueue(executorFn)\`: Iterates pending items, runs \`executorFn(action)\`. If successful, marks status \`completed\`.
- \`getPendingCount()\`: Returns number of remaining pending actions.`,
      starterCode: `class OfflineQueue {
  constructor() {
    this.queue = [];
  }

  enqueue(action) {
    this.queue.push({ ...action, status: 'pending' });
  }

  async processQueue(executorFn) {
    for (const item of this.queue) {
      if (item.status === 'pending') {
        try {
          await executorFn(item);
          item.status = 'completed';
        } catch (e) {
          // Keep pending
        }
      }
    }
  }

  getPendingCount() {
    return this.queue.filter(i => i.status === 'pending').length;
  }
}

module.exports = OfflineQueue;
`,
      testCases: [
        {
          id: 'tc_mob_1',
          input: 'const q = new OfflineQueue(); q.enqueue({ id: 1 }); q.getPendingCount()',
          expectedOutput: '1',
          description: 'Queues action and reports pending count',
        },
      ],
      hints: ['Filter for `status === "pending"` when processing.'],
    },
    aiInterviewQuestions: [
      {
        id: 'mob_ai_1',
        question: 'How do you handle Apple App Store and Google Play Store review rejections related to permissions or privacy declarations?',
        category: 'problem_solving',
        expectedKeyPoints: ['Provide explicit contextual permission dialogs before requesting native permissions', 'Adhere to Apple Guideline 3.1.1 for digital goods vs physical services', 'Submit clear demo video walkthroughs with test login credentials'],
      },
      {
        id: 'mob_ai_2',
        question: 'What is your strategy for optimizing app bundle size and cold startup time on entry-level Android devices?',
        category: 'technical_depth',
        expectedKeyPoints: ['Enable Hermes engine and Proguard / R8 code shrinking', 'Dynamic module imports and deferred feature initialization', 'Optimizing and WebP compressing static assets'],
      },
    ],
  },

  ai_datascience: {
    niche: 'ai_datascience',
    nicheTitle: 'AI Engineering & Data Science (LLMs, RAG, Python)',
    description: '30-minute balanced assessment covering vector databases, embeddings, evaluation metrics, and prompt security.',
    mcqQuestions: [
      {
        id: 'ai_mcq_1',
        scenario: 'A company wants an AI assistant to answer questions about 500 proprietary internal PDF policy manuals without hallucinating.',
        question: 'Which architecture is best suited for this requirement?',
        options: [
          { id: 'opt_1', text: 'Fine-tuning a base LLM on raw text files only.' },
          { id: 'opt_2', text: 'Retrieval-Augmented Generation (RAG) with semantic chunking, vector embeddings in a vector DB (Pinecone/pgvector), hybrid search (dense + BM25), and citation generation.' },
          { id: 'opt_3', text: 'Pasting all 500 PDFs into a single prompt string on every user query.' },
          { id: 'opt_4', text: 'Using a regex search script on the server.' },
        ],
        correctOptionId: 'opt_2',
        explanation: 'RAG retrieves verifiable ground-truth text chunks dynamically, minimizing hallucinations and enabling up-to-date document citations.',
        difficulty: 'medium',
        tags: ['LLM', 'RAG', 'Vector Database', 'Embeddings'],
        points: 10,
      },
      {
        id: 'ai_mcq_2',
        scenario: 'An LLM returns inconsistent unstructured text when your API backend strictly requires JSON with `{ status, summary, tags }`.',
        question: 'What is the most robust technique to guarantee valid JSON outputs from modern LLMs?',
        options: [
          { id: 'opt_1', text: 'Use Structured Outputs (JSON Schema / function calling / response_format: { type: "json_schema" }) with Zod / Pydantic schema enforcement.' },
          { id: 'opt_2', text: 'Append "PLEASE RETURN JSON ONLY" at the end of the prompt in capital letters.' },
          { id: 'opt_3', text: 'Run eval() on whatever string the model returns.' },
          { id: 'opt_4', text: 'Reduce temperature to 0.99.' },
        ],
        correctOptionId: 'opt_1',
        explanation: 'Modern LLM APIs provide constrained grammar decoding (Structured Outputs) that mathematically guarantees output conformism to a JSON Schema.',
        difficulty: 'medium',
        tags: ['LLM', 'Structured Outputs', 'JSON', 'API'],
        points: 10,
      },
      {
        id: 'ai_mcq_3',
        scenario: 'You are evaluating a binary classification model for rare disease detection where only 0.5% of samples are positive.',
        question: 'Why is Accuracy a misleading metric for this imbalanced dataset, and what should you use instead?',
        options: [
          { id: 'opt_1', text: 'Accuracy is fine because 99.5% accuracy means the model is excellent.' },
          { id: 'opt_2', text: 'A trivial model predicting "negative" for all inputs gets 99.5% accuracy while missing 100% of diseases; use Precision, Recall (Sensitivity), and F1-Score / PR-AUC instead.' },
          { id: 'opt_3', text: 'Use Mean Squared Error (MSE).' },
          { id: 'opt_4', text: 'Accuracy is only for regression models.' },
        ],
        correctOptionId: 'opt_2',
        explanation: 'In highly imbalanced datasets, accuracy masks false negatives. Recall and F1-score evaluate the model’s true detection efficacy.',
        difficulty: 'medium',
        tags: ['Machine Learning', 'Metrics', 'Evaluation', 'F1-Score'],
        points: 10,
      },
    ],
    codingChallenge: {
      id: 'ai_code_1',
      title: 'Implement Cosine Similarity & Vector Top-K Matcher',
      difficulty: 'medium',
      language: 'javascript',
      timeLimitMinutes: 12,
      realWorldContext: 'RAG and vector search pipelines rely on cosine similarity calculations to find relevant document chunks.',
      description: `Implement \`findTopKSimilar(queryVector, documentVectors, k)\`:
- Calculates cosine similarity: \`dotProduct(A, B) / (norm(A) * norm(B))\`.
- Returns the top \`k\` documents sorted in descending order of similarity score.
- Output format: array of \`{ id, score }\` where score is rounded to 4 decimal places.`,
      starterCode: `function findTopKSimilar(queryVector, docs, k = 3) {
  function dot(a, b) {
    return a.reduce((sum, v, i) => sum + v * b[i], 0);
  }
  function norm(a) {
    return Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
  }

  const qNorm = norm(queryVector);
  const scored = docs.map(doc => {
    const dNorm = norm(doc.vector);
    const sim = (qNorm && dNorm) ? dot(queryVector, doc.vector) / (qNorm * dNorm) : 0;
    return { id: doc.id, score: Number(sim.toFixed(4)) };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

module.exports = findTopKSimilar;
`,
      testCases: [
        {
          id: 'tc_ai_1',
          input: 'findTopKSimilar([1, 0], [{ id: "d1", vector: [1, 0] }, { id: "d2", vector: [0, 1] }], 1)',
          expectedOutput: '[{"id":"d1","score":1}]',
          description: 'Correctly identifies identical direction vector as score 1.0',
        },
      ],
      hints: ['Norm of vector is Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)).'],
    },
    aiInterviewQuestions: [
      {
        id: 'ai_ai_1',
        question: 'How do you monitor and prevent prompt injection attacks in a customer-facing AI agent with database read/write tools?',
        category: 'technical_depth',
        expectedKeyPoints: ['Strict system prompt delimiters and user message separation', 'Tool authorization layers and human-in-the-loop for destructive operations', 'Input sanitization and dual LLM guardrail inspection'],
      },
    ],
  },

  uiux_design: {
    niche: 'uiux_design',
    nicheTitle: 'UI/UX & Product Design',
    description: '30-minute assessment covering design heuristics, WCAG accessibility, design systems, and conversion optimization.',
    mcqQuestions: [
      {
        id: 'ux_mcq_1',
        scenario: 'An e-commerce checkout page has a 62% cart abandonment rate on mobile devices.',
        question: 'Which UX intervention is most likely to produce the highest conversion uplift?',
        options: [
          { id: 'opt_1', text: 'Add 5 additional mandatory account registration fields before showing prices.' },
          { id: 'opt_2', text: 'Implement 1-click Express Checkout (Apple Pay/Google Pay), guest checkout option, and a sticky progress step bar.' },
          { id: 'opt_3', text: 'Make all product photos autoplay with background music.' },
          { id: 'opt_4', text: 'Change all buttons to flashing red colors.' },
        ],
        correctOptionId: 'opt_2',
        explanation: 'Friction reduction via guest checkout and digital wallets directly tackles mobile abandonment.',
        difficulty: 'medium',
        tags: ['UX', 'Conversion Optimization', 'Mobile'],
        points: 10,
      },
      {
        id: 'ux_mcq_2',
        scenario: 'A client wants light grey text (#A0AEC0) on a pure white background (#FFFFFF) for body text.',
        question: 'According to WCAG 2.1 AA standards, what is the minimum contrast ratio required for normal body text, and does this color meet it?',
        options: [
          { id: 'opt_1', text: 'Minimum 3:1; yes it passes.' },
          { id: 'opt_2', text: 'Minimum 4.5:1; no, this combination is ~2.8:1 and fails accessibility standards.' },
          { id: 'opt_3', text: 'Minimum 7:1; yes it passes.' },
          { id: 'opt_4', text: 'WCAG does not regulate body text contrast.' },
        ],
        correctOptionId: 'opt_2',
        explanation: 'WCAG AA requires at least 4.5:1 for normal text. Light grey on white violates this and causes severe legibility issues.',
        difficulty: 'medium',
        tags: ['Accessibility', 'WCAG', 'Typography'],
        points: 10,
      },
    ],
    practicalTask: {
      id: 'ux_task_1',
      title: 'UX Teardown & Redesign Strategy for a Freelancer Portal',
      type: 'design_critique',
      scenario: 'A client has a freelancer profile page where clients are failing to hire talent because the hire button is buried at the bottom below 12 unorganized paragraphs, skills are untagged, and reviews have no summary metrics.',
      instructions: [
        '1. Identify 3 critical usability violations using Nielsen Norman UX heuristics.',
        '2. Outline the Information Hierarchy for the redesigned freelancer card (Top to Bottom).',
        '3. Propose a conversion-focused Call-to-Action (CTA) strategy (Sticky bar, Primary vs Secondary actions).',
        '4. Detail how you would structure social proof (Rating badge, earnings verified, completed jobs).',
      ],
      rubric: [
        { criteria: 'Usability Heuristics & Problem Diagnosis', weight: 30 },
        { criteria: 'Information Architecture & Hierarchy Clarity', weight: 30 },
        { criteria: 'Conversion CTA & Social Proof Strategy', weight: 25 },
        { criteria: 'Accessibility & Mobile Responsiveness Considerations', weight: 15 },
      ],
      starterContent: `### 1. Usability Heuristics Violations
- Violation 1:
- Violation 2:
- Violation 3:

### 2. Information Architecture (Redesigned Layout Hierarchy)
- Hero / Header Section:
- Skill & Expertise Matrix:
- Portfolio & Social Proof:
- Pricing & Terms:

### 3. CTA & Conversion Strategy
- Primary Action:
- Secondary Action:
- Mobile Sticky Interaction:

### 4. Trust & Credibility Elements
- Badges & Verification:
- Review Summaries:`,
      timeLimitMinutes: 12,
    },
    aiInterviewQuestions: [
      {
        id: 'ux_ai_1',
        question: 'How do you conduct usability testing on a tight freelance deadline with limited budget?',
        category: 'problem_solving',
        expectedKeyPoints: ['5-user guerrilla hallway testing', 'Figma prototype click-through tasks', 'Unmoderated testing tools (Loom, Maze)', 'Qualitative observation over quantitative vanity metrics'],
      },
    ],
  },

  digital_marketing: {
    niche: 'digital_marketing',
    nicheTitle: 'Digital Marketing & Paid Ads (Google / Meta / SEO)',
    description: '30-minute balanced assessment covering high-ROI ad spend, technical SEO, attribution, and CRO funnels.',
    mcqQuestions: [
      {
        id: 'dm_mcq_1',
        scenario: 'A Google Ads campaign for a B2B SaaS product has a high Click-Through Rate (CTR 8.5%) but a near-zero conversion rate (0.2%) on the landing page.',
        question: 'What is the most likely culprit and recommended action?',
        options: [
          { id: 'opt_1', text: 'Increase ad bids by 500% to get more traffic.' },
          { id: 'opt_2', text: 'Check for search term intent mismatch and ensure landing page message matches the ad copy promise with a clear single CTA.' },
          { id: 'opt_3', text: 'Disable SSL on the landing page.' },
          { id: 'opt_4', text: 'Change the Google Ads billing currency.' },
        ],
        correctOptionId: 'opt_2',
        explanation: 'High CTR with low conversion indicates either poor search intent matching or high friction / disconnect on the landing page.',
        difficulty: 'medium',
        tags: ['Google Ads', 'PPC', 'CRO', 'Search Intent'],
        points: 10,
      },
      {
        id: 'dm_mcq_2',
        scenario: 'A website migrated to a new domain name, but organic Google traffic dropped by 80% after 2 weeks.',
        question: 'What is the most common technical SEO migration oversight?',
        options: [
          { id: 'opt_1', text: 'Missing 1-to-1 301 redirects from old URLs to new matching URLs, or a `noindex` tag left active in production robots.txt / meta tags.' },
          { id: 'opt_2', text: 'Not changing the domain registrar.' },
          { id: 'opt_3', text: 'Using SVG icons instead of PNG.' },
          { id: 'opt_4', text: 'Changing the CSS font size from 16px to 15px.' },
        ],
        correctOptionId: 'opt_1',
        explanation: 'Failing to map 301 permanent redirects destroys accumulated PageRank, and lingering noindex tags remove pages from search indices.',
        difficulty: 'medium',
        tags: ['SEO', 'Migration', '301 Redirects', 'Technical SEO'],
        points: 10,
      },
    ],
    practicalTask: {
      id: 'dm_task_1',
      title: 'Create a 30-Day Growth & Paid Ad Strategy for a Freelance Client',
      type: 'marketing_copy',
      scenario: 'A new online booking platform for home services needs high-intent leads in 2 major cities with a $3,000/month initial budget.',
      instructions: [
        '1. Define the Channel Mix & Budget Allocation (Google Search vs Meta Ads vs Local SEO).',
        '2. Write 2 High-Converting Google Search Ad Copies (Headlines, Descriptions, Callouts).',
        '3. Outline the Retargeting Strategy for website visitors who drop off before booking.',
      ],
      rubric: [
        { criteria: 'Strategic Channel Allocation & Budget Math', weight: 35 },
        { criteria: 'Copywriting Quality & Value Proposition', weight: 35 },
        { criteria: 'Retargeting & Funnel Architecture', weight: 30 },
      ],
      starterContent: `### 1. Channel Mix & Budget Allocation ($3,000 Total)
- Google Search Ads (Budget % & Rationale):
- Meta / Instagram Local Ads (Budget % & Rationale):
- Retargeting buffer:

### 2. High-Converting Google Search Ad Copy
**Ad Variation A (Emergency / Speed Focus):**
- Headline 1:
- Headline 2:
- Description 1:

**Ad Variation B (Trust / Guarantee Focus):**
- Headline 1:
- Headline 2:
- Description 1:

### 3. Retargeting Funnel
- Audience Segments:
- Offer / Incentive:`,
      timeLimitMinutes: 12,
    },
    aiInterviewQuestions: [
      {
        id: 'dm_ai_1',
        question: 'How do you convince a client who wants immediate results that SEO requires 3 to 6 months while still delivering short-term value?',
        category: 'freelance_delivery',
        expectedKeyPoints: ['Set clear timeline expectations with low-hanging fruit', 'Pair SEO with low-budget paid search for immediate lead flow', 'Provide transparent bi-weekly milestone reporting'],
      },
    ],
  },

  copywriting: {
    niche: 'copywriting',
    nicheTitle: 'Content Writing & Direct Response Copywriting',
    description: '30-minute balanced assessment covering landing page conversion copy, value proposition messaging, and email sequences.',
    mcqQuestions: [
      {
        id: 'cw_mcq_1',
        scenario: 'A landing page headline reads: "We Are The Leading Global Provider Of Enterprise Software Solutions Since 2012".',
        question: 'Why is this headline weak for direct response conversion, and how should it be improved?',
        options: [
          { id: 'opt_1', text: 'It should be written in all-caps.' },
          { id: 'opt_2', text: 'It focuses on the company (ego-centric) instead of the customer benefit/pain-point. It should be rewritten to emphasize clear value, e.g. "Automate 80% Of Your Team’s Manual Data Entry In 14 Days".' },
          { id: 'opt_3', text: 'It does not include a trademark symbol.' },
          { id: 'opt_4', text: 'It should be translated into 5 languages.' },
        ],
        correctOptionId: 'opt_2',
        explanation: 'Direct response copy prioritizes the customer problem and quantifiable desired outcome over corporate self-praise.',
        difficulty: 'medium',
        tags: ['Copywriting', 'Headlines', 'Direct Response'],
        points: 10,
      },
    ],
    practicalTask: {
      id: 'cw_task_1',
      title: 'Craft a High-Converting Above-The-Fold Landing Page Copy',
      type: 'marketing_copy',
      scenario: 'A B2B SaaS startup named "InvoiceFlow" helps freelancers automate late-payment follow-ups and get paid 3x faster without awkward emails.',
      instructions: [
        '1. Write 2 powerful Headline options (1 Direct Benefit, 1 Pain-Agitation).',
        '2. Write a compelling Subheadline (2-3 sentences explaining the mechanism and outcome).',
        '3. Create Primary and Secondary Call-To-Action (CTA) button copy.',
      ],
      rubric: [
        { criteria: 'Headline Hook & Value Clarity', weight: 40 },
        { criteria: 'Persuasive Subhead & Benefit Bullet Points', weight: 40 },
        { criteria: 'CTA Action-Orientation', weight: 20 },
      ],
      starterContent: `### 1. Headlines
- Option A (Direct Benefit):
- Option B (Pain Agitation):

### 2. Subheadline (Mechanism & Outcome)
[Your subheadline here]

### 3. CTA Buttons
- Primary CTA Button:
- Supporting Micro-Copy:`,
      timeLimitMinutes: 12,
    },
    aiInterviewQuestions: [
      {
        id: 'cw_ai_1',
        question: 'How do you handle a client who provides vague feedback like "make it punchier" or "give it more wow factor"?',
        category: 'freelance_delivery',
        expectedKeyPoints: ['Ask targeted clarifying questions', 'Present 2 distinct tonal variations side-by-side with rationale', 'Anchor changes to target audience conversion psychology'],
      },
    ],
  },

  devops: {
    niche: 'devops',
    nicheTitle: 'DevOps & Cloud Infrastructure (Docker / Kubernetes / AWS)',
    description: '30-minute balanced assessment covering containerization, CI/CD pipelines, cloud scalability, and disaster recovery.',
    mcqQuestions: [
      {
        id: 'do_mcq_1',
        scenario: 'A Node.js Docker image build results in a 1.4GB image size and takes 8 minutes to deploy in CI/CD.',
        question: 'What Docker best practices will reduce the image size to under 150MB and speed up builds?',
        options: [
          { id: 'opt_1', text: 'Use a Multi-Stage Dockerfile with `node:alpine` or `distroless`, leverage layer caching for `package.json`, and exclude `node_modules` with a `.dockerignore` file.' },
          { id: 'opt_2', text: 'Install all global dependencies inside the container.' },
          { id: 'opt_3', text: 'Zip the Docker container before deploying.' },
          { id: 'opt_4', text: 'Run the build as root user.' },
        ],
        correctOptionId: 'opt_1',
        explanation: 'Multi-stage builds separate build dependencies from the minimal runtime image, dropping image size by ~90%.',
        difficulty: 'medium',
        tags: ['Docker', 'CI/CD', 'Containers', 'Optimization'],
        points: 10,
      },
    ],
    practicalTask: {
      id: 'do_task_1',
      title: 'Design a Resilient Production CI/CD & Cloud Infrastructure Plan',
      type: 'architecture_review',
      scenario: 'A high-traffic e-commerce client needs an automated GitHub Actions CI/CD pipeline to deploy a containerized Next.js frontend and Node backend to AWS.',
      instructions: [
        '1. Diagram the CI/CD stages (Lint, Test, Docker Build, Deploy to Staging, Production Release).',
        '2. Specify AWS services for compute, database, static assets, and secret management.',
      ],
      rubric: [
        { criteria: 'CI/CD Pipeline Security & Automation', weight: 50 },
        { criteria: 'AWS Architecture & Scalability', weight: 50 },
      ],
      starterContent: `### 1. CI/CD Pipeline Workflow
- Step 1 (Validation & Linting):
- Step 2 (Automated Testing & Security Scanning):
- Step 3 (Containerization & Deploy):

### 2. Cloud Architecture (AWS Infrastructure)
- Compute Layer:
- Database:
- Secret Management:`,
      timeLimitMinutes: 12,
    },
    aiInterviewQuestions: [
      {
        id: 'do_ai_1',
        question: 'How do you investigate and remediate a Kubernetes Pod trapped in a CrashLoopBackOff state?',
        category: 'problem_solving',
        expectedKeyPoints: ['Inspect logs with kubectl logs --previous', 'Check exit code (OOMKilled 137 vs code throw 1)', 'Verify environment variables and mounted secrets', 'Check liveness and readiness probe configurations'],
      },
    ],
  },

  qa_cybersecurity: {
    niche: 'qa_cybersecurity',
    nicheTitle: 'QA Engineering & Cybersecurity Testing',
    description: '30-minute assessment covering test automation, OWASP Top 10 vulnerability remediation, and security edge cases.',
    mcqQuestions: [
      {
        id: 'qa_mcq_1',
        scenario: "An attacker inputs ' OR '1'='1 into a web login form and gains administrative access.",
        question: 'What is this vulnerability, and what is the definitive programmatic fix?',
        options: [
          { id: 'opt_1', text: 'Cross-Site Scripting (XSS); fix with CSS formatting.' },
          { id: 'opt_2', text: 'SQL Injection; fix by using Parameterized Queries (Prepared Statements) or an ORM that safely escapes parameters.' },
          { id: 'opt_3', text: 'CSRF; fix by clearing cookies.' },
          { id: 'opt_4', text: 'DDoS; fix with rate limiting.' },
        ],
        correctOptionId: 'opt_2',
        explanation: 'SQL Injection occurs when untrusted input concatenates into SQL queries. Prepared statements treat inputs strictly as literals.',
        difficulty: 'medium',
        tags: ['Security', 'SQL Injection', 'OWASP Top 10'],
        points: 10,
      },
    ],
    practicalTask: {
      id: 'qa_task_1',
      title: 'Security Audit & Test Case Matrix for a Freelance Payment Gateway',
      type: 'bug_report',
      scenario: 'A freelance marketplace allows clients to deposit funds and release escrow to freelancers. You need to write a comprehensive test suite matrix covering security edge cases.',
      instructions: [
        '1. Detail 3 Critical Security Test Cases (IDOR, Negative Balances, Double Spending).',
        '2. Outline E2E Happy Path vs Unhappy Path scenarios for Escrow Release.',
      ],
      rubric: [
        { criteria: 'Security Edge Case Coverage', weight: 50 },
        { criteria: 'Test Matrix Completeness & Rigor', weight: 50 },
      ],
      starterContent: `### 1. Security Test Cases
- TC-SEC-01 (IDOR Test on Invoice Release):
- TC-SEC-02 (Negative Value / Zero Deposit Injection):

### 2. Escrow Release Test Matrix
- Happy Path Scenario:
- Unhappy Path Scenario:`,
      timeLimitMinutes: 12,
    },
    aiInterviewQuestions: [
      {
        id: 'qa_ai_1',
        question: 'How do you set up an automated regression testing pipeline that runs on pull requests without slowing down developer velocity?',
        category: 'technical_depth',
        expectedKeyPoints: ['Test pyramid prioritization', 'Parallel test execution across CI matrix runners', 'Flaky test quarantine mechanism'],
      },
    ],
  },

  custom: {
    niche: 'custom',
    nicheTitle: 'Specialized Freelance Domain Assessment',
    description: '30-minute balanced assessment covering technical problem solving, freelance delivery, and quality assurance.',
    mcqQuestions: [
      {
        id: 'cst_mcq_1',
        scenario: 'A freelance client requests a scope change 2 days before the final delivery deadline without increasing the project budget or timeline.',
        question: 'What is the most professional and effective way to handle this request?',
        options: [
          { id: 'opt_1', text: 'Silently work overnight without mentioning anything to the client.' },
          { id: 'opt_2', text: 'Professionally acknowledge the request, explain that it falls outside the agreed scope, and provide a Change Order proposal with estimated additional time and budget or offer it for Phase 2.' },
          { id: 'opt_3', text: 'Refuse aggressively and cancel the contract immediately.' },
          { id: 'opt_4', text: 'Deliver half-finished work.' },
        ],
        correctOptionId: 'opt_2',
        explanation: 'Scope management through clear communication and structured change orders protects both freelancer time and client relationship.',
        difficulty: 'medium',
        tags: ['Freelancing', 'Client Management', 'Scope Control'],
        points: 10,
      },
      {
        id: 'cst_mcq_2',
        scenario: 'You encounter a technical roadblock on a freelance project that will delay your milestone delivery by 24 hours.',
        question: 'What is the standard best-practice communication protocol?',
        options: [
          { id: 'opt_1', text: 'Wait until the deadline has passed, then explain what happened.' },
          { id: 'opt_2', text: 'Proactively notify the client as soon as the blocker is identified, explain what was tried, provide the revised timeline, and present the planned solution.' },
          { id: 'opt_3', text: 'Ignore the client messages until the fix is ready.' },
          { id: 'opt_4', text: 'Blame the client requirements.' },
        ],
        correctOptionId: 'opt_2',
        explanation: 'Proactive communication with clear solutions builds immense client trust even when unexpected technical obstacles arise.',
        difficulty: 'medium',
        tags: ['Communication', 'Delivery', 'Professionalism'],
        points: 10,
      },
    ],
    practicalTask: {
      id: 'cst_task_1',
      title: 'Freelance Project Scope, Architecture & Delivery Blueprint',
      type: 'architecture_review',
      scenario: 'You are hired by a high-value client to execute a critical project in your specialized domain. You must deliver a professional project kick-off blueprint.',
      instructions: [
        '1. Define the Core Deliverables & Technical Acceptance Criteria.',
        '2. Outline the Milestone Timeline and Risk Mitigation Strategy.',
        '3. Propose Quality Assurance and Client Handover Procedures.',
      ],
      rubric: [
        { criteria: 'Technical Clarity & Scope Definition', weight: 40 },
        { criteria: 'Risk Management & Timeline Realism', weight: 35 },
        { criteria: 'Client Communication & Handover Quality', weight: 25 },
      ],
      starterContent: `### 1. Scope & Acceptance Criteria
- Primary Deliverable 1:
- Primary Deliverable 2:
- Success Metrics:

### 2. Milestone Plan & Risk Mitigation
- Milestone 1 (Discovery & Prototype):
- Milestone 2 (Core Build & Testing):
- Identified Risks & Prevention:

### 3. QA & Client Handover
- Testing Protocol:
- Documentation & Walkthrough:`,
      timeLimitMinutes: 12,
    },
    aiInterviewQuestions: [
      {
        id: 'cst_ai_1',
        question: 'How do you ensure you consistently deliver 5-star quality work for clients on freelance platforms?',
        category: 'freelance_delivery',
        expectedKeyPoints: ['Clear upfront requirement alignment and scope definition', 'Regular asynchronous progress updates', 'Thorough self-testing before delivering milestones', 'Supportive post-delivery onboarding'],
      },
      {
        id: 'cst_ai_2',
        question: 'When an urgent production bug happens over the weekend, what is your triage and communication procedure?',
        category: 'problem_solving',
        expectedKeyPoints: ['Acknowledge immediately to reassure client', 'Isolate bug and implement temporary rollback or hotfix', 'Perform root-cause analysis and add regression tests'],
      },
    ],
  },
};

/**
 * Helper to randomize and shuffle items on each test attempt
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Resolves or dynamically generates test content with fresh randomized questions on every attempt.
 */
export function getTestForCandidate(candidate: Partial<CandidateProfile>, attemptNumber: number = 1): NicheTestData {
  const nicheKey = (candidate.niche || 'frontend') as NicheCategory;
  const baseTest = NICHE_TEST_REGISTRY[nicheKey] || NICHE_TEST_REGISTRY.custom || NICHE_TEST_REGISTRY.frontend;

  // 1. Randomize and rotate MCQs
  const shuffledMCQs = shuffleArray(baseTest.mcqQuestions).map((mcq) => {
    // 2. Randomize options within each MCQ while preserving correct option identity
    const shuffledOpts = shuffleArray(mcq.options);
    return {
      ...mcq,
      options: shuffledOpts,
    };
  });

  // 3. Randomize AI Voice Questions
  const shuffledAI = shuffleArray(baseTest.aiInterviewQuestions);

  return {
    ...baseTest,
    nicheTitle: candidate.nicheTitle || baseTest.nicheTitle,
    mcqQuestions: shuffledMCQs,
    aiInterviewQuestions: shuffledAI,
  };
}
