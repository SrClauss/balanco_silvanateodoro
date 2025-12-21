import { useEffect, useState } from "react";
import IconButton from '@mui/material/IconButton';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import { useStt } from "../lib/useStt";

type Props = {
  value: string;
  onChange: (v: string) => void;
  language?: string;
  placeholder?: string;
};

export default function MicrophoneInput({ value, onChange, language = "pt-BR" }: Props) {
  const { available, listening, start, stop, latestTranscript } = useStt();
  const [interim, setInterim] = useState<string>("");

  useEffect(() => {
    // pull interim text from the plugin's last result every 300ms while listening
    let timer: any = null;
    if (listening) {
      timer = setInterval(() => {
        const t = latestTranscript.current;
        setInterim(t ?? "");
      }, 250);
    } else {
      setInterim("");
    }
    return () => clearInterval(timer);
  }, [listening, latestTranscript]);

  useEffect(() => {
    // when interim changes and it's final-like (ends with punctuation or user stopped), we append
    // NOTE: plugin sends isFinal via events; here we keep it simple and append when listening stops
  }, [interim]);

  async function handleToggle() {
    if (!available) return;
    if (listening) {
      await stop();
      // append final transcript if any
      if (latestTranscript.current) {
        onChange((value + " " + latestTranscript.current).trim());
        latestTranscript.current = "";
      }
    } else {
      try {
        await start({ language, interimResults: true, continuous: false });
      } catch (e) {
        console.error("STT start error", e);
      }
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ flex: 1 }}>{/* placeholder for alignment; actual input should be in parent */}</span>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <small style={{ marginRight: 8, color: '#555' }}>{listening ? 'Ouvindo...' : 'Ditar'}</small>
        <IconButton onClick={handleToggle} color={listening ? 'primary' : 'default'} size="large">
          {listening ? <MicOffIcon /> : <MicIcon />}
        </IconButton>
      </div>
    </div>
  );
}
