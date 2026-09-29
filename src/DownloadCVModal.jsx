import { useEffect, useRef, useState } from 'react';
import { Download, X, Check, AlertCircle, FileText, Building2, User, Mail, Phone } from 'lucide-react';
import { cvUrl } from './career';
import { lockPageScroll } from './scrollLock';
import { getConsent } from './CookieConsent';

export default function DownloadCVModal({ onClose }) {
  const dialogRef = useRef(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [leadSaved, setLeadSaved] = useState(null);
  const [retryingLead, setRetryingLead] = useState(false);
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

  const clientRequestIdRef = useRef(
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `cv_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  );
  const submissionPayloadRef = useRef(null);

  const ensureSession = async () => {
    try {
      const consent = getConsent() || 'pending';
      await fetch('/api/assistant/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cookie-consent': consent,
        },
      });
    } catch (err) {
      console.warn('[CVModal] Failed to initialize session:', err);
    }
  };

  const handleRetryLead = async () => {
    setRetryingLead(true);
    try {
      await ensureSession();
      const payload = submissionPayloadRef.current || {
        clientRequestId: clientRequestIdRef.current,
        name: name.trim(),
        company: company.trim() || 'Independent / Not specified',
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        roleText: 'CV Download Request (from Portfolio Modal)',
      };

      const res = await fetch('/api/assistant/lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Lead-Retry': '1',
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.saved) {
          setLeadSaved(true);
          setTimeout(() => onClose(), 2000);
        } else {
          setLeadSaved(false);
        }
      } else {
        setLeadSaved(false);
      }
    } catch {
      setLeadSaved(false);
    } finally {
      setRetryingLead(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanCompany = company.trim() || 'Independent / Not specified';
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
    let saved = false;

    try {
      // Ensure active session cookie exists before submitting lead
      await ensureSession();

      // Record recruiter lead / CV download request in server with stable request ID
      const payload = {
        clientRequestId: clientRequestIdRef.current,
        name: cleanName,
        company: cleanCompany,
        email: cleanEmail,
        phone: cleanPhone,
        roleText: 'CV Download Request (from Portfolio Modal)',
      };
      submissionPayloadRef.current = payload;

      const res = await fetch('/api/assistant/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        saved = Boolean(data.saved);
      }
    } catch {
      saved = false;
    }

    setLeadSaved(saved);

    // Trigger direct file download
    const link = document.createElement('a');
    link.href = cvUrl;
    link.download = 'Sudheer_Palakurla_FullStack_AI_Engineer_CV.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSubmitting(false);
    setDownloaded(true);

    if (saved) {
      // Auto-close after brief confirmation if saved successfully
      setTimeout(() => {
        onClose();
      }, 2500);
    }
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
                Your details (name, email, company, optional phone) are stored securely for 30 days solely for Sudheer to review and follow up regarding relevant engineering opportunities. To request deletion of your data at any time, contact <a href="mailto:sudheercv@gmail.com" style={{ color: 'inherit', textDecoration: 'underline' }}>sudheercv@gmail.com</a>.
              </p>
            </form>
          </>
        ) : (
          <div className="steve-cv-success">
            <div
              className="steve-cv-success-icon"
              style={{
                borderColor: leadSaved !== false ? undefined : 'rgba(234, 179, 8, 0.4)',
                color: leadSaved !== false ? undefined : '#eab308',
              }}
            >
              {leadSaved !== false ? <Check size={28} /> : <AlertCircle size={28} />}
            </div>
            <h3>{leadSaved !== false ? 'Download Started!' : 'CV Download Started'}</h3>
            <p>
              {leadSaved !== false ? (
                <>
                  Thank you, <strong>{name.trim()}</strong>. Your contact details were saved and Sudheer's CV is downloading to your device.
                </>
              ) : (
                <>
                  Your CV download has started. However, we couldn't save your contact details due to a network error, so Sudheer may not be able to follow up directly.
                </>
              )}
            </p>
            {leadSaved === false ? (
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="steve-cv-submit"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                  disabled={retryingLead}
                  onClick={handleRetryLead}
                >
                  {retryingLead ? 'Saving...' : 'Retry saving details'}
                </button>
                <button type="button" className="steve-cv-done" onClick={onClose}>
                  Done
                </button>
              </div>
            ) : (
              <button type="button" className="steve-cv-done" onClick={onClose}>
                Done
              </button>
            )}
          </div>
        )}
      </div>
    </dialog>
  );
}
