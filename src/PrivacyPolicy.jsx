import React, { useEffect, useRef } from 'react';
import { lockPageScroll } from './scrollLock';

export default function PrivacyPolicy({ onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const unlock = lockPageScroll();
    return () => unlock();
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.focus();
    const onKey = e => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      if (e.key !== 'Tab') return;
      const nodes = [...dialog.querySelectorAll(
        'a[href],button:not([disabled]),input,textarea,select,[tabindex]:not([tabindex="-1"])'
      )].filter(el => el.getClientRects().length);
      const first = nodes[0], last = nodes.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="privacy-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div
        ref={dialogRef}
        className="privacy-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Privacy Policy"
        tabIndex={-1}
      >
        <div className="privacy-header">
          <h2>Privacy Policy</h2>
          <p className="privacy-meta">Sudheer Palakurla · sudheercv.vercel.app · Last updated: September 2026</p>
          <button className="privacy-close" onClick={onClose} aria-label="Close privacy policy">✕</button>
        </div>

        <div className="privacy-body">
          <section>
            <h3>Overview</h3>
            <p>
              This is the personal engineering portfolio of <strong>Sudheer Palakurla</strong>, London, UK.
              This policy explains what is collected when you visit and how it is used.
              Contact: <a href="mailto:sdh9247@gmail.com">sdh9247@gmail.com</a>
            </p>
          </section>

          <section>
            <h3>What we collect</h3>
            <ul>
              <li><strong>Session data</strong> — a temporary session token to power the AI assistant. Strictly necessary, expires in 2 hours.</li>
              <li><strong>Engagement analytics</strong> — server-side telemetry (IP address, browser information, referring page, session timestamps, and chat interaction count) used to understand portfolio reach. Retained for 90 days. No personal data is sold.</li>
              <li><strong>Contact details</strong> — if you voluntarily submit your name, company, and email via the recruiter form or calendar booking, recruiter submissions are retained for up to 180 days for follow-up. Calendar events follow the calendar owner's retention settings.</li>
              <li><strong>Zero tracking cookies</strong> — this portfolio does not use third-party tracking, advertising, or cross-site behavioral cookies.</li>
            </ul>
          </section>

          <section>
            <h3>AI assistant</h3>
            <p>
              The AI assistant (Steve) processes your messages to generate responses using third-party AI
              services. Conversation metadata is retained for 90 days for quality and security purposes.
              Raw message content is not stored on this site's servers beyond your active session.
            </p>
          </section>

          <section>
            <h3>Your rights</h3>
            <p>You have the right to access, correct, or request deletion of any information you have submitted.
            To exercise any right or ask a question, contact <a href="mailto:sdh9247@gmail.com">sdh9247@gmail.com</a>.</p>
          </section>
        </div>

        <div className="privacy-footer">
          <button className="button primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
