import { type MountedChronoPilot } from './index.js';
import type { WocWorldLike } from './woc-adapter.js';
interface DesktopSettingUpdate {
    path?: string;
    value?: unknown;
}
interface DesktopCommand {
    type: 'start' | 'stop' | 'toggle' | 'update-setting' | 'update-settings';
    path?: string;
    value?: unknown;
    updates?: DesktopSettingUpdate[];
}
interface DesktopSnapshot {
    ready: boolean;
    status?: MountedChronoPilot['controller']['status'];
    settings?: MountedChronoPilot['controller']['settings'];
    partyMembers?: ReturnType<MountedChronoPilot['controller']['partyMembers']>;
}
interface ChronoPilotDesktopApi {
    command(command: DesktopCommand): boolean;
    snapshot(): DesktopSnapshot;
}
declare global {
    interface Window {
        __game?: {
            world?: WocWorldLike;
        };
        __chronopilot?: MountedChronoPilot;
        __chronopilotBootstrapInstalled?: boolean;
        __chronopilotApi?: ChronoPilotDesktopApi;
    }
}
export {};
