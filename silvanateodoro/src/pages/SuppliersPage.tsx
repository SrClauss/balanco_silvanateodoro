import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { List, ListItem, ListItemText, Box, IconButton, Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useConfirm } from '../lib/Confirm';
import { useNotify } from '../lib/Notifications';
import CreateEntityDialog from '../components/CreateEntityDialog';
import EditEntityDialog from '../components/EditEntityDialog';

export default function SuppliersPage(){
  const [items, setItems] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);

  async function load(){
    try{
      const res: any = await invoke('list_fornecedores', { page: 1, per_page: 100 });
      setItems(res.items || []);
    }catch(e){console.error(e)}
  }

  useEffect(()=>{load()},[]);

  async function handleDelete(id: any){
    const confirm = useConfirm();
    const notify = useNotify();
    const ok = await confirm.confirm({ title: 'Excluir fornecedor', description: 'Confirma exclusão deste fornecedor?' });
    if(!ok) return;
    try{ await invoke('delete_fornecedor', { id: id }); load(); notify.notify({ message: 'Fornecedor excluído', severity: 'success' }); }catch(e){ console.error(e); notify.notify({ message: 'Erro ao excluir', severity: 'error' }); }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <h2>Fornecedores</h2>
        <Button variant="contained" onClick={() => setShowCreate(true)}>Novo fornecedor</Button>
      </Box>
      <List>
        {items.map(t => (
          <ListItem key={t._id?.$oid ?? t._id} divider secondaryAction={
            <>
              <IconButton size="small" color="success" onClick={() => { setEditItem(t); setShowEdit(true); }} title="Editar"><EditIcon fontSize="small" /></IconButton>
              <IconButton size="small" color="error" onClick={() => handleDelete(t._id?.$oid ?? t._id)} title="Excluir"><DeleteIcon fontSize="small" /></IconButton>
            </>
          }>
            <ListItemText primary={t.nome_fantasia || t.nome} secondary={t.cnpj || t.email} />
          </ListItem>
        ))}
      </List>

      <CreateEntityDialog open={showCreate} onClose={() => { setShowCreate(false); load(); }} type="fornecedor" onCreated={() => load()} />
      <EditEntityDialog open={showEdit} onClose={() => setShowEdit(false)} type="fornecedor" item={editItem} onSaved={() => { setShowEdit(false); load(); }} />
    </Box>
  )
}
