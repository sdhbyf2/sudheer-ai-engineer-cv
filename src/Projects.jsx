import { useEffect, useState } from 'react';
import { ArrowRight, Plus, Minus, Link } from 'lucide-react';
import { projects, projectDecisions, email } from './career';
import { VoiceDemo, EdgeDemo } from './SystemDemos';

function ProjectArt({ project }) {
 const [step,setStep] = useState(1);
 const explanations = [
  'Start with the user’s question inside the school management ERP.',
  'Retrieve relevant context using PostgreSQL, pgvector, and HNSW indexing.',
  'Route the request to an LLM, with automatic fallback if a provider is unavailable.',
 ];
 return <div className={'project-art '+project.className}>
  <div className="diagram-heading"><span>ENGINEERING NOTE</span><span>{project.className==='rag'?'SELECT A STEP TO EXPLORE':'EXPLORE THE ARCHITECTURE'}</span></div>
  {project.className==='rag' ? <div className="retrieval-walkthrough"><div className="retrieval-diagram" role="group" aria-label="Explore the RAG architecture">
   <button className="diagram-node question" aria-pressed={step===0} aria-controls="rag-explanation" onClick={()=>setStep(0)}><span>INPUT</span><strong>User question</strong><small>Find the right context.</small></button>
   <div className="diagram-connector"><ArrowRight size={18}/></div>
   <button className="diagram-node retrieval" aria-pressed={step===1} aria-controls="rag-explanation" onClick={()=>setStep(1)}><span>RETRIEVE</span><div className="vector-matrix" aria-hidden="true">{Array.from({length:18},(_,i)=><i key={i}/>)}</div><strong>Vector search</strong><small>pgvector + HNSW</small></button>
   <div className="diagram-connector"><ArrowRight size={18}/></div>
   <button className="diagram-node answer" aria-pressed={step===2} aria-controls="rag-explanation" onClick={()=>setStep(2)}><span>GENERATE</span><strong>Contextual answer</strong><small>LLM routing + failover</small></button>
  </div><p id="rag-explanation" className="diagram-explanation" aria-live="polite"><span className="step-copy" key={step}>{explanations[step]}</span></p></div> : project.className==='voice' ? <VoiceDemo/> : <EdgeDemo/>}
  <div className="diagram-caption"><span>{project.subtitle}</span><span>DESIGNED & BUILT</span></div>
 </div>;
}

export default function Projects() {
 const [expanded,setExpanded] = useState(null);
 const [copied,setCopied] = useState(null);
 const [copyFailed,setCopyFailed] = useState(null);
 useEffect(()=>{
  const select=hash=>{
   const project=projects.find(item=>hash==='#project-'+item.className);
   if(project)setExpanded(project.id);
  };
  const restore=()=>select(location.hash);
  const navigate=event=>{
   if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   const link=event.target.closest?.('a[href^="#project-"]');
   if(link)select(link.hash);
  };
  restore();
  window.addEventListener('hashchange',restore);
  window.addEventListener('popstate',restore);
  document.addEventListener('click',navigate);
  return()=>{window.removeEventListener('hashchange',restore);window.removeEventListener('popstate',restore);document.removeEventListener('click',navigate);};
 },[]);
 const copyLink=async project=>{
  try {
   await navigator.clipboard.writeText(new URL('#project-'+project.className,location.href).href);
   setCopied(project.id);setCopyFailed(null);
  } catch {setCopied(null);setCopyFailed(project.id);}
 };
 return <div className="project-grid balanced-projects">{projects.map(project=><article id={'project-'+project.className} key={project.id} className={'project reveal project-'+project.id}>
  <ProjectArt project={project}/>
  <div className="project-info">
   <span className="eyebrow">{project.type}</span><h3>{project.name}</h3><p>{project.description}</p>
   <div className="project-ownership"><span>MY CONTRIBUTION</span><strong>{project.role}</strong></div>
   <div className="tags">{project.tags.map(tag=><span key={tag}>{tag}</span>)}</div>
   <button className="project-more" aria-label={(expanded===project.id?'Close case study: ':'Read case study: ')+project.name} aria-expanded={expanded===project.id} aria-controls={'detail-'+project.id} onClick={()=>setExpanded(expanded===project.id?null:project.id)}>
    {expanded===project.id?'Close case study':'Read the case study'}{expanded===project.id?<Minus size={17}/>:<Plus size={17}/>}</button>
   <div id={'detail-'+project.id} hidden={expanded!==project.id} className="project-detail">
    <dl><dt>The challenge</dt><dd>{project.challenge}</dd></dl>
    <h4 className="case-study-heading">Engineering decisions</h4>
    <ul className="case-decisions">{projectDecisions[project.className].map(decision=><li key={decision.title}><h5>{decision.title}</h5><p>{decision.detail}</p></li>)}</ul>
    <div className="case-outcome"><h4>What it delivers</h4><p>{project.outcome}</p></div>
    <div className="case-share"><button aria-label={'Copy case study link: '+project.subtitle} onClick={()=>copyLink(project)}><Link size={16} aria-hidden="true"/>{copied===project.id?'Link copied':'Copy case study link'}</button><p role="status">{copied===project.id?'Case study link copied.':copyFailed===project.id?'Clipboard unavailable. Use the direct link below.':''}</p>{copyFailed===project.id&&<a href={'#project-'+project.className}>Open direct case study link</a>}</div>
    <a className="case-contact" href={'mailto:'+email+'?subject='+encodeURIComponent('Let’s discuss: '+project.subtitle)} aria-label={'Discuss this project: '+project.subtitle}>Discuss this project <ArrowRight size={17}/></a>
   </div>
  </div>
 </article>)}</div>;
}
