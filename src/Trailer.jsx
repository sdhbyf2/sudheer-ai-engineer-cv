import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Pause, Play, X } from 'lucide-react';
import { lockPageScroll } from './scrollLock';

const scenes = [
 { label: 'THE SPARK', first: 'EVERY BREAKTHROUGH', last: 'STARTS WITH CURIOSITY.', caption: 'A full-stack foundation. An AI focus.', detail: 'An engineer’s mindset. A builder’s instinct.' },
 { label: 'THE FOUNDATION', first: '8+ YEARS.', last: 'BUILT IN THE REAL WORLD.', caption: '95+ client builds and contributions', detail: 'From responsive websites to full-stack platforms.' },
 { label: 'THE FRONTIER', first: 'INTELLIGENCE.', last: 'ENGINEERED TO DELIVER.', caption: 'RAG · Real-time voice · Agentic workflows', detail: 'Production AI systems. From architecture to deployment.' },
 { label: 'WHAT COMES NEXT', first: 'YOUR AMBITION.', last: 'OUR NEXT CHAPTER.', caption: 'Let’s build something extraordinary.', detail: 'Explore the systems. Meet the engineer.' },
];

export default function Trailer({ motion, onClose }) {
 const dialog = useRef(null);
 const [scene, setScene] = useState(0);
 const [playing, setPlaying] = useState(motion);
 const [elapsed, setElapsed] = useState(0);
 const sceneRef = useRef(0);
 useEffect(() => {
  const previousFocus = document.activeElement;
  const unlock = lockPageScroll();
  const modal = dialog.current;
  modal.showModal();
  return () => { modal.close(); unlock(); previousFocus?.focus(); };
 }, []);
 useEffect(() => { if (!motion) setPlaying(false); }, [motion]);
 useEffect(() => {
  if (!playing) return;
  let last = performance.now();
  const timer = setInterval(() => {
   const now = performance.now();
   const delta = document.hidden ? 0 : Math.min(now - last, 150);
   last = now;
   setElapsed(value => Math.min(5000, value + delta));
  }, 100);
  return () => clearInterval(timer);
 }, [playing]);
 useEffect(() => {
  if (elapsed < 5000) return;
  if (sceneRef.current < scenes.length - 1) {
   sceneRef.current += 1; setScene(sceneRef.current); setElapsed(0);
  } else setPlaying(false);
 }, [elapsed]);
 const go = index => { sceneRef.current = index; setScene(index); setElapsed(0); };
 const current = scenes[scene];
 return <dialog ref={dialog} className="trailer" data-playing={playing} aria-label="Sudheer Palakurla cinematic introduction" onCancel={onClose} onKeyDown={event => {
  if (event.key === 'ArrowRight') { event.preventDefault(); go(Math.min(3, scene + 1)); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); go(Math.max(0, scene - 1)); }
 }}>
  <div className="trailer-top"><span>SUDHEER PALAKURLA <b>/ THE INTRODUCTION</b></span><button onClick={onClose} aria-label="Close introduction"><span>SKIP INTRO</span><X size={18}/></button></div>
  <div className={'trailer-universe scene-' + scene} aria-hidden="true"><div className="trailer-halo"/><div className="trailer-grid"/><div className="trailer-line"/></div>
  <div key={scene} className="trailer-scene" aria-live={playing?'off':'polite'}><span className="eyebrow">{current.label}</span><h2>{current.first}<br/><span>{current.last}</span></h2><p>{current.caption}</p><small>{current.detail}</small>{scene === 3 && <button className="button primary" onClick={onClose}>Enter the portfolio <ArrowRight size={17}/></button>}</div>
  <div className="trailer-bottom"><div className="trailer-segments">{scenes.map((s,i)=><button key={s.label} aria-label={'Go to scene '+(i+1)} aria-current={i===scene?'step':undefined} onClick={()=>go(i)}><span style={{transform:`scaleX(${i<scene?1:i===scene?elapsed/5000:0})`}}/></button>)}</div><div className="trailer-playback"><span>{current.label} <b> {playing?'PLAYING':'PAUSED'} · SILENT FILM</b></span><div><button aria-label="Previous scene" disabled={scene===0} onClick={()=>go(scene-1)}><ArrowLeft size={18}/></button><button aria-label={playing?'Pause introduction':'Play introduction'} onClick={()=>{if(elapsed>=5000&&scene===3)go(0);setPlaying(!playing);}}>{playing?<Pause size={18}/>:<Play size={18}/>}</button><button aria-label="Next scene" disabled={scene===3} onClick={()=>go(scene+1)}><ArrowRight size={18}/></button></div><span>20 SEC <b>/ ORIGINAL PORTFOLIO</b></span></div></div>
 </dialog>;
}
