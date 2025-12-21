import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import { invoke } from '@tauri-apps/api/core';
import { useNotify } from '../lib/Notifications';

type Props = {
  open: boolean;
  onClose: () => void;
  type: 'fornecedor' | 'marca' | 'tag';
  onCreated?: (item: any) => void;
};

export default function CreateEntityDialog({ open, onClose, type, onCreated }: Props){
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cnpj, setCnpj] = useState('');
  const notify = useNotify();

  useEffect(()=>{
    if(open){ setNome(''); setDescricao(''); setNomeFantasia(''); setCnpj(''); }
  },[open]);

  async function handleCreate(){
    try{
      if(type === 'marca'){
        if(!nome || nome.trim().length === 0){ notify.notify({ message: 'Nome da marca é obrigatório', severity: 'error' }); return; }
        const marca = { nome: nome, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        const res: any = await invoke('create_marca', { marca });
        onCreated && onCreated(res);
      } else if(type === 'fornecedor'){
        if(!(nomeFantasia || nome) || (nomeFantasia || nome).trim().length === 0){ notify.notify({ message: 'Nome fantasia é obrigatório', severity: 'error' }); return; }
        const fornecedor = { nome_fantasia: nomeFantasia || nome, nome: nome, cnpj, contato_nome: null, endereco: null, telefone: null, email: null, ativo: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        const res: any = await invoke('create_fornecedor', { fornecedor });
        onCreated && onCreated(res);
      } else if(type === 'tag'){
        if(!nome || nome.trim().length === 0){ notify.notify({ message: 'Nome da tag é obrigatório', severity: 'error' }); return; }
        const tag = { nome, descricao };
        const res: any = await invoke('create_tag', { tag });
        onCreated && onCreated(res);
      }
    }catch(e){
      console.error('create entity', e);
      notify.notify({ message: 'Erro ao criar: ' + (e as any).toString(), severity: 'error' });
    }
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Novo {type}</DialogTitle>
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
        <Button variant="contained" onClick={handleCreate}>Criar</Button>
      </DialogActions>
    </Dialog>
  );
}
