import { useEffect, useRef } from 'react';
import { ArrowUpRight, Download, X } from 'lucide-react';
import { cvUrl, email, linkedin, roles, skills, education } from './career';
import { lockPageScroll } from './scrollLock';
import RecruiterDetails from './RecruiterDetails';

export default function QuickCV({ onClose }) {
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
   <div className="cv-heading"><img className="cv-portrait" src="/portrait-240.webp" alt="Sudheer Palakurla" width="100" height="120"/><div><span className="eyebrow">FULL-STACK & APPLIED AI</span><h2 id="quick-cv-title">Sudheer Palakurla</h2><p>Frontend roots, full-stack delivery and applied AI. <br/>8+ years of software development experience.</p></div><a className="button primary" href={cvUrl} download>Full CV <Download size={15}/></a></div>
   <div className="cv-links"><a href={'mailto:'+email}>{email} <ArrowUpRight size={14}/></a><a href={linkedin} target="_blank" rel="noreferrer">LinkedIn <ArrowUpRight size={14}/></a></div>
   <section className="cv-summary"><h3>Profile</h3><p>Exploring full-time frontend, full-stack and applied AI engineering opportunities.</p><p>Started in frontend development and expanded into backend systems, architecture and applied AI. Work spans sprint planning, deliverables, proofs of concept, MVPs and team collaboration. Deployments include Jenkins and CI/CD pipelines, staging and production environments, OCI, AWS and VPS hosting. Master’s in Data Science & AI, alongside an MBA.</p></section>
   <section aria-label="Recruitment details"><h3>Availability & role preferences</h3><RecruiterDetails/></section>
   <section><h3>Selected impact</h3><ul><li>Worked with teams delivering hundreds of websites, alongside business applications.</li><li>Led migrations reporting 30–40% improvements in performance and maintainability.</li><li>Introduced test coverage that reduced production defects by approximately 40%.</li><li>Built an AI-driven SaaS platform as sole engineer, including RAG onboarding and voice AI.</li></ul></section>
   <section><h3>Experience</h3>{roles.map(role=><article className="cv-role" key={role.company}><div><strong>{role.role}</strong><span>{role.date}</span></div><h4>{role.company} · {role.location}</h4>{role.scope&&<p className="role-scope">{role.scope}</p>}<p>{role.summary} {role.detail}</p></article>)}</section>
   <section><h3>Core capabilities</h3><div className="cv-skills">{skills.map(skill=><div key={skill.title}><h4>{skill.title}</h4><p>{skill.items.join(' · ')}</p></div>)}</div></section>
   <section><h3>Education</h3>{education.map(([degree,focus,place])=><p key={degree}><strong>{degree} · {focus}</strong><br/>{place}</p>)}</section>
  </div>
 </dialog>;
}
