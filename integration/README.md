# Authorized custom-client integration

ChronoPilot is designed for a separately branded build of the open-source World of ClaudeCraft desktop client. It is not a second connection, screen reader, input bot, memory reader, packet interceptor, or injector.

Reference base: the current public `levy-street/world-of-claudecraft` client API.

1. Build this package with `npm install && npm run build`.
2. Add it to the custom World of ClaudeCraft checkout as a local or private package dependency.
3. Import `mountChronoPilot` in `src/main.ts`.
4. After the `Hud` and `Renderer` are created inside `startGame`, call `mountChronoPilot(world)` and retain the returned handle for cleanup.
5. Give the custom distribution a separate `appId`, `productName`, updater channel, and deep-link scheme. Do not overwrite the official install.
6. Test on a local realm first. Keep `ALLOW_DEV_COMMANDS` disabled outside local development.
7. Ask the server owner to enable an explicit client identifier or account allowlist before using the live realm.

The integration needs no new combat command. It uses the existing server-authoritative `IWorld` surface:

- `partyInfo` for HP, mana, role, absorbs, incoming healing, Rewind value, aggro, positions, and party-frame auras
- `entities` for engaged enemies, current casts, targets, and crowd control
- `known`, player cooldowns, GCD, cast state, channel state, resources, and auras
- `castAbility`, `castAbilityOn`, `targetEntity`, and `useItem` for normal legal requests
- active duel/arena/Cup/battleground state plus `partyInfo.raid` and roster size for automatic PvP, Solo, Party, and Raid selection
- `inventory` and the shared potion cooldown for optional combat potions

The current player still controls navigation, facing, camera, mechanics, loot, chat, trades, mail, and every economy action. The optional PvP root escape may issue the game's normal 15-yard Blink ability; it does not pathfind or chase.
