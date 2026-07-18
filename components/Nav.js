"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useI18n } from "@/lib/i18n";
import Logo from "./Logo";

const LINKS = [
  { href: "/learn/hiragana", key: "nav.hiragana" },
  { href: "/learn/katakana", key: "nav.katakana" },
  { href: "/learn/kanji", key: "nav.learnKanji" },
  { href: "/practice", key: "nav.practice" },
  { href: "/read", key: "nav.read" },
  { href: "/dictionary", key: "nav.dict" },
  { href: "/kanji", key: "nav.kanji" },
  { href: "/friends", key: "nav.friends" },
  { href: "/groups", key: "nav.groups" },
];

function SearchBox() {
  const { t } = useI18n();
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term), 250);
    return () => clearTimeout(id);
  }, [term]);

  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const results = useQuery(
    api.search.all,
    debounced.trim() ? { term: debounced } : "skip"
  );

  const go = (href) => {
    setTerm("");
    setOpen(false);
    router.push(href);
  };

  const hasResults =
    results && (results.users.length > 0 || results.kanji.length > 0);

  return (
    <div className="nav-search" ref={boxRef}>
      <input
        className="nav-search-input"
        value={term}
        placeholder={t("search.placeholder")}
        onChange={(e) => {
          setTerm(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && term.trim() && (
        <div className="nav-search-dropdown">
          {results === undefined && (
            <div className="nav-search-hint">{t("loading")}</div>
          )}
          {results && !hasResults && (
            <div className="nav-search-hint">{t("search.none")}</div>
          )}
          {results?.users.length > 0 && (
            <>
              <div className="nav-search-label">{t("search.users")}</div>
              {results.users.map((u) => (
                <button
                  key={u.userId}
                  className="nav-search-item"
                  onClick={() => go(`/profile/${u.userId}`)}
                >
                  👤 {u.name}
                </button>
              ))}
            </>
          )}
          {results?.kanji.length > 0 && (
            <>
              <div className="nav-search-label">{t("search.kanji")}</div>
              {results.kanji.map((k) => (
                <button
                  key={k.rank}
                  className="nav-search-item"
                  onClick={() => go(`/dictionary?q=${encodeURIComponent(k.char)}`)}
                >
                  <span className="jp">{k.char}</span>
                  <span className="nav-search-rank">#{k.rank}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="lang-toggle">
      <button
        className={lang === "tr" ? "active" : ""}
        onClick={() => setLang("tr")}
      >
        TR
      </button>
      <button
        className={lang === "en" ? "active" : ""}
        onClick={() => setLang("en")}
      >
        EN
      </button>
    </div>
  );
}

export default function Nav() {
  const pathname = usePathname();
  const { isAuthenticated } = useConvexAuth();
  const viewer = useQuery(api.users.viewer);
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const accountHref =
    isAuthenticated && viewer ? `/profile/${viewer._id}` : "/account";

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isActive = (href) => pathname.startsWith(href);

  return (
    <>
      <header className="topbar">
        <div className="topbar-row">
          <Link href="/kanji" className="brand">
            <Logo size={42} />
            <span className="brand-text">
              <span className="brand-jp jp">猫漢字</span>
              <span className="brand-tr">NEKO KANJI</span>
            </span>
          </Link>
          <SearchBox />
          <div className="topbar-actions">
            <LangToggle />
            <Link
              href={accountHref}
              className={`nav-account ${
                pathname.startsWith("/account") ||
                (viewer && pathname === `/profile/${viewer._id}`)
                  ? "active"
                  : ""
              }`}
            >
              {isAuthenticated ? t("nav.profile") : t("nav.login")}
            </Link>
          </div>
          <button
            className="burger-btn"
            aria-label="Menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
        <nav className="nav">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={isActive(l.href) ? "active" : ""}
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>
        {menuOpen && (
          <div className="mobile-menu">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={isActive(l.href) ? "active" : ""}
              >
                {t(l.key)}
              </Link>
            ))}
            <Link href={accountHref}>
              {isAuthenticated ? t("nav.profile") : t("nav.login")}
            </Link>
            <LangToggle />
          </div>
        )}
      </header>

      {/* Sadece mobilde görünen alt menü */}
      <nav className="bottom-nav">
        <Link
          href="/learn/kanji"
          className={isActive("/learn") ? "active" : ""}
        >
          <span className="bn-icon">📖</span>
          <span>{t("nav.short.learn")}</span>
        </Link>
        <Link href="/practice" className={isActive("/practice") ? "active" : ""}>
          <span className="bn-icon">🎲</span>
          <span>{t("nav.short.practice")}</span>
        </Link>
        <Link
          href="/kanji"
          className={`bottom-logo ${pathname === "/kanji" ? "active" : ""}`}
          aria-label="Kanji Map"
        >
          <Logo size={34} />
        </Link>
        <Link href="/read" className={isActive("/read") ? "active" : ""}>
          <span className="bn-icon">📜</span>
          <span>{t("nav.short.read")}</span>
        </Link>
        <Link
          href={accountHref}
          className={
            pathname.startsWith("/account") ||
            (viewer && pathname === `/profile/${viewer._id}`)
              ? "active"
              : ""
          }
        >
          <span className="bn-icon">👤</span>
          <span>{t("nav.short.profile")}</span>
        </Link>
      </nav>
    </>
  );
}
