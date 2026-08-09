function selectGameTarget(targets) {
  if (!Array.isArray(targets)) return null;
  const pages = targets.filter((target) => target?.type === 'page' && target.webSocketDebuggerUrl);
  return pages.find((target) => /^app:\/\/worldofclaudecraft(?:\/|$)/i.test(target.url || ''))
    ?? pages.find((target) => /world\s+of\s+claudecraft/i.test(target.title || ''))
    ?? pages.find((target) => /worldofclaudecraft/i.test(target.url || ''))
    ?? null;
}

async function discoverGameTarget(port, fetchImpl = globalThis.fetch) {
  if (!Number.isInteger(port) || port < 1 || port > 65_535) return null;
  if (typeof fetchImpl !== 'function') throw new Error('Fetch is unavailable');
  const response = await fetchImpl(`http://127.0.0.1:${port}/json/list`, {
    signal: AbortSignal.timeout(1_000),
  });
  if (!response.ok) throw new Error(`DevTools endpoint returned ${response.status}`);
  return selectGameTarget(await response.json());
}

class CdpSession {
  constructor(webSocketUrl, { WebSocketImpl = globalThis.WebSocket } = {}) {
    if (typeof WebSocketImpl !== 'function') throw new Error('WebSocket is unavailable');
    const url = new URL(webSocketUrl);
    if (url.protocol !== 'ws:' || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) {
      throw new Error('Refusing a non-local DevTools endpoint');
    }
    url.hostname = '127.0.0.1';
    this.socket = new WebSocketImpl(url.toString());
    this.nextId = 1;
    this.pending = new Map();
    this.closed = false;
    this.opened = new Promise((resolve, reject) => {
      const onOpen = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(new Error('Could not connect to the official client'));
      };
      const cleanup = () => {
        this.socket.removeEventListener('open', onOpen);
        this.socket.removeEventListener('error', onError);
      };
      this.socket.addEventListener('open', onOpen);
      this.socket.addEventListener('error', onError);
    });
    this.socket.addEventListener('message', (event) => this.onMessage(event.data));
    this.socket.addEventListener('close', () => this.onClose());
  }

  onMessage(raw) {
    let message;
    try {
      message = JSON.parse(typeof raw === 'string' ? raw : raw.toString());
    } catch {
      return;
    }
    if (!message.id) return;
    const pending = this.pending.get(message.id);
    if (!pending) return;
    this.pending.delete(message.id);
    if (message.error) pending.reject(new Error(message.error.message || 'DevTools command failed'));
    else pending.resolve(message.result);
  }

  onClose() {
    if (this.closed) return;
    this.closed = true;
    for (const { reject } of this.pending.values()) reject(new Error('Official client disconnected'));
    this.pending.clear();
    this.onDisconnected?.();
  }

  async command(method, params = {}) {
    await this.opened;
    if (this.closed || this.socket.readyState !== 1) throw new Error('Official client disconnected');
    const id = this.nextId++;
    const response = new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
    this.socket.send(JSON.stringify({ id, method, params }));
    return response;
  }

  async evaluate(expression) {
    const result = await this.command('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    });
    if (result?.exceptionDetails) {
      throw new Error(result.exceptionDetails.text || 'Game evaluation failed');
    }
    return result?.result?.value;
  }

  close() {
    if (!this.closed) this.socket.close();
    this.onClose();
  }
}

async function connectToGame(port, options = {}) {
  const target = await discoverGameTarget(port, options.fetchImpl);
  if (!target) return null;
  const session = new CdpSession(target.webSocketDebuggerUrl, options);
  await session.command('Runtime.enable');
  return session;
}

module.exports = {
  CdpSession,
  connectToGame,
  discoverGameTarget,
  selectGameTarget,
};
