import "./globals.css";
import {
  Nunito,
  Zen_Maru_Gothic,
  Shippori_Mincho,
  Hachi_Maru_Pop,
} from "next/font/google";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { I18nProvider } from "@/lib/i18n";

const nunito = Nunito({
  subsets: ["latin", "latin-ext"],
  variable: "--font-ui",
});

const zenMaru = Zen_Maru_Gothic({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-jp",
});

const shippori = Shippori_Mincho({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-jp-sharp",
});

const hachiMaru = Hachi_Maru_Pop({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-jp-play",
});

const SITE_URL = "https://neko-kanji.com";
const SITE_NAME = "猫漢字 Neko Kanji";
const SITE_DESC =
  "Learn hiragana, katakana and the 2500 most frequent Japanese kanji. Track your progress on a GitHub-style heatmap, level up with XP and badges, and compete with friends and groups.";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "猫漢字 Neko Kanji — Learn Japanese Kanji",
    template: "%s | 猫漢字 Neko Kanji",
  },
  description: SITE_DESC,
  keywords: [
    "learn japanese",
    "kanji",
    "top 2500 kanji",
    "hiragana",
    "katakana",
    "kanji practice",
    "japanese vocabulary",
    "kanji heatmap",
    "JLPT",
    "neko kanji",
  ],
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "猫漢字 Neko Kanji — Learn Japanese Kanji",
    description: SITE_DESC,
    locale: "en_US",
    alternateLocale: ["tr_TR"],
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "猫漢字 Neko Kanji — Learn the top 2500 kanji",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "猫漢字 Neko Kanji — Learn Japanese Kanji",
    description: SITE_DESC,
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${nunito.variable} ${zenMaru.variable} ${shippori.variable} ${hachiMaru.variable}`}
      >
        <ConvexClientProvider>
          <I18nProvider>
            <Nav />
            <main className="container">{children}</main>
            <Footer />
          </I18nProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
