import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Autocomplete, Chip } from '@mui/material';
import { invoke } from '@tauri-apps/api/core';
import MicrophoneInput from './MicrophoneInput';
import CreateEntityDialog from './CreateEntityDialog';
import { useNotify } from '../lib/Notifications';

type Props = { open: boolean; onClose: () => void; product?: any; onSaved?: () => void };

export default function ProductForm({ open, onClose, product, onSaved }: Props){
  const [descricao, setDescricao] = useState('');

  useEffect(()=>{
    if(open && product){
      setDescricao(product.descricao || '');
      setSelectedFornecedor(product.fornecedor || null);
      setSelectedMarca(product.marca ? { nome: product.marca } : null);
      setSelectedTags(product.tags || []);
    } else if(open && !product){
      setDescricao(''); setSelectedFornecedor(null); setSelectedMarca(null); setSelectedTags([]);
    }
  },[open, product]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [marcas, setMarcas] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [selectedFornecedor, setSelectedFornecedor] = useState<any | null>(null);
  const [selectedMarca, setSelectedMarca] = useState<any | null>(null);
  const [selectedTags, setSelectedTags] = useState<any[]>([]);
  const [openCreateFornecedor, setOpenCreateFornecedor] = useState(false);
  const [openCreateMarca, setOpenCreateMarca] = useState(false);

  async function loadOptions(){
    try{
      const f: any = await invoke('list_fornecedores', { page: 1, per_page: 200 });
      const m: any = await invoke('list_marcas', { page: 1, per_page: 200 });
      const t: any = await invoke('list_tags', { page: 1, per_page: 500 });
      setFornecedores(f.items || []);
      setMarcas(m.items || []);
      setTags(t.items || []);
    }catch(e){console.error(e)}
  }

  useEffect(()=>{ if(open) loadOptions(); },[open]);

  const notify = useNotify();

  async function handleSave(){
    if(!descricao || descricao.trim().length === 0){ notify.notify({ message: 'Descrição é obrigatória', severity: 'warning' }); return; }
    const produto: any = { descricao, marca: selectedMarca?.nome ?? selectedMarca, fornecedor: selectedFornecedor, tags: selectedTags };
    try{
      if(product && product._id){
        // keep id if present — normalize to string if it is { $oid }
        const idVal = product._id?.$oid ?? product._id;
        if(idVal) produto._id = idVal;
        await invoke('update_produto', { produto });
        notify.notify({ message: 'Produto atualizado', severity: 'success' });
      } else {
        await invoke('create_produto', { produto });
        notify.notify({ message: 'Produto criado', severity: 'success' });
      }
      onSaved && onSaved();
      onClose();
    }catch(e){ console.error(e); notify.notify({ message: 'Erro ao salvar: ' + (e as any).toString(), severity: 'error' }); }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Novo produto</DialogTitle>
      <DialogContent>
        <TextField label="Descrição" fullWidth value={descricao} onChange={(e)=>setDescricao(e.currentTarget.value)} sx={{ mb: 2 }} />
        <MicrophoneInput value={descricao} onChange={(v)=>setDescricao(v)} />

        <Autocomplete
          options={fornecedores}
          getOptionLabel={(o:any)=> o.nome_fantasia || o.nome}
          value={selectedFornecedor}
          onChange={(_, v)=> setSelectedFornecedor(v)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Fornecedor"
              sx={{ mt: 2 }}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {params.InputProps.endAdornment}
                    <Button size="small" onClick={() => setOpenCreateFornecedor(true)} sx={{ ml: 1 }}>+</Button>
                  </>
                ),
              }}
            />
          )}
        />

        <Autocomplete
          options={marcas}
          getOptionLabel={(o:any)=> o.nome}
          value={selectedMarca}
          onChange={(_, v)=> setSelectedMarca(v)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Marca"
              sx={{ mt: 2 }}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {params.InputProps.endAdornment}
                    <Button size="small" onClick={() => setOpenCreateMarca(true)} sx={{ ml: 1 }}>+</Button>
                  </>
                ),
              }}
            />
          )}
        />

        <CreateEntityDialog open={openCreateFornecedor} onClose={()=>setOpenCreateFornecedor(false)} type="fornecedor" onCreated={(item)=>{ setFornecedores(prev=>[...(prev||[]), item]); setSelectedFornecedor(item); }} />
        <CreateEntityDialog open={openCreateMarca} onClose={()=>setOpenCreateMarca(false)} type="marca" onCreated={(item)=>{ setMarcas(prev=>[...(prev||[]), item]); setSelectedMarca(item); }} />

        <Autocomplete
          multiple
          options={tags}
          getOptionLabel={(o:any)=> o.nome}
          value={selectedTags}
          onChange={(_, v)=> setSelectedTags(v)}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip variant="outlined" label={option.nome} {...getTagProps({ index })} />
            ))
          }
          renderInput={(params) => <TextField {...params} label="Tags" sx={{ mt: 2 }} />}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave}>Salvar</Button>
      </DialogActions>
    </Dialog>
  )
}
