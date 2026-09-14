import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function EnergyCore({ motion, followPointer = true }) {
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
  const uniforms = { uTime: { value: 0 }, uResolution: { value: new THREE.Vector2() }, uPointer: { value: new THREE.Vector2() } };
  const material = new THREE.ShaderMaterial({ uniforms, transparent: true,
   vertexShader: 'void main(){gl_Position=vec4(position,1.0);}',
   fragmentShader: `precision highp float;
   uniform float uTime; uniform vec2 uResolution; uniform vec2 uPointer;
   float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
   void main(){
    vec2 uv=(gl_FragCoord.xy-.5*uResolution)/uResolution.y; uv-=uPointer*.025;
    float r=length(uv);float a=atan(uv.y,uv.x);float t=uTime*.13;
    float n=noise(vec2(cos(a),sin(a))*7.+vec2(t*2.,r*35.-t*5.));
    float ringRadius=.292+.007*sin(a*9.+t*4.)+.009*n;
    float ring= .0016/max(abs(r-ringRadius),.0012);
    float corona=exp(-abs(r-.305)*27.)*(.2+.8*noise(vec2(cos(a),sin(a))*12.+vec2(-t*3.,r*19.+t)));
    float threads=pow(max(0.,sin(r*230.+a*3.+n*9.-t*8.)),9.)*exp(-abs(r-.33)*16.)*.28;
    float halo=exp(-abs(r-.31)*8.)*.10;
    float flare=exp(-abs(uv.y+.07)*110.)*exp(-abs(uv.x)*2.)*.1;
    vec3 gold=vec3(1.,.65,.25);
    vec3 color=gold*(ring*.68+corona*.52+threads+halo+flare);
    color+=vec3(1.,.91,.68)*pow(max(0.,ring*.6),2.)*.48;
    color*=smoothstep(.265,.287,r);
    vec2 grid=uv*180.;float star=step(.998,hash(floor(grid)))*pow(max(0.,1.-length(fract(grid)-.5)*2.),5.);
    color+=star*vec3(.6,.55,.42)*(.5+.5*sin(t*3.+hash(floor(grid))*20.));
    color*=1.-smoothstep(.40,.49,r);
    float alpha=clamp(max(max(color.r,color.g),color.b)*8.,0.,1.);
    gl_FragColor=vec4(color/max(alpha,.00001),alpha);
   }`
  });
  const geometry = new THREE.PlaneGeometry(2,2); scene.add(new THREE.Mesh(geometry,material));
  const resize=()=>{ const {width,height}=el.getBoundingClientRect();renderer.setSize(width,height);uniforms.uResolution.value.set(width*renderer.getPixelRatio(),height*renderer.getPixelRatio());renderer.render(scene,camera); };
  const observer=new ResizeObserver(resize);observer.observe(el);resize();
  const pointerTarget=new THREE.Vector2();
  const pointer=e=>{if(active.current&&followPointer)pointerTarget.set(e.clientX/innerWidth-.5,.5-e.clientY/innerHeight);};
  window.addEventListener('pointermove',pointer,{passive:true});
  let previous=0; let inView=true; let contextLost=false;
  const animate=time=>{uniforms.uTime.value+=Math.min((time-previous)/1000,.05);uniforms.uPointer.value.lerp(pointerTarget,.035);renderer.render(scene,camera);previous=time;};
  const sync=()=>{previous=performance.now();const running=active.current&&inView&&!document.hidden&&!contextLost;renderer.setAnimationLoop(running?animate:null);el.dataset.rendering=running?'running':'paused';};
  syncAnimation.current=sync;
  const viewObserver=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;sync();});viewObserver.observe(el);
  document.addEventListener('visibilitychange',sync);
  const lost=event=>{event.preventDefault();contextLost=true;sync();el.classList.add('context-lost');};
  const restored=()=>{contextLost=false;el.classList.remove('context-lost');resize();sync();};
  renderer.domElement.addEventListener('webglcontextlost',lost);renderer.domElement.addEventListener('webglcontextrestored',restored);sync();
  return()=>{syncAnimation.current=()=>{};renderer.setAnimationLoop(null);observer.disconnect();viewObserver.disconnect();window.removeEventListener('pointermove',pointer);document.removeEventListener('visibilitychange',sync);renderer.domElement.removeEventListener('webglcontextlost',lost);renderer.domElement.removeEventListener('webglcontextrestored',restored);geometry.dispose();material.dispose();renderer.dispose();el.removeChild(renderer.domElement);};
 },[followPointer]);
 return <div ref={host} className="energy-canvas" aria-hidden="true"/>;
}
