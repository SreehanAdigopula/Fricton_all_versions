# Friction

Friction is a hand-drawn adaptive focus app for students. It combines a focus timer, distraction and break tracking, pet progress, study media, motivation prompts, and a System Builder for turning big goals into realistic work plans.

## Features

- Email/password login with Supabase, plus Offline Mode for local-only use.
- Adaptive focus timer that reacts to completions, distractions, breaks, and failed sessions.
- Pet buddy system with growth stages and recoverable small/sad stress forms.
- Built-in study environments and custom YouTube/Spotify study links.
- Thought Parking Lot for saving distractions until later.
- Motivation companion page with pet-voice prompts and visual idea search.
- System Builder with required-field validation, autocorrect, Full/Reduced/Survival modes, action tracking, milestone advancement, check-ins, and reviews.
- App Rules and Policies pages written in plain language.

## Run Locally

From the project folder:

```bash
python3 -m http.server 8004 --bind 127.0.0.1
```

Then open the matching local address:

```text
http://127.0.0.1:8004/login.html
```

If that port is busy, use another open port and update the address to match.

## Notes

This is a student-project MVP. Supabase signup, email confirmation, and cross-device sync require the configured Supabase project to be available and correctly allow the site URL as an auth redirect.
