"use client";

import { useEffect, useRef, useState } from "react";
import { kanaToRomaji } from "@/lib/romaji";
import { speak } from "@/lib/tts";
import { wordsStartingWith, wordsContainingKanji } from "@/lib/words";
import { useI18n } from "@/lib/i18n";
import StrokeOrder from "@/components/StrokeOrder";

const RULE_CHARS = ["三", "一", "十", "小", "国", "人", "中"];

// Genel çizgi kuralları rehberi
function StrokeRules() {
  const { t } = useI18n();
  return (
    <details className="rules">
      <summary>{t("modal.rulesTitle")}</summary>
      <ol>
        {RULE_CHARS.map((ch, i) => (
          <li key={ch}>
            {t(`modal.rule${i + 1}`)} (<span className="jp">{ch}</span>)
          </li>
        ))}
      </ol>
      <p className="hint" style={{ marginTop: 8 }}>
        {t("modal.rulesHint")}
      </p>
    </details>
  );
}

// Yazma pratiği: soluk karakterin üzerinden parmak/fare ile çizme
function TraceBox({ char }) {
  const { t } = useI18n();
  const canvasRef = useRef(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }, [char]);

  const pos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e) => {
    drawing.current = true;
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    canvasRef.current.setPointerCapture(e.pointerId);
  };

  const move = (e) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current.getContext("2d");
    ctx.strokeStyle = "#c0392b";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const end = () => (drawing.current = false);

  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="trace-wrap">
      <div className="trace-title">{t("modal.trace")}</div>
      <div className="trace-box">
        <div className="trace-ghost jp">{char}</div>
        <canvas
          ref={canvasRef}
          className="trace-canvas"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
        />
      </div>
      <div className="trace-actions">
        <button className="btn secondary small" onClick={clear}>
          {t("modal.clear")}
        </button>
      </div>
    </div>
  );
}

function WordList({ words, title }) {
  const { t } = useI18n();
  if (!words.length) return null;
  return (
    <div className="word-list">
      <div className="trace-title">{title}</div>
      {words.slice(0, 6).map((w) => (
        <div key={w.w + w.kana} className="word-item" onClick={() => speak(w.kana)} title={t("modal.clickListen")}>
          <span className="w jp">{w.w}</span>
          <span className="r jp">{w.kana}</span>
          <span className="romaji">{kanaToRomaji(w.kana)}</span>
          <span className="m">{w.m}</span>
        </div>
      ))}
    </div>
  );
}

export default function CharModal({ item, onClose }) {
  // item: { type: "kana", h, k, r, script } | { type: "kanji", ...KANJI kaydı }
  const { t, lang } = useI18n();
  const [apiInfo, setApiInfo] = useState(null);

  useEffect(() => {
    setApiInfo(null);
    if (item?.type === "kanji") {
      // kanjiapi.dev'den ek bilgi: çizgi sayısı, JLPT, sınıf
      fetch(`https://kanjiapi.dev/v1/kanji/${encodeURIComponent(item.c)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then(setApiInfo)
        .catch(() => {});
    }
  }, [item]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!item) return null;

  const isKanji = item.type === "kanji";
  const displayChar = isKanji ? item.c : item.script === "katakana" ? item.k : item.h;
  const speakText = isKanji ? (item.kun?.[0] || item.on?.[0] || item.c || "").replace(/\(.*\)/, "") : item.h;
  const words = isKanji
    ? wordsContainingKanji(item.c)
    : wordsStartingWith(item.script === "katakana" ? item.k : item.h);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose} aria-label="✕">✕</button>
        <div className="modal-head">
          <div className="modal-char jp">{displayChar}</div>
          <div className="modal-info">
            {isKanji ? (
              <>
                <div className="reading-row">
                  <span className="reading-label">{t("modal.meaning")}</span>{" "}
                  <b>
                    {(lang === "tr"
                      ? item.m_tr || item.m || (item.meanings || []).join(", ")
                      : (item.meanings || []).join(", ") || item.m || item.m_tr) ||
                      "—"}
                  </b>
                </div>
                {lang === "tr" && item.m_tr && item.meanings?.length > 0 && (
                  <div className="reading-row">
                    <span className="reading-label">EN</span>{" "}
                    <span className="hint">{item.meanings.join(", ")}</span>
                  </div>
                )}
                {item.on && item.on.length > 0 && (
                  <div className="reading-row"><span className="reading-label">ON-YOMİ</span> <span className="jp">{item.on.join("、")}</span> <span className="hint">({item.on.map((r) => kanaToRomaji(r)).join(", ")})</span></div>
                )}
                {item.kun && item.kun.length > 0 && (
                  <div className="reading-row"><span className="reading-label">KUN-YOMİ</span> <span className="jp">{item.kun.join("、")}</span> <span className="hint">({item.kun.map((r) => kanaToRomaji(r.replace(/[()]/g, ""))).join(", ")})</span></div>
                )}
                <div className="reading-row" style={{ marginTop: 6 }}>
                  {(apiInfo?.stroke_count || item.strokes) ? (
                    <span className="badge">
                      {t("modal.strokesBadge", { n: apiInfo?.stroke_count || item.strokes })}
                    </span>
                  ) : null}
                  {(apiInfo?.jlpt || item.jlpt) ? (
                    <span className="badge">JLPT N{apiInfo?.jlpt || item.jlpt}</span>
                  ) : null}
                  {(apiInfo?.grade || item.grade) ? (
                    <span className="badge">
                      {t("modal.gradeBadge", { n: apiInfo?.grade || item.grade })}
                    </span>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <div className="reading-row"><span className="reading-label">{t("modal.reading")}</span> <b>{item.r}</b></div>
                <div className="reading-row"><span className="reading-label">HIRAGANA</span> <span className="jp">{item.h}</span></div>
                <div className="reading-row"><span className="reading-label">KATAKANA</span> <span className="jp">{item.k}</span></div>
              </>
            )}
            <div style={{ marginTop: 10 }}>
              <button className="btn small" onClick={() => speak(speakText)}>{t("modal.listen")}</button>
            </div>
          </div>
        </div>

        <div className="trace-wrap">
          <div className="trace-title">{t("modal.strokeTitle")}</div>
          <div className="stroke-section">
            {[...displayChar].map((ch) => (
              <StrokeOrder key={ch} char={ch} />
            ))}
          </div>
        </div>

        <StrokeRules />

        <TraceBox char={displayChar} />

        {isKanji && item.ex && (
          <div className="word-list">
            <div className="trace-title">{t("modal.example")}</div>
            <div className="word-item" onClick={() => speak(item.ex.r)} title={t("modal.clickListen")}>
              <span className="w jp">{item.ex.w}</span>
              <span className="r jp">{item.ex.r}</span>
              <span className="romaji">{kanaToRomaji(item.ex.r)}</span>
              <span className="m">{item.ex.m}</span>
            </div>
          </div>
        )}

        <WordList
          words={words}
          title={
            isKanji ? t("practice.wordsWithKanji") : t("practice.wordsStarting")
          }
        />
      </div>
    </div>
  );
}
