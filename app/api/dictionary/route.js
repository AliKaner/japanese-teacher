// Jisho.org sözlük API'sine sunucu tarafı proxy (tarayıcıdan CORS engeline takılmadan)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  if (!q) {
    return Response.json({ error: "q parametresi gerekli" }, { status: 400 });
  }
  try {
    const res = await fetch(
      `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(q)}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error(`Jisho ${res.status}`);
    const data = await res.json();
    return Response.json(data);
  } catch (err) {
    return Response.json(
      { error: "Sözlük servisine ulaşılamadı: " + err.message },
      { status: 502 }
    );
  }
}
