const bridge = window.chronopilotDesktop;
let latest = { ready: false };
const pendingSettings = new Map();

const HEALING_SKILLS = [
  ['arcane_intellect', 'Aether Insight'],
  ['temporal_echo', 'Temporal Echo'],
  ['temporal_mend', 'Temporal Mend'],
  ['temporal_barrier', 'Temporal Barrier'],
  ['temporal_cascade', 'Temporal Cascade'],
  ['temporal_rewind', 'Temporal Rewind'],
  ['mass_barrier', 'Mass Barrier'],
  ['power_echo', 'Power Echo'],
  ['temporal_reversal', 'Temporal Reversal'],
  ['collective_reversal', 'Collective Reversal'],
  ['perfect_moment', 'Perfect Moment'],
  ['counterspell', 'Counterspell'],
];
const FROST_SKILLS = [
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
  ['power_echo', 'Power Echo'],
  ['presence_of_mind', 'Racing Mind'],
  ['rune_of_power', 'Rune of Power'],
  ['counterspell', 'Spellbreak'],
  ['ice_block', 'Cold Coffin'],
  ['evocation', 'Aetherwell / Evocation'],
  ['frost_nova', 'Icebind'],
];
const PVP_SKILLS = [
  ['ice_block', 'Ice Block / Cold Coffin'],
  ['blink', 'Blink / Flickerstep'],
  ['frost_nova', 'Icebind'],
  ['polymorph', 'Polymorph / Bewitch'],
  ['counterspell', 'Counterspell / Spellbreak'],
  ['temporal_hourglass', 'Hourglass of Suspension'],
  ['temporal_acceleration', 'Temporal Acceleration'],
];
const DAMAGE_SKILLS = [
  ['arcane_surge', 'Arcane Surge'],
  ['arcane_missiles', 'Aether Darts'],
  ['arcane_explosion', 'Arcane Explosion'],
  ['evocation', 'Aetherwell / Evocation'],
];
function createSkillToggles(containerId, skills, settingsRoot = 'abilities') {
  const container = document.getElementById(containerId);
  for (const [id, label] of skills) {
    const row = document.createElement('label');
    row.className = 'skill';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.dataset.path = `${settingsRoot}.${id}`;
    const span = document.createElement('span');
    span.textContent = label;
    row.append(input, span);
    container.append(row);
  }
}

createSkillToggles('healing-skills', HEALING_SKILLS);
createSkillToggles('damage-skills', DAMAGE_SKILLS);
createSkillToggles('pvp-skills', PVP_SKILLS);
createSkillToggles('frost-skills', FROST_SKILLS, 'frostAbilities');

function getPath(object, path) {
  return path.split('.').reduce((value, key) => value?.[key], object);
}

function setPath(object, path, value) {
  const parts = path.split('.');
  const key = parts.pop();
  if (!key) return false;
  let cursor = object;
  for (const part of parts) {
    if (!cursor?.[part] || typeof cursor[part] !== 'object') return false;
    cursor = cursor[part];
  }
  cursor[key] = value;
  return true;
}

function fieldPath(element) {
  if (element.dataset.profile) {
    return `profiles.${document.getElementById('profile-editor').value}.${element.dataset.profile}`;
  }
  return element.dataset.path;
}

function displayRange(input) {
  const scale = Number(input.dataset.scale || 1);
  const suffix = input.dataset.suffix || '';
  const shown = scale === 1 ? Number(input.value) : Math.round(Number(input.value));
  const output = input.closest('.range-row')?.querySelector('.range-value');
  if (output) output.textContent = `${shown}${suffix}`;
}

function valueFromField(element) {
  if (element.type === 'checkbox') return element.checked;
  if (element.dataset.nullableNumber) return element.value === '' ? null : Number(element.value);
  if (element.type === 'range' || element.type === 'number') {
    const scale = Number(element.dataset.scale || 1);
    return Number(element.value) / scale;
  }
  return element.value;
}

async function commitSettings(updates) {
  for (const { path, value } of updates) {
    pendingSettings.set(path, value);
    if (latest.settings) setPath(latest.settings, path, value);
  }
  if (latest.settings) {
    for (const element of document.querySelectorAll('[data-path], [data-profile]')) {
      hydrateField(element, latest.settings);
    }
  }
  let accepted = false;
  try {
    accepted = await bridge.command({ type: 'update-settings', updates });
  } catch {
    accepted = false;
  }
  if (!accepted) {
    for (const { path } of updates) pendingSettings.delete(path);
  }
}

async function commitSetting(path, value) {
  await commitSettings([{ path, value }]);
}

function updateField(element) {
  const path = fieldPath(element);
  if (!path) return;
  const value = valueFromField(element);
  if (
    path === 'abilities.temporal_reversal' ||
    path === 'abilities.collective_reversal' ||
    path === 'modules.resurrection'
  ) {
    void commitSettings([
      { path: 'abilities.temporal_reversal', value },
      { path: 'abilities.collective_reversal', value },
      { path: 'modules.resurrection', value },
    ]);
    return;
  }
  void commitSetting(path, value);
}

