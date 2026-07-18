"use client";

import { useState } from "react";
import { KANA_GROUPS } from "@/lib/data";
import { GROUP_EN } from "@/lib/en";
import { useI18n } from "@/lib/i18n";
import CharModal from "@/components/CharModal";

function KanaTable({ script, onSelect }) {
  const { lang } = useI18n();
  return (
    <>
      {KANA_GROUPS.map((group) => (
        <section key={group.name}>
          <div className="group-title">
            {lang === "en" ? GROUP_EN[group.name] || group.name : group.name}
          </div>
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

export default function KatakanaPage() {
  const { t } = useI18n();
  const [selected, setSelected] = useState(null);

  return (
    <div>
      <h1>{t("learn.titleKatakana")}</h1>
      <p className="subtitle">{t("learn.subtitleKatakana")}</p>

      <KanaTable script="katakana" onSelect={setSelected} />

      {selected && (
        <CharModal item={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
