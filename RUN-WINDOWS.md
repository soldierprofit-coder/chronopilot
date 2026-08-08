# Run ChronoPilot on Windows

1. Extract the complete ZIP. Do not run the program from inside the ZIP viewer.
2. Run `ChronoPilot Lazy Client.exe` from the extracted root of the Windows ZIP.
3. Press Login in the game client. Sign in on the official World of ClaudeCraft browser page; ChronoPilot never asks for or stores the password.
4. Return to the client and enter the world. The game session is remembered by the normal Electron app profile.
5. The ChronoPilot control window starts over the right side of the game. Choose Auto context and press Start Assist. Chronomancy is the only rotation in this build.

The controller is a real detachable Windows window. Drag its Windows title bar anywhere, including onto another monitor. Enable **Pin over game** to keep it visible. Press **F10** to hide or restore it; closing the control window also hides it without closing the game. Its last valid screen position is remembered.

Auto-detect uses PvP during an active duel, arena, Vale Cup, or Thornhollow Fields match; otherwise it uses Solo Questing when you are alone, Party for a normal party, and Raid when the group is converted to a raid or contains more than five members. You can override this from the Overview tab.

There is no specialization selector: every action uses the Chronomancy healer engine. Click **Start / stop hotkey** and press a key to bind it; the default `[` key toggles Assist while the game window is focused.

Skillbar position and page do not matter: ChronoPilot casts by the game's internal ability ID. **Natural stream targeting** is enabled by default. The real in-game selector stays on the latest ally ChronoPilot healed, moves directly to another ally when healing priorities change, and selects the boss or add only when ChronoPilot actually attacks. Turn the setting off if you prefer hidden direct-target casts that preserve your own selection.

In Party and Raid modes, normal direct heals prefer an injured ally. Self-healing takes priority when you reach the emergency threshold. If no tank role is present, Auto-detect prefers the member currently holding the most enemy aggro, then a living melee/frontline member, the party leader, and finally you.

**Maximum Surge stacks** and **Minimum Surge stacks** allow 1–4 for PvE. PvP has its own one-to-four limits on the PvP tab. With **Smart Surge stacks** enabled, PvE adapts using mana and group health; PvP ignores mana conservation and adapts from team-health pressure, reaching four while stable and spending at one when someone is in danger. Setting **Conserve mana** or **Stop damage** to 0 disables that reserve; both default to 0 in PvP.

Aether Insight is maintained out of combat and Temporal Echo waits for valid combat intent. With **Keep Echo on tank** enabled, the confirmed tank Echo survives manual input and refreshes only below one second. Turn it off for adaptive rescue: Echo moves immediately from a safe tank to a genuinely endangered ally, stays there while needed, and returns when the ally recovers or the tank becomes unsafe. Smart Power Echo repeats a genuinely urgent Temporal Mend. Perfect Moment starts disabled; if you enable it, its smart logic waits for a safe group Echo/Cascade window. Any emergency returns priority to direct healing and defensives. During Nythraxis' phase-transition cutscene, the server's transition stun pauses both actions and stream-visible target changes.

The Resurrection module and both Reversal spell toggles are linked, with the module as the authoritative master setting when saved data is loaded. Turning the module off keeps both skills off after tab changes and restarts even if an older save contains stale ability values. PvP never uses either resurrection spell, even if resurrection remains enabled for Party or Raid.

The Skills page saves immediately. **Aetherwell / Evocation** is the mana-recovery toggle under **Damage & recovery**. Version 0.10.2 fixes the bridge validation for internal ability names containing underscores, so leaving and returning to the Skills tab no longer restores their previous values.

PvP mode is enabled by default and has its own aggressive healing/damage preset. Ice Block defaults to 45% HP and cleanses and grants immunity even while controlled; Hourglass defaults to 40%; Temporal Barrier begins at 88%; and emergency direct healing begins at 52%. Blink is used only to break a root; Icebind controls nearby melee pressure; Bewitch is reserved for a secondary opponent while your lowest ally is pressured; Spellbreak interrupts active casts; and Temporal Acceleration waits for a stable active fight. Each PvP spell still has its own Skills toggle.

PvP opponents are intentionally sent by the game as player entities with `hostile: false`. ChronoPilot recognizes active duel, arena, and Thornhollow rosters and treats only those opponents as legal damage targets. In Thornhollow it excludes your own 5v5 team, promotes enemy-owned pets, prioritizes your valid manual enemy selection, and otherwise acquires the nearest visible opponent.

The executable is a portable unsigned test build. Windows SmartScreen may display Unknown Publisher. All adjacent DLLs and the `resources` folder must remain beside the executable.

ChronoPilot does not navigate or chase. The only automatic movement is the optional 15-yard PvP Blink used to break a root. If movement interrupts another cast, Assist remains active and tries the priority again once the game reports that casting is available. Food and drinking remain manual and out of combat.
