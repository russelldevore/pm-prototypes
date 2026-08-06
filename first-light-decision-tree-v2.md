# First Light — Full Decision Tree (state-driven build)

## Starting state
WIND = Favorable · AWARENESS = Unaware · POSITION = Workable · WIND_SECURED = false

---

## DECISION 1 — APPROACH
| Choice (archetype) | Effect |
|---|---|
| Move Now (**Aggressive**) | POSITION → Strong · WIND → Compromised |
| Wait For Light (**Cautious**) | POSITION → Poor · WIND unchanged |
| Circle Wide (**Tactical**) | POSITION → Strong · WIND unchanged · sets **WIND_SECURED = true** |

No hard stops possible here — every choice proceeds to Decision 2.

---

## DECISION 2 — ON SIGN
Opening text varies: if WIND is still Favorable, the scene reads calm; if
Compromised, the text acknowledges you can feel air starting to shift.

| Choice (archetype) | Effect |
|---|---|
| Push In (**Aggressive**) | If WIND ≠ Favorable → **HARD STOP: "Wind Beat You To It."** If WIND = Favorable → AWARENESS → Alerted, POSITION → Strong |
| Back Out & Glass (**Cautious**) | WIND, AWARENESS unchanged · POSITION improves one step (Poor→Workable→Strong) |
| Call (**Tactical**) | WIND, AWARENESS unchanged · POSITION degrades one step (Strong→Workable→Poor) |

## → Natural wind decay (applied automatically after Decision 2, before Decision 3)
If WIND_SECURED = false and WIND = Favorable → **WIND decays to Compromised**
(the forecast thermal shift catching up with you). If WIND_SECURED = true,
no decay — Circle Wide at Decision 1 is the only way to prevent this.

## → Recovery check
If WIND = Compromised **and** POSITION ≠ Strong → route to the **Recovery
Node** instead of Decision 3.

---

## RECOVERY NODE — "Reassess"
Triggered when the wind's against you and your position isn't strong
enough to gamble on it.

| Choice | Effect |
|---|---|
| Push north to a parallel finger, reset the approach | POSITION → Workable · WIND → Favorable → **proceeds to Decision 3** |
| Call it, back out clean, try again this evening | **END — "Lived To Hunt This Line Again"** (a disciplined fold, not a bust) |

---

## DECISION 3 — THE ENCOUNTER
Opening text varies: bedded and unaware, or already on his feet watching,
depending on incoming AWARENESS.

| Choice (archetype) | Effect |
|---|---|
| Stalk Now (**Aggressive**) | If WIND = Blown → **HARD STOP: "So Close."** Else → POSITION → Strong → **Shot Resolution** |
| Wait Him Out (**Cautious**) | If WIND ≠ Favorable → **HARD STOP: "The Wind Finally Caught Up."** Else → **Shot Resolution**, POSITION unchanged |
| Back Out & Call (**Tactical**) | If AWARENESS = Alerted → **HARD STOP: "One Call Too Many."** Else → POSITION → Strong → **Shot Resolution** |

---

## SHOT RESOLUTION (only reached if nothing hard-stopped)
Read off final POSITION:

| POSITION | Ending |
|---|---|
| Strong | **"Clean Shot"** — full-draw, high-percentage opportunity |
| Workable | **"The Harder Shot"** — a marginal but earned, ethical decision made well |
| Poor | **"Held Off"** — no good shot presents; the correct, disciplined call is to pass |

All three are framed as valid successful hunts in the debrief, not a
tiered win/lose — reflecting that patient and aggressive paths can both
be "right" if played consistently.

---

## Every reachable ending (8 total)
1. **Wind Beat You To It** — hard stop, Decision 2
2. **So Close** — hard stop, Decision 3
3. **The Wind Finally Caught Up** — hard stop, Decision 3
4. **One Call Too Many** — hard stop, Decision 3
5. **Lived To Hunt This Line Again** — recovery fold
6. **Clean Shot** — success, Strong position
7. **The Harder Shot** — success, Workable position
8. **Held Off** — success (ethical), Poor position

