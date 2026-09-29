import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowDown, Download, Play, Menu, X, MessageCircle } from 'lucide-react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import Trailer, { introDurationSeconds } from './Trailer';
import QuickCV from './QuickCV';
import Portrait from './Portrait';
import Projects from './Projects';
import WebWork from './WebWork';
import Contact from './Contact';
import AssistantPanel from './AssistantPanel';
import Profile from './Profile';
import Experience from './Experience';
import DownloadCVModal from './DownloadCVModal';
import PrivacyPolicy from './PrivacyPolicy';
import { skills } from './career';
import { lockPageScroll } from './scrollLock';
import './style.css';
import './fonts.css';
import './refinements.css';
import './balanced.css';
import './elegance.css';
import './circle-portrait.css';
import './surfaces.css';
import './mobile.css';
import './geometric.css';
import './cinematic.css';
import './intro.css';
import './assistant.css';


export default function App(){
 const [motion,setMotion]=useState(()=>typeof window==='undefined'||!matchMedia('(prefers-reduced-motion: reduce)').matches);
 const [assistantOpen,setAssistantOpen]=useState(false);
 const smoothScroll=useRef(null);
 const [trailer,setTrailer]=useState(false);
 useEffect(()=>{
  fetch('/api/assistant/session', {
   method: 'POST',
   credentials: 'same-origin',
  }).catch(()=>{});
 },[]);
 const introDestination=useRef(null);
 const navigateFromIntro=id=>{introDestination.current=id;setTrailer(false);};
 useEffect(()=>{
  if(trailer||!introDestination.current)return;
  const id=introDestination.current;
  introDestination.current=null;
  const frame=requestAnimationFrame(()=>document.querySelector('.chapter-rail a[href="#'+id+'"]')?.click());
  return()=>cancelAnimationFrame(frame);
 },[trailer]);
 const [quickCV,setQuickCV]=useState(false);
 const [cvModalOpen,setCvModalOpen]=useState(false);
 const [privacyModalOpen,setPrivacyModalOpen]=useState(false);
 const [assistantProject,setAssistantProject]=useState('');
 const openAssistant=(project='')=>{setAssistantProject(project);setAssistantOpen(true);};
 const [menu,setMenu]=useState(false);const [chapter,setChapter]=useState('01');
 useEffect(()=>{
  // Safari does not focus buttons on pointer click. Preserve the dialog's return target.
  const focusDialogTrigger=event=>{
   const trigger=event.target.closest?.('.nav-cv, .header-cv, .profile-quick-link, .trailer-trigger, .steve-launcher, .ask-steve-link, .ask-project, .steve-contact-button, .cv-contact-button, .contact-cv-link');
   trigger?.focus({preventScroll:true});
  };
  document.addEventListener('click',focusDialogTrigger,true);
  return()=>document.removeEventListener('click',focusDialogTrigger,true);
 },[]);
 useEffect(()=>{document.documentElement.dataset.motion=motion?'on':'off'; const lenis=motion&&!trailer&&!quickCV&&!assistantOpen&&!menu&&!cvModalOpen?new Lenis({autoRaf:true,duration:1.5,anchors:false}):null;smoothScroll.current=lenis;return()=>{lenis?.destroy();smoothScroll.current=null;};},[motion,trailer,quickCV,assistantOpen,menu,cvModalOpen]);
 useEffect(()=>{const reveal=new IntersectionObserver(entries=>entries.forEach(e=>{e.target.classList.toggle('in-view',e.isIntersecting);if(e.isIntersecting)e.target.classList.add('revealed');}),{threshold:.05});document.querySelectorAll('.reveal').forEach(el=>reveal.observe(el));return()=>reveal.disconnect();},[]);
 useEffect(()=>{
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const change=()=>setMotion(!media.matches);
  media.addEventListener('change',change);
  return()=>media.removeEventListener('change',change);
 },[]);
 useEffect(()=>{
  const query=matchMedia('(max-width: 900px)');
  const update=()=>{if(!query.matches)setMenu(false);};
  query.addEventListener('change',update);
  return()=>query.removeEventListener('change',update);
 },[]);
 useEffect(()=>{
  if(!menu)return;
  const unlock=lockPageScroll();
  const frame=requestAnimationFrame(()=>document.querySelector('#main-navigation a')?.focus());
  const onKey=event=>{
   if(event.key==='Escape'){event.preventDefault();setMenu(false);document.querySelector('.menu-toggle')?.focus();}
   if(event.key!=='Tab')return;
   const nodes=[...document.querySelectorAll('header a,header button')].filter(el=>el.getClientRects().length&&!el.disabled);
   const first=nodes[0],last=nodes.at(-1);
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  };
  document.addEventListener('keydown',onKey);
  return()=>{cancelAnimationFrame(frame);document.removeEventListener('keydown',onKey);unlock();};
 },[menu]);
 useEffect(()=>{
  let frame=0;
  const update=()=>{
   frame=0;
   const progress=Math.min(1,Math.max(0,scrollY/Math.max(1,innerHeight)));
   document.documentElement.style.setProperty('--hero-progress',motion?progress:0);
   document.documentElement.style.setProperty('--page-progress',Math.min(1,Math.max(0,scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight))));
   const sections=[...document.querySelectorAll('[data-chapter]')];
   let current=sections[0];
   sections.forEach(section=>{
    const bounds=section.getBoundingClientRect();
    if(bounds.top<=innerHeight*.38)current=section;
    const offset=Math.max(-1,Math.min(1,(bounds.top-innerHeight*.25)/innerHeight));
    section.style.setProperty('--section-drift',motion?offset:0);
    section.style.setProperty('--journey-progress',Math.max(0,Math.min(1,(innerHeight*.75-bounds.top)/Math.max(1,bounds.height))));
   });
   if(current)setChapter(current.dataset.chapter);
  };
  const onScroll=()=>{if(!frame)frame=requestAnimationFrame(update);};
  window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',onScroll);update();
  return()=>{window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',onScroll);cancelAnimationFrame(frame);};
 },[motion]);
 useEffect(()=>{
  let pending=0;
  let disposed=false;
  let interacted=false;
  const align=(target,animated=false,focus=false)=>{
   cancelAnimationFrame(pending);
   pending=requestAnimationFrame(()=>{pending=requestAnimationFrame(()=>{
    const mobile=matchMedia('(max-width:900px)').matches;
    const headerHeight=mobile?document.querySelector('header').getBoundingClientRect().height:72;
    const padding=target.id==='home'?0:parseFloat(getComputedStyle(target).paddingTop);
    const top=target.id==='home'?0:Math.max(0,scrollY+target.getBoundingClientRect().top+padding-headerHeight-24);
    if(focus){target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}
    if(smoothScroll.current)smoothScroll.current.scrollTo(top,{duration:1.15,immediate:!animated});
    else window.scrollTo({top,behavior:'instant'});
   });});
  };
  const restore=()=>{
   const target=document.getElementById(location.hash.slice(1)||'home');
   if(target){setMenu(false);align(target);}
  };
  const navigate=event=>{
   const link=event.target.closest?.('a[href^="#"]');
   if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   const target=document.getElementById(link.hash.slice(1));
   if(!target)return;
   event.preventDefault();interacted=true;setMenu(false);
   if(location.hash!==link.hash)history.pushState(null,'',link.hash);
   align(target,true,true);
  };
  const userScroll=()=>{interacted=true;};
  document.fonts.ready.then(()=>{if(!disposed&&!interacted&&location.hash)restore();});
  document.addEventListener('click',navigate);
  window.addEventListener('popstate',restore);
  window.addEventListener('hashchange',restore);
  window.addEventListener('wheel',userScroll,{passive:true});
  window.addEventListener('touchstart',userScroll,{passive:true});
  return()=>{disposed=true;document.removeEventListener('click',navigate);window.removeEventListener('popstate',restore);window.removeEventListener('hashchange',restore);window.removeEventListener('wheel',userScroll);window.removeEventListener('touchstart',userScroll);cancelAnimationFrame(pending);};
 },[]);
 const nav=[['Profile','story'],['Experience','experience'],['Selected work','work']];
 return <>
 <a inert={menu?true:undefined} className="skip-link" href="#story">Skip to content</a>
 <header className={chapter!=='01'?'scrolled':''}><a className="brand" href="#home" aria-label="Sudheer Palakurla home">S<span className="brand-dot">.</span><span className="brand-name">FULL-STACK & AI<br/>PORTFOLIO</span></a><button className="header-cv" onClick={()=>{setMenu(false);setQuickCV(true);}} aria-label="Open quick CV">CV <ArrowUpRight size={14}/></button><nav id="main-navigation" aria-label="Main navigation" className={menu?'open':''}><div className="mobile-menu-heading">A little curiosity goes a long way.<span>EXPLORE THE PORTFOLIO</span></div>{nav.map(([label,id])=><a key={id} href={'#'+id} aria-current={chapter===({story:'02',experience:'03',work:'04'})[id]?'location':undefined} onClick={()=>setMenu(false)}>{label}</a>)}<button className="nav-cv" onClick={()=>{setMenu(false);setQuickCV(true);}}>Quick CV <ArrowUpRight size={14}/></button><a href="#contact" className="nav-contact" onClick={()=>setMenu(false)}>Discuss a role <ArrowUpRight size={14}/></a></nav><button className="menu-toggle" aria-controls="main-navigation" aria-label={menu?'Close navigation':'Open navigation'} aria-expanded={menu} onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</button></header>
 <div className="reading-progress" aria-hidden="true"/>
 <aside inert={menu?true:undefined} className="chapter-rail" aria-label="Portfolio chapters">{[['home','Introduction'],['story','Profile'],['experience','Experience'],['work','Selected work'],['capabilities','Capabilities'],['contact','Contact']].map(([id,label],i)=><a key={id} href={'#'+id} aria-label={label} aria-current={Number(chapter)===i+1?'location':undefined}><span>{label}</span><i/></a>)}</aside>
 <main inert={menu?true:undefined}>
 <section id="home" className="hero" data-chapter="01">

  <div className="hero-content"><div className="eyebrow"><span className="status-dot"/> OPEN TO FULL-TIME ENGINEERING ROLES</div><h1>Sudheer<br/><span>Palakurla.</span></h1><div className="hero-editorial">Full-stack engineer.<br/><em>Working in applied AI.</em></div><p>I bring 8+ years in software development, growing from frontend into full-stack engineering and applied AI. I work across architecture, planning, development and deployment to turn ideas into working products.</p><p className="hero-hiring-facts">London / 1 month notice / Sponsorship required</p><div className="hero-actions secondary-actions"><button type="button" className="button primary" onClick={()=>setCvModalOpen(true)}>Download CV <Download size={17}/></button><a className="text-link" href="#experience">View experience <ArrowUpRight size={15}/></a><button className="text-link ask-steve-link" onClick={()=>openAssistant()}><span>Ask Steve</span><ArrowUpRight size={15}/></button></div><div className="hero-actions"><button className="trailer-trigger" onClick={()=>setTrailer(true)}><span><Play size={13} fill="currentColor"/></span>Watch the introduction <small>{introDurationSeconds} SEC</small></button></div></div>
  <Portrait motion={motion && !trailer && !quickCV && !assistantOpen && !menu && !cvModalOpen}/>
  <div className="hero-bottom"><a href="#story" className="scroll-prompt"><span className="scroll-icon"><ArrowDown size={15}/></span> SCROLL TO DISCOVER</a><span className="hero-caption">ENGINEERING WITH INTENT</span></div>
 </section>
 <div className="credential-strip"><div><strong>8+ years</strong><span>SOFTWARE DEVELOPMENT</span></div><div><strong>40+ websites</strong><span>CRAZY DESIGNERS · 2014–2017</span></div><div><strong>Master’s</strong><span>DATA SCIENCE & AI</span></div><a href="#contact"><span className="status-dot"/> OPEN TO FULL-TIME ENGINEERING ROLES <ArrowUpRight size={15}/></a></div>
 <Profile onQuickCV={()=>setQuickCV(true)}/>
 <Experience/>
 <section id="work" className="section work" data-chapter="04"><div className="section-kicker reveal"><span>SELECTED WORK</span><span>REAL SYSTEMS. REAL IMPACT.</span></div><div className="section-title reveal"><h2>Intelligence.<br/><span>In practice.</span></h2><p>Three AI case studies.<br/>My contribution, decisions, and delivered capabilities.</p></div><Projects onAskSteve={project=>openAssistant(project)}/><WebWork/></section>
 <section id="capabilities" className="section toolkit" data-chapter="05"><div className="section-kicker reveal"><span>THE CAPABILITIES</span><span>THE TOOLS BEHIND THE THINKING</span></div><h2 className="reveal">The right tools.<br/><span>A considered approach.</span></h2><div className="skills-grid">{skills.map(skill=><div className="skill reveal" key={skill.title}><h3>{skill.title}</h3><p className="skill-subtitle">{skill.subtitle}</p>{skill.items.map(item=><p key={item}>{item}</p>)}<details className="skill-details"><summary aria-label={'More expertise: '+skill.title}>More expertise <span aria-hidden="true">+</span></summary><ul>{skill.more.map(item=><li key={item}>{item}</li>)}</ul></details></div>)}</div></section>
 <Contact onAskSteve={()=>openAssistant()} onDownloadCV={()=>setCvModalOpen(true)}/>
 </main><footer inert={menu?true:undefined}><a className="footer-brand" href="#home">S.</a><span>© {new Date().getFullYear()} · SOFTWARE & AI ENGINEERING</span><span>CRAFTED WITH INTENT. POWERED BY CURIOSITY.</span><button type="button" className="footer-privacy-link" onClick={()=>setPrivacyModalOpen(true)}>Privacy Policy</button><a href="#home">BACK TO TOP ↑</a></footer>
 {quickCV && <QuickCV onClose={()=>setQuickCV(false)} onDownloadCV={()=>setCvModalOpen(true)}/>}
 {cvModalOpen && <DownloadCVModal onClose={()=>setCvModalOpen(false)}/>}
 <button className="steve-launcher" type="button" aria-haspopup="dialog" aria-expanded={assistantOpen} onClick={()=>openAssistant()}><MessageCircle size={18}/> Ask Steve</button>
 <AssistantPanel open={assistantOpen} projectId={assistantProject} onClearProject={()=>setAssistantProject('')} onClose={()=>setAssistantOpen(false)}/>
 {trailer && <Trailer motion={motion} onClose={()=>setTrailer(false)} onNavigate={navigateFromIntro}/>}
 {privacyModalOpen && <PrivacyPolicy onClose={()=>setPrivacyModalOpen(false)}/>}
 </>;
}
