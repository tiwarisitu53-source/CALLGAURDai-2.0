import { DemoScenario } from '../types';

export const SIMULATION_SCENARIOS: DemoScenario[] = [
  {
    id: 'pnb-credit-card-demo',
    title: 'Punjab National Bank (Context Match → OTP Threat)',
    titleHindi: 'पंजाब नेशनल बैंक (कॉन्टेक्स्ट मैच → OTP फ्रॉड)',
    tag: 'Context Match Demo',
    callerType: 'Financial Impersonator with Expected Context',
    riskExpectation: 'HIGH',
    callerIdentity: 'Punjab National Bank (Vivek Khand Branch)',
    callerIdentityHindi: 'पंजाब नेशनल बैंक (विवेक खंड शाखा)',
    callerNumber: '+91 98210 99887',
    expectedOrganization: 'Punjab National Bank',
    expectedReason: 'Credit card application',
    description:
      'Demonstrates why expected context is only supporting evidence. The caller matches an expected credit card application call (initial LOW risk 18), but later demands an OTP, causing risk to escalate 18 → 34 → 82.',
    descriptionHindi:
      'यह दर्शाता है कि कॉन्टेक्स्ट मैच सिर्फ सहायक साक्ष्य है। कॉलर अपेक्षित क्रेडिट कार्ड आवेदन से मेल खाता है (प्रारंभिक रिस्क 18), लेकिन बाद में OTP मांगता है जिससे रिस्क 18 → 34 → 82 हो जाता है।',
    simulatedTurns: [
      "I'm calling from Punjab National Bank regarding your credit card application.",
      "I have your application details here from the portal. I just need to verify a few routine details before moving it forward.",
      "To complete the verification and disburse the card, I need the 6-digit OTP that was just sent to your phone.",
    ],
    simulatedTurnsHindi: [
      "नमस्ते, मैं पंजाब नेशनल बैंक से आपके क्रेडिट कार्ड आवेदन के संबंध में बात कर रहा हूँ।",
      "पोर्टल पर आपके आवेदन का विवरण दर्ज है। आगे की प्रक्रिया पूरी करने से पहले मुझे कुछ सामान्य जानकारी सत्यापित करनी है।",
      "वेरिफिकेशन पूरा करने और कार्ड जारी करने के लिए, आपके फोन पर जो 6 अंकों का OTP आया है, कृपया वह बता दीजिए।",
    ],
  },
  {
    id: 'legitimate-project',
    title: 'Legitimate Project Team Call',
    titleHindi: 'वैध प्रोजेक्ट टीम कॉल (सुरक्षित)',
    tag: 'Safe Caller',
    callerType: 'Colleague / Internal Team',
    riskExpectation: 'LOW',
    callerIdentity: 'Rahul Sharma (Project Lead)',
    callerIdentityHindi: 'राहुल शर्मा (प्रोजेक्ट लीड)',
    callerNumber: '+91 98201 54321',
    description:
      'Colleague calling to confirm tomorrow afternoon’s AI project presentation time and review the live demo slide deck.',
    descriptionHindi:
      'सहकर्मी कल दोपहर की AI प्रेजेंटेशन का समय कन्फर्म करने और स्लाइड डेक रिव्यू करने के लिए कॉल कर रहे हैं।',
    simulatedTurns: [
      "Hi, I'm Rahul from the project team. I wanted to discuss tomorrow's presentation.",
      "Yes, I just wanted to confirm if our presentation time is still set for 2 PM and whether we should review the slide deck beforehand.",
      "Sounds great! That works perfectly. Connect me through whenever you have a moment.",
    ],
    simulatedTurnsHindi: [
      "नमस्ते, मैं प्रोजेक्ट टीम से राहुल बात कर रहा हूँ। मुझे कल की प्रेजेंटेशन के बारे में बात करनी थी।",
      "हाँ, मैं बस कन्फर्म करना चाहता था कि क्या हमारी मीटिंग कल दोपहर 2 बजे ही है, और क्या हमें पहले स्लाइड डेक रिव्यू करना चाहिए?",
      "बिल्कुल सही! सब कुछ तैयार है। जब भी समय मिले, कॉल कनेक्ट कर दीजिए।",
    ],
  },
  {
    id: 'bank-otp-scam',
    title: 'Bank Security & OTP Theft Scam',
    titleHindi: 'बैंक सिक्योरिटी और OTP चोरी फ्रॉड (हाई रिस्क)',
    tag: 'Credential Theft',
    callerType: 'Financial Impersonator',
    riskExpectation: 'HIGH',
    callerIdentity: 'Wells Chase Security Dept',
    callerIdentityHindi: 'बैंक सिक्योरिटी डिपार्टमेंट (नकली)',
    callerNumber: '+91 98210 99887',
    description:
      'Impersonates bank fraud prevention. Claims suspicious transactions and creates urgency, demanding the 6-digit one-time passcode.',
    descriptionHindi:
      'बैंक अधिकारी बनकर संदिग्ध ट्रांजेक्शन का डर दिखाता है और फोन पर आए 6 अंकों के OTP की तुरंत मांग करता है।',
    simulatedTurns: [
      "I'm calling about an urgent security problem with your bank account.",
      "We detected suspicious unauthorized charges of $1,420 originating from overseas.",
      "To prevent immediate account freeze, I need you to provide the 6-digit OTP verification code sent to your phone right now.",
    ],
    simulatedTurnsHindi: [
      "नमस्ते, मैं आपके बैंक के सिक्योरिटी डिपार्टमेंट से बोल रहा हूँ। आपके अकाउंट में एक अर्जेंट सिक्योरिटी प्रॉब्लम है।",
      "हमने आपके डेबिट कार्ड पर विदेश से एक संदिग्ध अनधिकृत ट्रांजेक्शन डिटेक्ट किया है।",
      "अकाउंट तुरंत फ्रीज होने से बचाने के लिए, आपके फोन पर जो 6 अंकों का OTP आया है, वह वेरिफिकेशन के लिए अभी बता दीजिए।",
    ],
  },
  {
    id: 'prize-reward-scam',
    title: 'Unsolicited Prize & Gift Card Scam',
    titleHindi: 'नकली लॉटरी और गिफ्ट कार्ड फ्रॉड (हाई रिस्क)',
    tag: 'Financial Fraud',
    callerType: 'Sweepstakes Impersonator',
    riskExpectation: 'HIGH',
    callerIdentity: 'National Cash Reward Center',
    callerIdentityHindi: 'नेशनल रिवॉर्ड सेंटर (नकली)',
    callerNumber: '+91 91234 56789',
    description:
      'Claims recipient won a $25,000 cash sweepstakes, but requires upfront payment or gift cards to release the funds.',
    descriptionHindi:
      'बड़ी लॉटरी जीतने का झूठा दावा करता है और प्राइज मनी रिलीज करने के नाम पर अग्रिम शुल्क या गिफ्ट कार्ड मांगता है।',
    simulatedTurns: [
      "Congratulations! You've been selected as the grand prize winner in our nationwide sweepstakes.",
      "You have won a $25,000 cash reward that is ready for immediate courier dispatch.",
      "To release your cash prize, we just need a one-time verification fee of $150 paid via Apple gift card or wire transfer.",
    ],
    simulatedTurnsHindi: [
      "बधाई हो! आपको हमारे ऑल-इंडिया लकी ड्रा में 25 लाख रुपये के ग्रांड प्राइज विनर के रूप में चुना गया है।",
      "यह कैश प्राइज आपके पते पर कूरियर डिस्पैच के लिए पूरी तरह से तैयार है।",
      "प्राइज रिलीज करने के लिए आपको सिर्फ 1,500 रुपये की एक छोटी सी वेरिफिकेशन फीस या गिफ्ट कार्ड देना होगा।",
    ],
  },
  {
    id: 'tech-support-scam',
    title: 'Urgent Tech Support & Remote Access',
    titleHindi: 'नकली टेक सपोर्ट और एनीडेस्क रिमोट फ्रॉड (हाई रिस्क)',
    tag: 'Malware Coercion',
    callerType: 'Tech Support Impersonator',
    riskExpectation: 'HIGH',
    callerIdentity: 'Windows Security Defense Center',
    callerIdentityHindi: 'विंडोज सिक्योरिटी सपोर्ट (नकली)',
    callerNumber: '+91 97110 88234',
    description:
      'Claims your computer is infected with viruses, demanding you download remote desktop software to give them screen control.',
    descriptionHindi:
      'कंप्यूटर में वायरस होने का दावा करके AnyDesk या TeamViewer जैसे रिमोट सॉफ्टवेयर डाउनलोड करने का दबाव बनाता है।',
    simulatedTurns: [
      "Hello, this is technical support. Our security telemetry detected that your computer has been infected with malicious trojans.",
      "Your personal files and banking details are at immediate risk of corruption.",
      "You must install our remote desktop support software right now so our technician can access your screen and clean the infection.",
    ],
    simulatedTurnsHindi: [
      "हेलो, मैं टेक्निकल सपोर्ट से बात कर रहा हूँ। हमारे सिस्टम ने डिटेक्ट किया है कि आपके कंप्यूटर में खतरनाक वायरस आ गया है।",
      "आपकी पर्सनल फाइल्स और बैंकिंग डिटेल्स तुरंत करप्ट होने के गंभीर खतरे में हैं।",
      "आपको अभी हमारा रिमोट सॉफ्टवेयर AnyDesk इनस्टॉल करना होगा ताकि हम स्क्रीन एक्सेस करके वायरस हटा सकें।",
    ],
  },
  {
    id: 'normal-business-call',
    title: 'Normal Business & Meeting Follow-up',
    titleHindi: 'सामान्य बिजनेस मीटिंग फॉलो-अप (सुरक्षित)',
    tag: 'Routine Business',
    callerType: 'Business Associate',
    riskExpectation: 'LOW',
    callerIdentity: 'Elena Rostova (Apex Partners)',
    callerIdentityHindi: 'एलेना रोस्तोवा (बिजनेस पार्टनर)',
    callerNumber: '+91 22 6123 4567',
    description:
      'External business partner checking in to verify agenda items and room links for tomorrow’s scheduled partnership review.',
    descriptionHindi:
      'बिजनेस पार्टनर कल की मीटिंग का एजेंडा और वीडियो लिंक कन्फर्म करने के लिए कॉल कर रहे हैं।',
    simulatedTurns: [
      "Hello, I'm calling regarding the partnership meeting scheduled for tomorrow.",
      "I wanted to confirm the presentation time and make sure we have the updated calendar invite and room link.",
      "No other requests! Just wanted to ensure we are aligned before tomorrow morning. Thank you.",
    ],
    simulatedTurnsHindi: [
      "नमस्ते, मैं कल होने वाली पार्टनरशिप रिव्यू मीटिंग के सिलसिले में कॉल कर रही हूँ।",
      "मैं बस यह कन्फर्म करना चाहती थी कि क्या आपको अपडेटेड मीटिंग लिंक और कैलेंडर इनवाइट मिल गया है?",
      "और कोई बात नहीं है! बस कल सुबह की मीटिंग से पहले सब कुछ अलाइन करना था। धन्यवाद।",
    ],
  },
];
