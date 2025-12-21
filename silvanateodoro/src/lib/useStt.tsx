import { useEffect, useState, useRef } from "react";
import {
  isAvailable,
  requestPermission,
  startListening,
  stopListening,
  onResult,
  onStateChange,
  onError,
} from "tauri-plugin-stt-api";

export function useStt() {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<any | null>(null);
  const latestTranscript = useRef<string>("");

  useEffect(() => {
    (async () => {
      try {
        const res = await isAvailable();
        setAvailable(res.available);
      } catch (e) {
        setAvailable(false);
      }
    })();
  }, []);

  useEffect(() => {
    let unlistenResult: any = null;
    let unlistenState: any = null;
    let unlistenError: any = null;

    (async () => {
      try {
        unlistenResult = await onResult((r) => {
          // keep a reference; consumers can listen via returned callbacks too
          latestTranscript.current = r.transcript;
        });
      } catch (e) {}

      try {
        unlistenState = await onStateChange((s) => {
          setListening(s.state === "listening");
        });
      } catch (e) {}

      try {
        unlistenError = await onError((e) => {
          setError(e);
        });
      } catch (e) {}
    })();

    return () => {
      try { if (typeof unlistenResult === 'function') unlistenResult(); } catch {}
      try { if (typeof unlistenState === 'function') unlistenState(); } catch {}
      try { if (typeof unlistenError === 'function') unlistenError(); } catch {}
    };
  }, []);

  async function ensurePermission() {
    const perm = await requestPermission();
    return perm;
  }

  async function start(config?: { language?: string; interimResults?: boolean; continuous?: boolean; maxDuration?: number; onDevice?: boolean; }) {
    try {
      await ensurePermission();
      await startListening(config ?? { language: "pt-BR", interimResults: true, continuous: false });
    } catch (e) {
      setError(e);
      throw e;
    }
  }

  async function stop() {
    try {
      await stopListening();
    } catch (e) {
      setError(e);
      throw e;
    }
  }

  return {
    available,
    listening,
    error,
    latestTranscript,
    start,
    stop,
    ensurePermission,
  };
}
