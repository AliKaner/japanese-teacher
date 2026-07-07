"use client";

import { useState } from "react";
import { KANA_GROUPS, KANJI } from "@/lib/data";
import CharModal from "@/components/CharModal";

const TABS = [
  { id: "hiragana", label: "ひらがな Hiragana" },
  { id: "katakana", label: "カタカナ Katakana" },
  { id: "kanji", label: "漢字 Kanji" },
];

function KanaTable({ script, onSelect }) {
  return (
    <>
      {KANA_GROUPS.map((group) => (
        <section key={group.name}>
          <div className="group-title">{group.name}</div>
          <div className="kana-grid">
            {group.rows.flat().map((cell, i) =>
              cell ? (
                <div
                  key={i}
                  className="kana-cell"
                  onClick={() => onSelect({ type: "kana", ...cell, script })}
                >
                  <span className="glyph jp">
                    {script === "katakana" ? cell.k : cell.h}
                  </span>
                  <span className="romaji">{cell.r}</span>
                </div>
              ) : (
                <div key={i} className="kana-cell empty" />
              )
            )}
          </div>
        </section>
      ))}
    </>
  );
}

function KanjiTable({ onSelect }) {
  return (
    <>
      <div className="group-title">JLPT N5 Seviyesi — {KANJI.length} Kanji</div>
      <div className="kanji-grid">
        {KANJI.map((k) => (
          <div
            key={k.c}
            className="kanji-cell"
            onClick={() => onSelect({ type: "kanji", ...k })}
          >
            <span className="glyph jp">{k.c}</span>
            <span className="meaning">{k.m}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export default function LearnPage() {
  const [tab, setTab] = useState("hiragana");
  const [selected, setSelected] = useState(null);

  return (
    <div>
      <h1>📖 Harf Öğren</h1>
      <p className="subtitle">
        Bir karaktere tıkla: okunuşu, örnek kelimeleri ve yazma pratiği alanı
        açılır.
      </p>
      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab jp ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "kanji" ? (
        <KanjiTable onSelect={setSelected} />
      ) : (
        <KanaTable script={tab} onSelect={setSelected} />
      )}

      {selected && (
        <CharModal item={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
