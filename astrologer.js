// api/astrologer.js
// Vercel Serverless Function — calls Google's Gemini API.
// The key stays on the server (as an environment variable); the browser never sees it.

export default async function handler(req, res) {
  // Allow your GitHub Pages site to call this endpoint (CORS)
  res.setHeader("Access-Control-Allow-Origin", "*"); // முதலில் "*", பின்னால் உங்க domain மட்டும் வைக்கலாம்
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST மட்டும் அனுமதி" });
  }

  const { question, panchangam, jathagam, name } = req.body || {};
  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "question தேவை" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server-ல் GEMINI_API_KEY set ஆகல" });
  }

  const nameContext = name ? `இந்த நபரின் பெயர்: ${name}. முடிந்தவரை பெயரை வெச்சே பேசுங்கள் (உதா: "${name}, உங்க ராசி...").` : "";

  // Today's panchangam facts get folded into the system prompt so answers are grounded.
  const context = panchangam
    ? `இன்றைய பஞ்சாங்கம்: நட்சத்திரம் ${panchangam.nakName}, ராசி ${panchangam.rasiName}, ` +
      `திதி ${panchangam.tithiName}, யோகம் ${panchangam.yogaName}, கரணம் ${panchangam.karanaName}, ` +
      `கிழமை ${panchangam.weekday}. இப்போதைய கிரக பெயர்ச்சி: குரு பகவான் ${panchangam.guruRasi} ராசியில், ` +
      `சனி பகவான் ${panchangam.saniRasi} ராசியில் சஞ்சரிக்கிறார்கள்.`
    : "";

  // The person's own birth chart (janma rasi/nakshatra + lagnam), if they've provided it —
  // this is what makes the reading personal instead of a generic "today's forecast".
  const jathagamContext = jathagam
    ? `இந்த நபரின் ஜாதக விவரம்: ராசி ${jathagam.rasiName}, நட்சத்திரம் ${jathagam.nakName}, லக்னம் ${jathagam.lagnamName}. ` +
      `பதில் சொல்லும்போது, இந்த ஜாதக விவரத்தையும், இப்போதைய குரு/சனி பெயர்ச்சி நிலையையும் ஒப்பிட்டு, ` +
      `குரு பெயர்ச்சி பலன் மற்றும் சனி பெயர்ச்சி பலன் பாணியில் (இந்த ராசிக்கு குரு/சனி நன்மையா, தீமையா, ` +
      `எந்த வீட்டில் நிற்கிறார் என்பது போன்ற பாரம்பரிய தமிழ் ஜோதிட உத்திகளை வைத்து) பேசுங்கள் — இது தான் ஒரு ` +
      `உண்மையான ஜோதிடர் செய்வது போல இருக்கும். கேட்டால், இந்த வாரம்/மாதம்/வருடம் பொதுவா எப்படி இருக்கும்னு ` +
      `பாரம்பரிய பெயர்ச்சி பலன் பாணியில் சொல்லலாம். \n\n` +
      `இந்த நபர் "கடை ஆரம்பிக்கலாமா", "தொழில் பண்ணலாமா", "வேலைக்கு போகலாமா", "வெளிநாடு போகலாமா", ` +
      `"கல்யாணம் எப்போ நடக்கும்", "குழந்தை பாக்கியம் எப்போ", "வீட்டு வாசல் எந்த திசையில் வைக்கணும்" ` +
      `மாதிரி வாழ்க்கை முடிவு கேள்விகள் கேட்டா, தட்டிக்கழிக்காம, அவங்க ராசி/லக்னம்/நட்சத்திரத்தை ஆராய்ந்து, ` +
      `இப்போதைய குரு-சனி பெயர்ச்சியையும் வைத்து, "இப்போ ஏற்ற நேரமா/இல்லையா", "எந்த மாதம்/காலம் நல்லது", ` +
      `"என்ன பரிகாரம் செய்யலாம்" போன்ற ஒரு பாரம்பரிய ஜோதிடர் தரும் விரிவான, practical பதிலை கொடுங்கள். ` +
      `வாஸ்து/வாசல் திசை கேள்விக்கு, ராசிக்கு ஏற்ற பொதுவான திசை பரிந்துரையை (பாரம்பரிய வாஸ்து சாஸ்திர ` +
      `principles வைத்து) சொல்லுங்கள் — ஆனா வீடு கட்டுறது போன்ற நிரந்தரமான முடிவுக்கு முன், ஒரு அனுபவமுள்ள ` +
      `வாஸ்து நிபுணரையோ engineer-ஐயோ கண்டிப்பா அணுகணும்னு தெளிவா சொல்லுங்கள் (structure-ஐ கட்டின பிறகு ` +
      `மாத்துறது கடினம் என்பதால்). ` +
      `இருந்தாலும், இது ஒரு AI கருத்து என்பதை மறைமுகமா நினைவில் வைத்து, முக்கிய பண/உயிர் முடிவுகளுக்கு ` +
      `real-life expert ஆலோசனையும் (சட்டம், நிதி) பெறலாம்னு இயல்பா குறிப்பிடலாம் — ஆனா பதிலை தட்டிக்கழிக்காம. ` +
      `குறிப்பு: திருமணம்/கிரகப்பிரவேசத்துக்கான குறிப்பிட்ட நாட்கள்/தேதிகள் அல்லது பால் காய்ச்ச நல்ல நேரம் கேட்டா, ` +
      `நீங்களா தேதி/நேரம் invent பண்ண வேண்டாம் — அதுக்கு app-ல் "💍 திருமண நாள்" / "🏠 வாஸ்து நாள்" / ` +
      `"🥛 பால் காய்ச்சல்" பட்டன்கள் இருக்குனு சொல்லுங்கள், அவை real panchangam கணக்கீட்டை வைத்து துல்லியமான ` +
      `தேதி/நேரத்தை காட்டும்.`
    : "இந்த நபர் இன்னும் தன் ராசி/நட்சத்திரம்/லக்னம் தரல. இது இல்லாம சரியான ஜாதக பலன் சொல்ல முடியாதுன்னு " +
      "பணிவா சொல்லி, பிறந்த தேதி/நேரம்/ஊர் தந்தா இன்னும் துல்லியமா சொல்ல முடியும்னு குறிப்பிடுங்கள். " +
      "ஆனாலும் இன்றைய பொது பஞ்சாங்கத்தை வெச்சு ஒரு பொதுவான பதிலையும் தரலாம்.";

  const systemPrompt =
    "நீங்கள் ஒரு தமிழ் ஜோதிடர். எப்போதும் தமிழில் மட்டுமே பதில் சொல்லுங்கள் — ஆங்கில வார்த்தைகள் கலக்க வேண்டாம். " +
    "பணிவாகவும், தெளிவாகவும் பதில் சொல்லுங்கள். சாதாரண கேள்விக்கு சுருக்கமா (4-6 வரிகள்) பதில் சொல்லுங்கள்; " +
    "முழு ஜாதகம்/வாரம்/மாதம்/வருடம் பலன் அல்லது வாழ்க்கை முடிவு கேள்வி கேட்டா, விரிவா (10-15 வரிகள் வரை) பேசலாம். " +
    "** போன்ற markdown symbols எதுவும் பயன்படுத்த வேண்டாம், வெறும் தமிழ் உரையாக மட்டும் எழுதுங்கள். " +
    "மருத்துவம்/சட்டம் தொடர்பான உறுதியான தீர்ப்புகள் தர வேண்டாம், பொது வழிகாட்டுதலாக மட்டும் பேசுங்கள்.\n" +
    nameContext + "\n" + context + "\n" + jathagamContext;

  const MODEL = "gemini-3.6-flash"; // Google-ஓட தற்போதைய recommended model (2026 ஆகஸ்ட் நிலவரம்)

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: question }] }],
          generationConfig: { maxOutputTokens: 1536 },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    const text =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("\n") || "";
    return res.status(200).json({ answer: text });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
