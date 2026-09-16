export default function IntroGraphic({ scene }) {
 return <svg className={'intro-graphic intro-graphic-'+scene} viewBox="0 0 400 300" aria-hidden="true" focusable="false">
  <path className="intro-outline" d="M58 30H331L371 70V227L329 270H49L29 250V60Z"/>
  <path className="intro-outline intro-outline-secondary" d="M75 47H317L350 80V215L319 248H65L50 232V77Z"/>
  {scene===0&&<g>
   <path className="intro-wire" d="M77 95H150L200 150M77 150H200M77 205H150L200 150H318"/>
   <path className="intro-signal" d="M77 95H150L200 150H318"/>
   {[95,150,205].map(y=><rect className="intro-node" key={y} x="71" y={y-6} width="12" height="12"/>)}
   <path className="intro-core" d="M180 125H215L228 138V166L214 180H180L170 168V138Z"/>
   <path className="intro-output" d="M284 124H326V180H284Z M294 138H316 M294 148H316 M294 158H309"/>
   <text x="111" y="237">COMPLEXITY</text><text x="295" y="237">CLARITY</text>
  </g>}
  {scene===1&&<g className="intro-stack">
   <path className="intro-layer" d="M99 78H288L311 100V171H99Z"/>
   <path className="intro-layer" d="M83 113H272L295 135V206H83Z"/>
   <path className="intro-core" d="M67 148H256L279 170V241H67Z"/>
   <text x="192" y="102">DESIGN</text><text x="176" y="137">BUILD</text><text x="173" y="197">DELIVER</text>
   <path className="intro-signal" d="M68 242H280V171L257 148H68V242"/>
  </g>}
  {scene===2&&<g>
   <path className="intro-wire" d="M70 150H330"/>
   <path className="intro-signal" d="M70 150H330"/>
   {[['RETRIEVE',70],['REASON',200],['RESPOND',330]].map(([label,x])=><g key={label}>
    <path className={x===200?'intro-core':'intro-node'} d={`M${x-47} 115H${x+32}L${x+47} 130V185H${x-47}Z`}/>
    <text x={x} y="155">{label}</text>
   </g>)}
   <path className="intro-wire" d="M70 187V218H330V187"/>
   <text x="200" y="238">CONNECTED SYSTEMS</text>
  </g>}
  {scene===3&&<g>
   <path className="intro-wire" d="M73 96V211H178M328 205V90H224"/>
   <path className="intro-signal" d="M73 96V211H178M328 205V90H224"/>
   <path className="intro-core" d="M122 113H261L280 132V189H122Z"/>
   <text className="intro-graphic-final" x="200" y="157">LET’S BUILD.</text>
   <path className="intro-output" d="M190 221H220M211 213L220 221L211 229"/>
  </g>}
 </svg>;
}
