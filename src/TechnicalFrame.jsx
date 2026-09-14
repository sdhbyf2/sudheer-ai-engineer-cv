import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function TechnicalFrame({ motion, followPointer = true }) {
 const host = useRef(null);
 const active = useRef(motion);
 const syncAnimation = useRef(() => {});
 useEffect(() => { active.current = motion; syncAnimation.current(); }, [motion]);
 useEffect(() => {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' }); } catch { return; }
  const el = host.current;
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 650 ? 1 : 1.5)); el.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); const camera = new THREE.Camera();
  const uniforms = { uScroll: { value: 0 }, uTime: { value: 0 }, uResolution: { value: new THREE.Vector2() }, uPointer: { value: new THREE.Vector2() } };
  const material = new THREE.ShaderMaterial({ uniforms, transparent: true,
   vertexShader: 'void main(){gl_Position=vec4(position,1.0);}',
   fragmentShader: `precision highp float;
   uniform float uTime; uniform float uScroll; uniform vec2 uResolution; uniform vec2 uPointer;
   float segment(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h);}
   float frame(vec2 p){
    float d=segment(p,vec2(-.2624,.37),vec2(.2816,.37));
    d=min(d,segment(p,vec2(.2816,.37),vec2(.32,.3182)));
    d=min(d,segment(p,vec2(.32,.3182),vec2(.32,-.2738)));
    d=min(d,segment(p,vec2(.32,-.2738),vec2(.2432,-.37)));
    d=min(d,segment(p,vec2(.2432,-.37),vec2(-.32,-.37)));
    d=min(d,segment(p,vec2(-.32,-.37),vec2(-.32,.3034)));
    return min(d,segment(p,vec2(-.32,.3034),vec2(-.2624,.37)));
   }
   vec2 framePoint(float phase){
    float s=fract(phase)*2.648;
    if(s<.544)return mix(vec2(-.2624,.37),vec2(.2816,.37),s/.544);
    s-=.544;
    if(s<.0644)return mix(vec2(.2816,.37),vec2(.32,.3182),s/.0644);
    s-=.0644;
    if(s<.592)return mix(vec2(.32,.3182),vec2(.32,-.2738),s/.592);
    s-=.592;
    if(s<.1231)return mix(vec2(.32,-.2738),vec2(.2432,-.37),s/.1231);
    s-=.1231;
    if(s<.5632)return mix(vec2(.2432,-.37),vec2(-.32,-.37),s/.5632);
    s-=.5632;
    if(s<.6734)return mix(vec2(-.32,-.37),vec2(-.32,.3034),s/.6734);
    return mix(vec2(-.32,.3034),vec2(-.2624,.37),(s-.6734)/.0879);
   }
   void main(){
    vec2 p=(gl_FragCoord.xy-.5*uResolution)/uResolution.y;
    float t=uTime*.28;
    vec2 drift=vec2(sin(t)*.014,cos(t*.7)*.009+uScroll*.03);
    float border=1.-smoothstep(.001,.0028,frame(p/1.065));
    float echo=1.-smoothstep(.0006,.0018,frame((p-drift)/1.19));
    float phase=uTime*.045+uScroll*.055;
    vec2 runnerA=framePoint(phase+.16)*1.19+drift;
    vec2 runnerB=framePoint(phase+.66)*1.19+drift;
    float runners=1.-smoothstep(.004,.0065,min(length(p-runnerA),length(p-runnerB)));
    vec2 accentA=framePoint(-phase*.7+.34)*1.065;
    vec2 accentB=framePoint(-phase*.7+.352)*1.065;
    float accent=1.-smoothstep(.0015,.003,segment(p,accentA,accentB));
    float track=(1.-smoothstep(.0005,.0018,abs(p.y-.432)))*step(abs(p.x),.42);
    float marker=(1.-smoothstep(.004,.0065,length(p-vec2(sin(t)*.39,.432))));
    float crop=1.-smoothstep(.46,.50,max(abs(p.x),abs(p.y)));
    float intensity=(border*.62+echo*.32+runners*.9+accent*.8+track*.3+marker*.85)*crop;
    gl_FragColor=vec4(mix(vec3(.52,.65,.46),vec3(.77,.71,.56),border),clamp(intensity,0.,.85));
   }`

  });
  const geometry = new THREE.PlaneGeometry(2,2); scene.add(new THREE.Mesh(geometry,material));
  const resize=()=>{ const {width,height}=el.getBoundingClientRect();renderer.setSize(width,height);uniforms.uResolution.value.set(width*renderer.getPixelRatio(),height*renderer.getPixelRatio());renderer.render(scene,camera); };
  const observer=new ResizeObserver(resize);observer.observe(el);resize();
  const pointerTarget=new THREE.Vector2();
  const pointer=e=>{if(active.current&&followPointer)pointerTarget.set(e.clientX/innerWidth-.5,.5-e.clientY/innerHeight);};
  window.addEventListener('pointermove',pointer,{passive:true});
  let previous=0; let inView=true; let contextLost=false;
  const animate=time=>{uniforms.uScroll.value=scrollY/Math.max(innerHeight,1);uniforms.uTime.value+=Math.min((time-previous)/1000,.05);uniforms.uPointer.value.lerp(pointerTarget,.035);renderer.render(scene,camera);previous=time;};
  const sync=()=>{previous=performance.now();const running=active.current&&inView&&!document.hidden&&!contextLost;renderer.setAnimationLoop(running?animate:null);el.dataset.rendering=running?'running':'paused';};
  syncAnimation.current=sync;
  const viewObserver=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;sync();});viewObserver.observe(el);
  document.addEventListener('visibilitychange',sync);
  const lost=event=>{event.preventDefault();contextLost=true;sync();el.classList.add('context-lost');};
  const restored=()=>{contextLost=false;el.classList.remove('context-lost');resize();sync();};
  renderer.domElement.addEventListener('webglcontextlost',lost);renderer.domElement.addEventListener('webglcontextrestored',restored);sync();
  return()=>{syncAnimation.current=()=>{};renderer.setAnimationLoop(null);observer.disconnect();viewObserver.disconnect();window.removeEventListener('pointermove',pointer);document.removeEventListener('visibilitychange',sync);renderer.domElement.removeEventListener('webglcontextlost',lost);renderer.domElement.removeEventListener('webglcontextrestored',restored);geometry.dispose();material.dispose();renderer.dispose();el.removeChild(renderer.domElement);};
 },[followPointer]);
 return <div ref={host} className="frame-canvas" aria-hidden="true"/>;
}
