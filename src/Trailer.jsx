import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play, RotateCcw, X } from 'lucide-react';
import { lockPageScroll } from './scrollLock';
import IntroGraphic from './IntroGraphic';

const scenes = [
 { chapter: 'Perspective', label: 'THE APPROACH', first: 'Complex problems.', last: 'Clear experiences.', caption: 'AI systems, built around the people who use them.', detail: 'From architecture to the final interaction.', duration: 6000 },
 { chapter: 'Experience', label: 'THE FOUNDATION', first: '8+ years.', last: 'Built in the real world.', caption: 'Frontend roots. Full-stack delivery. Applied AI.', detail: 'Architecture, sprint planning, POCs, MVPs and production releases.', duration: 8000 },
 { chapter: 'Systems', label: 'THE AI WORK', first: 'Intelligence.', last: 'Built to work.', caption: 'RAG, real-time voice and resilient LLM routing.', detail: 'Retrieval, model integration, frontend and cloud deployment.', duration: 9000 },
 { chapter: 'Next chapter', label: 'WHAT COMES NEXT', first: 'Your next engineer.', last: 'Ready to contribute.', caption: 'Explore the systems. See how I think and build.', detail: 'Open to full-time engineering opportunities.', duration: 7000 },
];
const starts = scenes.map((_,i)=>scenes.slice(0,i).reduce((total,scene)=>total+scene.duration,0));
const duration = scenes.reduce((total,scene)=>total+scene.duration,0);
export const introDurationSeconds = duration/1000;
const timestamp = value => '00:'+String(Math.floor(value/1000)).padStart(2,'0');

export default function Trailer({ motion, onClose, onNavigate }) {
 const dialog = useRef(null);
 const [playing,setPlaying] = useState(motion);
 const [playhead,setPlayhead] = useState(0);
 const scene = Math.max(0,starts.findLastIndex(start=>playhead>=start));
 const current = scenes[scene];
 const complete = playhead>=duration;
 useEffect(()=>{
  const previousFocus=document.activeElement;
  const unlock=lockPageScroll();
  const modal=dialog.current;
  modal.showModal();
  return()=>{modal.close();unlock();previousFocus?.focus({preventScroll:true});};
 },[]);
 useEffect(()=>{if(!motion)setPlaying(false);},[motion]);
 useEffect(()=>{
  if(!playing)return;
  let last=performance.now();
  const resetClock=()=>{last=performance.now();};
  document.addEventListener('visibilitychange',resetClock);
  const timer=setInterval(()=>{
   const now=performance.now();
   const delta=now-last;
   last=now;
   if(!document.hidden)setPlayhead(value=>Math.min(duration,value+delta));
  },100);
  return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',resetClock);};
 },[playing]);
 useEffect(()=>{if(complete)setPlaying(false);},[complete]);
 const go=index=>{setPlayhead(starts[Math.max(0,Math.min(scenes.length-1,index))]);setPlaying(false);};
 const toggle=()=>{if(complete){setPlayhead(0);setPlaying(true);}else setPlaying(value=>!value);};
 const navigate=id=>{if(onNavigate)onNavigate(id);else onClose();};
 return <dialog ref={dialog} className="trailer intro-film" data-playing={playing} data-scene={scene} data-complete={complete} aria-label="Sudheer Palakurla cinematic introduction" onCancel={onClose} onKeyDown={event=>{
  if(event.key==='ArrowRight'){event.preventDefault();go(scene+1);}
  if(event.key==='ArrowLeft'){event.preventDefault();go(scene-1);}
  if(event.key==='Home'){event.preventDefault();go(0);}
  if(event.key==='End'){event.preventDefault();go(scenes.length-1);}
  if(event.code==='Space'&&!event.target.closest('button,a')){event.preventDefault();toggle();}
 }}>
  <div className="intro-top"><span>Sudheer Palakurla <b>AI ENGINEER</b></span><button onClick={onClose} aria-label="Close introduction"><span>Skip intro</span><X size={20}/></button></div>
  <div className="intro-backdrop" aria-hidden="true"><span/><span/></div>
  <div className="intro-body" key={scene} aria-live={playing?'off':'polite'}>
   <div className="intro-copy"><span className="eyebrow">{current.label}</span><h2>{current.first}<br/><em>{current.last}</em></h2><p>{current.caption}</p><small>{current.detail}</small>
    {scene===3&&<div className="intro-actions"><button className="button primary" onClick={()=>navigate('work')}>Explore my work <ArrowRight size={17}/></button><button className="intro-contact" onClick={()=>navigate('contact')}>Discuss a role <ArrowUpRight size={17}/></button></div>}
   </div>
   <IntroGraphic scene={scene}/>
  </div>
  <div className="intro-bottom">
   <div className="intro-chapters" role="group" aria-label="Introduction chapters">{scenes.map((item,i)=><button key={item.chapter} aria-label={'Go to scene '+(i+1)+': '+item.chapter} aria-current={i===scene?'step':undefined} onClick={()=>go(i)}><span className="intro-chapter-name">{item.chapter}</span><span className="intro-progress" aria-hidden="true"><i style={{transform:`scaleX(${Math.max(0,Math.min(1,(playhead-starts[i])/item.duration))})`}}/></span></button>)}</div>
   <div className="intro-controls"><span className="intro-state">{complete?'Complete':playing?'Playing':'Paused'}<small>Silent introduction</small></span><div><button onClick={()=>go(scene-1)} disabled={scene===0} aria-label="Previous scene"><ArrowLeft size={20}/></button><button onClick={toggle} aria-label={complete?'Replay introduction':playing?'Pause introduction':'Play introduction'}>{complete?<RotateCcw size={20}/>:playing?<Pause size={20}/>:<Play size={20}/>}</button><button onClick={()=>go(scene+1)} disabled={scene===scenes.length-1} aria-label="Next scene"><ArrowRight size={20}/></button></div><span className="intro-time" role="timer" aria-label={'Elapsed '+Math.floor(playhead/1000)+' of '+introDurationSeconds+' seconds'}>{timestamp(playhead)} <span>/ {timestamp(duration)}</span></span></div>
  </div>
 </dialog>;
}
