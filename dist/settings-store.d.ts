import type { AssistSettings } from './types.js';
export declare function loadSettings(storage?: Pick<Storage, 'getItem'>): AssistSettings;
export declare function saveSettings(settings: AssistSettings, storage?: Pick<Storage, 'setItem'>): void;
