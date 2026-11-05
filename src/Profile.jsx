import { ArrowUpRight } from 'lucide-react';
import RecruiterDetails from './RecruiterDetails';
import RoleFit from './RoleFit';
import { deliveryStages } from './career';

export default function Profile({ onQuickCV }) {
 return <section id="story" className="section story" data-chapter="02">
  <div className="section-kicker reveal"><span>THE PROFILE</span><span>AI ENGINEERING · FULL-STACK · SOLUTION ARCHITECTURE</span></div>
  <div className="story-grid">
   <div className="profile-title reveal"><h2>Thoughtful by nature.<br/><span>Engineer by craft.</span></h2><p className="profile-origin">Frontend precision.<br/>Full-stack & AI architecture.</p></div>
   <div className="story-copy reveal"><p className="lead">I started with the interface. Today, I architect and deliver the whole system.</p><p>With 8+ years of software engineering experience and 95+ client web and e-commerce builds delivered across UK and international markets, my work spans RAG pipelines, multi-model LLM orchestration, real-time voice AI agents, distributed messaging (Kafka, RabbitMQ, Redis) and full-stack applications in Python, FastAPI, Node.js, React, Next.js and TypeScript.</p><p>I combine hands-on AI and full-stack engineering with Solution Architecture and Forward Deployed Engineering (FDE): leading customer discovery, requirements workshops, PoC-to-production delivery, and cloud deployments across OCI/OKE (Kubernetes), AWS, Cloudflare and Terraform.</p></div>
  </div>
  <section className="delivery-path reveal" aria-labelledby="delivery-path-title">
   <div className="profile-row-heading"><h3 id="delivery-path-title">From the first idea to a live product.</h3><p>Hands-on engineering through each stage.</p></div>
   <ol>{deliveryStages.map(stage=><li key={stage.title}><h4>{stage.title}</h4><p>{stage.description}</p><span>{stage.tools}</span></li>)}</ol>
  </section>
  <div className="profile-evidence reveal"><RoleFit/></div>
  <section className="profile-recruitment reveal" aria-labelledby="profile-recruitment-title">
   <div className="profile-row-heading"><h3 id="profile-recruitment-title">The practical details.</h3><p>Open to AI Engineer, Full-Stack Engineer and AI Solutions Architect / FDE roles.</p></div>
   <RecruiterDetails/>
   <div className="profile-summary-footer"><p>Solution architecture, customer discovery and production ownership.<br/>An engineer who stays close to the code.</p><button className="profile-quick-link" onClick={onQuickCV}>Open Quick CV <ArrowUpRight size={17}/></button></div>
  </section>
 </section>;
}
