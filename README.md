# 🛡️ CallGuard AI

### **Don't just identify the caller. Understand the conversation.**

CallGuard AI is a **context-aware conversational security layer for phone calls**.

Instead of relying only on caller reputation or a fixed spam list, CallGuard evaluates:

* 🗣️ What the caller is saying
* 🎯 Why they are calling
* 👤 What the user is expecting
* ⚠️ Suspicious behavioral signals
* 📈 How risk changes throughout the conversation

The goal is simple:

> **A caller who looks safe at first should not remain trusted if their behavior becomes suspicious later.**

---

## 🚨 The Problem

Modern scam calls are becoming more convincing.

A scammer can:

* use a new/unreported number
* impersonate a trusted organization
* provide correct information
* behave normally during the first few seconds
* avoid obvious scam keywords
* start the actual scam only after gaining the victim's trust

Therefore, **caller ID alone is not enough**.

---

## 💡 Our Approach

CallGuard combines three sources of evidence:

```text
Caller Reputation
       +
Conversation Intelligence
       +
User Context
       ↓
   Risk Engine
       ↓
LOW / MEDIUM / HIGH
       ↓
CONNECT / SCREEN FURTHER / BLOCK
       ↓
Continuous Monitoring
```

### Our core principle

> **No single signal is treated as proof of trust.**

Even a familiar organization, a clean phone number, or a matching expected call does not automatically mean the caller is legitimate.

---

# ⭐ What Makes CallGuard Different?

We don't claim that AI call screening is new.

Products such as **Google Call Screen, Truecaller Assistant, Samsung Call Screening, Hiya Call Screener and Apple's Call Screening** already address parts of this problem.

Our focus is different:

### **Context + Conversation + Continuous Risk**

Instead of asking only:

> **“Is this number suspicious?”**

CallGuard asks:

> **“Does this conversation make sense for this user, and does the caller's behavior continue to remain safe?”**

---

## 👤 1. Expected Calls

Users can optionally tell CallGuard what interactions they are expecting.

Example:

```text
Organization: Punjab National Bank
Purpose: Credit Card Application
Category: Banking
```

If a caller claims to be from PNB about the application, the context can support the assessment.

### But:

**Context match ≠ identity verification.**

A scammer who knows the user's application details can still be dangerous.

---

# 🧠 2. Adaptive Conversational Screening

CallGuard does not depend on one fixed questionnaire.

The conversation can adapt according to what the caller says.

For example:

```text
Caller:
"I'm calling regarding your bank account."

        ↓

AI:
"Could you explain the reason for the call?"

        ↓

Caller:
"We need to complete verification."

        ↓

AI:
"What type of verification is required?"

        ↓

Caller:
"Please provide the OTP you received."
```

The new information changes the risk assessment.

---

# 📈 3. Continuous Risk Monitoring

### Trust is reversible.

A caller may initially appear legitimate and become suspicious later.

Example:

```text
Initial screening       → 18  LOW
More information        → 34  MEDIUM
OTP request             → 82  HIGH
```

CallGuard therefore does not permanently mark a caller as safe after the first screening.

> **A safe first 30 seconds does not guarantee a safe conversation.**

---

# 🛡️ 4. User Verification Layer

When the caller claims something important, CallGuard can ask the user for confirmation.

Example:

> **Caller claims:** Punjab National Bank
> **Purpose:** Credit Card Verification
> **Are you expecting this call?**

Options:

* YES
* NO
* I'M NOT SURE

If the user does not respond:

> **UNKNOWN — never automatically treated as YES.**

User confirmation is also treated as a **supporting signal**, not absolute proof.

---

# 🌐 5. Hindi & Hinglish Voice Support

India has diverse accents, languages and speaking styles.

CallGuard supports Hindi/Hinglish voice interaction through an Indian-focused speech layer while keeping the same risk engine.

The system is designed to handle:

* Hindi
* Hinglish
* Code-switching
* Different accents
* Unclear speech
* Low speech-recognition confidence

If speech confidence is low, the system can ask the caller to repeat instead of immediately making a high-risk decision.

---

# 🔄 Complete Flow

```text
Incoming / Unknown Caller
          ↓
Voice Screening
          ↓
Speech Recognition
          ↓
Conversation Intelligence
          ↓
Expected User Context
          ↓
Risk Signals
          ↓
Risk Engine
          ↓
LOW / MEDIUM / HIGH
          ↓
Connect / Screen Further / Block
          ↓
Continuous Monitoring
          ↓
Final Risk & Explanation
          ↓
Dashboard
```

---

# ⚠️ Edge Cases

CallGuard is designed around real-world failure scenarios rather than only ideal demonstrations.

### Caller Behavior

* Scammer behaves normally during initial screening
* Scammer changes intent after connection
* Caller avoids obvious scam keywords
* Caller lies
* Caller provides partially correct information
* Caller changes their story
* Caller creates urgency or emotional pressure
* Caller requests OTP/PIN/password/payment later
* Caller asks the AI to ignore its instructions
* Caller attempts to manipulate the AI

