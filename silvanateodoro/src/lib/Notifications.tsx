import React, { createContext, useContext, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';

type NotifyOptions = { message: string; severity?: 'success' | 'error' | 'info' | 'warning' };

type NotifyContextType = {
  notify: (opts: NotifyOptions) => void;
};

const NotifyContext = createContext<NotifyContextType | null>(null);

export function useNotify() {
  const ctx = useContext(NotifyContext);
  if (!ctx) throw new Error('useNotify must be used within NotifyProvider');
  return ctx;
}

export function NotifyProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  function notify(opts: NotifyOptions) {
    setMessage(opts.message);
    setSeverity(opts.severity ?? 'success');
    setOpen(true);
  }

  return (
    <NotifyContext.Provider value={{ notify }}>
      {children}
      <Snackbar open={open} autoHideDuration={3000} onClose={() => setOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setOpen(false)} severity={severity} sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </NotifyContext.Provider>
  );
}
