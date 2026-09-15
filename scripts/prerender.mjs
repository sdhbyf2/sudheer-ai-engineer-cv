import { createServer } from 'vite';
import {createElement} from 'react';
import {renderToString} from 'react-dom/server';
import {readFile,writeFile} from 'node:fs/promises';
const server=await createServer({server:{middlewareMode:true},appType:'custom',optimizeDeps:{noDiscovery:true,include:[]}});
try{
 const {default:App}=await server.ssrLoadModule('/src/App.jsx');
 const markup=renderToString(createElement(App));
 if(!markup.includes('Sudheer')||!markup.includes('school management ERP'))throw new Error('Incomplete prerendered CV');
 let html=await readFile('dist/index.html','utf8');
 const verification=process.env.GOOGLE_SITE_VERIFICATION?.trim();
 if(verification){
  const escaped=verification.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  html=html.replace('</head>',()=>`<meta name="google-site-verification" content="${escaped}"/>\n</head>`);
 }
 if(!html.includes('<div id="root"></div>'))throw new Error('Missing prerender target');
 await writeFile('dist/index.html',html.replace('<div id="root"></div>',()=>`<div id="root">${markup}</div>`));
 console.log('Full portfolio rendered into initial HTML.');
}finally{await server.close();}
