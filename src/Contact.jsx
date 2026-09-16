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
  <div className="eyebrow reveal"><span className="status-dot"/> OPEN TO FULL-TIME AI ENGINEERING ROLES</div>
  <h2 className="reveal">A good conversation.<br/><span>A great next chapter.</span></h2>
  <p className="contact-intro reveal">Hiring for your engineering team? <br/>I’d welcome a conversation about the role, your team, and how I could contribute.</p>
  <div className="role-contact-action reveal"><a className="button primary" href={'mailto:'+email+'?subject='+encodeURIComponent('AI Engineer opportunity')}>Discuss a role <ArrowUpRight size={17}/></a></div>
  <div className="contact-actions reveal"><a className="contact-link" href={'mailto:'+email+'?subject='+encodeURIComponent('AI Engineer opportunity')}>{email} <ArrowUpRight/></a><button className="copy-email" onClick={copyEmail} aria-label={copyState==='copied'?'Email copied':'Copy email address'}>{copyState==='copied'?<Check size={17}/>:<Copy size={17}/>}</button></div>
  <p className="copy-feedback" role="status">{copyState==='copied'?'Email address copied.':copyState==='failed'?'Copy unavailable. You can use the email link above.':''}</p>
  <div className="contact-bottom"><p>AI Engineer · Applied AI Engineer · LLM Engineer<br/>Full-stack experience. A focus on useful AI.</p><a href={linkedin} target="_blank" rel="noreferrer">LinkedIn <ArrowUpRight size={16}/></a><a href="https://github.com/sdhbyf2/sudheer-ai-engineer-cv" target="_blank" rel="noreferrer">Portfolio source <ArrowUpRight size={16}/></a><a href={cvUrl} download>Download CV <Download size={16}/></a></div>
 </section>;
}
