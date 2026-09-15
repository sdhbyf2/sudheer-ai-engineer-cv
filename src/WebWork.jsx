import { ArrowUpRight } from 'lucide-react';

const websites = [
 { name: 'Crazy Techsol', url: 'https://crazytechsol.com/', role: 'Independent build', contribution: 'Complete website and voice assistant.', preview: '/work/crazy-techsol.webp' },
 { name: 'Pain Divine', url: 'https://paindivine.co.uk/', role: 'Independent build', contribution: 'Website designed and developed independently.', preview: '/work/pain-divine.webp' },
 { name: 'KR Energy Consultants', url: 'https://krenergyconsultants.com/', role: 'Independent build', contribution: 'Website designed and developed independently.' },
 { name: 'SK Security Services', url: 'https://www.sksecurityservices.co.uk/', role: 'Independent build', contribution: 'Website designed and developed independently.' },
 { name: 'GetMyHotels', url: 'https://www.getmyhotels.com/', role: 'Team contribution', contribution: 'Contributed to the website as part of a team.' },
 { name: '3 Bolt Court', role: 'Team contribution', contribution: 'Internal clocking system and case management application.' },
 { name: 'Brittania Consultancy', url: 'https://brittaniaconsultancy.com/', role: 'Website & internal applications', contribution: 'Website, employee records and staff clocking, plus client onboarding, journey tracking, client login and invoice generation.' },
 { name: 'Lekhavali', url: 'https://lekhavali.com/', role: 'Work in progress', contribution: 'School operating system in development.' },
 { name: 'Betfred Games', url: 'https://www.betfred.com/games' },
 { name: 'The Foot Doctor', url: 'https://thefootdoctor.in/' },
 { name: 'Sanguine Bio Instruments', url: 'http://sanguinebio.net/' },
];

function WorkContent({ site }) {
 return <><span>{site.role&&<span className={'work-role'+(site.role==='Work in progress'?' work-in-progress':'')}>{site.role}</span>}<strong>{site.name}</strong>{site.contribution&&<span className="work-contribution">{site.contribution}</span>}{site.url&&<small>{new URL(site.url).hostname.replace(/^www\./,'')}{site.url.startsWith('http:')?' · HTTP':''}</small>}</span>{site.url&&<ArrowUpRight size={20} aria-hidden="true"/>}</>;
}

export default function WebWork() {
 return <div className="web-work reveal" aria-labelledby="web-work-title">
  <div className="web-work-heading"><div><span className="eyebrow">WEB DESIGN & DEVELOPMENT</span><h3 id="web-work-title">Selected websites & applications.</h3></div><p>Independent builds.<br/>Shared achievements.</p></div>
  <ul className="web-work-links">{websites.map(site=><li key={site.name} className={site.preview?'work-with-preview':''}>
   {site.url ? <a href={site.url} target="_blank" rel="noopener noreferrer" aria-label={site.name+' — open website in a new tab'}>
    {site.preview&&<img className="work-preview" src={site.preview} width="1200" height="750" loading="lazy" decoding="async" alt={site.name+' website preview'}/>}
    <span className="work-link-content"><WorkContent site={site}/></span>
   </a> : <div className="work-link-content work-internal"><WorkContent site={site}/></div>}
  </li>)}</ul>
 </div>;
}
