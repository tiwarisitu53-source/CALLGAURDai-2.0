import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const PORT = 3000;

// Lazy initialization helper for Gemini SDK
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Unified fallback heuristic analyzer supporting English, Hindi, and Hinglish
function analyzeLocally(
  userMessage: string,
  currentScore: number,
  historyCount: number,
  language: "en" | "hi" = "en",
  expectedCalls: Array<{ organization: string; reason: string; category?: string }> = [],
  userVerification: "EXPECTED" | "UNEXPECTED" | "NOT_SURE" | "UNAVAILABLE" = "UNAVAILABLE"
) {
  const lower = userMessage.toLowerCase();
  const signals: string[] = [];
  let addedScore = 0;
  let category = "General Inquiry";
  let intent = "Caller provided general statement";
  let stage: "INITIAL" | "DISCOVERY" | "VERIFICATION" | "FINAL_DECISION" = "DISCOVERY";
  let claimedOrganization = "";
  let matchedExpected: { organization: string; reason: string } | null = null;

  // Check against expected calls
  if (expectedCalls && expectedCalls.length > 0) {
    for (const exp of expectedCalls) {
      const orgTerms = exp.organization.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
      const reasonTerms = exp.reason.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
      const orgMatch =
        lower.includes(exp.organization.toLowerCase()) ||
        (exp.organization.toLowerCase().includes("punjab national") && (lower.includes("punjab") || lower.includes("pnb"))) ||
        orgTerms.some((t) => lower.includes(t));
      const reasonMatch =
        lower.includes(exp.reason.toLowerCase()) ||
        reasonTerms.some((t) => lower.includes(t)) ||
        (exp.reason.toLowerCase().includes("credit card") && lower.includes("card"));

      if (orgMatch || reasonMatch) {
        matchedExpected = { organization: exp.organization, reason: exp.reason };
        claimedOrganization = exp.organization;
        signals.push("Context matched expected interaction (Supporting signal only)");
        break;
      }
    }
  }

  // Handle user verification signals
  if (userVerification === "EXPECTED") {
    signals.push("User indicated call was expected (Supporting signal)");
  } else if (userVerification === "UNEXPECTED") {
    signals.push("User reported call was NOT expected (+25 risk)");
    addedScore += 25;
  } else if (userVerification === "UNAVAILABLE") {
    signals.push("User verification unavailable (Treated as UNKNOWN)");
  }

  // Critical credential / fraud signals (Jumps directly to HIGH)
  // Supports English, Hindi, and Hinglish terminology
  if (
    lower.includes("otp") ||
    lower.includes("one-time password") ||
    lower.includes("verification code") ||
    lower.includes("code sent to your phone") ||
    lower.includes("share kar dijiye") ||
    (lower.includes("bata dijiye") && lower.includes("code")) ||
    lower.includes("ओटीपी") ||
    lower.includes("ओ टी पी") ||
    lower.includes("सत्यापन कोड") ||
    lower.includes("कोड बता")
  ) {
    signals.push("OTP / Verification Code Request");
    signals.push("Sensitive authentication data request");
    signals.push("Caller requested a one-time password");
    addedScore += 65;
    category = "Credential Theft";
    intent = "Attempting to harvest one-time passcode for account takeover";
  } else if (
    lower.includes("password") ||
    lower.includes("pin number") ||
    lower.includes("cvv") ||
    lower.includes("social security") ||
    lower.includes("ssn") ||
    lower.includes("पासवर्ड") ||
    lower.includes("पिन") ||
    lower.includes("सीवीवी")
  ) {
    signals.push("Sensitive personal information request");
    signals.push("Direct credential theft attempt");
    addedScore += 60;
    category = "Credential Theft";
    intent = "Soliciting confidential authentication credentials";
  } else if (
    lower.includes("remote") ||
    lower.includes("anydesk") ||
    lower.includes("teamviewer") ||
    lower.includes("install") ||
    lower.includes("screen share") ||
    lower.includes("infected") ||
    lower.includes("रिमोट") ||
    lower.includes("एनीडेस्क") ||
    lower.includes("टीमव्यूअर") ||
    lower.includes("स्क्रीन एक्सेस") ||
    lower.includes("वायरस")
  ) {
    signals.push("Technical-support impersonation");
    signals.push("Requests to install software / share screen");
    addedScore += 55;
    category = "Tech Support Scam";
    intent = "Coercing target to install remote access software";
  } else if (
    lower.includes("gift card") ||
    lower.includes("apple card") ||
    lower.includes("crypto") ||
    lower.includes("wire transfer") ||
    lower.includes("गिफ्ट कार्ड") ||
    lower.includes("क्रिप्टो")
  ) {
    signals.push("Unusual payment instructions");
    signals.push("Irreversible payment demand");
    addedScore += 50;
    category = "Financial Fraud";
    intent = "Demanding untraceable payment method";
  } else if (
    lower.includes("prize") ||
    lower.includes("lottery") ||
    lower.includes("grand prize") ||
    lower.includes("won $") ||
    lower.includes("sweepstakes") ||
    lower.includes("लॉटरी") ||
    lower.includes("इनाम") ||
    lower.includes("कैश प्राइज") ||
    lower.includes("लाख रुपये")
  ) {
    signals.push("Prize / reward claims");
    signals.push("Unsolicited windfall");
    addedScore += 40;
    category = "Prize / Advance Fee Scam";
    intent = "Claiming recipient won an unsolicited prize";
  }

  // Intermediate signals (Raises risk to MEDIUM, but not instant BLOCK without critical signal)
  if (
    lower.includes("bank") ||
    lower.includes("punjab national") ||
    lower.includes("pnb") ||
    lower.includes("wells fargo") ||
    lower.includes("chase") ||
    lower.includes("fraud prevention") ||
    lower.includes("security department") ||
    lower.includes("बैंक") ||
    lower.includes("खाता") ||
    lower.includes("अकाउंट") ||
    lower.includes("सिक्योरिटी") ||
    lower.includes("डेबिट कार्ड")
  ) {
    signals.push("Bank / Financial institution reference");
    if (!claimedOrganization) {
      claimedOrganization = lower.includes("punjab") ? "Punjab National Bank" : "Financial Institution";
    }
    if (signals.length <= 2 && !matchedExpected) addedScore += 15;
    if (category === "General Inquiry") category = "Banking / Financial Inquiry";
    if (!intent.includes("harvest") && !intent.includes("solicit"))
      intent = "Claiming bank or account inquiry";
  }

  // E-Commerce / Amazon handling
  if (
    lower.includes("amazon") ||
    lower.includes("अमेज़न") ||
    lower.includes("अमेजन") ||
    lower.includes("delivery") ||
    lower.includes("parcel") ||
    lower.includes("पार्सल")
  ) {
    signals.push("E-commerce / Delivery inquiry");
    if (category === "General Inquiry") category = "E-Commerce Account Inquiry";
    if (!intent.includes("harvest") && !intent.includes("solicit")) {
      intent = "Caller claims to be from Amazon or delivery regarding account or parcel";
      addedScore += 10;
    }
  }

  if (
    lower.includes("suspicious activity") ||
    lower.includes("unauthorized charge") ||
    lower.includes("account blocked") ||
    lower.includes("account frozen") ||
    lower.includes("संदिग्ध") ||
    lower.includes("अनधिकृत") ||
    lower.includes("फ्रीज") ||
    lower.includes("ब्लॉक")
  ) {
    signals.push("Account security claim / urgency indicator");
    addedScore += 15;
    stage = "VERIFICATION";
  }
  if (
    lower.includes("urgent") ||
    lower.includes("immediately") ||
    lower.includes("right now") ||
    lower.includes("arrest") ||
    lower.includes("lawsuit") ||
    lower.includes("police") ||
    lower.includes("तुरंत") ||
    lower.includes("अभी") ||
    lower.includes("जल्दी") ||
    lower.includes("पुलिस")
  ) {
    signals.push("Artificial urgency or threat pressure");
    addedScore += 25;
  }

  // Legitimate work/personal signals (Reduces risk)
  if (
    lower.includes("project") ||
    lower.includes("presentation") ||
    lower.includes("meeting") ||
    lower.includes("slide deck") ||
    lower.includes("rahul") ||
    lower.includes("david") ||
    lower.includes("confirm the time") ||
    lower.includes("lunch") ||
    lower.includes("internship") ||
    lower.includes("प्रोजेक्ट") ||
    lower.includes("प्रेजेंटेशन") ||
    lower.includes("मीटिंग") ||
    lower.includes("राहुल") ||
    lower.includes("इंटरनशिप") ||
    lower.includes("कन्फर्म")
  ) {
    signals.push("Legitimate personal / business context");
    signals.push("No sensitive data requested");
    addedScore -= 15;
    category = "Business / Personal Discussion";
    intent = "Discussing scheduled business project or meeting";
  }

  const newScore = Math.min(100, Math.max(5, currentScore + addedScore));
  let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";
  let action: "CONNECT" | "SCREEN_FURTHER" | "BLOCK" = "SCREEN_FURTHER";
  let isFinal = false;

  if (newScore >= 71) {
    riskLevel = "HIGH";
    action = "BLOCK";
    isFinal = true;
    stage = "FINAL_DECISION";
  } else if (newScore <= 30 && historyCount >= 1) {
    riskLevel = "LOW";
    action = "CONNECT";
    isFinal = true;
    stage = "FINAL_DECISION";
  } else if (newScore > 30 && newScore <= 70) {
    riskLevel = "MEDIUM";
    action = "SCREEN_FURTHER";
    stage = "VERIFICATION";
  }

  // Natural responses adapted to selected language
  let responseText = "";
  if (language === "hi") {
    if (action === "BLOCK") {
      responseText = "सुरक्षा कारणों और संदिग्ध फ्रॉड रिस्क के चलते यह कॉल ब्लॉक की जा रही है। धन्यवाद।";
    } else if (action === "CONNECT") {
      responseText = "आपकी पहचान और कॉल का उद्देश्य सत्यापित हो गया है। कॉल कनेक्ट की जा रही है, कृपया लाइन पर बने रहें।";
    } else if (lower.includes("otp") || lower.includes("पासवर्ड") || lower.includes("ओटीपी")) {
      responseText = "कॉल-गार्ड सुरक्षा नीति के तहत किसी भी फोन कॉल पर ओटीपी या पासवर्ड साझा करना वर्जित है। कृपया अपनी आधिकारिक पहचान स्पष्ट करें।";
    } else if (lower.includes("bank") || lower.includes("account") || lower.includes("बैंक") || lower.includes("खाता")) {
      responseText = "मैं समझ गया कि आप बैंक खाते के संबंध में बात कर रहे हैं। क्या इस बारे में किसी पासवर्ड या वित्तीय ट्रांजेक्शन की मांग की गई है?";
    } else if (lower.includes("anydesk") || lower.includes("remote") || lower.includes("teamviewer") || lower.includes("ऐप")) {
      responseText = "सुरक्षा नीति के अनुसार हम किसी भी रिमोट एक्सेस ऐप जैसे एनीडेस्क को डाउनलोड करने की अनुमति नहीं देते।";
    } else if (lower.includes("amazon") || lower.includes("अमेज़न") || lower.includes("अमेजन")) {
      responseText = "आप किस समस्या के संबंध में कॉल कर रहे हैं?";
    } else if (lower.includes("lottery") || lower.includes("लॉटरी") || lower.includes("इनाम") || lower.includes("प्राइज")) {
      responseText = "हम किसी भी अनपेक्षित लॉटरी या नकद पुरस्कार के लिए कोई अग्रिम शुल्क या फीस का भुगतान नहीं करते।";
    } else {
      responseText = "क्या आप कृपया अपने कॉल का उद्देश्य और अपनी आधिकारिक पहचान संक्षेप में बता सकते हैं?";
    }
  } else {
    if (action === "BLOCK") {
      responseText = "This call has been blocked due to high-risk fraud and credential-theft indicators. Goodbye.";
    } else if (action === "CONNECT") {
      responseText = "Thank you for confirming your identity. Connecting you to the recipient now. Please hold.";
    } else if (lower.includes("otp") || lower.includes("verification code")) {
      responseText = "CallGuard security policy prohibits sharing verification codes or passwords over the phone. Please state your official reason for calling.";
    } else if (lower.includes("bank") || lower.includes("account")) {
      responseText = "I understand you are calling about an account. Did this notification ask for any verification codes, passwords, or payments?";
    } else {
      responseText = "Could you please provide a few more details regarding your identity and the purpose of this call?";
    }
  }

  return {
    riskScore: newScore,
    riskLevel,
    intent,
    category,
    signals: signals.length > 0 ? signals : ["Routine caller statement"],
    explanation:
      newScore >= 71
        ? "The caller exhibited explicit fraud patterns such as credential requests or unauthorized software installation."
        : newScore <= 30
        ? "Caller provided consistent, benign context with zero security or credential threats."
        : "Caller purpose is unverified or involves sensitive topics; additional screening required.",
    recommendedAction: action,
    nextQuestion: responseText,
    responseText,
    responseTextHindi: language === "hi" ? responseText : undefined,
    isFinal,
    conversationStage: stage,
    unansweredQuestions: action === "SCREEN_FURTHER" ? ["Verified caller identity", "Specific nature of request"] : [],
    claimedOrganization: claimedOrganization || undefined,
    contextMatch: matchedExpected
      ? {
          matched: true,
          organization: matchedExpected.organization,
          reason: matchedExpected.reason,
          notes: "Supporting signal only. Does not guarantee caller legitimacy.",
        }
      : undefined,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "30mb" }));

  // 1. Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      gnaniConfigured: !!process.env.GNANI_API_KEY,
      timestamp: new Date().toISOString(),
    });
  });

  // Gnani AI Voice status endpoint
  app.get("/api/gnani/status", (req, res) => {
    const configured = !!process.env.GNANI_API_KEY;
    res.json({
      configured,
      provider: configured ? "gnani" : "browser-fallback",
      sttModel: "Gnani Prisma STT (v3)",
      ttsModel: "Gnani Timbre TTS (v2.5)",
      languageSupport: ["hi-IN", "en-IN", "Hinglish code-switching"],
      message: configured
        ? "Gnani AI voice processing engine active for Hindi/Hinglish."
        : "Gnani API key not configured. Using high-accuracy browser voice fallback.",
    });
  });

  // Gnani Prisma Speech-to-Text (STT) proxy endpoint
  // Secure server-side proxy keeping GNANI_API_KEY safe
  app.post("/api/gnani/stt", async (req, res) => {
    try {
      const apiKey = process.env.GNANI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          success: false,
          error: "GNANI_API_KEY is not configured on the server",
          fallback: true,
        });
      }

      const { audioBase64, mimeType = "audio/webm", languageCode = "hi-IN" } = req.body || {};
      if (!audioBase64) {
        return res.status(400).json({ success: false, error: "Missing audioBase64 audio payload" });
      }

      const audioBuffer = Buffer.from(audioBase64, "base64");
      const extension = mimeType.includes("wav") ? "wav" : mimeType.includes("ogg") ? "ogg" : "webm";
      const blob = new Blob([audioBuffer], { type: mimeType });

      const formData = new FormData();
      formData.append("audio_file", blob, `input.${extension}`);
      formData.append("language_code", languageCode);

      const gnaniRes = await fetch("https://api.vachana.ai/stt/v3", {
        method: "POST",
        headers: {
          "X-API-Key-ID": apiKey,
        },
        body: formData,
      });

      if (!gnaniRes.ok) {
        const errText = await gnaniRes.text().catch(() => "");
        console.warn(`Gnani STT API error (HTTP ${gnaniRes.status}):`, errText);
        return res.status(gnaniRes.status).json({
          success: false,
          error: `Gnani STT returned HTTP ${gnaniRes.status}: ${errText || "Transcription request failed"}`,
          fallback: true,
        });
      }

      const data = (await gnaniRes.json()) as any;
      const transcript =
        data.transcript ||
        data.text ||
        (Array.isArray(data.results) ? data.results[0]?.transcript : "") ||
        "";

      res.json({
        success: true,
        transcript: transcript.trim(),
        provider: "gnani",
        raw: data,
      });
    } catch (error: any) {
      console.error("Gnani STT proxy error:", error);
      res.status(500).json({
        success: false,
        error: error?.message || "Internal error communicating with Gnani STT",
        fallback: true,
      });
    }
  });

  // Gnani Timbre Text-to-Speech (TTS) proxy endpoint
  // Secure server-side proxy keeping GNANI_API_KEY safe
  app.post("/api/gnani/tts", async (req, res) => {
    try {
      const apiKey = process.env.GNANI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          success: false,
          error: "GNANI_API_KEY is not configured on the server",
          fallback: true,
        });
      }

      const { text, language = "hi", voice = "Nalini" } = req.body || {};
      if (!text || typeof text !== "string") {
        return res.status(400).json({ success: false, error: "Missing or invalid text parameter" });
      }

      const languageCode = language.startsWith("en") ? "en-IN" : "hi-IN";

      const gnaniRes = await fetch("https://api.vachana.ai/api/v1/tts/inference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key-ID": apiKey,
        },
        body: JSON.stringify({
          text: text.trim(),
          model: "timbre-v2.5",
          language: languageCode,
          voice,
          audio_config: {
            encoding: "linear_pcm",
            container: "wav",
            sample_rate: 24000,
          },
        }),
      });

      if (!gnaniRes.ok) {
        const errText = await gnaniRes.text().catch(() => "");
        console.warn(`Gnani TTS API error (HTTP ${gnaniRes.status}):`, errText);
        return res.status(gnaniRes.status).json({
          success: false,
          error: `Gnani TTS returned HTTP ${gnaniRes.status}: ${errText || "Synthesis request failed"}`,
          fallback: true,
        });
      }

      const arrayBuffer = await gnaniRes.arrayBuffer();
      const base64Audio = Buffer.from(arrayBuffer).toString("base64");
      const audioDataUrl = `data:audio/wav;base64,${base64Audio}`;

      res.json({
        success: true,
        audioDataUrl,
        provider: "gnani",
      });
    } catch (error: any) {
      console.error("Gnani TTS proxy error:", error);
      res.status(500).json({
        success: false,
        error: error?.message || "Internal error communicating with Gnani TTS",
        fallback: true,
      });
    }
  });

  // 2. Initial greeting endpoint
  app.post("/api/init-call", (req, res) => {
    const { callerName, callerNumber, language = "en" } = req.body || {};
    const greeting =
      language === "hi"
        ? "नमस्ते। आप कॉल-गार्ड स्क्रीनिंग असिस्टेंट से जुड़े हैं। क्या आप संक्षेप में बता सकते हैं कि आपने किस कारण से कॉल किया है?"
        : "Hello. You've reached the CallGuard screening assistant. Could you briefly tell me the reason for your call?";

    res.json({
      greeting,
      initialRiskScore: 5,
      initialRiskLevel: "LOW",
      status: "screening",
    });
  });

  // 3. Core Call Screening Analysis endpoint
  // Common Risk Engine for English, Hindi, and Hinglish with Expected Calls integration
  app.post("/api/screen", async (req, res) => {
    try {
      const {
        callerName = "Unknown Caller",
        callerNumber = "Unknown Number",
        history = [],
        userMessage = "",
        currentRiskScore = 5,
        language = "en",
        expectedCalls = [],
        userVerification = "UNAVAILABLE",
      } = req.body;

      if (!userMessage || typeof userMessage !== "string") {
        return res.status(400).json({ error: "Missing or invalid userMessage" });
      }

      const client = getGeminiClient();

      if (!client) {
        console.warn("GEMINI_API_KEY not configured. Using intelligent safety analyzer.");
        const fallback = analyzeLocally(
          userMessage,
          currentRiskScore,
          history.length,
          language === "hi" ? "hi" : "en",
          expectedCalls,
          userVerification
        );
        return res.json(fallback);
      }

      // Build context conversation prompt
      const formattedHistory = history
        .map(
          (t: { sender: string; text: string }) =>
            `${t.sender === "ai" ? "CallGuard AI" : "Caller"}: "${t.text}"`
        )
        .join("\n");

      const isHindi = language === "hi";

      const expectedCallsSummary =
        expectedCalls && expectedCalls.length > 0
          ? expectedCalls
              .map(
                (c: any) =>
                  `- Organization: "${c.organization}", Reason: "${c.reason}", Category: "${c.category || 'General'}"`
              )
              .join("\n")
          : "None registered.";

      const systemPrompt = `You are CallGuard AI, an elite adaptive cybersecurity call-screening assistant deployed on personal phones.
Your core mission:
Traditional caller ID tells WHO is calling. CallGuard AI understands WHY they are calling.
Screen incoming callers using conversational voice questioning, detect fraud/scam signals, dynamically adjust a risk score from 0 to 100, and decide whether to CONNECT, SCREEN_FURTHER, or BLOCK.

CORE RISK SCORING & ADAPTIVE RULES (UNIVERSAL COMMON RISK ENGINE):
1. Calibrated Risk Score (0–100):
   - 0–30 = LOW (Benign, legitimate, routine personal or verified business matters)
   - 31–70 = MEDIUM (Unverified identity, ambiguous claims, security topics requiring cautious investigation)
   - 71–100 = HIGH (Active threat, credential solicitation, coercive pressure, unauthorized access)

2. RISK EVOLVES GRADUALLY ACROSS TURNS:
   - Do NOT immediately score 90+ on the first turn unless an explicit critical credential/scam demand is made.
   - The same risk logic applies whether the caller speaks English, Hindi, or conversational Indian Hinglish.
   - Example evolution (English or Hindi):
     * Turn 1: "I'm calling about a problem with your bank account." / "Namaste, main aapke bank se bol raha hoon." -> Risk ~20-25 (LOW). Ask what kind of problem.
     * Turn 2: "We detected suspicious activity on your card." / "Aapke account mein suspicious activity hai." -> Risk ~40-45 (MEDIUM). Ask if any codes or payments were requested.
     * Turn 3: "Give me the OTP sent to your phone right now." / "Apna OTP bata dijiye." -> Risk 95 (HIGH). Recommend: BLOCK.
   - For legitimate calls:
     * Turn 1: "Hi, I'm Rahul from the project team regarding tomorrow's presentation." / "Main project team se Rahul baat kar raha hoon, kal ki presentation ke bare mein." -> Risk ~10-15 (LOW). Ask what time or specific detail.
     * Turn 2: "Just confirming we meet at 2 PM to review the deck." / "Haan kal 2 baje meeting confirm karni thi." -> Risk ~10 (LOW). Recommend: CONNECT.
     * NEVER penalize legitimate calls or mark them HIGH risk simply because they speak Hindi, Hinglish, or casual English!

3. CONTEXT-AWARE SIGNAL RECOGNITION (Taxonomy applies equally to all languages):
   • OTP request (OTP / ओटीपी / verification code / "share kar dijiye")
   • Password / PIN request (password / पासवर्ड / पिन / CVV)
   • Banking credential request
   • Payment request / Gift card request (gift cards / vouchers / wire)
   • Sensitive personal information request (SSN, Aadhaar, PAN, card details)
   • Urgency / Threats / Fear-based pressure (तुरंत / अभी / police / arrest)
   • Prize / reward claims / Unsolicited windfall (lottery / 25 lakh reward)
   • Bank impersonation (calling from bank fraud department)
   • Government impersonation (Police, Tax, Customs, Border Control)
   • Technical-support impersonation / Remote access (AnyDesk, TeamViewer, virus alert)
   • Legitimate personal context
   • Routine business context

4. FALSE POSITIVE PREVENTION & E-COMMERCE CONTEXT (AMAZON EXAMPLE):
   - Do NOT automatically block every number that is reported as spam or mentions a major brand.
   - Number reputation is only one potential signal: Reputation + Conversation analysis + Caller intent + Explicit signals -> Final decision.
   - Example (Amazon / Delivery):
     * Caller: "Main Amazon se bol raha hoon." -> Understand context, ask: "आप किस समस्या के संबंध में कॉल कर रहे हैं?" -> Risk remains LOW (~15-20).
     * Caller: "Aapke account mein security issue hai." -> Cautious investigation, ask: "क्या आपको कोई अनधिकृत ट्रांजेक्शन दिखा है?" -> Risk MEDIUM (~35-45).
     * Caller: "Verification ke liye OTP share kar dijiye." -> Critical credential theft! Risk jumps to HIGH (90-95). Recommended Action: BLOCK.
     * If the caller is just confirming an address or order details without asking for credentials, keep risk LOW and CONNECT!

${
  isHindi
    ? `HINDI & HINGLISH LANGUAGE REQUIREMENTS:
- Active Language Mode: HINDI / INDIAN HINGLISH (हिंदी)
- The caller may speak pure Hindi (in Devanagari or Romanized script), pure English, or mixed natural Indian Hinglish (e.g. "Main bank ke fraud team se bol raha hoon", "Aapka account verify karna hai", "Main ek internship ke regarding call kar raha hoon", "OTP share karna padega").
- Understand Hindi, Hinglish, and English with high semantic precision. Do NOT force the caller to use pure textbook Hindi.
- CRITICAL FOR VOICE SYNTHESIS: Generate 'responseText' and 'nextQuestion' in natural, fluent, conversational Hindi (in clear Devanagari script with natural loan words like 'कॉल', 'वेरिफिकेशन', 'अकाउंट' where culturally standard) so that the Indian Hindi TTS voice pronounces it authentically.
- DO NOT provide a rigid or awkward mechanical translation. It must sound like an authentic, polite, professional Hindi assistant.
- ERROR / LOW CONFIDENCE HANDLING: If speech is unclear, muffled, or ambiguous, DO NOT immediately classify as HIGH RISK. Politely ask for clarification in Hindi: e.g. "माफ़ कीजिए, आपकी बात ठीक से समझ नहीं आई। क्या आप दोबारा बता सकते हैं कि आप किस बारे में कॉल कर रहे हैं?"
- IF RECOMMENDING BLOCK (Risk >= 71): State calmly and politely in Hindi that the call is blocked due to detected security threats, and conclude the call (e.g., "सुरक्षा कारणों और फ्रॉड रिस्क के चलते यह कॉल ब्लॉक की जा रही है। नमस्ते।").
- IF RECOMMENDING CONNECT (Risk <= 30): State in Hindi that caller purpose is verified and connect the call (e.g., "आपकी पहचान और कॉल का उद्देश्य सत्यापित हो गया है। कॉल कनेक्ट की जा रही है, कृपया प्रतीक्षा करें।").
- Analytical fields ('intent', 'category', 'signals', 'explanation') must remain in clear English so the user's unified security dashboard and risk analytics remain consistent and comparable across languages.`
    : `ENGLISH LANGUAGE REQUIREMENTS:
- Generate 'responseText' and 'nextQuestion' in concise, natural, polite English (1-2 sentences) optimized for phone Text-to-Speech synthesis.
- If BLOCK: State calmly that the call is blocked due to detected security risks, and say goodbye.
- If CONNECT: State that CallGuard is connecting them to the recipient now.
- If SCREEN_FURTHER: Ask the most direct, natural question to uncover their true motive.`
}

4. ACTIONS:
   - 'CONNECT': Used when caller purpose is verified as benign and legitimate (risk <= 30).
   - 'SCREEN_FURTHER': Used when more details are required (risk 31–70, or early turn).
   - 'BLOCK': Used when critical fraud signals or credential theft are present (risk >= 71).
   - 'isFinal': Set to true only for 'BLOCK' or 'CONNECT'.`;

      const userPrompt = `Caller ID: ${callerName} (${callerNumber})
Selected Language: ${isHindi ? "Hindi / Indian Hinglish (हिंदी)" : "English"}
Current Risk Score: ${currentRiskScore}
Previous Conversation:
${formattedHistory || "(No prior conversation - call just started)"}

New Caller Utterance:
"${userMessage}"

${
  isHindi
    ? "IMPORTANT: You MUST generate 'responseText' and 'nextQuestion' in natural conversational Hindi (in Devanagari script, e.g. 'नमस्ते...', 'क्या आप...'). Do not return responseText in English."
    : ""
}
Analyze this caller's response and return your structured assessment.`;

      let responseTextRaw = "";
      const modelsToTry = ["gemini-3.1-flash-lite", "gemini-3.8-flash"];

      for (const model of modelsToTry) {
        try {
          const response = await client.models.generateContent({
            model,
            contents: userPrompt,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.2,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  riskScore: {
                    type: Type.INTEGER,
                    description: "Numerical risk score between 0 and 100",
                  },
                  riskLevel: {
                    type: Type.STRING,
                    description: "Risk tier: 'LOW', 'MEDIUM', or 'HIGH'",
                  },
                  intent: {
                    type: Type.STRING,
                    description: "Succinct description of what caller is attempting to accomplish",
                  },
                  category: {
                    type: Type.STRING,
                    description:
                      "Category such as 'Credential Theft', 'Bank Impersonation', 'Prize Scam', 'Tech Support Scam', 'Project Inquiry', etc.",
                  },
                  signals: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "List of detected risk or legitimacy signals",
                  },
                  explanation: {
                    type: Type.STRING,
                    description: "Clear rationale for the risk evaluation",
                  },
                  recommendedAction: {
                    type: Type.STRING,
                    description: "Screening recommendation: must be 'CONNECT', 'SCREEN_FURTHER', or 'BLOCK'",
                  },
                  nextQuestion: {
                    type: Type.STRING,
                    description: isHindi
                      ? "The specific adaptive question in Hindi (Devanagari script) CallGuard should speak next"
                      : "The specific adaptive question or statement CallGuard should speak next",
                  },
                  responseText: {
                    type: Type.STRING,
                    description: isHindi
                      ? "Exact spoken Hindi text (in Devanagari script) for the AI voice to speak to the caller"
                      : "Exact text for the AI voice to speak to the caller right now",
                  },
                  isFinal: {
                    type: Type.BOOLEAN,
                    description: "True if screening is concluded (call connected or blocked)",
                  },
                  conversationStage: {
                    type: Type.STRING,
                    description: "'INITIAL', 'DISCOVERY', 'VERIFICATION', or 'FINAL_DECISION'",
                  },
                  unansweredQuestions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Key facts still needed if screening is continuing",
                  },
                },
                required: [
                  "riskScore",
                  "riskLevel",
                  "intent",
                  "category",
                  "signals",
                  "explanation",
                  "recommendedAction",
                  "nextQuestion",
                  "responseText",
                  "isFinal",
                ],
              },
            },
          });

          if (response.text) {
            responseTextRaw = response.text;
            break;
          }
        } catch (_err) {
          // Fallback gracefully on next iteration or local safety engine
        }
      }

      if (!responseTextRaw) {
        throw new Error("All Gemini models unavailable, reverting to safety engine");
      }

      const parsed = JSON.parse(responseTextRaw);

      // Clamp risk score to valid range
      parsed.riskScore = Math.max(0, Math.min(100, Number(parsed.riskScore) || 5));
      if (parsed.riskScore >= 71) {
        parsed.riskLevel = "HIGH";
        parsed.recommendedAction = "BLOCK";
        parsed.isFinal = true;
      } else if (parsed.riskScore >= 31) {
        parsed.riskLevel = "MEDIUM";
        parsed.recommendedAction = "SCREEN_FURTHER";
        parsed.isFinal = false;
      } else {
        parsed.riskLevel = "LOW";
        if (history.length >= 2) {
          parsed.recommendedAction = "CONNECT";
          parsed.isFinal = true;
        } else {
          parsed.recommendedAction = "SCREEN_FURTHER";
          parsed.isFinal = false;
        }
      }

      if (isHindi) {
        const hasDevanagari = /[\u0900-\u097F]/.test(parsed.responseText || "");
        if (!hasDevanagari) {
          if (parsed.recommendedAction === "BLOCK") {
            parsed.responseText = "सुरक्षा कारणों और फ्रॉड रिस्क के चलते यह कॉल ब्लॉक की जा रही है। नमस्ते।";
            parsed.nextQuestion = parsed.responseText;
          } else if (parsed.recommendedAction === "CONNECT") {
            parsed.responseText = "आपकी पहचान और कॉल का उद्देश्य सत्यापित हो गया है। कॉल कनेक्ट की जा रही है, कृपया प्रतीक्षा करें।";
            parsed.nextQuestion = parsed.responseText;
          } else {
            parsed.responseText = "क्या आप कृपया अपने कॉल का उद्देश्य और पहचान थोड़ा और स्पष्ट कर सकते हैं?";
            parsed.nextQuestion = parsed.responseText;
          }
        }
        parsed.responseTextHindi = parsed.responseText;
      }

      res.json(parsed);
    } catch (error: any) {
      console.error("Error in /api/screen:", error);
      const fallback = analyzeLocally(
        req.body?.userMessage || "",
        req.body?.currentRiskScore || 5,
        req.body?.history?.length || 0,
        req.body?.language === "hi" ? "hi" : "en",
        req.body?.expectedCalls || [],
        req.body?.userVerification || "UNAVAILABLE"
      );
      res.json({
        ...fallback,
        explanation: `${fallback.explanation} (Note: Analyzed via common safety engine)`,
      });
    }
  });

  // Vite middleware for development vs static production serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CallGuard AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
