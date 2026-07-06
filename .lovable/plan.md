## Goal
Make the chatbot sound like a real person from Shachavir Timber — warm, natural, no robotic phrasing, no markdown asterisks/bullets cluttering replies.

## Changes

### 1. Welcome message (both React + legacy widgets)
Replace the current greeting in:
- `src/components/ShachavirAssistant.tsx` (WELCOME constant)
- `src/lib/legacy-hydrate.server.ts` (ASSISTANT_WIDGET initial message)

New greeting:
> "Hi, I'm Shachavir from Shachavir Timber 👋 How can I help you today?"

Also update input placeholder to something conversational like "Type your message…" instead of "Ask about our doors, prices, projects…".

### 2. System prompt rewrite (`src/routes/api/public/chat.ts`)
Rewrite `buildSystemPrompt` so the assistant:
- Speaks in first person as "Shachavir", a friendly team member (not "an AI assistant").
- Uses short, warm, conversational sentences — like a WhatsApp chat with a customer.
- Never uses markdown bold/italics (`**`, `*`, `_`) or bullet lists with `-`/`*`. Plain sentences only. Line breaks are fine.
- Avoids robotic phrases ("I'm an AI", "As an assistant", "I can help you with the following:", "Here are…").
- Asks a natural follow-up question when useful (e.g. "What kind of door are you thinking about — interior or main entrance?").
- Shares prices/details naturally in prose, not tables/lists.
- Suggests contacting the team by phone/WhatsApp/contact form only when it actually fits the flow.

### 3. Strip stray markdown from responses (safety net)
In the chat API handler, after `generateText`, run a small sanitizer on `result.text`:
- Remove `**`, `__`, and standalone `*`/`_` used for emphasis.
- Convert leading `- ` / `* ` bullet markers at line start to plain text (drop the marker).
- Trim excess blank lines.

This guarantees no asterisks reach the user even if the model slips.

### 4. Keep everything else unchanged
No changes to placement, storage, endpoints, auth, or context loading.

## Technical notes
- Both widget copies (React + legacy vanilla JS) must be updated together so the greeting matches site-wide.
- Sanitizer is a plain regex pass — no new dependencies.
- Model + context loading stay as-is.
