import { ArrowUpRight } from 'lucide-react';

const websites = [
 { name: 'Crazy Techsol', url: 'https://crazytechsol.com/', role: 'Independent build', contribution: 'Complete website and voice assistant.' },
 { name: 'Pain Divine', url: 'https://paindivine.co.uk/', role: 'Independent build', contribution: 'Website designed and developed independently.' },
 { name: 'KR Energy Consultants', url: 'https://krenergyconsultants.com/', role: 'Independent build', contribution: 'Website designed and developed independently.' },
 { name: 'SK Security Services', url: 'https://www.sksecurityservices.co.uk/', role: 'Independent build', contribution: 'Website designed and developed independently.' },
 { name: 'GetMyHotels', url: 'https://www.getmyhotels.com/', role: 'Team contribution', contribution: 'Contributed to the website as part of a team.' },
 { name: '3 Bolt Court', role: 'Team contribution', contribution: 'Internal clocking system and case management application.' },
 { name: 'Brittania Consultancy', url: 'https://brittaniaconsultancy.com/', role: 'Website & internal applications', contribution: 'Website, employee records and staff clocking, plus client onboarding, journey tracking, client login and invoice generation.' },
 { name: 'Lekhavali', url: 'https://lekhavali.com/', role: 'Work in progress', contribution: 'School management platform in development, connecting admissions, academics, attendance, fees, staff records and parent communication, with role-based access and AI-assisted workflows.' },
 { name: 'Betfred Games', url: 'https://www.betfred.com/games', role: 'Online gaming platform', contribution: 'Games platform with searchable game listings, category navigation and account access.' },
 { name: 'The Foot Doctor', url: 'https://thefootdoctor.in/', role: 'Healthcare website', contribution: 'Website presenting foot and ankle care services, specialist profiles, clinic locations and appointment enquiries.' },
 { name: 'Sanguine Bio Instruments', url: 'http://sanguinebio.net/', role: 'Laboratory equipment website', contribution: 'Product catalogue for laboratory and research instruments, with equipment categories, company information and enquiry contacts.' },
];

function WorkContent({ site }) {
 return <><span>{site.role&&<span className={'work-role'+(site.role==='Work in progress'?' work-in-progress':'')}>{site.role}</span>}<strong>{site.name}</strong>{site.contribution&&<span className="work-contribution">{site.contribution}</span>}{site.url&&<small>{new URL(site.url).hostname.replace(/^www\./,'')}{site.url.startsWith('http:')?' · HTTP':''}</small>}</span>{site.url&&<ArrowUpRight size={20} aria-hidden="true"/>}</>;
}

export default function WebWork() {
 return <section className="web-work reveal" aria-labelledby="web-work-title">
  <div className="web-work-heading"><div><span className="eyebrow">WEB DESIGN & DEVELOPMENT</span><h3 id="web-work-title">Selected websites & applications.</h3></div><p>Independent builds.<br/>Shared achievements.</p></div>
  <ul className="web-work-links">{websites.map(site=><li key={site.name}>
   {site.url ? <a href={site.url} target="_blank" rel="noopener noreferrer" aria-label={site.name+' — open website in a new tab'}>
    <span className="work-link-content"><WorkContent site={site}/></span>
   </a> : <div className="work-link-content work-internal"><WorkContent site={site}/></div>}
  </li>)}</ul>
 </section>;
}
