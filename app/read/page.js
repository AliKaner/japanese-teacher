"use client";

import { useRef, useState } from "react";
import { TEXTS } from "@/lib/data";
import { kanaToRomaji } from "@/lib/romaji";
import { speak } from "@/lib/tts";

export default function ReadPage() {
  const [textId, setTextId] = useState(TEXTS[0].id);
  const [tip, setTip] = useState(null); // { token, x, y }
  const areaRef = useRef(null);

  const text = TEXTS.find((t) => t.id === textId);

  const showTip = (e, token) => {
    if (!token.r) return;
    setTip({ token, x: e.clientX, y: e.clientY });
  };

  const moveTip = (e) => {
    setTip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : t));
  };

  return (
    <div>
      <h1>📜 Okuma</h1>
      <p className="subtitle">
        Kelimelerin üzerine gel: hiragana okunuşu, romaji ve Türkçe anlamı
        görünür. Sesli dinlemek için kelimeye tıkla.
      </p>

      <div className="tabs">
        {TEXTS.map((t) => (
          <button
            key={t.id}
            className={`tab jp ${t.id === textId ? "active" : ""}`}
            onClick={() => setTextId(t.id)}
          >
            {t.title.split("—")[0].trim()}
          </button>
        ))}
      </div>

      <div className="card">
        <h2 className="jp" style={{ marginTop: 0 }}>
          {text.title} <span className="badge">{text.level}</span>
        </h2>
        <div style={{ marginBottom: 12 }}>
          <button
            className="btn secondary small"
            onClick={() => speak(text.tokens.map((t) => t.t).join(""))}
          >
            🔊 Tamamını Dinle
          </button>
        </div>
        <div className="reading-text jp" ref={areaRef}>
          {text.tokens.map((token, i) =>
            token.r ? (
              <span
                key={i}
                className="token"
                onMouseEnter={(e) => showTip(e, token)}
                onMouseMove={moveTip}
                onMouseLeave={() => setTip(null)}
                onClick={() => speak(token.t)}
              >
                {token.t}
              </span>
            ) : (
              <span key={i}>{token.t}</span>
            )
          )}
        </div>
      </div>

      {tip && (
        <div
          className="tooltip"
          style={{
            left: Math.min(tip.x + 14, typeof window !== "undefined" ? window.innerWidth - 300 : tip.x),
            top: tip.y + 18,
          }}
        >
          <div className="tt-reading jp">{tip.token.r}</div>
          <div className="tt-romaji">{kanaToRomaji(tip.token.r)}</div>
          <div className="tt-meaning">🇹🇷 {tip.token.m}</div>
        </div>
      )}
    </div>
  );
}
