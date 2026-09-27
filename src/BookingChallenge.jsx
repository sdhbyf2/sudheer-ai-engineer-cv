import { useEffect, useRef, useState } from "react";
let loading;
function loadWidget() {
  if (window.turnstile) return Promise.resolve();
  if (!loading)
    loading = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = resolve;
      script.onerror = () => {
        loading = null;
        reject(
          new Error("Verification did not load. Please use the contact link."),
        );
      };
      document.head.appendChild(script);
    });
  return loading;
}
export default function BookingChallenge({ siteKey, onToken }) {
  const node = useRef(null),
    callback = useRef(onToken);
  callback.current = onToken;
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true,
      widget;
    loadWidget()
      .then(() => {
        if (live)
          widget = window.turnstile.render(node.current, {
            sitekey: siteKey,
            action: "steve-booking",
            theme: "dark",
            callback: (token) => callback.current(token),
            "expired-callback": () => callback.current(""),
            "error-callback": () => {
              callback.current("");
              setError(
                "Verification could not finish. Please contact Sudheer.",
              );
            },
          });
      })
      .catch((e) => setError(e.message));
    return () => {
      live = false;
      if (widget !== undefined) window.turnstile?.remove(widget);
    };
  }, [siteKey]);
  return (
    <div className="steve-challenge">
      <p>Verify this booking request.</p>
      <div ref={node} />
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
