import { ArrowUpRight } from 'lucide-react';

const websites = [
 { name: 'Betfred Games', url: 'https://www.betfred.com/games', role: 'Senior frontend developer · Sharp Gaming team', contribution: 'Enterprise betting and gaming platform involving distributed services, third-party game integration, latency optimisation, Kafka, RabbitMQ, Redis, WebSockets, Kubernetes/OKE, Terraform and Instana monitoring.' },
 { name: 'GetMyHotels', url: 'https://www.getmyhotels.com/', role: 'Team contribution · AI-powered hotel booking', contribution: 'Customer-facing search and booking workflows built with Kafka-driven messaging, Redis caching, WebSockets, payment integrations and Terraform infrastructure provisioning.' },
 { name: '3 Bolt Court', role: 'Team contribution · Legal services platform', contribution: 'Digital platform, internal clocking and case management built with service-oriented microservices architecture, Redis caching, payment integrations and Terraform deployment.' },
 { name: 'Brittania Consultancy', url: 'https://brittaniaconsultancy.com/', role: 'Website & internal applications', contribution: 'Website, employee records and staff clocking, plus serverless client onboarding, journey tracking, client login, invoice generation and case-management ERP RAG assistant.' },
 { name: 'Lekhavali', url: 'https://lekhavali.com/', role: 'Work in progress', contribution: 'School management platform in development, connecting admissions, academics, attendance, fees, staff records and parent communication, with role-based access and AI-assisted workflows.' },
 { name: 'Crazy Techsol', url: 'https://crazytechsol.com/', role: 'Independent build', contribution: 'Complete website and real-time AI voice assistant.' },
 { name: 'Pain Divine', url: 'https://paindivine.co.uk/', role: 'Independent build', contribution: 'Website designed and developed independently.' },
 { name: 'KR Energy Consultants', url: 'https://krenergyconsultants.com/', role: 'Independent build', contribution: 'Renewable energy consultancy website designed and developed independently.' },
 { name: 'SK Security Services', url: 'https://www.sksecurityservices.co.uk/', role: 'Independent build', contribution: 'Website designed and developed independently.' },
 { name: 'The Foot Doctor', url: 'https://thefootdoctor.in/', role: 'Independent build', contribution: 'Built the complete healthcare website independently, presenting services, specialists, locations and appointment enquiries.' },
 { name: 'Sanguine Bio Instruments', url: 'http://sanguinebio.net/', role: 'Independent build', contribution: 'Built the complete laboratory equipment website independently, including its product catalogue, company information and enquiry pages.' },
];

function WorkContent({ site }) {
 return <><span>{site.role&&<span className={'work-role'+(site.role==='Work in progress'?' work-in-progress':'')}>{site.role}</span>}<strong>{site.name}</strong>{site.contribution&&<span className="work-contribution">{site.contribution}</span>}{site.url&&<small>{new URL(site.url).hostname.replace(/^www\./,'')}{site.url.startsWith('http:')?' · HTTP':''}</small>}</span>{site.url&&<ArrowUpRight size={20} aria-hidden="true"/>}</>;
}

export default function WebWork() {
 return <section className="web-work reveal" aria-labelledby="web-work-title">
  <div className="web-work-heading"><div><span className="eyebrow">SELECTED ENTERPRISE & CLIENT PLATFORMS</span><h3 id="web-work-title">Websites & applications.</h3></div><p>Distributed platforms, AI workflows,<br/>and client builds delivered end-to-end.</p></div>
  <details className="work-collection"><summary>Explore {websites.length} additional projects <span aria-hidden="true">+</span></summary>
  <ul className="web-work-links">{websites.map(site=><li key={site.name}>
   {site.url ? <a href={site.url} target="_blank" rel="noopener noreferrer" aria-label={site.name+' — open website in a new tab'}>
    <span className="work-link-content"><WorkContent site={site}/></span>
   </a> : <div className="work-link-content work-internal"><WorkContent site={site}/></div>}
  </li>)}</ul></details>
 </section>;
}
