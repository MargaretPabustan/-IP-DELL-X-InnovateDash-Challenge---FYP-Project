import { useState } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Sora:wght@600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy: #242da1;
    --blue: #0e136c;
    --light-blue: #e8eaff;
    --bg: #ededf0;
    --white: #ffffff;
    --text: #1a1a2e;
    --muted: #8888aa;
    --red: #cc2200;
    --red-bg: #fff0ee;
    --shadow: 0 8px 32px rgba(45, 53, 201, 0.12);
  }

  body { font-family: 'DM Sans', sans-serif; }

  .phone-shell {
    width: 300px;
    height: 600px;
    background: #f0f0f3;
    border-radius: 44px;
    box-shadow:
      0 0 0 2px #d0d0d8,
      0 24px 60px rgba(0,0,0,0.25),
      inset 0 1px 0 rgba(255,255,255,0.8);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .notch {
    width: 80px;
    height: 10px;
    background: #d0d0d8;
    border-radius: 0 0 12px 12px;
    margin: 0 auto;
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
  }

  .screen {
    flex: 1;
    background: var(--bg);
    display: flex;
    flex-direction: column;
    border-radius: 42px;
    overflow: hidden;
    position: relative;
  }

  /* Top bar */
  .topbar {
    background: var(--navy);
    padding: 20px 20px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
  }

  .topbar-progress {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 1;
  }

  .progress-dot {
    width: 32px;
    height: 4px;
    border-radius: 2px;
    background: rgba(255,255,255,0.25);
  }

  .progress-dot.active {
    background: var(--blue);
  }

  .progress-dot.done {
    background: rgba(255,255,255,0.55);
  }

  .topbar-logo {
    font-family: 'Sora', sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: var(--white);
    letter-spacing: 0.3px;
  }

  /* Main content area */
  .content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }

  /* Error card */
  .error-card {
    background: var(--white);
    border: 2px solid var(--blue);
    border-radius: 18px;
    padding: 28px 24px 22px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    box-shadow: var(--shadow);
    width: 100%;
    animation: popIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  @keyframes popIn {
    from { opacity: 0; transform: scale(0.85) translateY(12px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  .warning-icon {
    width: 58px;
    height: 52px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .warning-icon svg {
    filter: drop-shadow(0 3px 8px rgba(204,34,0,0.25));
  }

  .error-title {
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 600;
    color: var(--text);
    text-align: center;
    letter-spacing: -0.1px;
  }

  .rescan-btn {
    background: linear-gradient(135deg, #e8e8ee 0%, #d8d8e0 100%);
    border: none;
    border-radius: 8px;
    padding: 8px 22px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    cursor: pointer;
    letter-spacing: 0.2px;
    transition: all 0.18s ease;
    box-shadow: 0 1px 3px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.6);
  }

  .rescan-btn:hover {
    background: linear-gradient(135deg, #d8d8e8 0%, #c8c8d8 100%);
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(0,0,0,0.15);
  }

  .rescan-btn:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  }

  /* Bottom nav */
  .bottom-nav {
    background: var(--bg);
    padding: 10px 0 16px;
    display: flex;
    align-items: center;
    justify-content: space-around;
    border-top: 1px solid rgba(0,0,0,0.06);
  }

  .nav-item {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 44px;
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.15s ease;
    color: var(--muted);
    position: relative;
  }

  .nav-item:hover {
    background: rgba(45, 53, 201, 0.07);
    color: var(--blue);
  }

  .nav-item.qr-scan {
    background: var(--navy);
    border-radius: 14px;
    color: var(--white);
    width: 52px;
    height: 52px;
    margin-top: -8px;
    box-shadow: 0 4px 16px rgba(26,31,110,0.35);
  }

  .nav-item.qr-scan:hover {
    background: var(--blue);
    color: var(--white);
  }

  .toast {
    position: absolute;
    bottom: 80px;
    left: 20px;
    right: 20px;
    background: var(--navy);
    color: white;
    font-size: 12px;
    font-weight: 500;
    padding: 10px 14px;
    border-radius: 10px;
    text-align: center;
    animation: fadeInOut 2s ease forwards;
    z-index: 20;
    pointer-events: none;
  }

  @keyframes fadeInOut {
    0%   { opacity: 0; transform: translateY(6px); }
    15%  { opacity: 1; transform: translateY(0); }
    75%  { opacity: 1; }
    100% { opacity: 0; transform: translateY(-4px); }
  }
`;

export default function BoothflowApp() {
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <>
      <style>{styles}</style>
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#c8c8d4", fontFamily: "'DM Sans', sans-serif" }}>
        <div className="phone-shell">
          <div className="notch" />
          <div className="screen">
            {/* Top Bar */}
            <div className="topbar">
              <div className="topbar-progress">
                <div className="progress-dot done" />
                <div className="progress-dot done" />
                <div className="progress-dot active" />
                <div className="progress-dot" />
                <div className="progress-dot" />
              </div>
              <div className="topbar-logo">Boothflow</div>
            </div>

            {/* Main Content */}
            <div className="content">
              <div className="error-card">
                {/* Warning Icon */}
                <div className="warning-icon">
                  <svg width="58" height="52" viewBox="0 0 58 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M26.268 2.5C27.4226 0.5 30.5774 0.5 31.732 2.5L55.9904 44.5C57.145 46.5 55.5674 49 53.2583 49H4.74167C2.43264 49 0.855 46.5 2.00962 44.5L26.268 2.5Z" fill="#cc2200" />
                    <text x="29" y="38" textAnchor="middle" fill="white" fontSize="26" fontWeight="800" fontFamily="sans-serif">!</text>
                  </svg>
                </div>

                <div className="error-title">Submission Unsuccessful</div>

                <button
                  className="rescan-btn"
                  onClick={() => showToast("Opening scanner…")}
                >
                  Re-Scan
                </button>
              </div>
            </div>

            {/* Toast */}
            {toast && <div className="toast">{toast}</div>}

            {/* Bottom Nav */}
            <div className="bottom-nav">
              {/* Profile */}
              <div className="nav-item" onClick={() => showToast("Profile")}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </div>

              {/* QR Scan (active) */}
              <div className="nav-item qr-scan" onClick={() => showToast("Scanning…")}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="6" height="6" rx="1" />
                  <rect x="15" y="3" width="6" height="6" rx="1" />
                  <rect x="3" y="15" width="6" height="6" rx="1" />
                  <path d="M15 15h2v2h-2zM17 17h2v2h-2zM19 15h2M15 19h2M19 21v-2" />
                </svg>
              </div>

              {/* Home */}
              <div className="nav-item" onClick={() => showToast("Home")}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
