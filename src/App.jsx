import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowDown, Download, Play, Menu, X } from 'lucide-react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import Trailer, { introDurationSeconds } from './Trailer';
import QuickCV from './QuickCV';
import Portrait from './Portrait';
import Projects from './Projects';
import WebWork from './WebWork';
import Contact from './Contact';
import { roles, education, skills } from './career';
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


export default function App(){
 const [motion,setMotion]=useState(()=>typeof window==='undefined'||!matchMedia('(prefers-reduced-motion: reduce)').matches);
 const smoothScroll=useRef(null);
 const [trailer,setTrailer]=useState(false);
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
 const [menu,setMenu]=useState(false);const [chapter,setChapter]=useState('01');
 useEffect(()=>{
  // Safari does not focus buttons on pointer click. Preserve the dialog's return target.
  const focusDialogTrigger=event=>{
   const trigger=event.target.closest?.('.nav-cv, .header-cv, .profile-quick-link, .trailer-trigger');
   trigger?.focus({preventScroll:true});
  };
  document.addEventListener('click',focusDialogTrigger,true);
  return()=>document.removeEventListener('click',focusDialogTrigger,true);
 },[]);
 useEffect(()=>{document.documentElement.dataset.motion=motion?'on':'off'; const lenis=motion&&!trailer&&!quickCV&&!menu?new Lenis({autoRaf:true,duration:1.5,anchors:false}):null;smoothScroll.current=lenis;return()=>{lenis?.destroy();smoothScroll.current=null;};},[motion,trailer,quickCV,menu]);
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
 const nav=[['Profile','story'],['Selected work','work'],['Experience','experience']];
 return <>
 <a inert={menu?true:undefined} className="skip-link" href="#story">Skip to content</a>
 <header className={chapter!=='01'?'scrolled':''}><a className="brand" href="#home" aria-label="Sudheer Palakurla home">S<span className="brand-dot">.</span><span className="brand-name">AI ENGINEER<br/>PORTFOLIO</span></a><button className="header-cv" onClick={()=>{setMenu(false);setQuickCV(true);}} aria-label="Open quick CV">CV <ArrowUpRight size={14}/></button><nav id="main-navigation" aria-label="Main navigation" className={menu?'open':''}><div className="mobile-menu-heading">A little curiosity goes a long way.<span>EXPLORE THE PORTFOLIO</span></div>{nav.map(([label,id])=><a key={id} href={'#'+id} aria-current={chapter===({story:'02',work:'03',experience:'05'})[id]?'location':undefined} onClick={()=>setMenu(false)}>{label}</a>)}<button className="nav-cv" onClick={()=>{setMenu(false);setQuickCV(true);}}>Quick CV <ArrowUpRight size={14}/></button><a href="#contact" className="nav-contact" onClick={()=>setMenu(false)}>Let’s talk <ArrowUpRight size={14}/></a></nav><button className="menu-toggle" aria-controls="main-navigation" aria-label={menu?'Close navigation':'Open navigation'} aria-expanded={menu} onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</button></header>
 <div className="reading-progress" aria-hidden="true"/>
 <aside inert={menu?true:undefined} className="chapter-rail" aria-label="Portfolio chapters">{[['home','Introduction'],['story','Profile'],['work','Selected work'],['capabilities','Capabilities'],['experience','Timeline'],['contact','Contact']].map(([id,label],i)=><a key={id} href={'#'+id} aria-label={label} aria-current={Number(chapter)===i+1?'location':undefined}><span>{label}</span><i/></a>)}</aside>
 <main inert={menu?true:undefined}>
 <section id="home" className="hero" data-chapter="01">

  <div className="hero-content"><div className="eyebrow"><span className="status-dot"/> AI ENGINEER / FULL-STACK BUILDER</div><h1>Sudheer<br/><span>Palakurla.</span></h1><div className="hero-editorial">A human perspective.<br/><em>An engineering mindset.</em></div><p>I build AI systems that turn complex information into useful experiences — from retrieval and real-time voice to the full application around them.</p><div className="hero-actions secondary-actions"><a href="#work" className="button primary">Explore my work <ArrowUpRight size={17}/></a><a className="text-link" href="/Sudheer_Palakurla_AI_Engineer_CV.pdf" download>Download CV <Download size={15}/></a></div><div className="hero-actions"><button className="trailer-trigger" onClick={()=>setTrailer(true)}><span><Play size={13} fill="currentColor"/></span>Watch the introduction <small>{introDurationSeconds} SEC</small></button></div></div>
  <Portrait motion={motion && !trailer && !quickCV && !menu}/>
  <div className="hero-bottom"><a href="#story" className="scroll-prompt"><span className="scroll-icon"><ArrowDown size={15}/></span> SCROLL TO DISCOVER</a><span className="hero-caption">ENGINEERING WITH INTENT</span></div>
 </section>
 <div className="credential-strip"><div><strong>8+ years</strong><span>ENGINEERING EXPERIENCE</span></div><div><strong>95+ builds</strong><span>DELIVERED OR CONTRIBUTED TO</span></div><div><strong>Master’s</strong><span>DATA SCIENCE & AI</span></div><a href="#contact"><span className="status-dot"/> OPEN TO AI ENGINEERING ROLES <ArrowUpRight size={15}/></a></div>
 <section id="story" className="section story" data-chapter="02"><div className="section-kicker reveal"><span>THE PROFILE</span><span>CREATIVE THINKING. PRACTICAL ENGINEERING.</span></div><div className="story-grid"><div className="profile-title reveal"><h2>Thoughtful by nature.<br/><span>Engineer by craft.</span></h2><div className="impact-notes"><div><strong>30–40<span>%</span></strong><p>Improvement in performance and maintainability through frontend migrations.</p></div><div><strong>~40<span>%</span></strong><p>Fewer production defects after introducing automated test coverage.</p></div><span className="impact-source">SELECTED CAREER IMPACT<br/>AS REPORTED IN THE CV</span></div></div><div className="story-copy reveal"><p className="lead">I connect the intelligence inside a product with the experience people actually use.</p><p>My foundation is full-stack engineering: 8+ years across client applications, e-commerce, migrations, and technical leadership. Today, I apply that experience to production RAG, LLM routing, agentic workflows, and real-time voice AI.</p><div className="profile-facts"><div><span>WHAT I BRING</span><p>Hands-on delivery from architecture to deployment.</p></div><div><span>WHAT I’M LOOKING FOR</span><p>AI Engineer, Applied AI Engineer, and LLM / ML Engineer roles.</p></div></div><button className="profile-quick-link" onClick={()=>setQuickCV(true)}>The essentials, in two minutes <ArrowUpRight size={17}/></button></div></div></section>
 <section id="work" className="section work" data-chapter="03"><div className="section-kicker reveal"><span>SELECTED WORK</span><span>REAL SYSTEMS. REAL IMPACT.</span></div><div className="section-title reveal"><h2>Intelligence.<br/><span>In practice.</span></h2><p>Three systems. Different challenges.<br/>One approach: own the whole solution.</p></div><Projects/><WebWork/></section>
 <section id="capabilities" className="section toolkit" data-chapter="04"><div className="section-kicker reveal"><span>THE CAPABILITIES</span><span>THE TOOLS BEHIND THE THINKING</span></div><h2 className="reveal">The right tools.<br/><span>A considered approach.</span></h2><div className="skills-grid">{skills.map(skill=><div className="skill reveal" key={skill.title}><h3>{skill.title}</h3><p className="skill-subtitle">{skill.subtitle}</p>{skill.items.map(item=><p key={item}>{item}</p>)}<details className="skill-details"><summary aria-label={'More expertise: '+skill.title}>More expertise <span aria-hidden="true">+</span></summary><ul>{skill.more.map(item=><li key={item}>{item}</li>)}</ul></details></div>)}</div></section>
 <section id="experience" className="section experience" data-chapter="05"><div className="section-kicker reveal"><span>THE TIMELINE</span><span>EVERY CHAPTER BUILDS THE NEXT</span></div><h2 className="reveal">Experience,<br/><span>built over time.</span></h2><div className="timeline">{roles.map((role,i)=><article className="role reveal" key={role.company}><span className="role-date">{role.date}{i===0&&<span className="current-role">CURRENT</span>}</span><div><span className="role-name">{role.role} · {role.location}</span><h3>{role.company}</h3></div><div className="role-summary"><p>{role.summary}</p><div className="role-tags">{role.tags.map(tag=><span key={tag}>{tag}</span>)}</div></div></article>)}</div><div className="education reveal"><span className="eyebrow">THE FOUNDATION</span>{education.map(([degree,focus,place])=><div key={degree}><h3>{degree}</h3><span>{focus}</span><p>{place}</p></div>)}</div></section>
 <Contact/>
 </main><footer inert={menu?true:undefined}><a className="footer-brand" href="#home">S.</a><span>© {new Date().getFullYear()} · AI ENGINEERING</span><span>CRAFTED WITH INTENT. POWERED BY CURIOSITY.</span><a href="#home">BACK TO TOP ↑</a></footer>
 {quickCV && <QuickCV onClose={()=>setQuickCV(false)}/>}
 {trailer && <Trailer motion={motion} onClose={()=>setTrailer(false)} onNavigate={navigateFromIntro}/>}
 </>;
}
