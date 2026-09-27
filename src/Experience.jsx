import { careerTimeline, education } from './career';

export default function Experience() {
 return <section id="experience" className="section experience" data-chapter="03">
  <div className="section-kicker reveal"><span>PROFESSIONAL EXPERIENCE</span><span>CONTRIBUTION. COLLABORATION. OWNERSHIP.</span></div>
  <h2 className="reveal">Experience,<br/><span>built over time.</span></h2>
    <div className="timeline">{careerTimeline.map(role=><article className="role reveal" key={role.company}>
    <span className="role-date">{role.date}{role.scope&&<span className="current-role">CURRENT</span>}</span>
    <div><span className="role-name">{role.scope?'Formal title: ':''}{role.role} · {role.location}</span><h3>{role.company}</h3>{role.scope&&<p className="role-scope">Scope of work: {role.scope}</p>}</div>
    <div className="role-summary"><p>{role.summary}</p>{role.scope&&<p className="role-detail">{role.detail}</p>}<div className="role-tags">{role.tags.map(tag=><span key={tag}>{tag}</span>)}</div></div>
    </article>)}</div>
  <div className="education reveal"><span className="eyebrow">THE FOUNDATION</span>{education.map(([degree,focus,place,date])=><div key={degree}><h3>{degree}</h3><span>{focus}</span><p>{place}</p>{date&&<p className="education-date">{date}</p>}</div>)}</div>
 </section>;
}
