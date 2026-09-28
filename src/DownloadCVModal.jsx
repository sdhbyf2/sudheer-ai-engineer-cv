import { useEffect, useRef, useState } from 'react';
import { Download, X, Check, FileText, Building2, User, Mail, Phone } from 'lucide-react';
import { cvUrl } from './career';
import { lockPageScroll } from './scrollLock';

export default function DownloadCVModal({ onClose }) {
  const dialogRef = useRef(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const modal = dialogRef.current;
    const previouslyFocused = document.activeElement;
    const unlock = lockPageScroll();
    modal?.showModal();

    // Auto-focus the first input
    const firstInput = modal?.querySelector('input[name="name"]');
    firstInput?.focus();

    return () => {
      modal?.close();
      unlock();
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, []);

  const handleBackdropClick = (e) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanCompany = company.trim() || 'Direct Visitor / Recruitment';
    const cleanPhone = phone.trim();

    if (!cleanName) {
      setError('Please enter your full name.');
      return;
    }

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please provide a valid work email address.');
      return;
    }

    setSubmitting(true);

    try {
      // Record recruiter lead / CV download request in server
      await fetch('/api/assistant/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          company: cleanCompany,
          email: cleanEmail,
          phone: cleanPhone,
          roleText: 'CV Download Request (from Portfolio Modal)',
        }),
      }).catch(() => {});
    } catch {
      // Non-fatal: continue with file download regardless
    }

    // Trigger direct file download
    const link = document.createElement('a');
    link.href = cvUrl;
    link.download = 'Sudheer_Palakurla_FullStack_AI_Engineer_CV.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSubmitting(false);
    setDownloaded(true);

    // Auto-close after brief confirmation
    setTimeout(() => {
      onClose();
    }, 2200);
  };

  return (
    <dialog
      ref={dialogRef}
      className="steve-cv-dialog"
      aria-labelledby="cv-modal-title"
      aria-modal="true"
      onClick={handleBackdropClick}
      onCancel={onClose}
    >
      <div className="steve-cv-card">
        <button
          type="button"
          className="steve-cv-close"
          onClick={onClose}
          aria-label="Close CV download modal"
        >
          <X size={18} />
        </button>

        {!downloaded ? (
          <>
            <div className="steve-cv-header">
              <span className="steve-cv-eyebrow">
                <FileText size={13} /> CURRICULUM VITAE · PDF
              </span>
              <h2 id="cv-modal-title">Download Sudheer's CV</h2>
              <p>
                8+ years experience · Full-stack & Applied AI Engineer in London, UK. Please share
                your contact details to download the complete technical CV.
              </p>
            </div>

            <form className="steve-cv-form" onSubmit={handleSubmit} noValidate>
              {error && (
                <div className="steve-cv-error" role="alert">
                  {error}
                </div>
              )}

              <div className="steve-cv-field">
                <label htmlFor="cv-name">
                  <User size={13} /> Full Name <span className="req">*</span>
                </label>
                <input
                  id="cv-name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitting}
                  autoComplete="name"
                />
              </div>

              <div className="steve-cv-field">
                <label htmlFor="cv-email">
                  <Mail size={13} /> Work Email <span className="req">*</span>
                </label>
                <input
                  id="cv-email"
                  name="email"
                  type="email"
                  required
                  placeholder="e.g. sarah@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  autoComplete="email"
                />
              </div>

              <div className="steve-cv-grid">
                <div className="steve-cv-field">
                  <label htmlFor="cv-company">
                    <Building2 size={13} /> Company / Agency <span className="opt">(optional)</span>
                  </label>
                  <input
                    id="cv-company"
                    name="company"
                    type="text"
                    placeholder="e.g. Monzo, DeepMind"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    disabled={submitting}
                    autoComplete="organization"
                  />
                </div>

                <div className="steve-cv-field">
                  <label htmlFor="cv-phone">
                    <Phone size={13} /> Phone Number <span className="opt">(optional)</span>
                  </label>
                  <input
                    id="cv-phone"
                    name="phone"
                    type="tel"
                    placeholder="e.g. +44 7700 900077"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={submitting}
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className="steve-cv-actions">
                <button
                  type="submit"
                  className="steve-cv-submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    'Preparing Download...'
                  ) : (
                    <>
                      Download CV <Download size={16} />
                    </>
                  )}
                </button>
              </div>

              <p className="steve-cv-privacy">
                Your details are kept private and used only for direct communication regarding engineering opportunities.
              </p>
            </form>
          </>
        ) : (
          <div className="steve-cv-success">
            <div className="steve-cv-success-icon">
              <Check size={28} />
            </div>
            <h3>Download Started!</h3>
            <p>
              Thank you, <strong>{name.trim()}</strong>. Sudheer's CV is downloading to your device.
            </p>
            <button type="button" className="steve-cv-done" onClick={onClose}>
              Done
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
}
