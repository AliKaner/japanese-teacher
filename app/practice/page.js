"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { KANA_GROUPS } from "@/lib/data";
import { WORDS_EN } from "@/lib/en";
import { kanaToRomaji } from "@/lib/romaji";
import { speak } from "@/lib/tts";
import { wordsStartingWith, wordsContainingKanji } from "@/lib/words";
import { useI18n } from "@/lib/i18n";
import CharModal from "@/components/CharModal";

const ALL_KANA = KANA_GROUPS.flatMap((g) => g.rows.flat()).filter(Boolean);
const JLPT = ["5", "4", "3", "2", "1"];

const DEFAULT_CONFIG = {
  sources: ["hiragana"],
  kanaSel: [], // seçili kana id'leri (h alanı); boş = hepsi
  jlptLevels: ["5"], // boş = hepsi
  customKanji: [], // [{c, meanings, m_tr, ...}] doluysa jlpt yok sayılır
};

const FALLBACK_MEANINGS = {
  tr: ["su", "dağ", "ağaç", "nehir", "ateş", "gökyüzü", "el", "göz"],
  en: ["water", "mountain", "tree", "river", "fire", "sky", "hand", "eye"],
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function displayChar(item) {
  if (!item || item.error) return "";
  if (item.type === "kanji") return item.c;
  return item.script === "katakana" ? item.k : item.h;
}

function wordMeaning(w, lang) {
  return lang === "en" ? WORDS_EN[w.w] || w.m : w.m;
}

function kanjiMeaningOf(item, lang) {
  if (lang === "tr" && item.m_tr) return item.m_tr;
  return item.meanings?.[0] || item.m || item.m_tr || "";
}

// ---------- Config yardımcıları ----------
function kanaPoolOf(config) {
  if (!config.kanaSel.length) return ALL_KANA;
  const sel = new Set(config.kanaSel);
  return ALL_KANA.filter((k) => sel.has(k.h));
}

function kanaSourcesOf(config) {
  return config.sources.filter((s) => s === "hiragana" || s === "katakana");
}

function jlptParam(config) {
  if (!config.jlptLevels.length || config.jlptLevels.length === JLPT.length)
    return "all";
  return pick(config.jlptLevels);
}

// ---------- Ayar Paneli ----------
function SetupPanel({ config, setConfig }) {
  const { t, lang } = useI18n();
  const [showKanaPicker, setShowKanaPicker] = useState(false);
  const [kanjiSearch, setKanjiSearch] = useState("");
  const [kanjiResults, setKanjiResults] = useState([]);
  const searchTimer = useRef(null);

  const toggleSource = (s) => {
    setConfig((c) => {
      const has = c.sources.includes(s);
      if (has && c.sources.length === 1) return c; // en az bir kaynak
      return {
        ...c,
        sources: has ? c.sources.filter((x) => x !== s) : [...c.sources, s],
      };
    });
  };

  const toggleKana = (h) => {
    setConfig((c) => ({
      ...c,
      kanaSel: c.kanaSel.includes(h)
        ? c.kanaSel.filter((x) => x !== h)
        : [...c.kanaSel, h],
    }));
  };

  const toggleJlpt = (l) => {
    setConfig((c) => ({
      ...c,
      jlptLevels: c.jlptLevels.includes(l)
        ? c.jlptLevels.filter((x) => x !== l)
        : [...c.jlptLevels, l],
    }));
  };

  const searchKanji = (term) => {
    setKanjiSearch(term);
    clearTimeout(searchTimer.current);
    if (!term.trim()) {
      setKanjiResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/kanji?search=${encodeURIComponent(term.trim())}&limit=8`
        );
        const data = await res.json();
        setKanjiResults(data.kanjis || []);
      } catch {
        setKanjiResults([]);
      }
    }, 250);
  };

  const addKanji = (k) => {
    setConfig((c) =>
      c.customKanji.some((x) => x.c === k.c)
        ? c
        : { ...c, customKanji: [...c.customKanji, k] }
    );
    setKanjiSearch("");
    setKanjiResults([]);
  };

  const removeKanji = (c) => {
    setConfig((cfg) => ({
      ...cfg,
      customKanji: cfg.customKanji.filter((x) => x.c !== c),
    }));
  };

  const kanaActive = kanaSourcesOf(config).length > 0;
  const kanjiActive = config.sources.includes("kanji");

  return (
    <div className="card setup-panel">
      <h2 style={{ marginTop: 0 }}>{t("practice.setup")}</h2>

      <div className="setup-row">
        <span className="setup-label">{t("practice.sources")}</span>
        <div className="tabs" style={{ margin: 0 }}>
          {[
            { id: "hiragana", label: "ひらがな" },
            { id: "katakana", label: "カタカナ" },
            { id: "kanji", label: "漢字" },
          ].map((s) => (
            <button
              key={s.id}
              className={`tab jp ${config.sources.includes(s.id) ? "active" : ""}`}
              onClick={() => toggleSource(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {kanaActive && (
        <div className="setup-row">
          <button
            className="btn secondary small"
            onClick={() => setShowKanaPicker((v) => !v)}
          >
            {t("practice.pickChars")} {showKanaPicker ? "▲" : "▼"}
          </button>
          <span className="hint">
            {t("practice.pickCharsHint", {
              n: config.kanaSel.length || ALL_KANA.length,
            })}
          </span>
          {showKanaPicker && (
            <>
              <div className="setup-actions">
                <button
                  className="btn secondary small"
                  onClick={() => setConfig((c) => ({ ...c, kanaSel: [] }))}
                >
                  {t("practice.clear")}
                </button>
              </div>
              <div className="setup-kana-grid">
                {ALL_KANA.map((k) => (
                  <button
                    key={k.h}
                    className={`kana-pick jp ${
                      config.kanaSel.includes(k.h) ? "on" : ""
                    }`}
                    onClick={() => toggleKana(k.h)}
                    title={k.r}
                  >
                    {config.sources.includes("hiragana") ? k.h : k.k}
                    <span className="kana-pick-r">{k.r}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {kanjiActive && (
        <div className="setup-row">
          <span className="setup-label">{t("practice.kanjiLevels")}</span>
          <div className="tabs" style={{ margin: 0 }}>
            {JLPT.map((l) => (
              <button
                key={l}
                className={`tab ${config.jlptLevels.includes(l) ? "active" : ""}`}
                onClick={() => toggleJlpt(l)}
                disabled={config.customKanji.length > 0}
              >
                N{l}
              </button>
            ))}
            <button
              className={`tab ${config.jlptLevels.length === 0 ? "active" : ""}`}
              onClick={() => setConfig((c) => ({ ...c, jlptLevels: [] }))}
              disabled={config.customKanji.length > 0}
            >
              {t("practice.all")}
            </button>
          </div>

          <div className="setup-custom">
            <span className="setup-label">{t("practice.customKanji")}</span>
            <span className="hint">{t("practice.customHint")}</span>
            <div className="nav-search" style={{ maxWidth: 320, margin: 0 }}>
              <input
                className="nav-search-input"
                value={kanjiSearch}
                placeholder={t("practice.searchAdd")}
                onChange={(e) => searchKanji(e.target.value)}
              />
              {kanjiResults.length > 0 && (
                <div className="nav-search-dropdown">
                  {kanjiResults.map((k) => (
                    <button
                      key={k.c}
                      className="nav-search-item"
                      onClick={() => addKanji(k)}
                    >
                      <span className="jp">{k.c}</span>
                      <span className="nav-search-rank">
                        {lang === "tr" && k.m_tr ? k.m_tr : k.meanings?.[0]}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {config.customKanji.length > 0 && (
              <div className="kchip-row">
                {config.customKanji.map((k) => (
                  <button
                    key={k.c}
                    className="kchip jp"
                    onClick={() => removeKanji(k.c)}
                    title="✕"
                  >
                    {k.c} <span className="kchip-x">✕</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <p className="hint" style={{ margin: "6px 0 0" }}>{t("practice.mixed")}</p>
    </div>
  );
}

// ---------- Soru üretimi ----------
async function makeQuestion(config, lang) {
  const source = pick(config.sources);

  if (source === "kanji") {
    // Özel kanji listesi: soruyu istemcide kur
    if (config.customKanji.length > 0) {
      const item = pick(config.customKanji);
      const correct = kanjiMeaningOf(item, lang);
      const options = new Set([correct]);
      let guard = 0;
      while (options.size < 4 && guard++ < 100) {
        const other = kanjiMeaningOf(pick(config.customKanji), lang);
        if (other) options.add(other);
        if (guard > 30) break;
      }
      for (const f of FALLBACK_MEANINGS[lang === "en" ? "en" : "tr"]) {
        if (options.size >= 4) break;
        if (f !== correct) options.add(f);
      }
      return {
        item: { type: "kanji", ...item },
        correct,
        options: [...options].sort(() => Math.random() - 0.5),
      };
    }
    // JLPT havuzu: API'den hazır soru
    const res = await fetch(
      `/api/kanji?quiz=true&lang=${lang}&jlpt=${jlptParam(config)}`
    );
    const data = await res.json();
    if (data && !data.error) return data;
    return null;
  }

  // Kana sorusu (seçili karakter havuzundan)
  const script = pick(kanaSourcesOf(config));
  const kanaPool = kanaPoolOf(config);
  const item = { type: "kana", ...pick(kanaPool), script };
  const correct = item.r;
  const options = new Set([correct]);
  let guard = 0;
  while (options.size < 4 && guard++ < 200) {
    const from = options.size < kanaPool.length ? kanaPool : ALL_KANA;
    options.add(pick(from).r);
  }
  return {
    item,
    correct,
    options: [...options].sort(() => Math.random() - 0.5),
  };
}

async function makeRandomItem(config, lang) {
  const source = pick(config.sources);
  if (source === "kanji") {
    if (config.customKanji.length > 0) {
      return { type: "kanji", ...pick(config.customKanji) };
    }
    const res = await fetch(`/api/kanji?random=true&jlpt=${jlptParam(config)}`);
    const data = await res.json();
    if (data && !data.error) return { type: "kanji", ...data };
    return null;
  }
  const script = pick(kanaSourcesOf(config));
  return { type: "kana", ...pick(kanaPoolOf(config)), script };
}

// ---------- Rastgele Kart ----------
function RandomChar({ config }) {
  const { t, lang } = useI18n();
  const [item, setItem] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  const next = async () => {
    setLoading(true);
    setRevealed(false);
    try {
      setItem(await makeRandomItem(config, lang));
    } catch {
      setItem(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    next();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(config)]);

  const words = useMemo(() => {
    if (!item || item.error) return [];
    if (item.type === "kanji") return wordsContainingKanji(item.c);
    return wordsStartingWith(item.script === "katakana" ? item.k : item.h);
  }, [item]);

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>{t("practice.random")}</h2>

      {loading ? (
        <p className="hint" style={{ textAlign: "center", margin: "40px 0" }}>
          {t("loading")}
        </p>
      ) : item ? (
        <>
          <div
            className="big-char jp"
            onClick={() => setDetail(item)}
            title={t("modal.clickDetail")}
            style={{ cursor: "pointer" }}
          >
            {displayChar(item)}
          </div>
          {revealed ? (
            <div className="reveal">
              {item.type === "kanji" ? (
                <>
                  <b>{kanjiMeaningOf(item, lang)}</b>{" "}
                  <span className="romaji">
                    {[...(item.on || []), ...(item.kun || [])].join("、")}
                  </span>
                </>
              ) : (
                <>
                  <b>{item.r}</b>{" "}
                  <span className="romaji jp">
                    ({item.h} / {item.k})
                  </span>
                </>
              )}
              <div style={{ marginTop: 6 }}>
                <button
                  className="btn secondary small"
                  onClick={() =>
                    speak(
                      item.type === "kanji"
                        ? (item.kun?.[0] || item.on?.[0] || item.c).replace(/\(.*\)/, "")
                        : item.h
                    )
                  }
                >
                  {t("practice.listen")}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", margin: "6px 0 14px" }}>
              <button className="btn secondary" onClick={() => setRevealed(true)}>
                {t("practice.reveal")}
              </button>
            </div>
          )}

          {revealed && words.length > 0 && (
            <div className="word-list">
              <div className="trace-title">
                {item.type === "kanji"
                  ? t("practice.wordsWithKanji")
                  : t("practice.wordsStarting")}
              </div>
              {words.slice(0, 4).map((w) => (
                <div
                  key={w.w}
                  className="word-item"
                  onClick={() => speak(w.kana)}
                  title={t("modal.clickListen")}
                >
                  <span className="w jp">{w.w}</span>
                  <span className="r jp">{w.kana}</span>
                  <span className="romaji">{kanaToRomaji(w.kana)}</span>
                  <span className="m">{wordMeaning(w, lang)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="hint" style={{ textAlign: "center" }}>
          {t("practice.hint")}
        </p>
      )}

      <div style={{ textAlign: "center", marginTop: 14 }}>
        <button className="btn" onClick={next}>
          {t("practice.newChar")}
        </button>
      </div>

      {detail && <CharModal item={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

// ---------- Quiz ----------
function Quiz({ config }) {
  const { t, lang } = useI18n();
  const [q, setQ] = useState(null);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState({ ok: 0, total: 0, streak: 0 });
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useConvexAuth();
  const recordCorrect = useMutation(api.progress.recordCorrect);

  const next = async () => {
    setLoading(true);
    setPicked(null);
    try {
      setQ(await makeQuestion(config, lang));
    } catch {
      setQ(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setScore({ ok: 0, total: 0, streak: 0 });
    next();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(config), lang]);

  const pickOpt = (opt) => {
    if (picked !== null || !q) return;
    setPicked(opt);
    const good = opt === q.correct;
    setScore((s) => ({
      ok: s.ok + (good ? 1 : 0),
      total: s.total + 1,
      streak: good ? s.streak + 1 : 0,
    }));
    if (good && q.item.type === "kanji" && isAuthenticated) {
      recordCorrect({ char: q.item.c }).catch(() => {});
    }
    if (q.item.type !== "kanji") speak(q.item.h);
  };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>{t("practice.quiz")}</h2>

      {loading ? (
        <p className="hint" style={{ textAlign: "center", margin: "40px 0" }}>
          {t("loading")}
        </p>
      ) : q ? (
        <>
          <div className="big-char jp">{displayChar(q.item)}</div>
          <p className="hint" style={{ textAlign: "center", margin: 0 }}>
            {q.item.type === "kanji"
              ? t("practice.quizHintKanji")
              : t("practice.quizHintKana")}
          </p>
          <div className="quiz-options">
            {q.options.map((opt) => (
              <button
                key={opt}
                className={`quiz-option ${
                  picked !== null
                    ? opt === q.correct
                      ? "correct"
                      : opt === picked
                      ? "wrong"
                      : ""
                    : ""
                }`}
                disabled={picked !== null}
                onClick={() => pickOpt(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
          {picked !== null && (
            <div style={{ textAlign: "center", marginTop: 14 }}>
              <button className="btn" onClick={next}>
                {t("practice.next")}
              </button>
            </div>
          )}
          <div className="scoreboard">
            <span>
              {t("practice.correct")}: <b>{score.ok}</b> / {score.total}
            </span>
            <span>
              {t("practice.streak")}: <b>{score.streak}</b> 🔥
            </span>
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center" }}>
          <p className="hint">{t("practice.quizIntro")}</p>
          <button className="btn" onClick={next}>
            {t("practice.start")}
          </button>
        </div>
      )}
    </div>
  );
}

export default function PracticePage() {
  const { t } = useI18n();
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("practiceConfig");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.sources?.length) setConfig({ ...DEFAULT_CONFIG, ...parsed });
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded)
      window.localStorage.setItem("practiceConfig", JSON.stringify(config));
  }, [config, loaded]);

  if (!loaded) return <p className="hint">{t("loading")}</p>;

  return (
    <div>
      <h1>{t("practice.title")}</h1>
      <p className="subtitle">{t("practice.intro")}</p>
      <SetupPanel config={config} setConfig={setConfig} />
      <div className="practice-grid" style={{ marginTop: 14 }}>
        <RandomChar config={config} />
        <Quiz config={config} />
      </div>
    </div>
  );
}
