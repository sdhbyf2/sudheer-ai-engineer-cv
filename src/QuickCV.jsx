import { useEffect, useRef } from 'react';
import { ArrowUpRight, Download, X } from 'lucide-react';
import { email, phone, linkedin, careerTimeline, skills, education } from './career';
import { lockPageScroll } from './scrollLock';
import RecruiterDetails from './RecruiterDetails';

export default function QuickCV({ onClose, onDownloadCV }) {
 const ref = useRef(null);
 useEffect(() => {
  const modal = ref.current;
  const focused = document.activeElement;
  const unlock = lockPageScroll();
  modal.showModal();
  return () => { modal.close(); unlock(); const target=focused?.getClientRects().length?focused:document.querySelector('.menu-toggle'); target?.focus(); };
 }, []);
 return <dialog ref={ref} className="quick-cv" aria-labelledby="quick-cv-title" onCancel={onClose} data-lenis-prevent>
  <div className="cv-toolbar"><span>THE ESSENTIALS / 2 MIN READ</span><button onClick={onClose} aria-label="Close quick CV"><X size={20}/></button></div>
  <div className="cv-sheet">
   <div className="cv-heading"><img className="cv-portrait" src="/portrait-240.webp" alt="Sudheer Palakurla" width="100" height="120"/><div><span className="eyebrow">AI ENGINEER · FULL-STACK ENGINEER · AI SOLUTIONS ARCHITECT</span><h2 id="quick-cv-title">Sudheer Palakurla</h2><p>AI-powered applications, LLM integrations, distributed systems and full-stack delivery.<br/>8+ years of software engineering experience.</p></div><button type="button" className="button primary" onClick={() => { onClose(); onDownloadCV?.(); }}>Full CV <Download size={15}/></button></div>
   <div className="cv-links"><a href={'mailto:'+email}>{email} <ArrowUpRight size={14}/></a><a href={phone.href}>{phone.display}</a><a href={linkedin} target="_blank" rel="noreferrer">LinkedIn <ArrowUpRight size={14}/></a></div>
   <section className="cv-summary"><h3>Profile</h3><p>AI Engineer with 8+ years of software engineering experience, specialising in building AI-powered applications, LLM integrations and full-stack systems. Hands-on experience developing RAG pipelines (PostgreSQL, pgvector, HNSW), multi-model orchestration, real-time voice AI agents (OpenAI Realtime API, Gemini Live) and API-driven applications using Python, FastAPI, Node.js and modern JavaScript/TypeScript frameworks.</p><p>Experienced in taking applications from customer discovery, requirements workshops and solution architecture (FDE) through development, distributed messaging (Kafka, RabbitMQ, Redis), cloud deployment (OCI/OKE Kubernetes, AWS, Cloudflare, Terraform) and production support. Master’s in Computer Science (Data Science & AI) alongside an MBA.</p></section>
   <section aria-label="Recruitment details"><h3>Availability & role preferences</h3><RecruiterDetails/></section>
   <section><h3>Selected career impact</h3><ul><li>Delivered or contributed to 95+ client web and e-commerce builds across UK and international markets, including 40+ responsive websites at Crazy Designers (2014–2017).</li><li>Owned technical delivery across customer engagements, from discovery and requirements workshops through solution architecture, enterprise integration and production release.</li><li>Designed and shipped production RAG systems using PostgreSQL, pgvector and HNSW indexing to support AI-assisted search and in-app guidance.</li><li>Implemented multi-model LLM routing, provider fallback, evaluation, tracing, monitoring and cost-optimisation practices for production AI workflows.</li><li>Led legacy-to-React / TypeScript / Next.js / Three.js migrations that improved application performance and maintainability by 30–40%; test automation reduced production defects by ~40%.</li><li>Built real-time voice AI using the OpenAI Realtime API with automatic fallback to Gemini Live to maintain conversational continuity during provider outages.</li></ul></section>
    <section><h3>Experience</h3>{careerTimeline.map(role =>
     role.isBreak ? (
      <article className="cv-role cv-career-break" key={role.date}>
       <div><strong>Career Break</strong><span>{role.date}</span></div>
      </article>
     ) : (
      <article className="cv-role" key={role.company}>
       <div><strong>{role.scope?'Formal title: ':''}{role.role}</strong><span>{role.date}</span></div>
       <h4>{role.company} · {role.location}</h4>{role.scope&&<p className="role-scope">Scope of work: {role.scope}</p>}<p>{role.summary} {role.detail}</p>
      </article>
     )
    )}</section>
   <section><h3>Core capabilities</h3><div className="cv-skills">{skills.map(skill=><div key={skill.title}><h4>{skill.title}</h4><p>{skill.items.join(' · ')}</p></div>)}</div></section>
   <section><h3>Education</h3>{education.map(([degree,focus,place,date])=><p key={degree}><strong>{degree} · {focus}</strong><br/>{place}{date&&<><br/><span className="education-date">{date}</span></>}</p>)}</section>
  </div>
 </dialog>;
}
