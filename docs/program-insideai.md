# Program: InsideAI — AutoDev Experimentation Guide

## Identity

InsideAI is an AI coaching mobile app for African professionals.
Stack: Expo React Native v53, TypeScript, Supabase, OpenAI (Whisper + GPT).
Deployed via Expo. Everything is in PRODUCTION.

## Rules

Same safety rules as ZeroName:
1. Never break production
2. One improvement at a time
3. Branch only (autodev/{module}/{date})
4. Verify build before push
5. Notify on success
6. Discard on failure

## Applicable Modules

Only these modules apply to InsideAI:

### Security
- Input validation on API calls
- Secure storage of auth tokens
- Certificate pinning considerations
- Data sanitization

### Quality
- Coaching system prompt in `services/openai.ts`
- Text improvement prompt quality
- Recommendation engine prompts
- Voice transcription prompt optimization

## Key Files

| File | Purpose | Module |
|------|---------|--------|
| `services/openai.ts` | AI integration | quality |
| `providers/AppProvider.tsx` | Global state | security |
| `hooks/useVoiceRecording.ts` | Voice input | quality |
| `app.json` | App config | security |

## Constraints

- React Native build: `npx expo export --platform web` for verification
- No Node.js-only APIs — must work in React Native runtime
- Mobile-first: performance matters even more than web
