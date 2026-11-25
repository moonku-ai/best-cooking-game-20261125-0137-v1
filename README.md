# Dapur Senja

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/moonku-ai/best-cooking-game-20261125-0137-v1/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/moonku-ai/best-cooking-game-20261125-0137-v1/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Dapur Senja** is an original top-down cooking game played in a desktop browser, offline, from static files. You are the cook of a small warung at dusk. Orders come in on the board — five dishes on the menu — and a three-minute shift is yours to fill: fetch ingredients from the crates, chop them on the boards, fry them on the stove, build each dish on a plate and run it to the serving window before the customer walks away.

## How it plays

- **Five dishes, one route each.** Nasi Goreng (rice + egg), Ayam Geprek (chopped + fried chicken, fresh chopped chili), Sayur Sop (greens + egg), Nasi Ayam (rice + chicken) and Teh Tarik (tea, quick and cheap). Every ingredient has its own chain: chop first, then cook, then plate — chili is served chopped, never cooked.
- **The kitchen is the puzzle.** Crates on the left wall, two chopping boards and a two-burner stove on the island, plating counters and the serving window along the top. You carry one thing at a time, so every trip is a choice.
- **Pressure that grows.** Orders spawn faster as the shift goes on, and the last thirty seconds are the rush. A dish left too long on the burner burns and has to be thrown away. Four plates only — a served plate comes back six seconds later.
- **Score:** base price plus a tip for patience left, times a combo that grows when serves come quickly (up to x2). Three stars at 1,200 coins.
- **Feel:** chopping, sizzling and coin sounds synthesized in the browser (no audio files), steam, floating coin pops and a small screen shake on every serve.

Controls: **WASD / arrows** to walk, **E** (or Space) to pick up, put down, chop and serve — hold E on a chopping board to chop. Click a station to walk to it and use it. **P** pauses, **M** mutes, **R** starts a new shift.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Or open `game/index.html` through any static server. Node 22+ for `main.ts` (the make.fun entrypoint, which copies `game/` + `screenshots/` to `/output` and writes `dossier.json`).

Screenshots are staged deterministically from the real game: `game/index.html?shot=play|rush|serve|end&seed=7` (see `shots.json`). All four shots in `screenshots/` are real renders of the game's own code: a busy kitchen mid-shift, the rush, a serve at the window, and the end-of-shift results.

## Tests

```sh
node --test tests/
```

Tests cover the recipe rules (every dish's exact ingredients and states, plate rules, payout math) and the order board (spawn pacing, expiry, serving the right and wrong dish, combo build and reset). The game was also play-tested in a real browser (walk, chop, cook, plate, serve, burn, rush) before submitting.

---

<sub>Entered on [make.fun](https://make.fun/bounty/best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
