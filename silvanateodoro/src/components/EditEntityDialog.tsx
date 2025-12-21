import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import { invoke } from '@tauri-apps/api/core';
import { useNotify } from '../lib/Notifications';

type Props = {
  open: boolean;
  onClose: () => void;
  type: 'fornecedor' | 'marca' | 'tag';
  item?: any;
  onSaved?: (item: any) => void;
};

export default function EditEntityDialog({ open, onClose, type, item, onSaved }: Props){
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cnpj, setCnpj] = useState('');
  const notify = useNotify();

  useEffect(()=>{
    if(open && item){
      setNome(item.nome || '');
      setDescricao(item.descricao || '');
      setNomeFantasia(item.nome_fantasia || '');
      setCnpj(item.cnpj || '');
    }
  },[open, item]);

  async function handleSave(){
    try{
      if(type === 'marca'){
        const marca = { ...item, nome, updated_at: new Date().toISOString() };
        await invoke('update_marca', { marca });
        onSaved && onSaved(marca);
      } else if(type === 'fornecedor'){
        const fornecedor = { ...item, nome_fantasia: nomeFantasia || nome, nome: nome, cnpj, updated_at: new Date().toISOString() };
        await invoke('update_fornecedor', { fornecedor });
        onSaved && onSaved(fornecedor);
      } else if(type === 'tag'){
        const tag = { ...item, nome, descricao };
        await invoke('update_tag', { tag });
        onSaved && onSaved(tag);
      }
      onClose();
    }catch(e){
      console.error('update entity', e);
      notify.notify({ message: 'Erro ao salvar: ' + (e as any).toString(), severity: 'error' });
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Editar {type}</DialogTitle>
      <DialogContent>
        {(type === 'marca' || type === 'tag') && (
          <TextField label={type === 'marca' ? 'Nome da marca' : 'Nome da tag'} fullWidth value={nome} onChange={(e)=>setNome(e.currentTarget.value)} sx={{ mt: 1 }} />
        )}
        {type === 'tag' && (
          <TextField label="Descrição" fullWidth value={descricao} onChange={(e)=>setDescricao(e.currentTarget.value)} sx={{ mt: 2 }} />
        )}
        {type === 'fornecedor' && (
          <>
            <TextField label="Nome fantasia" fullWidth value={nomeFantasia} onChange={(e)=>setNomeFantasia(e.currentTarget.value)} sx={{ mt: 1 }} />
            <TextField label="CNPJ" fullWidth value={cnpj} onChange={(e)=>setCnpj(e.currentTarget.value)} sx={{ mt: 2 }} />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave}>Salvar</Button>
      </DialogActions>
    </Dialog>
  );
}
