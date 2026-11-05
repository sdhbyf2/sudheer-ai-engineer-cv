export const cvUrl = '/Sudheer_Palakurla_AI_Engineer_CV.pdf';
export const email = 'sdh9247@gmail.com';
export const phone = { display: '+44 7466 442259', href: 'tel:+447466442259' };
export const linkedin = 'https://www.linkedin.com/in/sudheer-palakurla-b2a9271b5/';
export const github = 'https://github.com/sdhbyf2';
export const githubRepo = 'https://github.com/sdhbyf2/sudheer-ai-engineer-cv';

export const deliveryStages = [
 { title: 'Plan', description: 'Lead discovery workshops, shape solution architecture and plan sprint deliverables.', tools: 'Solution architecture · FDE · Sprint planning' },
 { title: 'Prove', description: 'Validate the approach through a proof of concept, then build a working MVP.', tools: 'Discovery · POCs · MVPs' },
 { title: 'Build', description: 'Engineer full-stack interfaces, APIs, distributed messaging and AI pipelines.', tools: 'React · TypeScript · FastAPI · Kafka / Redis' },
 { title: 'Release', description: 'Ship through CI/CD, Kubernetes/containers, tracing and cloud deployments.', tools: 'OCI / OKE · AWS · Cloudflare · Terraform' },
];

export const roles = [
 { date: 'APR 2024 — PRESENT', company: 'Brittania Consultancy Services', role: 'Web Designer', scope: 'AI & application engineering', location: 'United Kingdom', summary: 'Own technical delivery across client projects from initial discovery and requirements gathering through solution architecture, full-stack development, AI integration and cloud deployment.', detail: 'Built a production ERP RAG assistant (PostgreSQL, pgvector, HNSW), multi-model LLM routing with local model fallback, a real-time voice AI assistant (OpenAI Realtime API with Gemini Live fallback), and a serverless client-onboarding platform on Cloudflare (Pages, Workers, Hono, D1, KV, R2, Workers AI). Manage deployments across OCI, AWS and Cloudflare alongside SonarQube, Jest, Vitest and Playwright.', tags: ['React / Next.js / TypeScript', 'Python / FastAPI', 'RAG / pgvector', 'Voice AI', 'OCI / AWS / Cloudflare'] },
 { date: 'OCT 2022 — JUN 2023', company: 'Sharp Gaming', role: 'Senior Frontend Developer', location: 'United Kingdom', summary: 'Led migration of legacy JavaScript applications to React and TypeScript, improving maintainability, scalability and code organisation.', detail: 'Developed reusable React components, integrated REST APIs and WebSockets with Redux and React Hooks, and contributed to the Betfred enterprise betting and gaming platform alongside product, backend, QA and DevOps teams using SonarQube and automated testing.', tags: ['React / TypeScript', 'Redux / WebSockets', 'Technical mentoring'] },
 { date: 'MAY 2017 — JAN 2020', company: 'Crazy Techsol', role: 'Senior Developer', location: 'India', summary: 'Led concurrent client projects and full-stack e-commerce delivery for 8+ stores.', detail: 'Migrated PHP/jQuery applications to React, TypeScript, and Redux. Established component libraries, CI practices, and technical documentation.', tags: ['Full-stack delivery', 'Node.js / PHP', 'Team leadership'] },
 { date: 'DEC 2014 — APR 2017', company: 'Crazy Designers', role: 'Web Designer', location: 'India', summary: 'Designed and delivered 40+ responsive websites and e-commerce solutions.', detail: 'Worked directly with clients from prototypes to custom CMS themes, payment integrations, and cross-browser testing.', tags: ['WordPress', 'WooCommerce', 'UI design'] },
];

export const careerTimeline = [
 roles[0],
 { isBreak: true, date: 'JUN 2023 — APR 2024', role: 'Career Break' },
 ...roles.slice(1),
];

