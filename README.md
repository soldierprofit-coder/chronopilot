# ChronoPilot

ChronoPilot is an authorized, semi-assisted Mage controller for a separately built World of ClaudeCraft desktop client. It auto-detects Chronomancy for healing or Cryomancy/Frost for PvE damage and keeps each profile's settings independent.

The player moves, positions, faces, and handles mechanics manually. ChronoPilot can choose legal targets and cast enabled healing, defensive, interrupt, resurrection, and Chronomancy damage-to-heal abilities through the existing server-authoritative client commands.

## Current milestone

- Auto-detected Chronomancy healer and Frost PvE DPS engines, with manual profile override
- Independent Frost skills, mana limits, defensives, cooldowns, proc logic, and AoE thresholds; healer sliders are ignored while Frost is active
- Frost single-target loop: Rimelance generation, Fingers of Frost anti-overcap, instant Brain Freeze Winterlash, Winter's Chill Ice Lances, and five-Icicle Glacial Spike bursts
- Frost pack loop: Frozen Orb, densest-cluster Blizzard placement, Icebind setup, Frostsweep, and automatic full-stage Glacial Front
- Frost upkeep for Aether Insight, Hoarfrost Mantle, Frostveil, Water Elemental, Spellbreak, Cold Coffin, potions, and safe between-pull Aetherwell
- Durable-target logic for Rune of Power, Icy Veins, Frozen Orb, Glacial Front, Power Echo, and Racing Mind when those talents are learned
- AoE refuses to fire into protected breakable crowd control
- MMOminion-style detachable Start/Stop control window
- Official browser-login handoff; no ChronoPilot password field or credential storage
- Starts over the game, drags freely to another monitor, pins on top, and hides/restores with F10
- Performance-oriented Electron GPU flags and unthrottled game rendering
- Auto-detected Solo Questing, Party, Raid, and PvP / Arena profiles, with manual overrides
- Module and per-ability toggles
- Separate healing, group ally-count, and mana thresholds for every profile
- Tank, assisted-party-member, current, lowest-HP, closest-engaged, and closest-in-range enemy modes
- Configurable target range and optional new-enemy selection for questing
- Automatic healing priority over single-target or nearby-pack damage
- Ally-first party and raid healing, with self-healing promoted for emergencies
- No-tank fallback using the current aggro holder, a melee/frontline member, the party leader, then self
- Aether Insight upkeep before combat and after a party-roster change
- Temporal Echo only when combat is pending; the tank-lock mode refreshes below one second, while turning the lock off moves Echo immediately between a safe tank and genuinely endangered allies
- Smart Power Echo reserved for an emergency Temporal Mend repeat
- Perfect Moment is off by default; its optional smart logic remains available for safe Echo/Cascade damage-healing windows
- Natural stream targeting, enabled by default: the real selector stays on the latest healed ally and moves to an enemy only when ChronoPilot attacks
- Explicit Nythraxis transition pause with no casts or cosmetic target switching during the scene
- Smart one-to-four-stack Aether Surge spending, with separate aggressive PvP limits and conservative PvE limits
- Zero-percent mana reserve settings for fully unrestricted damage or healing
- Optional automatic health and mana potions, with drinking kept manual
- Interrupted or refused casts remain active and retry when the character is ready
- The Resurrection module is the authoritative master switch; PvP always skips both resurrection spells
- Manual-input pause and emergency stop
- Bindable Start/Stop hotkey, defaulting to `[` for quick in-game control
- PvP mode uses smart Ice Block, root-breaking Blink, Icebind melee relief, secondary-target Bewitch, protective Hourglass, Spellbreak, stable-window Temporal Acceleration, barriers, healing, and damage-to-heal
- PvP auto-detection supports real duels, arenas, Vale Cup, and Thornhollow Fields 5v5 matches
- Thornhollow targeting promotes only the opposing roster and its owned pets; teammates and nearby ordinary players remain excluded
- Local settings persistence
- Tests for healing priorities, quest targeting, party-member assist, mana conservation, nearby-pack damage, casting safety, control, and PvP

Solo Questing does not move the character or chase enemies. It selects one legal enemy inside the configured range when `Attack new enemies` is enabled. Party and Raid modes never start a new fight. Frost can place Blizzard at a legal position and starts Glacial Front's server-authoritative full charge, but the player still controls facing, movement, mechanics, and early release. PvP mode can move exactly once with Blink when `Blink out of roots` is enabled; no other movement is automated.

