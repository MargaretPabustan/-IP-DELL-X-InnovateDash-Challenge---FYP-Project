import { useState } from "react";

const UserIcon = () => (
  <div className="relative w-16 h-16 flex items-center justify-center">
    {/* Head */}
    <div
      className="absolute rounded-full bg-red-500"
      style={{ width: 28, height: 28, top: 0, left: "50%", transform: "translateX(-50%)" }}
    />
    {/* Body */}
    <div
      className="absolute bg-red-500"
      style={{
        width: 52,
        height: 32,
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        borderRadius: "26px 26px 0 0",
      }}
    />
  </div>
);

const PersonIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const QRIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="3" height="3" />
    <rect x="18" y="14" width="3" height="3" />
    <rect x="14" y="18" width="3" height="3" />
    <rect x="18" y="18" width="3" height="3" />
  </svg>
);

const HomeIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12L12 3l9 9" />
    <path d="M9 21V12h6v9" />
    <path d="M3 12v9h18V12" />
  </svg>
);

export default function DuplicateUserScreen() {
  const [activeNav, setActiveNav] = useState("qr");

  const handleReScan = () => {
    console.log("Re-Scan clicked");
    // navigate back to scanner
  };

  const handleSearchByName = () => {
    console.log("Search by name clicked");
    // navigate to name search
  };

  return (
    <div className="min-h-screen bg-gray-300 flex items-center justify-center">
      {/* Phone Shell */}
      <div
        className="flex flex-col overflow-hidden"
        style={{
          width: 320,
          height: 620,
          background: "#d6d6d6",
          borderRadius: 44,
          boxShadow: "0 20px 60px rgba(0,0,0,0.35), inset 0 0 0 2px #bbb",
        }}
      >
        {/* Status Bar */}
        <div
          className="flex items-center justify-end gap-1 px-4"
          style={{ background: "#1a1a2e", height: 28, flexShrink: 0 }}
        >
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-white opacity-70" />
          ))}
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 pb-3 pt-2"
          style={{ background: "#1a1a2e", flexShrink: 0 }}
        >
          <div
            style={{
              height: 3,
              width: 80,
              background: "linear-gradient(90deg, #7c6af7, #a78bfa)",
              borderRadius: 2,
            }}
          />
          <span className="text-white font-bold text-base tracking-wide">Boothflow</span>
          <div style={{ width: 80 }} />
        </div>

        {/* Body */}
        <div
          className="flex flex-col items-center gap-5 px-5 pt-8 pb-4"
          style={{ flex: 1, background: "#ebebeb", overflow: "hidden" }}
        >
          {/* Duplicate User Card */}
          <div
            className="w-full bg-white flex flex-col items-center gap-3 py-7 px-5"
            style={{
              borderRadius: 12,
              border: "2.5px solid #7c6af7",
              boxShadow: "0 0 0 3px rgba(124,106,247,0.18)",
            }}
          >
            <UserIcon />
            <span className="text-gray-800 font-bold text-sm tracking-wide">
              Duplicate User
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 w-full justify-center">
            <button
              onClick={handleReScan}
              className="text-gray-700 font-semibold text-sm px-5 py-2 transition-colors"
              style={{
                border: "1.5px solid #888",
                borderRadius: 24,
                background: "#ebebeb",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => (e.target.style.background = "#d5d5d5")}
              onMouseLeave={(e) => (e.target.style.background = "#ebebeb")}
            >
              Re-Scan
            </button>
            <button
              onClick={handleSearchByName}
              className="text-gray-700 font-semibold text-sm px-5 py-2 transition-colors"
              style={{
                border: "1.5px solid #888",
                borderRadius: 24,
                background: "#ebebeb",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => (e.target.style.background = "#d5d5d5")}
              onMouseLeave={(e) => (e.target.style.background = "#ebebeb")}
            >
              Search by name
            </button>
          </div>
        </div>

        {/* Bottom Nav */}
        <div
          className="flex items-center justify-around"
          style={{
            background: "#ebebeb",
            height: 68,
            borderTop: "1px solid #ccc",
            flexShrink: 0,
            paddingBottom: 4,
          }}
        >
          {/* Person */}
          <button
            className="flex flex-col items-center justify-center"
            style={{ background: "none", border: "none", cursor: "pointer" }}
            onClick={() => setActiveNav("person")}
          >
            <PersonIcon />
          </button>

          {/* QR (center) */}
          <button
            className="flex items-center justify-center"
            style={{
              background: "#fff",
              border: "2px solid #ccc",
              borderRadius: 16,
              width: 52,
              height: 44,
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              cursor: "pointer",
            }}
            onClick={() => setActiveNav("qr")}
          >
            <QRIcon />
          </button>

          {/* Home */}
          <button
            className="flex flex-col items-center justify-center"
            style={{ background: "none", border: "none", cursor: "pointer" }}
            onClick={() => setActiveNav("home")}
          >
            <HomeIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