export const projects = [
 { id: '01', name: 'Answers, grounded in context.', subtitle: 'School management ERP assistant', type: 'RAG & SEMANTIC SEARCH', className: 'rag', tags: ['PostgreSQL', 'pgvector', 'HNSW', 'LLM routing'], description: 'Semantic search and in-app AI guidance for a school management ERP platform.', role: 'Sole developer · School ERP and RAG assistant', challenge: 'Help users find relevant information and navigate a complex ERP.', implementation: 'PostgreSQL and pgvector with HNSW indexing retrieve context. Multi-model routing connects hosted providers with automatic local-model failover.', outcome: 'AI-assisted search and contextual guidance inside the application.', steps: ['User question', 'Vector retrieval', 'LLM routing', 'In-app answer'] },
 { id: '02', name: 'Conversation without interruption.', subtitle: 'Real-time voice AI', type: 'VOICE AI', className: 'voice', tags: ['OpenAI Realtime', 'Gemini Live', 'OCI'], description: 'Real-time conversational voice AI with automatic provider fallback, built from architecture through deployment.', role: 'Sole engineer · Architecture to deployment', challenge: 'Maintain voice interactions when an inference provider becomes unavailable.', implementation: 'OpenAI Realtime API supports live conversation, with automatic fallback to Gemini Live. The application is deployed on OCI with PostgreSQL and Alembic migrations.', outcome: 'Provider fallback supports continuity of voice interactions.', context: 'Voice AI', steps: ['Live voice', 'Realtime API', 'Gemini fallback'] },
 { id: '03', name: 'A smarter start, at the edge.', subtitle: 'Serverless client onboarding', type: 'FULL-STACK & EDGE AI', className: 'edge', tags: ['Cloudflare', 'Hono', 'D1 / KV / R2'], description: 'Client onboarding with application logic, data, storage, and AI in a serverless architecture.', role: 'Built the full-stack onboarding platform', challenge: 'Bring onboarding workflows and AI-assisted features into one platform.', implementation: 'Cloudflare Pages and Hono Workers serve the application. D1 handles relational data, KV supports caching, R2 stores objects, and Workers AI enables in-app AI features.', outcome: 'An integrated edge architecture for client onboarding and AI-assisted features.', context: 'Brittania Consultancy', steps: ['Client app', 'Workers / Hono', 'Data + AI'] },
];

// Architecture explanations stay separate from measured outcomes; no unverified metrics.
export const projectDecisions = {
 rag: [
  { title: 'Retrieve before generating', detail: 'PostgreSQL, pgvector and HNSW provide the context used by the assistant to answer questions inside the ERP.' },
  { title: 'Keep a fallback route', detail: 'Multi-model routing connects hosted providers with automatic local-model failover when a provider is unavailable.' },
 ],
 voice: [
  { title: 'Make the conversation real time', detail: 'OpenAI Realtime handles live voice interaction. OCI hosts the deployed application.' },
  { title: 'Plan for provider unavailability', detail: 'Automatic fallback to Gemini Live gives the application an alternative provider for voice interactions.' },
 ],
 edge: [
  { title: 'Separate data by its job', detail: 'D1 holds relational records, KV supports caching, and R2 stores objects within the onboarding platform.' },
  { title: 'Connect the full workflow', detail: 'Pages serves the frontend, Hono Workers handle application logic, and Workers AI provides in-app AI features.' },
 ],
};

export const education = [
 ['Master of Computer Science', 'Data Science & AI', 'Bournemouth University, UK', 'Jan 2020 – Jan 2022'],
 ['Master of Business Administration', 'HR & Finance', 'Osmania University, India'],
 ['Bachelor of Technology', 'Computer Science Engineering', 'Kakatiya University, India'],
];

export const skills = [
 { title: 'AI & LLM engineering', subtitle: 'From retrieval to real-time conversation.', items: ['RAG architecture (PostgreSQL, pgvector, HNSW)', 'Multi-model LLM routing & automatic failover', 'Real-time voice AI (OpenAI Realtime, Gemini Live)', 'Agentic workflows & Model Context Protocol (MCP)'], more: ['Prompt engineering, guardrails & safety evaluation', 'Tokenization & context management', 'LLM evaluation, tracing, monitoring & cost optimisation', 'Cloudflare Workers AI & local model fallback', 'Solution architecture, customer discovery & FDE delivery', 'PoC-to-production & enterprise AI integration'] },
 { title: 'Full-stack & distributed systems', subtitle: 'Frontend roots. Resilient backend & messaging.', items: ['React / Next.js / TypeScript / Three.js', 'Python / FastAPI / Node.js / Express.js', 'Kafka / RabbitMQ / Redis / WebSockets', 'PostgreSQL / MySQL / MongoDB / SQL'], more: ['Microservices & event-driven architecture', 'Alembic schema migrations & REST API design', 'Redux / React Hooks / Vite / Angular / Material UI', 'React Native & Expo (Mobile)', 'PHP / WordPress / WooCommerce / Magento', 'Customer requirements workshops & technical specifications'] },
 { title: 'Cloud, DevOps & quality', subtitle: 'Containerised, automated & production-ready.', items: ['OCI / OKE (Kubernetes) / AWS', 'Docker / Kubernetes / Terraform', 'Cloudflare (Workers, Pages, D1, R2, KV)', 'Vitest / Jest / Playwright / pytest'], more: ['Jenkins & GitLab CI/CD pipelines', 'SonarQube / Instana APM / Postman / BrowserStack', 'React Testing Library (RTL) & TDD / BDD', 'Agile / Scrum / Jira / Confluence', '95+ client web & e-commerce builds delivered', '30–40% performance lift & ~40% defect reduction'] },
];
