# ChronoPilot

ChronoPilot is an authorized, semi-assisted Mage controller that launches and attaches to the installed official World of ClaudeCraft Windows client. Version 0.14.0 auto-detects **Chronomancy healing** or **Pyromancy/Fire damage** and keeps their settings independent.

The player remains responsible for ordinary movement, facing, positioning, food, and drinking. When **Dodge AoE** is enabled, ChronoPilot can temporarily own movement for supported Rift boss danger zones, then releases movement and resumes combat. ChronoPilot acts through the game's existing server-authoritative input, target, and ability commands. It never asks for a password, changes the installed game, loads a DLL, or sends action-bar macros.

## Version 0.14.0

The interface presents exactly two specialization profiles: **Chronomage** and **Fire Mage**. **Auto-detect** only chooses between those profiles from the learned specialization; it is not a third profile. The old Frost PvE tab and wording are retired.

The portable Windows runtime is built into a fresh output directory and validated against the complete Electron executable size, preventing the truncated executable that affected the withdrawn 0.13.1 archive.

- Adds one **Dodge AoE** switch to Overview, enabled by default.
- Reads the official Rift death-zone mirror instead of scanning screen colors.
- Pauses all combat decisions, faces and walks through the nearest safe exit, avoids other live circles, then resumes the existing target and rotation.
- Keeps AoE movement authoritative while the feature is enabled; ordinary movement keys do not cancel the escape. Turn the switch off or stop Assist for full manual mechanic control.
- Uses Flickerstep automatically only when the remaining fuse is shorter than the calculated walking escape or the Mage is rooted, and only when the landing point is safe.
- Replaces the selectable Frost PvE profile with separate Fire PvE and Fire PvP logic.
- Preserves the complete Chronomancy Solo, Party, Raid, and PvP healer engine.
- Auto mode reads the active Mage specialization. Pyromancy loads Fire settings; Chronomancy loads healer settings.
- Migrates an old forced Frost profile back to Auto without resetting saved Chronomancy settings.
- Maintains Aether Insight and Hoarfrost Mantle before combat.
- Uses the official Fire opener: Rune of Power, Phoenix Trance, Cinderfall charges, then Hot Streak Pyrelance.
- Uses Cinderfall off the global cooldown and while another Fire spell is being cast.
- Never hard-casts the six-second Pyrelance as the normal filler. Hot Streak or Racing Mind makes it instant; Cinderbolt is the normal stationary filler and Scald is the moving or conservative filler.
- Uses Meteor on durable single targets or configured packs. Flamestrike spends Hot Streak on clustered packs.
- Uses full-stage Dragon's Breath only at the configured enemy count. The game server performs the maximum-stage release; the player still has to face the pack.
- Protects breakable crowd control from automatic AoE.
- Fire PvP uses manual targets first, then valid duel, arena, Vale Cup, or Thornhollow opponents.
- Fire PvP can arm the Mage's 30-yard wand auto-attack while moving. Auto-attacks still require range, facing, and line of sight, pause during spell casts, and resume when the target becomes visible again.
- Fire PvP includes smart Phoenix Trance burst, Hot Streak spending, Cinderfall, Meteor, Scald movement pressure, Spellbreak, Ice Block, root-breaking Flickerstep, Icebind, Bewitch, and optional Ring of Frost.
- Fire PvP never runs resurrection logic.
- Keeps the bindable Start/Stop hotkey, defaulting to `[`, plus the detachable second-monitor controller and F10 hide/show.
- Keeps natural stream targeting: the real in-game selector follows the ally or enemy being acted on.
- Uses 100 ms combat decisions and 250 ms visible controller updates without running a second copy of the game renderer.

The combat profiles remain aligned with World of ClaudeCraft `release/v0.36.0` at commit `5819c005a7666f161aee8c0b54d9007c865bb494`. Rift death-zone and controller-movement compatibility was checked against current game source commit `7e8c2c3cd8136242a2d8ff29c376dd2bef66f849`.

## Fire behavior

### Single target

1. Rune of Power before the burst window when learned.
2. Phoenix Trance on a durable target, or in PvP when Fire Burst is enabled.
3. Cinderfall charges to generate Hot Streak without delaying the main cast.
4. Instant Pyrelance on Hot Streak.
5. Meteor on a durable target when enabled.
6. Cinderbolt while stationary; Scald while moving, during execute, or under mana conservation.

### Packs

- Flamestrike replaces Pyrelance at the configured clustered-enemy count.
- Meteor targets the densest safe cluster.
- Dragon's Breath is reserved for the configured nearby-enemy count.
- No automatic AoE is used when it would break protected crowd control.

### PvP auto-attack

The assist sends the normal game `attack` command once to arm the Mage wand. This helps preserve pressure while running, but it cannot shoot through walls or obstacles and it does not turn, chase, or navigate the character.

## Suggested talents

### Fire PvE

- Ice Floes
- Warded
- Twin Icebind
- Racing Mind
- Winter's Recall
- Rune of Power

### Fire PvP starting point

- Ice Floes for manual casting movement, or Double Blink for extra escape
- Warded
- Twin Icebind, with Snap Bewitch as an alternative control choice
- Power Echo for a direct burst repeat
- Winter's Recall
- Overflowing Power

ChronoPilot checks which optional abilities are actually learned, so an unavailable talent is skipped rather than blocking the rotation.

## Chronomancy behavior retained

- Separate Solo, Party, Raid, and PvP presets with manual context override.
- Lowest-effective-HP healing, ally-first party and raid priority, self-emergency protection, and no-tank fallback.
- Temporal Echo tank lock or adaptive rescue mode.
- Smart Power Echo before an emergency Temporal Mend.
- Temporal Barrier, Mass Barrier, Cascade, Rewind, Hourglass, interrupts, potions, and optional resurrection in PvE.
- Smart one-to-four Aether Surge stacks with separate PvE and PvP limits.
- PvP skips both resurrection spells unconditionally.
- Perfect Moment remains optional and off by default.

## Official-client launcher

ChronoPilot finds or browses to `World of ClaudeCraft.exe`, launches the installed self-updating client with a random loopback-only DevTools port, and attaches the decision engine to that official renderer. The official client continues to own updates, login callbacks, saved sessions, GPU selection, and rendering.

The attachment does not patch `app.asar`, modify installed files, inject a DLL, store credentials, or send action-bar keys. If the official client is already running, close it completely before **Launch & Attach** so Electron accepts the launch-only attach flag. Renderer reloads reattach automatically; after a full updater restart, use **Launch & Attach** again.

ChronoPilot does not navigate or chase. Outside supported Rift danger zones, movement remains manual. During a verified AoE escape it uses the game's controller movement/facing channel and optionally Flickerstep, then releases that channel immediately on safety, Assist stop, or setting disable.

## Development

```bash
npm install
npm test
npm run check
npm run build
```

See `integration/README.md` for the upstream connection points.
