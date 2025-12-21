import React, { createContext, useContext, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
};

type ConfirmContextType = {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({});
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  function confirm(opts: ConfirmOptions) {
    setOptions(opts);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      // set resolver to the resolve function
      setResolver(() => resolve as (value: boolean) => void);
    });
  }

  function handleClose(result: boolean) {
    setOpen(false);
    if (resolver) {
      resolver(result);
      setResolver(null);
    }
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Dialog open={open} onClose={() => handleClose(false)}>
        <DialogTitle>{options.title ?? 'Confirmação'}</DialogTitle>
        <DialogContent>
          <DialogContentText>{options.description ?? 'Deseja prosseguir?'}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleClose(false)}>{options.cancelText ?? 'Cancelar'}</Button>
          <Button onClick={() => handleClose(true)} variant="contained" color="error">{options.confirmText ?? 'Confirmar'}</Button>
        </DialogActions>
      </Dialog>
    </ConfirmContext.Provider>
  );
}