The Windows-only ZIP puts `ChronoPilot Lazy Client.exe` directly in the extracted root. The separate source ZIP contains the editable project without the large Windows runtime. Keep every DLL and the `resources` folder beside the executable. This local build is unsigned, so Windows SmartScreen may show an Unknown Publisher warning.

## Version 0.11.0

This release adds the separate **Frost PvE DPS** profile for World of ClaudeCraft `release/v0.36.0`. Auto mode reads the active talent specialization: Frost loads its own rotation and settings, while Chronomancy restores the existing healer and PvP engines without resetting either profile.

Frost handles the current proc and resource contract: Fingers of Frost is spent before it can overcap, Brain Freeze is converted into instant Winterlash, Winter's Chill is consumed with Ice Lance, and five Icicles trigger a Glacial Spike burst. Safe packs use Frozen Orb before Blizzard, then Icebind and a fully charged Glacial Front when configured. The server automatically releases Glacial Front at stage IV; ChronoPilot never moves or turns the character to aim it.

## Version 0.10.2

This maintenance release fixes desktop Skills settings whose internal ability IDs contain underscores. Changes to Temporal Reversal, Collective Reversal, Temporal Echo, Aether Darts, and the other affected abilities now pass validation, save immediately, and remain stable across tab changes and restarts. Linked Resurrection controls also repaint together immediately instead of briefly showing conflicting states. The recovery skill is now labeled **Aetherwell / Evocation** so it matches both the in-game and internal names.

## Version 0.10.1

PvP now has separate Smart Surge limits of one to four charges. Its default preset spends aggressively without a mana reserve, reaches four charges while health is stable, and drops toward one charge when healing pressure rises. Cold Coffin now defaults to 45% HP, Hourglass to 40%, Temporal Barrier to 88%, and the emergency-heal threshold to 52% so burst protection starts before the old near-death window.

The Resurrection module is now the authoritative saved switch. Old Temporal Reversal or Collective Reversal values can no longer re-enable it after a restart or tab change, and both resurrection spells are unconditionally skipped in PvP because battleground and arena deaths return from the base.

## Version 0.10.0

This release returns ChronoPilot to one Chronomancy-only engine. Fire and Frost profile selection, settings, skills, code paths, and UI are removed. The stable adaptive Echo, healing, mana, resurrection, PvP utility, stream-targeting, and Solo/Party/Raid behavior remain intact.

Thornhollow Fields uses the authoritative active battleground roster to identify only the opposing 5v5 team and their pets. A valid opponent you select manually wins immediately; otherwise ChronoPilot can acquire the nearest visible roster-confirmed enemy even before that opponent attacks. The assist still never navigates or chases.

## Version 0.7.4

The **Keep Echo on tank** control now selects two complete behaviors. On locks the individual Echo to the assigned tank and retains the one-second mana-preserving refresh. Off enables adaptive rescue: when the tank is at least 85% effective HP, Echo can move immediately to an endangered ally without waiting for expiry, stays stable instead of following every small HP change, and returns to the tank when the rescue target recovers or the tank becomes unsafe.

## Version 0.7.3

This build prevents redundant Temporal Echo casts. Manual spell or target input no longer erases the confirmed individual Echo timer, party snapshots without a source ID may confirm only the already remembered target, and the assigned tank's Echo refreshes only below one second remaining. Existing saved three-second refresh settings migrate automatically. Manual override remains 250 ms at its lowest desktop setting.

## Version 0.7.1

This build makes Resurrection one atomic setting: Temporal Reversal, Collective Reversal, and the module are enabled or disabled together and legacy split settings are repaired when loaded. It also adds an auto-detected PvP / Arena profile. Cold Coffin is reserved for critical health or a controlled emergency, Flickerstep only breaks roots, Icebind relieves nearby melee pressure, Bewitch controls a secondary opponent while an ally is pressured, Hourglass protects and heals a critical ally or self, Spellbreak interrupts active casts, and Temporal Acceleration waits for a stable fight. Healing, barriers, Rewind, potions, and the Arcane damage-to-heal rotation remain active. Perfect Moment is migrated off by default but can still be enabled manually. Natural stream targeting shows every direct ally or control target and returns to a valid enemy only when an offensive action needs it. Version 0.7.1 fixes PvP targeting: active duel and arena opponents are promoted to valid enemies even though the game wire marks player entities as `hostile: false`.

## Development

```bash
npm install
npm test
npm run check
npm run build
```

See `integration/README.md` for the upstream connection points.
