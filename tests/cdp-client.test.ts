import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { CdpSession, discoverGameTarget, selectGameTarget } = require('../desktop/cdp-client.cjs') as {
  CdpSession: new (url: string, options?: Record<string, unknown>) => {
    evaluate(expression: string): Promise<unknown>;
    close(): void;
  };
  discoverGameTarget(port: number, fetchImpl: typeof fetch): Promise<Record<string, unknown> | null>;
  selectGameTarget(targets: Array<Record<string, unknown>>): Record<string, unknown> | null;
};

describe('official client attachment', () => {
  it('selects the official app page instead of unrelated DevTools targets', () => {
    const selected = selectGameTarget([
      { type: 'page', title: 'DevTools', url: 'devtools://devtools', webSocketDebuggerUrl: 'ws://127.0.0.1:1/a' },
      { type: 'page', title: 'World of ClaudeCraft', url: 'app://worldofclaudecraft/', webSocketDebuggerUrl: 'ws://127.0.0.1:1/game' },
    ]);
    expect(selected?.url).toBe('app://worldofclaudecraft/');
  });

  it('discovers targets only through the loopback endpoint', async () => {
    let requested = '';
    const target = { type: 'page', title: 'World of ClaudeCraft', url: 'app://worldofclaudecraft/', webSocketDebuggerUrl: 'ws://127.0.0.1:9222/game' };
    const fetchImpl = (async (url: string) => {
      requested = url;
      return { ok: true, json: async () => [target] } as Response;
    }) as typeof fetch;
    await expect(discoverGameTarget(9222, fetchImpl)).resolves.toEqual(target);
    expect(requested).toBe('http://127.0.0.1:9222/json/list');
  });

  it('refuses non-local websocket endpoints', () => {
    expect(() => new CdpSession('ws://example.com/devtools/page/1', { WebSocketImpl: class {} }))
      .toThrow('Refusing a non-local DevTools endpoint');
  });

  it('returns Runtime.evaluate values over the local session', async () => {
    class FakeWebSocket {
      readyState = 0;
      listeners = new Map<string, Set<(event: { data?: string }) => void>>();
      constructor(_url: string) {
        queueMicrotask(() => {
          this.readyState = 1;
          this.emit('open', {});
        });
      }
      addEventListener(name: string, callback: (event: { data?: string }) => void) {
        const entries = this.listeners.get(name) ?? new Set();
        entries.add(callback);
        this.listeners.set(name, entries);
      }
      removeEventListener(name: string, callback: (event: { data?: string }) => void) {
        this.listeners.get(name)?.delete(callback);
      }
      emit(name: string, event: { data?: string }) {
        for (const callback of this.listeners.get(name) ?? []) callback(event);
      }
      send(raw: string) {
        const request = JSON.parse(raw) as { id: number };
        queueMicrotask(() => this.emit('message', {
          data: JSON.stringify({ id: request.id, result: { result: { value: 42 } } }),
        }));
      }
      close() {
        this.readyState = 3;
        this.emit('close', {});
      }
    }
    const session = new CdpSession('ws://127.0.0.1:9222/devtools/page/game', {
      WebSocketImpl: FakeWebSocket,
    });
    await expect(session.evaluate('6 * 7')).resolves.toBe(42);
    session.close();
  });
});
