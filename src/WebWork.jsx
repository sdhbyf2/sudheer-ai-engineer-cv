import { ArrowUpRight } from 'lucide-react';

const websites = [
 ['Betfred Games', 'https://www.betfred.com/games'],
 ['Crazy Techsol', 'https://crazytechsol.com/'],
 ['The Foot Doctor', 'https://thefootdoctor.in/'],
 ['KR Energy Consultants', 'https://krenergyconsultants.com/'],
 ['Sanguine Bio Instruments', 'http://sanguinebio.net/'],
 ['SK Security Services', 'https://www.sksecurityservices.co.uk/'],
 ['GetMyHotels', 'https://www.getmyhotels.com/'],
 ['Pain Divine', 'https://paindivine.co.uk/'],
];

export default function WebWork() {
 return <div className="web-work reveal" aria-labelledby="web-work-title">
  <div className="web-work-heading"><div><span className="eyebrow">WEB DESIGN & DEVELOPMENT</span><h3 id="web-work-title">Selected websites.</h3></div><p>Websites I’ve built or contributed to.</p></div>
  <ul className="web-work-links">{websites.map(([name, url])=><li key={url}>
   <a href={url} target="_blank" rel="noopener noreferrer" aria-label={name+' — open website in a new tab'}><span><strong>{name}</strong><small>{new URL(url).hostname.replace(/^www\./,'')}{url.startsWith('http:')?' · HTTP':''}</small></span><ArrowUpRight size={20} aria-hidden="true"/></a>
  </li>)}</ul>
 </div>;
}
