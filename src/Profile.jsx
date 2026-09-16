import { ArrowUpRight } from 'lucide-react';
import RecruiterDetails from './RecruiterDetails';
import RoleFit from './RoleFit';
import { deliveryStages } from './career';

export default function Profile({ onQuickCV }) {
 return <section id="story" className="section story" data-chapter="02">
  <div className="section-kicker reveal"><span>THE PROFILE</span><span>FRONTEND ROOTS. END-TO-END DELIVERY.</span></div>
  <div className="story-grid">
   <div className="profile-title reveal"><h2>Thoughtful by nature.<br/><span>Engineer by craft.</span></h2><p className="profile-origin">Frontend precision.<br/>A full-stack perspective.</p></div>
   <div className="story-copy reveal"><p className="lead">I started with the interface. Today, I help deliver the whole product.</p><p>My 8+ years in software development began in frontend, then expanded into backend systems, architecture and applied AI. I’ve worked with teams delivering hundreds of websites, alongside business applications and AI features.</p><p>I connect technical decisions with the work needed to ship: planning, sprint deliverables, proofs of concept, MVPs, and releases to staging and production.</p></div>
  </div>
  <section className="delivery-path reveal" aria-labelledby="delivery-path-title">
   <div className="profile-row-heading"><h3 id="delivery-path-title">From the first idea to a live product.</h3><p>Hands-on engineering through each stage.</p></div>
   <ol>{deliveryStages.map(stage=><li key={stage.title}><h4>{stage.title}</h4><p>{stage.description}</p><span>{stage.tools}</span></li>)}</ol>
  </section>
  <div className="profile-evidence reveal"><RoleFit/></div>
  <section className="profile-recruitment reveal" aria-labelledby="profile-recruitment-title">
   <div className="profile-row-heading"><h3 id="profile-recruitment-title">The practical details.</h3><p>Open to frontend, full-stack and applied AI roles.</p></div>
   <RecruiterDetails/>
   <div className="profile-summary-footer"><p>Architecture, team collaboration and delivery ownership.<br/>A developer who stays close to the code.</p><button className="profile-quick-link" onClick={onQuickCV}>Open Quick CV <ArrowUpRight size={17}/></button></div>
  </section>
 </section>;
}
