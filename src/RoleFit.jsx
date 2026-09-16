import { ArrowUpRight } from 'lucide-react';

const contributions = [
 ['Applied AI', 'Document retrieval, contextual answers and model routing.', 'rag'],
 ['Conversational AI', 'Real-time voice with provider fallback.', 'voice'],
 ['Full-stack AI products', 'Application logic, data, storage and cloud delivery.', 'edge'],
];

export default function RoleFit() {
 return <section className="role-fit" aria-labelledby="role-fit-title">
  <h3 id="role-fit-title">Where I can contribute</h3>
  <p>Explore the work behind each capability.</p>
  <ul>{contributions.map(([title,detail,id])=><li key={id}><a href={'#project-'+id}>
   <span><strong>{title}</strong><span>{detail}</span></span><ArrowUpRight size={18} aria-hidden="true"/>
  </a></li>)}</ul>
 </section>;
}
