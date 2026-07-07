// Tarayıcının konuşma sentezi ile Japonca telaffuz
export function speak(text) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "ja-JP";
  utter.rate = 0.85;
  const jaVoice = window.speechSynthesis
    .getVoices()
    .find((v) => v.lang && v.lang.startsWith("ja"));
  if (jaVoice) utter.voice = jaVoice;
  window.speechSynthesis.speak(utter);
}
