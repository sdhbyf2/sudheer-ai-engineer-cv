import React, { useEffect, useRef, useState } from 'react';
import PrivacyPolicy from './PrivacyPolicy';

const CONSENT_KEY = 'sp_cookie_consent';
const CONSENT_VERSION = 'v1';

export function getConsent() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed.accepted ? 'accepted' : 'declined';
  } catch {
    return null;
  }
}

function saveConsent(accepted) {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      version: CONSENT_VERSION,
      accepted,
      at: new Date().toISOString(),
    }));
  } catch {}
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const bannerRef = useRef(null);

  useEffect(() => {
    // Show banner only if no previous consent recorded
    if (!getConsent()) {
      // Slight delay so the page paints first
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  // Trap focus within the banner while visible
  useEffect(() => {
    if (!visible || privacyOpen) return;
    const onKey = e => {
      if (e.key !== 'Tab') return;
      const banner = bannerRef.current;
      if (!banner) return;
      const nodes = [...banner.querySelectorAll('button,a[href]')].filter(el => el.getClientRects().length);
      const first = nodes[0], last = nodes.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [visible, privacyOpen]);

  const handleAccept = () => {
    saveConsent(true);
    setVisible(false);
    // Load Leadfeeder now that consent is granted
    loadLeadfeeder();
    // Notify server that consent was granted so visitor analytics can be recorded
    fetch('/api/assistant/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cookie-consent': 'accepted',
      },
      body: JSON.stringify({ consent: 'accepted' }),
    }).catch(() => {});
  };

  const handleDecline = () => {
    saveConsent(false);
    setVisible(false);
    // Notify server that consent was declined so telemetry is skipped/purged
    fetch('/api/assistant/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cookie-consent': 'declined',
      },
      body: JSON.stringify({ consent: 'declined' }),
    }).catch(() => {});
  };

  if (!visible) return privacyOpen ? <PrivacyPolicy onClose={() => setPrivacyOpen(false)} /> : null;

  return (
    <>
      <div
        ref={bannerRef}
        className="cookie-banner"
        role="region"
        aria-label="Cookie consent"
        aria-live="polite"
      >
        <div className="cookie-banner-content">
          <span className="cookie-banner-text">
            This site uses cookies for analytics and the AI assistant.{' '}
            <button type="button" className="cookie-policy-link" onClick={() => setPrivacyOpen(true)}>
              Privacy Policy
            </button>
          </span>
          <div className="cookie-banner-actions">
            <button type="button" className="cookie-btn cookie-btn-decline" onClick={handleDecline}>Decline</button>
            <button type="button" className="cookie-btn cookie-btn-accept" onClick={handleAccept}>Accept</button>
          </div>
        </div>
      </div>

      {privacyOpen && <PrivacyPolicy onClose={() => setPrivacyOpen(false)} />}
    </>
  );
}

function loadLeadfeeder() {
  if (window.__lfLoaded) return;
  window.__lfLoaded = true;
  window.ldfdr = window.ldfdr || function () {
    (window.ldfdr._q = window.ldfdr._q || []).push([].slice.call(arguments));
  };
  const d = document, s = 'script';
  const fs = d.getElementsByTagName(s)[0];
  const cs = d.createElement(s);
  cs.src = 'https://sc.lfeeder.com/lftracker_v1_YEgkB8lJrky4ep3Z.js';
  cs.async = 1;
  fs.parentNode.insertBefore(cs, fs);
}

// Call on mount for returning visitors who already accepted
export function initConsentTracking() {
  if (getConsent() === 'accepted') {
    loadLeadfeeder();
  }
}
