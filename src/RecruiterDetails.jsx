export const hiringDetails = [
 ['Based in', 'London, United Kingdom'],
 ['Notice period', '1 month'],
 ['Opportunities', 'Full-time engineering roles'],
 ['Visa status', 'Skilled Worker visa'],
];

export default function RecruiterDetails() {
 return <div className="recruiter-details">
  <dl>{hiringDetails.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
  <p>Employer sponsorship required for a new full-time position.</p>
 </div>;
}
