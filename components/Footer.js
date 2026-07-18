"use client";

import { useI18n } from "@/lib/i18n";

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="footer">
      <div className="footer-content">
        <p className="footer-motivation">{t("footer.text")}</p>
        <div className="footer-links">
          <a
            href="https://github.com/AliKaner/neko-kanji"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            {t("footer.contribute")}
          </a>
          <span className="footer-divider">•</span>
          <a
            href="https://alikaner.com"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            {t("footer.creator")}
          </a>
        </div>
        <p className="footer-copyright">
          © {new Date().getFullYear()} 猫漢字 Neko Kanji. Made with ❤️ for Japanese learners.
        </p>
      </div>
    </footer>
  );
}
