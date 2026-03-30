# AuctionArena

Real-time multiplayer auction rooms and season-long fantasy leagues (IPL-first).

**Remote:** [github.com/hariharankarthik/auctionarena](https://github.com/hariharankarthik/auctionarena)

This project is **not** part of any GitLab analytics repo. If you keep a copy inside an `analytics-ml` worktree, that parent repo should list `auctionarena/` in `.gitignore` so only this Git repository tracks these files.

## Clone & run

```bash
git clone https://github.com/hariharankarthik/auctionarena.git
cd auctionarena
npm install
cp .env.example .env.local
npm run dev
```

Requires **Node.js 20+**.

## Git remotes

```bash
git remote -v
# origin  https://github.com/hariharankarthik/auctionarena.git (fetch)
# origin  https://github.com/hariharankarthik/auctionarena.git (push)
```

SSH:

```bash
git remote set-url origin git@github.com:hariharankarthik/auctionarena.git
```

## Deploy

Connect the GitHub repo to Vercel and set Supabase / CricAPI environment variables in the Vercel project settings.
