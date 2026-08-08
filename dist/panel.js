import { saveSettings } from './settings-store.js';
const STYLE_ID = 'chronopilot-style';
const FROST_ABILITIES = [
    ['arcane_intellect', 'Aether Insight'],
    ['frost_armor', 'Hoarfrost Mantle'],
    ['frostbolt', 'Rimelance'],
    ['ice_lance', 'Ice Lance'],
    ['flurry', 'Winterlash'],
    ['frozen_orb', 'Frozen Orb'],
    ['blizzard', 'Blizzard'],
    ['glacial_spike', 'Glacial Spike'],
    ['glacial_front', 'Glacial Front'],
    ['ice_barrier', 'Frostveil'],
    ['icy_veins', 'Icy Veins'],
    ['summon_water_elemental', 'Water Elemental'],
    ['cone_of_cold', 'Frostsweep'],
    ['presence_of_mind', 'Racing Mind'],
    ['rune_of_power', 'Rune of Power'],
    ['counterspell', 'Spellbreak'],
    ['ice_block', 'Cold Coffin'],
    ['evocation', 'Aetherwell'],
    ['frost_nova', 'Icebind'],
];
const CHRONO_ABILITIES = [
    ['arcane_intellect', 'Aether Insight'],
    ['ice_floes', 'Ice Floes'],
    ['cold_snap', "Winter's Recall"],
    ['greater_invisibility', 'Greater Invisibility'],
    ['rings_of_frost', 'Ring of Frost'],
    ['temporal_echo', 'Temporal Echo'],
    ['temporal_mend', 'Temporal Mend'],
    ['temporal_barrier', 'Temporal Barrier'],
    ['temporal_cascade', 'Temporal Cascade'],
    ['temporal_rewind', 'Rewind'],
    ['mass_barrier', 'Mass Barrier'],
    ['power_echo', 'Power Echo'],
    ['arcane_surge', 'Aether Surge'],
    ['arcane_missiles', 'Aether Darts'],
    ['arcane_explosion', 'Aetherburst'],
    ['evocation', 'Aetherwell'],
    ['perfect_moment', 'Perfect Moment'],
    ['counterspell', 'Spellbreak'],
    ['ice_block', 'Cold Coffin'],
    ['blink', 'Flickerstep'],
    ['frost_nova', 'Icebind'],
    ['polymorph', 'Bewitch'],
    ['temporal_hourglass', 'Hourglass of Suspension'],
    ['temporal_acceleration', 'Temporal Acceleration'],
    ['temporal_reversal', 'Temporal Reversal'],
    ['collective_reversal', 'Collective Reversal'],
];
const ABILITY_LABELS = new Map([
    ...CHRONO_ABILITIES,
    ...FROST_ABILITIES,
]);
const MODULES = [
    ['healing', 'Healing'],
    ['damageToHeal', 'Damage to heal'],
    ['defensives', 'Defensives'],
    ['interrupts', 'Interrupts'],
    ['resurrection', 'Resurrection'],
];
const CONTEXTS = [
    ['solo', 'Solo Questing', 1],
    ['party', 'Party', 5],
    ['raid', 'Raid', 10],
    ['pvp', 'PvP / Arena', 5],
];
function injectStyle() {
    if (document.getElementById(STYLE_ID))
        return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
    #chronopilot-panel{position:fixed;top:90px;right:24px;width:min(360px,calc(100vw - 24px));z-index:40000;color:#eee;background:rgba(16,18,28,.96);border:1px solid rgba(171,139,255,.45);border-radius:10px;box-shadow:0 16px 48px rgba(0,0,0,.42);font:13px/1.35 system-ui,sans-serif;user-select:none}
    #chronopilot-panel *{box-sizing:border-box}
    #chronopilot-panel button,#chronopilot-panel select,#chronopilot-panel input{font:inherit}
    #chronopilot-panel .cp-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;cursor:move;border-bottom:1px solid rgba(255,255,255,.1)}
    #chronopilot-panel .cp-brand{font-weight:700;color:#d8c8ff}
    #chronopilot-panel .cp-status{display:flex;align-items:center;gap:7px;color:#aaa}
    #chronopilot-panel .cp-dot{width:8px;height:8px;border-radius:50%;background:#777}
    #chronopilot-panel[data-active="true"] .cp-dot{background:#7fe3b0;box-shadow:0 0 10px rgba(127,227,176,.65)}
    #chronopilot-panel .cp-body{padding:10px 12px;max-height:min(72vh,680px);overflow:auto}
    #chronopilot-panel .cp-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
    #chronopilot-panel button{border:1px solid rgba(255,255,255,.16);border-radius:6px;background:#262a3b;color:#eee;padding:6px 9px;cursor:pointer}
    #chronopilot-panel button:hover{background:#30364d}
    #chronopilot-panel button[data-selected="true"],#chronopilot-panel .cp-start{background:#7558c9;border-color:#9d80ef}
    #chronopilot-panel .cp-stop{background:#67343e;border-color:#9b5360}
    #chronopilot-panel .cp-view[hidden]{display:none}
    #chronopilot-panel fieldset{margin:0 0 10px;padding:9px;border:1px solid rgba(255,255,255,.12);border-radius:7px}
    #chronopilot-panel legend{padding:0 5px;color:#c9b8f2}
    #chronopilot-panel label{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:7px 0}
    #chronopilot-panel input[type="range"]{width:150px;accent-color:#9d80ef}
    #chronopilot-panel input[type="checkbox"]{accent-color:#9d80ef}
    #chronopilot-panel select{max-width:180px;background:#202435;color:#eee;border:1px solid rgba(255,255,255,.18);border-radius:5px;padding:5px}
    #chronopilot-panel .cp-decision{padding:9px;border-radius:7px;background:rgba(117,88,201,.18);border:1px solid rgba(157,128,239,.28)}
    #chronopilot-panel .cp-action{font-weight:700;color:#e1d7ff}
    #chronopilot-panel .cp-reason{color:#b9bac5;margin-top:3px}
    #chronopilot-panel .cp-actions{display:flex;gap:8px;justify-content:space-between;margin-top:10px}
    #chronopilot-panel .cp-grid{display:grid;grid-template-columns:1fr 1fr;gap:2px 10px}
    #chronopilot-panel .cp-small{font-size:12px;color:#999}
  `;
    document.head.append(style);
}
function checkbox(label, checked, onChange) {
    const row = document.createElement('label');
    const text = document.createElement('span');
    text.textContent = label;
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    input.addEventListener('change', () => onChange(input.checked));
    row.append(text, input);
    return row;
}
function range(label, value, min, max, format, onChange) {
    const row = document.createElement('label');
    const text = document.createElement('span');
    const output = document.createElement('span');
    output.textContent = `${label}: ${format(value)}`;
    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.value = String(value);
    input.addEventListener('input', () => {
        const next = Number(input.value);
        output.textContent = `${label}: ${format(next)}`;
        onChange(next);
    });
    text.append(output);
    row.append(text, input);
    return row;
}
export function mountChronoPilotPanel(controller) {
    injectStyle();
    const root = document.createElement('section');
    root.id = 'chronopilot-panel';
    root.dataset.active = 'false';
    root.innerHTML = `
    <header class="cp-head"><div><div class="cp-brand">ChronoPilot</div><div class="cp-small">Mage assist</div></div><div class="cp-status"><span class="cp-dot"></span><span class="cp-state">Paused</span></div></header>
    <div class="cp-body"><nav class="cp-tabs"></nav><div class="cp-views"></div><div class="cp-decision"><div class="cp-small">Last decision</div><div class="cp-action">Waiting</div><div class="cp-reason">Start Assist when you are ready.</div></div><div class="cp-actions"><button class="cp-pause">Emergency pause</button><button class="cp-toggle cp-start">Start assist</button></div></div>
  `;
    document.body.append(root);
    const tabs = root.querySelector('.cp-tabs');
    const views = root.querySelector('.cp-views');
    const persist = () => saveSettings(controller.settings);
    const sections = [];
    const overview = document.createElement('div');
    const rotationField = document.createElement('fieldset');
    rotationField.innerHTML = '<legend>Rotation</legend>';
    const rotationRow = document.createElement('label');
    rotationRow.innerHTML = '<span>Combat profile</span>';
    const rotationSelect = document.createElement('select');
    for (const [value, label] of [
        ['auto', 'Auto-detect talents'],
        ['chronomancy-healer', 'Chronomancy healer'],
        ['frost-pve', 'Frost PvE DPS'],
    ]) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        option.selected = controller.settings.assistProfile === value;
        rotationSelect.append(option);
    }
    rotationSelect.addEventListener('change', () => {
        controller.settings.assistProfile = rotationSelect.value;
        persist();
    });
    rotationRow.append(rotationSelect);
    const rotationNote = document.createElement('p');
    rotationNote.className = 'cp-small';
    rotationNote.textContent = 'Frost has independent PvE DPS rules and ignores the saved Chronomancy healing thresholds.';
    rotationField.append(rotationRow, rotationNote);
    const profileField = document.createElement('fieldset');
    profileField.innerHTML = '<legend>Group context</legend>';
    const profileRow = document.createElement('label');
    profileRow.innerHTML = '<span>Context</span>';
    const profileSelect = document.createElement('select');
    for (const [value, label] of [
        ['auto', 'Auto-detect'],
        ['solo', 'Solo Questing'],
        ['party', 'Party'],
        ['raid', 'Raid'],
        ['pvp', 'PvP / Arena'],
    ]) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        option.selected = controller.settings.mode === value;
        profileSelect.append(option);
    }
    profileSelect.addEventListener('change', () => {
        controller.settings.mode = profileSelect.value;
        persist();
    });
    profileRow.append(profileSelect);
    const profileNote = document.createElement('p');
    profileNote.className = 'cp-small';
    profileNote.textContent = 'Auto-detect chooses Solo, Party, Raid, or active PvP context rules.';
    profileField.append(profileRow, profileNote);
    const moduleField = document.createElement('fieldset');
    moduleField.innerHTML = '<legend>Modules</legend>';
    for (const [key, label] of MODULES) {
        moduleField.append(checkbox(label, controller.settings.modules[key], (value) => {
            controller.settings.modules[key] = value;
            if (key === 'resurrection') {
                controller.settings.abilities.temporal_reversal = value;
                controller.settings.abilities.collective_reversal = value;
            }
            persist();
        }));
    }
    overview.append(rotationField, profileField, moduleField);
    sections.push(['overview', 'Overview', overview]);
    const frost = document.createElement('div');
    const frostField = document.createElement('fieldset');
    frostField.innerHTML = '<legend>Frost PvE</legend>';
    const percent = (value) => `${value}%`;
    frostField.append(checkbox('Smart Frost procs', controller.settings.frost.smartProcs, (value) => { controller.settings.frost.smartProcs = value; persist(); }), checkbox('Smart Glacial burst', controller.settings.frost.smartGlacialBurst, (value) => { controller.settings.frost.smartGlacialBurst = value; persist(); }), checkbox('Icy Veins on durable targets', controller.settings.frost.icyVeinsDurableOnly, (value) => { controller.settings.frost.icyVeinsDurableOnly = value; persist(); }), checkbox('Icebind PvE packs', controller.settings.frost.useIcebindPve, (value) => { controller.settings.frost.useIcebindPve = value; persist(); }), range('Frozen Orb enemies', controller.settings.frost.frozenOrbEnemyCount, 2, 8, String, (value) => { controller.settings.frost.frozenOrbEnemyCount = value; persist(); }), range('Blizzard enemies', controller.settings.frost.blizzardEnemyCount, 2, 8, String, (value) => { controller.settings.frost.blizzardEnemyCount = value; persist(); }), range('Glacial Front enemies', controller.settings.frost.glacialFrontEnemyCount, 2, 8, String, (value) => { controller.settings.frost.glacialFrontEnemyCount = value; persist(); }), range('Conserve Frost mana', controller.settings.frost.conserveManaPct * 100, 0, 80, percent, (value) => { controller.settings.frost.conserveManaPct = value / 100; persist(); }), range('Stop Frost damage', controller.settings.frost.stopDamageManaPct * 100, 0, 50, percent, (value) => { controller.settings.frost.stopDamageManaPct = value / 100; persist(); }), range('Frost Aetherwell', controller.settings.frost.aetherwellManaPct * 100, 5, 80, percent, (value) => { controller.settings.frost.aetherwellManaPct = value / 100; persist(); }), range('Frostveil below', controller.settings.frost.barrierHpPct * 100, 20, 100, percent, (value) => { controller.settings.frost.barrierHpPct = value / 100; persist(); }), range('Cold Coffin below', controller.settings.frost.iceBlockHpPct * 100, 10, 60, percent, (value) => { controller.settings.frost.iceBlockHpPct = value / 100; persist(); }));
    const frostNote = document.createElement('p');
    frostNote.className = 'cp-small';
    frostNote.textContent = 'Blizzard is placed at the densest safe cluster. Glacial Front is held to its automatic full release; movement and facing remain manual.';
    frostField.append(frostNote);
    frost.append(frostField);
    sections.push(['frost', 'Frost PvE', frost]);
    const healing = document.createElement('div');
    const editorField = document.createElement('fieldset');
    editorField.innerHTML = '<legend>Preset editor</legend>';
    const editorRow = document.createElement('label');
    editorRow.innerHTML = '<span>Edit rules for</span>';
    const editorSelect = document.createElement('select');
    for (const [value, label] of CONTEXTS) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        editorSelect.append(option);
    }
    editorRow.append(editorSelect);
    editorField.append(editorRow);
    healing.append(editorField);
    const profileFields = new Map();
    for (const [context, label, maxAllies] of CONTEXTS) {
        const profile = controller.settings.profiles[context];
        const field = document.createElement('fieldset');
        field.innerHTML = `<legend>${label} rules</legend>`;
        field.hidden = context !== 'solo';
        field.append(range('Temporal Mend', profile.mendHpPct * 100, 30, 95, percent, (value) => { profile.mendHpPct = value / 100; persist(); }), range('Temporal Barrier', profile.barrierHpPct * 100, 30, 100, percent, (value) => { profile.barrierHpPct = value / 100; persist(); }), range('Emergency heal', profile.emergencyHpPct * 100, 15, 80, percent, (value) => { profile.emergencyHpPct = value / 100; persist(); }), range('Cascade below', profile.cascadeHpPct * 100, 50, 100, percent, (value) => { profile.cascadeHpPct = value / 100; persist(); }), range('Cascade ally count', profile.cascadeCount, 1, maxAllies, String, (value) => { profile.cascadeCount = value; persist(); }), range('Mass Barrier below', profile.massBarrierHpPct * 100, 40, 95, percent, (value) => { profile.massBarrierHpPct = value / 100; persist(); }), range('Mass Barrier ally count', profile.massBarrierCount, 1, maxAllies, String, (value) => { profile.massBarrierCount = value; persist(); }), range('Rewind recent loss', profile.rewindLossPct * 100, 5, 60, percent, (value) => { profile.rewindLossPct = value / 100; persist(); }), range('Rewind ally count', profile.rewindCount, 1, maxAllies, String, (value) => { profile.rewindCount = value; persist(); }), range('Conserve mana below', profile.conserveManaPct * 100, 0, 80, percent, (value) => { profile.conserveManaPct = value / 100; persist(); }), range('Stop damage below', profile.stopDamageManaPct * 100, 0, 60, percent, (value) => { profile.stopDamageManaPct = value / 100; persist(); }));
        profileFields.set(context, field);
        healing.append(field);
    }
    editorSelect.addEventListener('change', () => {
        for (const [context, field] of profileFields)
            field.hidden = editorSelect.value !== context;
    });
    const manaField = document.createElement('fieldset');
    manaField.innerHTML = '<legend>Shared mana and damage rules</legend>';
    manaField.append(range('Aetherwell mana', controller.settings.thresholds.aetherwellManaPct * 100, 10, 70, percent, (value) => { controller.settings.thresholds.aetherwellManaPct = value / 100; persist(); }), checkbox('Smart Power Echo rescue', controller.settings.thresholds.smartPowerEcho, (value) => { controller.settings.thresholds.smartPowerEcho = value; persist(); }), checkbox('Smart Perfect Moment healing', controller.settings.thresholds.smartPerfectMoment, (value) => { controller.settings.thresholds.smartPerfectMoment = value; persist(); }), checkbox('Smart Surge charges', controller.settings.thresholds.smartSurgeCharges, (value) => { controller.settings.thresholds.smartSurgeCharges = value; persist(); }), range('Maximum Surge charges', controller.settings.thresholds.maxSurgeCharges, 1, 4, (value) => String(value), (value) => { controller.settings.thresholds.maxSurgeCharges = value; persist(); }), range('Minimum Surge charges', controller.settings.thresholds.lowManaMaxSurgeCharges, 1, 4, (value) => String(value), (value) => { controller.settings.thresholds.lowManaMaxSurgeCharges = value; persist(); }), range('Aetherburst enemies', controller.settings.thresholds.aoeEnemyCount, 2, 6, (value) => String(value), (value) => { controller.settings.thresholds.aoeEnemyCount = value; persist(); }));
    const manaNote = document.createElement('p');
    manaNote.className = 'cp-small';
    manaNote.textContent = 'Power Echo repeats an emergency Mend. Perfect Moment opens repeated full-charge Darts only while safe Echo/Cascade targets need healing. Smart Surge dynamically chooses between Minimum and Maximum from mana and group health.';
    manaField.append(manaNote);
    healing.append(manaField);
    const potionField = document.createElement('fieldset');
    potionField.innerHTML = '<legend>Combat potions</legend>';
    potionField.append(checkbox('Use health potions', controller.settings.consumables.healthPotion, (value) => { controller.settings.consumables.healthPotion = value; persist(); }), range('Health potion below', controller.settings.consumables.healthPotionHpPct * 100, 10, 70, percent, (value) => { controller.settings.consumables.healthPotionHpPct = value / 100; persist(); }), checkbox('Use mana potions', controller.settings.consumables.manaPotion, (value) => { controller.settings.consumables.manaPotion = value; persist(); }), range('Mana potion below', controller.settings.consumables.manaPotionManaPct * 100, 5, 60, percent, (value) => { controller.settings.consumables.manaPotionManaPct = value / 100; persist(); }));
    const potionNote = document.createElement('p');
    potionNote.className = 'cp-small';
    potionNote.textContent = 'The highest available potion tier is used. Health and mana potions share one cooldown, so critical health wins. Food and drinking stay manual out of combat.';
    potionField.append(potionNote);
    healing.append(potionField);
    sections.push(['healing', 'Healing', healing]);
    const skills = document.createElement('div');
    const skillField = document.createElement('fieldset');
    skillField.innerHTML = '<legend>Chronomancy abilities</legend>';
    const skillGrid = document.createElement('div');
    skillGrid.className = 'cp-grid';
    const frostSkillField = document.createElement('fieldset');
    frostSkillField.innerHTML = '<legend>Frost PvE abilities</legend>';
    const frostSkillGrid = document.createElement('div');
    frostSkillGrid.className = 'cp-grid';
    for (const [id, label] of FROST_ABILITIES) {
        frostSkillGrid.append(checkbox(label, controller.settings.frostAbilities[id], (value) => {
            controller.settings.frostAbilities[id] = value;
            persist();
        }));
    }
    frostSkillField.append(frostSkillGrid);
    skills.append(frostSkillField);
    for (const [id, label] of CHRONO_ABILITIES) {
        skillGrid.append(checkbox(label, controller.settings.abilities[id], (value) => {
            if (id === 'temporal_reversal' || id === 'collective_reversal') {
                controller.settings.modules.resurrection = value;
                controller.settings.abilities.temporal_reversal = value;
                controller.settings.abilities.collective_reversal = value;
            }
            else {
                controller.settings.abilities[id] = value;
            }
            persist();
        }));
    }
    skillField.append(skillGrid);
    skills.append(skillField);
    sections.push(['skills', 'Skills', skills]);
    const targeting = document.createElement('div');
    const targetField = document.createElement('fieldset');
    targetField.innerHTML = '<legend>Targeting</legend>';
    const enemyRow = document.createElement('label');
    enemyRow.innerHTML = '<span>Enemy mode</span>';
    const enemySelect = document.createElement('select');
    for (const [value, label] of [
        ['tank-target', "Tank's target"],
        ['assist-member-target', "Assisted member's target"],
        ['current-target', 'Current target'],
        ['lowest-hp', 'Lowest-HP enemy'],
        ['closest-engaged', 'Closest engaged enemy'],
        ['closest-in-range', 'Closest enemy in range'],
    ]) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        option.selected = controller.settings.targeting.enemyMode === value;
        enemySelect.append(option);
    }
    enemySelect.addEventListener('change', () => {
        controller.settings.targeting.enemyMode = enemySelect.value;
        persist();
    });
    enemyRow.append(enemySelect);
    const assistRow = document.createElement('label');
    assistRow.innerHTML = '<span>Assist member</span>';
    const assistSelect = document.createElement('select');
    const refreshAssistMembers = () => {
        const selected = controller.settings.targeting.assistMemberId;
        assistSelect.replaceChildren();
        const automatic = document.createElement('option');
        automatic.value = '';
        automatic.textContent = 'Auto-detect tank';
        assistSelect.append(automatic);
        for (const member of controller.partyMembers()) {
            const option = document.createElement('option');
            option.value = String(member.id);
            option.textContent = `${member.name}${member.role ? ` (${member.role})` : ''}`;
            assistSelect.append(option);
        }
        assistSelect.value = selected === null ? '' : String(selected);
    };
    refreshAssistMembers();
    assistSelect.addEventListener('change', () => {
        controller.settings.targeting.assistMemberId = assistSelect.value === '' ? null : Number(assistSelect.value);
        persist();
    });
    assistRow.append(assistSelect);
    targetField.append(enemyRow, assistRow, range('Target range', controller.settings.targeting.maxTargetRange, 5, 30, (value) => `${value} yd`, (value) => { controller.settings.targeting.maxTargetRange = value; persist(); }), checkbox('Attack new enemies in Solo Questing', controller.settings.targeting.autoPull, (value) => { controller.settings.targeting.autoPull = value; persist(); }), checkbox('Keep Echo on tank (off = adaptive rescue)', controller.settings.targeting.keepEchoOnTank, (value) => { controller.settings.targeting.keepEchoOnTank = value; persist(); }), checkbox('Party and raid targets only', controller.settings.targeting.partyOnly, (value) => { controller.settings.targeting.partyOnly = value; persist(); }), checkbox('Natural stream targeting', controller.settings.targeting.streamTargetSelection, (value) => { controller.settings.targeting.streamTargetSelection = value; persist(); }));
    const targetNote = document.createElement('p');
    targetNote.className = 'cp-small';
    targetNote.textContent = 'ChronoPilot leaves its latest ally selected while healing and switches to an enemy only when it attacks. Cutscenes never trigger target switching.';
    targetField.append(targetNote);
    targeting.append(targetField);
    sections.push(['targeting', 'Targeting', targeting]);
    const safety = document.createElement('div');
    const safetyField = document.createElement('fieldset');
    safetyField.innerHTML = '<legend>Safety</legend>';
    safetyField.append(range('Manual pause', controller.settings.safety.manualOverrideMs / 100, 1, 50, (value) => `${(value / 10).toFixed(1)} sec`, (value) => { controller.settings.safety.manualOverrideMs = value * 100; persist(); }), checkbox('Enable PvP / Arena assist', controller.settings.pvp.enabled, (value) => { controller.settings.pvp.enabled = value; controller.settings.safety.disableInPvp = !value; persist(); }), range('PvP maximum Surge charges', controller.settings.pvp.maxSurgeCharges, 1, 4, String, (value) => { controller.settings.pvp.maxSurgeCharges = value; persist(); }), range('PvP minimum Surge charges', controller.settings.pvp.minSurgeCharges, 1, 4, String, (value) => { controller.settings.pvp.minSurgeCharges = value; persist(); }), range('PvP Ice Block below', controller.settings.pvp.iceBlockHpPct * 100, 10, 60, percent, (value) => { controller.settings.pvp.iceBlockHpPct = value / 100; persist(); }), checkbox('Blink out of roots', controller.settings.pvp.blinkOnRoot, (value) => { controller.settings.pvp.blinkOnRoot = value; persist(); }), range('PvP Hourglass rescue', controller.settings.pvp.hourglassHpPct * 100, 10, 50, percent, (value) => { controller.settings.pvp.hourglassHpPct = value / 100; persist(); }));
    const limits = document.createElement('p');
    limits.className = 'cp-small';
    limits.textContent = 'PvP uses aggressive Smart Surge limits, skips resurrection entirely, and never automates camera, loot, chat, trades, mail, or economy actions.';
    safetyField.append(limits);
    safety.append(safetyField);
    sections.push(['safety', 'Safety', safety]);
    for (const [id, label, view] of sections) {
        view.className = 'cp-view';
        view.dataset.view = id;
        view.hidden = id !== 'overview';
        views.append(view);
        const button = document.createElement('button');
        button.textContent = label;
        button.dataset.tab = id;
        button.dataset.selected = String(id === 'overview');
        button.addEventListener('click', () => {
            if (id === 'targeting')
                refreshAssistMembers();
            for (const candidate of root.querySelectorAll('[data-tab]')) {
                candidate.dataset.selected = String(candidate === button);
            }
            for (const candidate of root.querySelectorAll('[data-view]')) {
                candidate.hidden = candidate.dataset.view !== id;
            }
        });
        tabs.append(button);
    }
    const toggle = root.querySelector('.cp-toggle');
    const pause = root.querySelector('.cp-pause');
    toggle.addEventListener('click', () => controller.toggle());
    pause.addEventListener('click', () => controller.stop('Emergency pause pressed.'));
    const head = root.querySelector('.cp-head');
    let drag = null;
    head.addEventListener('pointerdown', (event) => {
        const rect = root.getBoundingClientRect();
        drag = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };
        head.setPointerCapture(event.pointerId);
    });
    head.addEventListener('pointermove', (event) => {
        if (!drag)
            return;
        root.style.left = `${Math.max(0, drag.left + event.clientX - drag.x)}px`;
        root.style.top = `${Math.max(0, drag.top + event.clientY - drag.y)}px`;
        root.style.right = 'auto';
    });
    head.addEventListener('pointerup', () => { drag = null; });
    const update = (status) => {
        root.dataset.active = String(status.active);
        const modeLabel = CONTEXTS.find(([mode]) => mode === status.detectedMode)?.[1] ?? status.detectedMode;
        const profileLabel = status.detectedProfile === 'frost-pve' ? 'Frost DPS' : 'Chrono Heal';
        root.querySelector('.cp-state').textContent = status.active
            ? `Active · ${profileLabel} · ${modeLabel}`
            : 'Paused';
        const decision = status.decision;
        let actionText = 'Waiting';
        if (decision.type === 'cast') {
            actionText = ABILITY_LABELS.get(decision.abilityId) ?? decision.abilityId;
        }
        else if (decision.type === 'cast-at') {
            actionText = `Place ${ABILITY_LABELS.get(decision.abilityId) ?? decision.abilityId}`;
        }
        else if (decision.type === 'target') {
            actionText = `Target ${decision.targetId}`;
        }
        else if (decision.type === 'use-item') {
            actionText = `Use ${decision.itemId.replaceAll('_', ' ')}`;
        }
        root.querySelector('.cp-action').textContent = actionText;
        root.querySelector('.cp-reason').textContent = status.decision.reason;
        toggle.textContent = status.active ? 'Stop assist' : 'Start assist';
        toggle.className = `cp-toggle ${status.active ? 'cp-stop' : 'cp-start'}`;
    };
    update(controller.status);
    return { element: root, update, destroy: () => root.remove() };
}