function bindSettingsFields() {
  for (const element of document.querySelectorAll('[data-path], [data-profile]')) {
    element.addEventListener('change', () => { void updateField(element); });
    if (element.type === 'range') element.addEventListener('input', () => displayRange(element));
  }
}

function populatePartySelect(id, firstLabel, selectedValue) {
  const select = document.getElementById(id);
  const members = latest.partyMembers || [];
  const signature = members.map((member) => `${member.id}:${member.name}:${member.role || ''}`).join('|');
  if (select.dataset.signature !== signature) {
    select.replaceChildren();
    const first = document.createElement('option');
    first.value = '';
    first.textContent = firstLabel;
    select.append(first);
    for (const member of members) {
      const option = document.createElement('option');
      option.value = String(member.id);
      option.textContent = `${member.name}${member.role ? ` · ${member.role}` : ''}`;
      select.append(option);
    }
    select.dataset.signature = signature;
  }
  select.value = selectedValue == null ? '' : String(selectedValue);
}

function hydrateField(element, settings) {
  const path = fieldPath(element);
  const value = getPath(settings, path);
  if (value === undefined || document.activeElement === element) return;
  if (element.type === 'checkbox') element.checked = Boolean(value);
  else if (element.type === 'range') {
    element.value = String(Number(value) * Number(element.dataset.scale || 1));
    displayRange(element);
  } else element.value = value == null ? '' : String(value);
}

function decisionLabel(decision) {
  if (!decision) return 'Waiting';
  if (decision.type === 'cast') return `Cast ${decision.abilityId.replaceAll('_', ' ')}`;
  if (decision.type === 'cast-at') return `Place ${decision.abilityId.replaceAll('_', ' ')}`;
  if (decision.type === 'target') return `Target #${decision.targetId}`;
  if (decision.type === 'use-item') return `Use ${decision.itemId.replaceAll('_', ' ')}`;
  return 'Hold';
}

function render(snapshot) {
  latest = snapshot || { ready: false };
  const ready = Boolean(latest.ready && latest.settings && latest.status);
  const connection = document.getElementById('connection');
  const startStop = document.getElementById('start-stop');
  startStop.disabled = !ready;
  connection.textContent = ready ? 'Connected to the game · settings saved locally' : 'Waiting for login and game world…';
  if (!ready) return;

  for (const [path, value] of pendingSettings) {
    if (Object.is(getPath(latest.settings, path), value)) pendingSettings.delete(path);
    else setPath(latest.settings, path, value);
  }

  const active = latest.status.active;
  startStop.textContent = active ? 'STOP ASSIST' : 'START ASSIST';
  startStop.classList.toggle('stop', active);
  const profile = latest.status.detectedProfile === 'frost-pve' ? 'FROST DPS' : 'CHRONO HEAL';
  document.getElementById('detected-mode').textContent = `${profile} · ${latest.status.detectedMode.toUpperCase()}`;
  document.getElementById('decision-title').textContent = active ? decisionLabel(latest.status.decision) : 'Paused';
  document.getElementById('decision-reason').textContent = latest.status.decision?.reason || 'Ready.';

  for (const element of document.querySelectorAll('[data-path], [data-profile]')) {
    hydrateField(element, latest.settings);
  }
  populatePartySelect('tank-select', 'Auto-detect', latest.settings.targeting.assignedTankId);
  populatePartySelect('assist-select', 'None', latest.settings.targeting.assistMemberId);
  if (!capturingHotkey) {
    document.getElementById('hotkey-capture').textContent = latest.settings.safety.toggleHotkey || '[';
  }
}

let capturingHotkey = false;
bindSettingsFields();
document.getElementById('profile-editor').addEventListener('change', () => render(latest));
document.getElementById('start-stop').addEventListener('click', () => {
  void bridge.command({ type: latest.status?.active ? 'stop' : 'start' });
});
document.getElementById('pin').addEventListener('change', (event) => bridge.setPinned(event.target.checked));
document.getElementById('hide').addEventListener('click', () => bridge.hide());
document.getElementById('hotkey-capture').addEventListener('click', (event) => {
  capturingHotkey = true;
  event.currentTarget.textContent = 'Press a key…';
});
document.addEventListener('keydown', (event) => {
  if (!capturingHotkey) return;
  event.preventDefault();
  event.stopPropagation();
  if (event.key === 'Escape') {
    capturingHotkey = false;
    render(latest);
    return;
  }
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(event.key)) return;
  const key = event.key.length === 1 ? event.key : event.key;
  capturingHotkey = false;
  document.getElementById('hotkey-capture').textContent = key;
  void commitSetting('safety.toggleHotkey', key);
}, true);
for (const tab of document.querySelectorAll('.tab')) {
  tab.addEventListener('click', () => {
    document.querySelector('.tab.active')?.classList.remove('active');
    document.querySelector('.page.active')?.classList.remove('active');
    tab.classList.add('active');
    document.querySelector(`[data-page="${tab.dataset.tab}"]`)?.classList.add('active');
  });
}

bridge.onSnapshot(render);
bridge.ready();
