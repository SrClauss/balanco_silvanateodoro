import { useEffect, useState, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Autocomplete, Chip, Box, Typography, Switch, FormControlLabel } from '@mui/material';
import { invoke } from '@tauri-apps/api/core';
import MicrophoneInput from './MicrophoneInput';
import CreateEntityDialog from './CreateEntityDialog';
import { useNotify } from '../lib/Notifications';
import type { Produto, Tag, Fornecedor, Marca } from '../types/entities';

// resetKey: when parent increments it, the form will reset to empty values (used for "Novo produto")
type Props = { open: boolean; onClose: () => void; product?: Produto | null; onSaved?: () => void; resetKey?: number };

export default function ProductForm({ open, onClose, product, onSaved, resetKey }: Props){
  const [descricao, setDescricao] = useState('');
  const [codigoInterno, setCodigoInterno] = useState('');
  const [tamanho, setTamanho] = useState('');
  const [precoCusto, setPrecoCusto] = useState<number | undefined>(undefined);
  const [precoVenda, setPrecoVenda] = useState<number | undefined>(undefined);

  // string mirrors for inputs: keep user typing as-is, convert to number only when valid
  const [precoCustoStr, setPrecoCustoStr] = useState<string>('');
  const [precoVendaStr, setPrecoVendaStr] = useState<string>('');

  // preserve state across modal close by default. Parent can reset by bumping `resetKey`.
  const initializedForProductRef = useRef<number | null>(null);
  useEffect(()=>{
    // if product changes, initialize to product values
    if(product){
      setDescricao(product.descricao || '');
      setCodigoInterno(product.codigo_interno || '');
      setTamanho(product.tamanho || '');
      setPrecoCusto(product.preco_custo ?? undefined);
      setPrecoVenda(product.preco_venda ?? undefined);
      setPrecoCustoStr(product.preco_custo != null ? String(product.preco_custo) : '');
      setPrecoVendaStr(product.preco_venda != null ? String(product.preco_venda) : '');
      setSelectedFornecedor(product.fornecedor || null);
      setSelectedMarca((product.marca && typeof product.marca === 'string') ? { nome: product.marca } : (product.marca as any) || null);
      setSelectedTags(product.tags || []);
      setUpdateAutomatico(product.update_automatico ?? true);
      initializedForProductRef.current = product._id && typeof product._id === 'string' ? 1 : 1;
    }
  // only when product identity changes
  },[product]);

  // reset when resetKey increments (used for creating a fresh new product)
  const prevResetKey = useRef<number | undefined>(undefined);
  useEffect(()=>{
    if(typeof resetKey !== 'undefined' && resetKey !== prevResetKey.current){
      // clear form when resetKey changes
      setDescricao(''); setCodigoInterno(''); setTamanho(''); setPrecoCusto(undefined); setPrecoVenda(undefined); setPrecoCustoStr(''); setPrecoVendaStr(''); setSelectedFornecedor(null); setSelectedMarca(null); setSelectedTags([]); setItems([]); setUpdateAutomatico(true);
      prevResetKey.current = resetKey;
    }
  },[resetKey]);

  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedFornecedor, setSelectedFornecedor] = useState<Fornecedor | null>(null);
  const [selectedMarca, setSelectedMarca] = useState<Marca | null>(null);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [openCreateFornecedor, setOpenCreateFornecedor] = useState(false);
  const [openCreateMarca, setOpenCreateMarca] = useState(false);

  // update automatico flag (default true)
  const [updateAutomatico, setUpdateAutomatico] = useState<boolean>(true);

  // stock items (item_produto)
  const [items, setItems] = useState<Array<{ id?: string | { $oid?: string }, data_aquisicao: string, quantidade: number }>>([]);

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

  // initialize items when product is present
  useEffect(()=>{
    if(product){
      setItems((product.item_produto || []).map((it:any) => ({ id: (it as any)?._id ?? (it as any).id, data_aquisicao: it.data_aquisicao || '', quantidade: (it.quantidade ?? 0) })))
    }
  },[product]);

  const notify = useNotify();

  async function handleSave(){
    if(!descricao || descricao.trim().length === 0){ notify.notify({ message: 'Descrição é obrigatória', severity: 'warning' }); return; }
    const produto: any = { codigo_interno: codigoInterno, descricao, tamanho, preco_custo: precoCusto, preco_venda: precoVenda, marca: selectedMarca?.nome ?? selectedMarca, fornecedor: selectedFornecedor, tags: selectedTags, item_produto: (items || []).map(it => ({ data_aquisicao: it.data_aquisicao, quantidade: it.quantidade })), update_automatico: updateAutomatico };
    try{
      if(product && product._id){
        // keep id if present — normalize to string if it is { $oid }
        let idVal: string | undefined;
        if (typeof product._id === 'string') {
          idVal = product._id;
        } else if (product._id && typeof product._id === 'object') {
          idVal = (product._id as any).$oid ?? undefined;
        }
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
        <TextField label="Código interno" fullWidth value={codigoInterno} onChange={(e)=>setCodigoInterno(e.currentTarget.value)} sx={{ mb: 2 }} />
        <TextField label="Descrição" fullWidth value={descricao} onChange={(e)=>setDescricao(e.currentTarget.value)} sx={{ mb: 2 }} />
        <MicrophoneInput value={descricao} onChange={(v)=>setDescricao(v)} />
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <TextField label="Tamanho" value={tamanho} onChange={(e)=>setTamanho(e.currentTarget.value)} sx={{ flex: 1 }} />
          <TextField
            label="Preço custo"
            type="number"
            value={precoCustoStr}
            onChange={(e)=>{
              const v = e.currentTarget.value;
              setPrecoCustoStr(v);
              // only update numeric value when parsed number is finite
              const n = v.trim() === '' ? undefined : Number(v);
              setPrecoCusto(Number.isFinite(n as number) ? (n as number) : undefined);
            }}
            onBlur={()=>{
              if(precoCustoStr.trim() === ''){ setPrecoCusto(undefined); return; }
              const n = Number(precoCustoStr);
              if(!Number.isFinite(n)){ setPrecoCusto(undefined); /* optional: reset string to '' or previous valid value */ }
              else setPrecoCusto(n);
            }}
            sx={{ width: 140 }}
            inputProps={{ step: '0.01' }}
          />

          <TextField
            label="Preço venda"
            type="number"
            value={precoVendaStr}
            onChange={(e)=>{
              const v = e.currentTarget.value;
              setPrecoVendaStr(v);
              const n = v.trim() === '' ? undefined : Number(v);
              setPrecoVenda(Number.isFinite(n as number) ? (n as number) : undefined);
            }}
            onBlur={()=>{
              if(precoVendaStr.trim() === ''){ setPrecoVenda(undefined); return; }
              const n = Number(precoVendaStr);
              if(!Number.isFinite(n)){ setPrecoVenda(undefined); }
              else setPrecoVenda(n);
            }}
            sx={{ width: 140 }}
            inputProps={{ step: '0.01' }}
          />
        </Box>

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
          freeSolo
          options={tags}
          getOptionLabel={(o:any)=> typeof o === 'string' ? o : o.nome}
          value={selectedTags}
          onChange={async (_, v) => {
            // v may contain strings (new tags) or Tag objects
            const newTags: any[] = [];
            for(const item of v){
              if(typeof item === 'string'){
                // create tag on the fly
                try{
                  const res: any = await invoke('create_tag', { tag: { nome: item } });
                  const created = res;
                  // update tag options
                  setTags(prev => [...(prev||[]), created]);
                  newTags.push(created);
                }catch(e){
                  console.error('failed create tag', e);
                  // ignore or fallback to string placeholder
                  newTags.push({ nome: item });
                }
              } else {
                newTags.push(item);
              }
            }
            setSelectedTags(newTags);
          }}
          renderTags={(value, getTagProps) =>
            value.map((option: any, index: number) => (
              <Chip variant="outlined" label={option.nome} {...getTagProps({ index })} />
            ))
          }
          renderInput={(params) => <TextField {...params} label="Tags" sx={{ mt: 2 }} />}
        />

        <Box sx={{ mt: 2 }}>
          <FormControlLabel control={<Switch checked={updateAutomatico} onChange={(_, v) => setUpdateAutomatico(v)} />} label="Update automático" sx={{ mb: 1 }} />
          <Typography variant="subtitle1">Itens de estoque</Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>Se nenhum item for adicionado, o sistema assume 1 unidade em estoque automaticamente.</Typography>
          {items.map((it, idx) => (
            <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
              <TextField label="Data aquisição" type="date" value={it.data_aquisicao} onChange={(e)=>{
                const v = e.currentTarget.value;
                setItems(prev => prev.map((p, i) => i === idx ? { ...p, data_aquisicao: v } : p));
              }} sx={{ width: 160 }} InputLabelProps={{ shrink: true }} />
              <TextField label="Quantidade" type="number" value={String(it.quantidade)} onChange={(e)=>{
                const v = e.currentTarget.value;
                const n = v === '' ? 0 : Number(v);
                setItems(prev => prev.map((p, i) => i === idx ? { ...p, quantidade: Number.isFinite(n) ? n : 0 } : p));
              }} sx={{ width: 120 }} />
              <Button onClick={()=> setItems(prev => prev.filter((_, i) => i !== idx))}>Remover</Button>
            </Box>
          ))}
          <Button variant="outlined" onClick={()=> setItems(prev => [...prev, { data_aquisicao: new Date().toISOString().slice(0,10), quantidade: 1 }])}>Adicionar item</Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave}>Salvar</Button>
      </DialogActions>
    </Dialog>
  )
}
