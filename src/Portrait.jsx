import { useEffect, useRef, lazy, Suspense } from 'react';
const TechnicalFrame=lazy(()=>import('./TechnicalFrame'));

export default function Portrait({ motion }) {
 const frame = useRef(null);
 const reset = () => {
  const node=frame.current;
  if(!node)return;
  node.style.setProperty('--portrait-x','0deg');
  node.style.setProperty('--portrait-y','0deg');
  node.style.setProperty('--light-x','50%');
  node.style.setProperty('--light-y','50%');
 };
 useEffect(()=>{if(!motion)reset();},[motion]);
 const follow = event => {
  if(!motion || event.pointerType!=='mouse')return;
  const rect=event.currentTarget.getBoundingClientRect();
  const x=(event.clientX-rect.left)/rect.width;
  const y=(event.clientY-rect.top)/rect.height;
  const node=frame.current;
  node.style.setProperty('--portrait-x',`${(0.5-y)*5}deg`);
  node.style.setProperty('--portrait-y',`${(x-0.5)*6}deg`);
  node.style.setProperty('--light-x',`${x*100}%`);
  node.style.setProperty('--light-y',`${y*100}%`);
 };
 return <div className="portrait-composition" onPointerMove={follow} onPointerLeave={reset}>
  <div className="portrait-overline"><span>THE PERSON BEHIND THE CODE</span></div>
  <figure ref={frame} className="portrait-frame core-portrait-frame">
   <div className="portrait-stage">
    <div className="portrait-photo angular-photo"><img src="/sudheer-palakurla.png" alt="Sudheer Palakurla in an asymmetrical geometric frame" width="1312" height="1199" fetchPriority="high" decoding="async"/></div>
    <div className="portrait-pattern" aria-hidden="true"><Suspense fallback={<div className="frame-fallback"/>}><TechnicalFrame motion={motion} followPointer={false}/></Suspense></div>
   </div>
  </figure>
  <div className="portrait-footnote"><span className="status-dot"/><span>Curiosity is the constant.</span><span className="portrait-cross" aria-hidden="true">+</span></div>
 </div>;
}