### Identity

* Caller claims to represent a bank/company/government
* Caller knows real personal information
* Caller knows the user's application details
* Caller matches an expected organization
* Legitimate organization calls from an unexpected number
* New or previously unreported number

### User Availability

* User is busy
* User is unavailable
* User does not respond to verification
* User responds late
* User is unsure

**No response = UNKNOWN, never YES.**

### Voice & Language

* Indian accents
* Hindi/Hinglish
* Code-switching
* Background noise
* Fast speech
* Unclear speech
* Speech-recognition errors

### AI & Risk

* AI misunderstands a sentence
* Legitimate caller sounds suspicious
* Scam caller initially sounds legitimate
* Risk changes during conversation
* Single keyword creates false suspicion
* New scam pattern is not known beforehand
* AI/API becomes unavailable

### Privacy & Security

* API key exposure
* Sensitive information in conversations
* Unnecessary audio storage
* Malicious caller input
* Prompt injection
* Unauthorized dashboard access

---

# 🎭 Live Mode & Simulation Mode

## Live Mode

A user can interact with CallGuard using natural voice.

```text
User speaks
    ↓
Speech Recognition
    ↓
Gemini
    ↓
Risk Analysis
    ↓
AI Response
    ↓
Voice Output
```

## Simulation Mode

Predefined scenarios allow judges to test the same risk engine with:

* Bank impersonation
* OTP theft
* Prize scams
* Payment requests
* Legitimate conversations
* Context-matching calls

**Simulation and Live Mode use the same core risk-analysis logic.**

---

# 📊 Risk Dashboard

The dashboard provides:

* Total screened calls
* Risk distribution
* Current risk
* Initial risk
* Final risk
* Risk evolution
* Detected intent
* Scam category
* Risk signals
* Final action
* Conversation transcript
* Screening history

---

# 🧪 Example Scenario

### Expected interaction

```text
PNB → Credit Card Application
```

### Caller

> "I'm calling from PNB regarding your credit card application."

### Initial assessment

```text
Context Match
Risk: 18 / 100
Status: LOW
```

The call continues.

### Caller

> "For verification, please tell me the OTP you received."

### Updated assessment

```text
OTP Request
Financial Context
Sensitive Information Request

Risk: 82 / 100
Status: HIGH
Action: BLOCK / WARN
```

### Key insight

The system did not assume:

> **"PNB + expected call = safe."**

It waited for additional evidence.

---

# 🆚 How We Position Against Existing Solutions

| Solution               | Strongest capability                         | CallGuard's focus                                 |
| ---------------------- | -------------------------------------------- | ------------------------------------------------- |
| Truecaller             | Caller ID, reputation & call assistant       | User-specific context + evolving risk             |
| Google Call Screen     | Call screening + scam detection              | Context-aware conversational assessment           |
| Samsung Call Screening | AI screening + live transcription            | Adaptive screening + risk evolution               |
| Hiya                   | AI screening + active-call fraud protection  | Context + explainable risk timeline               |
| Apple Call Screening   | Unknown-call screening                       | Context-aware conversational security             |
| **CallGuard**          | **Context + conversation + continuous risk** | **A security layer that keeps reassessing trust** |

We do **not** claim to replace these products.

We focus on a different question:

> **"Is this specific conversation still safe for this specific user?"**

---

# 🛠️ Tech Stack

| Layer                 | Technology            |
| --------------------- | --------------------- |
| Frontend              | React + TypeScript    |
| Backend               | Node.js               |
| AI Reasoning          | Google Gemini         |
| Real-time Voice       | Gemini Live API       |
| Indian Speech-to-Text | Gnani.ai Prisma       |
| Indian Text-to-Speech | Gnani.ai Timbre       |
| UI                    | Tailwind CSS          |
| Communication         | REST APIs + WebSocket |
| Development           | Google AI Studio      |

---

# 🔐 Security Principles

* API keys remain server-side
* Sensitive information is not required for expected-call context
* No passwords, OTPs or PINs are stored as user context
* Caller input is treated as untrusted input
* Risk is based on multiple signals
* User confirmation is never treated as identity proof
* No-response is treated as UNKNOWN

---

# ⚠️ Current Prototype Scope

The current project demonstrates the **conversational intelligence, risk analysis, user-context and continuous-monitoring layer**.

Full production deployment would require integration with supported telephony/mobile call-screening infrastructure, privacy controls, carrier/platform permissions and extensive real-world evaluation.

We intentionally do not claim that a browser prototype can directly control every cellular call.

---

# 🎯 Vision

CallGuard is not trying to prove that AI can magically identify every scam.

Our goal is to make phone communication **more context-aware, explainable and continuously protected**.

> ### **"Don't trust a caller just because they passed the first check. Keep evaluating the conversation."**

---

## 🚀 Built for safer conversations. Built for real-world uncertainty.

