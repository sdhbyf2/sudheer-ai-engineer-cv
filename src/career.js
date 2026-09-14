export const cvUrl = '/Sudheer_Palakurla_AI_Engineer_CV.pdf';
export const email = 'sdh9247@gmail.com';
export const linkedin = 'https://www.linkedin.com/in/sudheer-palakurla-b2a9271b5/';

export const roles = [
 { date: 'APR 2024 — PRESENT', company: 'Brittania Consultancy Services', role: 'Web Designer', location: 'United Kingdom', summary: 'Own client application delivery from requirements and architecture through testing, deployment, and support.', detail: 'Built a production ERP RAG assistant and a serverless client-onboarding platform. Integrated React frontends with Node.js and FastAPI, alongside Vitest/Jest, Playwright, and SonarQube.', tags: ['React / TypeScript', 'RAG / pgvector', 'Cloudflare'] },
 { date: 'OCT 2022 — JUN 2023', company: 'Sharp Gaming', role: 'Senior Frontend Developer', location: 'United Kingdom', summary: 'Led migration from legacy JavaScript to React and TypeScript, improving maintainability and developer productivity.', detail: 'Delivered real-time API integrations with Redux and React Hooks. Mentored developers and reinforced code reviews and quality gates.', tags: ['React / TypeScript', 'Redux', 'Technical mentoring'] },
 { date: 'MAY 2017 — JAN 2020', company: 'Crazy Techsol', role: 'Senior Developer', location: 'India', summary: 'Led concurrent client projects and full-stack e-commerce delivery for 8+ stores.', detail: 'Migrated PHP/jQuery applications to React, TypeScript, and Redux. Established component libraries, CI practices, and technical documentation.', tags: ['Full-stack delivery', 'Node.js / PHP', 'Team leadership'] },
 { date: 'DEC 2014 — APR 2017', company: 'Crazy Designers', role: 'Web Designer', location: 'India', summary: 'Designed and delivered 40+ responsive websites and e-commerce solutions.', detail: 'Worked directly with clients from prototypes to custom CMS themes, payment integrations, and cross-browser testing.', tags: ['WordPress', 'WooCommerce', 'UI design'] },
];

export const projects = [
 { id: '01', name: 'Answers, grounded in context.', subtitle: 'School management ERP assistant', type: 'RAG & SEMANTIC SEARCH', className: 'rag', tags: ['PostgreSQL', 'pgvector', 'HNSW', 'LLM routing'], description: 'Semantic search and in-app AI guidance for a school management ERP platform.', role: 'Designed and built the RAG assistant', challenge: 'Help users find relevant information and navigate a complex ERP.', implementation: 'PostgreSQL and pgvector with HNSW indexing retrieve context. Multi-model routing connects hosted providers with automatic local-model failover.', outcome: 'AI-assisted search and contextual guidance inside the application.', steps: ['User question', 'Vector retrieval', 'LLM routing', 'In-app answer'] },
 { id: '02', name: 'Conversation without interruption.', subtitle: 'Real-time voice AI', type: 'VOICE AI', className: 'voice', tags: ['OpenAI Realtime', 'Gemini Live', 'OCI'], description: 'Real-time conversational voice AI with automatic provider fallback, built from architecture through deployment.', role: 'Sole engineer · Architecture to deployment', challenge: 'Maintain voice interactions when an inference provider becomes unavailable.', implementation: 'OpenAI Realtime API supports live conversation, with automatic fallback to Gemini Live. The application is deployed on OCI.', outcome: 'Provider fallback supports continuity of voice interactions.', context: 'Voice AI', steps: ['Live voice', 'Realtime API', 'Gemini fallback'] },
 { id: '03', name: 'A smarter start, at the edge.', subtitle: 'Serverless client onboarding', type: 'FULL-STACK & EDGE AI', className: 'edge', tags: ['Cloudflare', 'Hono', 'D1 / KV / R2'], description: 'Client onboarding with application logic, data, storage, and AI in a serverless architecture.', role: 'Built the full-stack onboarding platform', challenge: 'Bring onboarding workflows and AI-assisted features into one platform.', implementation: 'Cloudflare Pages and Hono Workers serve the application. D1 handles relational data, KV supports caching, R2 stores objects, and Workers AI enables in-app AI features.', outcome: 'An integrated edge architecture for client onboarding and AI-assisted features.', context: 'Brittania Consultancy', steps: ['Client app', 'Workers / Hono', 'Data + AI'] },
];

export const education = [
 ['Master of Computer Science', 'Data Science & AI', 'Bournemouth University, UK'],
 ['Master of Business Administration', 'HR & Finance', 'Osmania University, India'],
 ['Bachelor of Technology', 'Computer Science Engineering', 'Kakatiya University, India'],
];

export const skills = [
 { title: 'AI systems', subtitle: 'From retrieval to real-time conversation.', items: ['RAG / pgvector / HNSW', 'LLM routing & automatic failover', 'Agentic workflows / MCP', 'Prompt engineering & evaluation'] },
 { title: 'Product engineering', subtitle: 'The complete application, end to end.', items: ['React / Next.js / TypeScript', 'Python / FastAPI / Node.js', 'PostgreSQL / REST APIs', 'Architecture & technical leadership'] },
 { title: 'Production delivery', subtitle: 'Built to ship. Designed to keep working.', items: ['AWS / OCI / Cloudflare', 'Docker / CI/CD', 'Vitest / Playwright / pytest', 'Agile delivery / Mentoring / WCAG'] },
];
