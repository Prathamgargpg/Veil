# VEIL — The Ascent
Bluff/deduction card + board game. 2 or 4 players, bots for practice, dark (Order) / light (Dawn) themes.

## Run
    npm install && JWT_SECRET=change-me npm start   # http://localhost:3000

## Stack
- Express REST (`/api/register|login|me`), bcrypt + JWT auth
- `ws` WebSocket rooms, server-authoritative engine (`game.js`), hidden hands never leave the server
- SQLite (`data.db`): accounts, win/loss stats, finished-game logs

## Rules
Each player holds 2 hidden Sigils (Seer, Blade, Broker, Warden). First to 10 Ascent, or last with a Sigil, wins.
- Tithe: +1 Ascent (always true, can't be challenged)
- Broker: +3 (claim Broker) · Seer: swap a Sigil with the deck (claim Seer)
- Blade: pay 2, target loses a Sigil (claim Blade); target may block by claiming Warden
- Anyone may challenge a claim: truthful claimer -> challenger loses a Sigil; bluffer loses one.
- 25s per decision, then you auto-pass. Leaving mid-game hands your seat to a bot.

## GitHub deploy
Push to GitHub (CI runs on push). GitHub Pages can't run the backend, so connect the repo to Render/Railway/Fly
(Node web service, start `npm start`, env `JWT_SECRET`, persistent disk for `data.db`). WebSockets work on same URL.

## Seeing "Server error (404)"?
The page is being served by something that is not the Node server (GitHub Pages, VS Code Live Server, `file://`).
Open `<your-address>/api/health`: it must return `{"ok":true}`. If not, run `npm start` and use `http://localhost:3000`,
or deploy with `render.yaml` (Render > New > Blueprint). The game page and API must share one address.
