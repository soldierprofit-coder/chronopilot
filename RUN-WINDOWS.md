# Run ChronoPilot 0.14.0 with the official Windows client

1. Install and update the normal World of ClaudeCraft Windows client, then close it completely.
2. Extract the entire ChronoPilot ZIP. Do not run it from inside the ZIP viewer.
3. Run `ChronoPilot Official Launcher.exe` from the extracted root.
4. ChronoPilot auto-detects `World of ClaudeCraft.exe`. If detection fails, click **Browse…**, choose the official EXE, then click **Launch & Attach**.
5. Sign in through the official client's normal login flow and enter the world. ChronoPilot never asks for or stores your password.
6. Wait for **Connected to the official game world**, choose **Auto**, then press **Start Assist** or your configured hotkey.

The default Start/Stop hotkey is `[`. Click the hotkey control to bind another key. Manual override defaults to 250 ms. Natural stream targeting displays the ally or enemy ChronoPilot is actually acting on; action-bar position does not affect casting because the game uses internal ability IDs.

There are only two specialization profiles: Chronomage and Fire Mage. Auto-detect chooses between them from your active talents; it is not a third profile. Active duels, arenas, Vale Cup, and Thornhollow Fields use the matching PvP rules. Fire and Chronomancy keep independent settings.

For Fire PvP, keep **Auto-attack while moving** enabled if you want wand pressure between casts. The wand still needs range, facing, and line of sight. It will not attack through an obstacle, but remains armed and resumes after line of sight returns.

The controller is a separate window. Drag it to any monitor, use **Pin over game** when useful, and press **F10** to hide or restore it. Its last valid screen position and selected game EXE are remembered.

The official client owns update checks, the game session, browser login callback, performance settings, GPU selection, and rendering. ChronoPilot attaches only through a random localhost port for that launch. It does not load DLLs, send action-bar macros, modify installed files, or store credentials.

If attachment fails, fully exit every World of ClaudeCraft process and click **Launch & Attach** again. After the official updater fully restarts the game, click **Launch & Attach** again.

ChronoPilot does not navigate or chase. Ordinary movement, facing, ground placement, food, and drinking remain manual. **Dodge AoE** is enabled by default and temporarily overrides movement only inside supported Rift boss danger zones; turn it off or stop Assist for full manual mechanic control. Dragon's Breath can auto-release at full stage through the game server, but you must aim the cone.

This is an unsigned portable test build, so Windows SmartScreen may display **Unknown Publisher**. Keep every adjacent DLL and the `resources` folder beside the executable.
