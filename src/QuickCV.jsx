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
   <div className="cv-heading"><img className="cv-portrait" src="/portrait-240.webp" alt="Sudheer Palakurla" width="100" height="120"/><div><span className="eyebrow">FULL-STACK ENGINEER · APPLIED AI</span><h2 id="quick-cv-title">Sudheer Palakurla</h2><p>Frontend roots, full-stack delivery and applied AI. <br/>8+ years of software development experience.</p></div><button type="button" className="button primary" onClick={() => { onClose(); onDownloadCV?.(); }}>Full CV <Download size={15}/></button></div>
   <div className="cv-links"><a href={'mailto:'+email}>{email} <ArrowUpRight size={14}/></a><a href={phone.href}>{phone.display}</a><a href={linkedin} target="_blank" rel="noreferrer">LinkedIn <ArrowUpRight size={14}/></a></div>
   <section className="cv-summary"><h3>Profile</h3><p>Exploring full-time frontend, full-stack and applied AI engineering opportunities.</p><p>Started in frontend development and expanded into backend systems, architecture and applied AI. Work spans sprint planning, deliverables, proofs of concept, MVPs and team collaboration. Deployments include Jenkins and CI/CD pipelines, staging and production environments, OCI, AWS and VPS hosting. Master’s in Data Science & AI, alongside an MBA.</p></section>
   <section aria-label="Recruitment details"><h3>Availability & role preferences</h3><RecruiterDetails/></section>
   <section><h3>Selected contributions</h3><ul><li>Delivered 40+ responsive websites and e-commerce solutions at Crazy Designers (2014–2017).</li><li>Led React/TypeScript migration work and contributed to Betfred game integration at Sharp Gaming.</li><li>Sole developer for a school ERP and its RAG assistant.</li><li>Built a real-time voice assistant from architecture through deployment as sole engineer.</li></ul></section>
    <section><h3>Experience</h3>{careerTimeline.map(role=><article className="cv-role" key={role.company}><div><strong>{role.scope?'Formal title: ':''}{role.role}</strong><span>{role.date}</span></div><h4>{role.company} · {role.location}</h4>{role.scope&&<p className="role-scope">Scope of work: {role.scope}</p>}<p>{role.summary} {role.detail}</p></article>)}</section>
   <section><h3>Core capabilities</h3><div className="cv-skills">{skills.map(skill=><div key={skill.title}><h4>{skill.title}</h4><p>{skill.items.join(' · ')}</p></div>)}</div></section>
   <section><h3>Education</h3>{education.map(([degree,focus,place,date])=><p key={degree}><strong>{degree} · {focus}</strong><br/>{place}{date&&<><br/><span className="education-date">{date}</span></>}</p>)}</section>
  </div>
 </dialog>;
}