## Full path map (all 27 raw choice sequences resolve into these 8 endings)
```
D1: Aggressive → WIND=Compromised, POSITION=Strong
    D2: Aggressive → HARD STOP (Wind Beat You To It)
    D2: Cautious   → POSITION=Strong → decay(skip, WIND_SECURED false, but already Compromised, stays) → Recovery? WIND=Compromised & POSITION=Strong → NO recovery (position strong) → D3
        D3: Aggressive → WIND≠Blown → Shot: Strong → Clean Shot
        D3: Cautious   → WIND≠Favorable → HARD STOP (Wind Finally Caught Up)
        D3: Tactical   → AWARENESS=Unaware → Shot: Strong → Clean Shot
    D2: Tactical   → POSITION=Workable → Recovery triggers (WIND=Compromised & POSITION≠Strong)
        Recovery A (reset) → D3 with POSITION=Workable, WIND=Favorable
            D3: Aggressive → Shot: Strong → Clean Shot
            D3: Cautious   → WIND=Favorable → Shot: Workable → The Harder Shot
            D3: Tactical   → Shot: Strong → Clean Shot
        Recovery B (fold) → Lived To Hunt This Line Again

D1: Cautious → WIND=Favorable, POSITION=Poor
    D2: Aggressive → WIND=Favorable → AWARENESS=Alerted, POSITION=Strong → decay(WIND_SECURED false, Favorable→Compromised) → Recovery? POSITION=Strong → NO → D3 (opens "on his feet, watching")
        D3: Aggressive → Shot: Strong → Clean Shot
        D3: Cautious   → WIND≠Favorable → HARD STOP (Wind Finally Caught Up)
        D3: Tactical   → AWARENESS=Alerted → HARD STOP (One Call Too Many)
    D2: Cautious   → POSITION=Workable → decay → Compromised → Recovery triggers (POSITION≠Strong)
        Recovery A → D3, POSITION=Workable, WIND=Favorable → as above pattern
        Recovery B → Lived To Hunt This Line Again
    D2: Tactical   → POSITION=Poor (already lowest, stays Poor) → decay → Compromised → Recovery triggers
        Recovery A → D3, POSITION=Workable, WIND=Favorable → as above pattern
        Recovery B → Lived To Hunt This Line Again

D1: Tactical → WIND=Favorable, POSITION=Strong, WIND_SECURED=true
    D2: Aggressive → WIND=Favorable → AWARENESS=Alerted, POSITION=Strong → no decay (secured) → D3 ("on his feet, watching")
        D3: Aggressive → Shot: Strong → Clean Shot
        D3: Cautious   → WIND=Favorable → Shot: Strong → Clean Shot
        D3: Tactical   → AWARENESS=Alerted → HARD STOP (One Call Too Many)
    D2: Cautious   → POSITION=Strong (already max) → no decay → D3 ("bedded, unaware")
        D3: Aggressive → Shot: Strong → Clean Shot
        D3: Cautious   → WIND=Favorable → Shot: Strong → Clean Shot
        D3: Tactical   → AWARENESS=Unaware → Shot: Strong → Clean Shot
    D2: Tactical   → POSITION=Workable → no decay (secured, still Favorable) → Recovery? WIND=Favorable so NO recovery check applies (rule only fires on Compromised) → D3
        D3: Aggressive → Shot: Strong → Clean Shot
        D3: Cautious   → WIND=Favorable → Shot: Workable → The Harder Shot
        D3: Tactical   → AWARENESS=Unaware → Shot: Strong → Clean Shot
```

This is the full tree — every one of the 27 raw sequences (including the
recovery sub-branches) lands on one of the 8 endings above, and no path
ever reconverges onto a scene that contradicts what already happened.
