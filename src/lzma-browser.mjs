// Upstream minified 2.3.2 renames postMessage properties and breaks its public protocol.
import workerURL from "lzma/src/lzma_worker.js?url";
export function createBindingCodec() {
  const worker = new Worker(workerURL),
    pending = new Map();
  let id = 0;
  worker.onmessage = ({ data }) => {
    if (data.action === 3) return;
    const call = pending.get(data.cbn);
    if (!call) return;
    pending.delete(data.cbn);
    clearTimeout(call.timer);
    if (data.error)
      call.reject(new Error(String(data.error.message || data.error)));
    else
      call.resolve(
        typeof data.result === "string"
          ? new TextEncoder().encode(data.result)
          : Uint8Array.from(data.result),
      );
  };
  const stop = (error) => {
    worker.terminate();
    for (const p of pending.values()) {
      clearTimeout(p.timer);
      p.reject(error);
    }
    pending.clear();
  };
  worker.onerror = (e) => stop(new Error(e.message || "LZMA worker failed"));
  const call = (action, data) =>
    new Promise((resolve, reject) => {
      const cbn = ++id;
      const timer = setTimeout(() => stop(new Error("LZMA timeout")), 120000);
      pending.set(cbn, { resolve, reject, timer });
      worker.postMessage({ action, data: Array.from(data), mode: 6, cbn });
    });
  return {
    compress: (data) => call(1, data),
    decompress: (data) => call(2, data),
    close: () => stop(new Error("LZMA worker closed")),
  };
}
