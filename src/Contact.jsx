import { useState } from 'react';
import { ArrowUpRight, Check, Copy, Download } from 'lucide-react';
import { cvUrl, email, linkedin } from './career';

export default function Contact() {
 const [copyState,setCopyState] = useState('idle');
 async function copyEmail() {
  try { await navigator.clipboard.writeText(email); setCopyState('copied'); }
  catch { setCopyState('failed'); }
 }
 return <section id="contact" className="section contact" data-chapter="06">
  <div className="eyebrow reveal"><span className="status-dot"/> OPEN TO AI ENGINEERING OPPORTUNITIES</div>
  <h2 className="reveal">A good conversation.<br/><span>A great next chapter.</span></h2>
  <p className="contact-intro reveal">Hiring an AI engineer or building an intelligent product?<br/>Let’s talk about what you have in mind.</p>
  <div className="contact-actions reveal"><a className="contact-link" href={'mailto:'+email}>{email} <ArrowUpRight/></a><button className="copy-email" onClick={copyEmail} aria-label={copyState==='copied'?'Email copied':'Copy email address'}>{copyState==='copied'?<Check size={17}/>:<Copy size={17}/>}</button></div>
  <p className="copy-feedback" role="status">{copyState==='copied'?'Email address copied.':copyState==='failed'?'Copy unavailable. You can use the email link above.':''}</p>
  <div className="contact-bottom"><p>From architecture to the final interaction.<br/>Ready to own the whole challenge.</p><a href={linkedin} target="_blank" rel="noreferrer">LinkedIn <ArrowUpRight size={16}/></a><a href={cvUrl} download>Download CV <Download size={16}/></a></div>
 </section>;
}
