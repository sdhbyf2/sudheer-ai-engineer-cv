import { useState } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';

export function VoiceDemo() {
 const [fallback,setFallback]=useState(false);
 return <div className="voice-diagram interactive-voice" data-fallback={fallback}>
  <div className="waveform" aria-hidden="true">{Array.from({length:37},(_,i)=><i key={i} style={{'--h':`${18+Math.sin(i*.64)**2*70}px`,'--delay':`${i*.08}s`}}/>)}</div>
  <div className="provider-route"><span className={!fallback?'route-active':''}>OpenAI Realtime<small>PRIMARY</small></span><ArrowRight size={17}/><span className={fallback?'route-active':''}>Gemini Live<small>FALLBACK</small></span></div>
  <div className="demo-controls"><span>ROUTING ILLUSTRATION</span><button onClick={()=>setFallback(!fallback)} aria-pressed={fallback}>{fallback?'Reset route':'Preview fallback'}{fallback?<RotateCcw size={14}/>:<ArrowRight size={14}/>}</button></div>
  <p className="demo-explanation" aria-live="polite"><span key={String(fallback)}>{fallback?'If the primary provider is unavailable, requests switch to Gemini Live.':'OpenAI Realtime handles the voice session. Preview the alternative route.'}</span></p>
 </div>;
}

const services=[['D1','Relational data for the onboarding application.'],['KV','Cached values for fast access at the edge.'],['R2','Object storage for application files.'],['Workers AI','AI features connected to the onboarding workflow.']];
export function EdgeDemo() {
 const [selected,setSelected]=useState(0);
 return <div className="edge-diagram interactive-edge">
  <div className="edge-center">Workers <span>+ Hono</span></div><div className="edge-connections" aria-hidden="true"/>
  <div className="edge-services" role="group" aria-label="Explore the edge services">{services.map(([name],i)=><button key={name} aria-pressed={selected===i} aria-controls="edge-explanation" onClick={()=>setSelected(i)}>{name}</button>)}</div>
  <p id="edge-explanation" className="demo-explanation" aria-live="polite"><span key={selected}>{services[selected][1]}</span></p>
 </div>;
}
