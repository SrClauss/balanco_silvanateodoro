import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { List, ListItem, ListItemText, Box, IconButton, Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CreateEntityDialog from '../components/CreateEntityDialog';
import EditEntityDialog from '../components/EditEntityDialog';
import { useConfirm } from '../lib/Confirm';
import { useNotify } from '../lib/Notifications';

export default function BrandsPage(){
  const [items, setItems] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);

  async function load(){
    try{
      const res: any = await invoke('list_marcas', { page: 1, per_page: 100 });
      setItems(res.items || []);
    }catch(e){console.error(e)}
  }

  useEffect(()=>{load()},[]);

  async function handleDelete(id: any){
    const confirm = useConfirm();
    const notify = useNotify();
    const ok = await confirm.confirm({ title: 'Excluir marca', description: 'Confirma exclusão desta marca?' });
    if(!ok) return;
    try{ await invoke('delete_marca', { id: id }); load(); notify.notify({ message: 'Marca excluída', severity: 'success' }); }catch(e){ console.error(e); notify.notify({ message: 'Erro ao excluir', severity: 'error' }); }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <h2>Marcas</h2>
        <Button variant="contained" onClick={() => setShowCreate(true)}>Nova marca</Button>
      </Box>
      <List>
        {items.map(t => (
          <ListItem key={t._id?.$oid ?? t._id} divider secondaryAction={
            <>
              <IconButton size="small" color="success" onClick={() => { setEditItem(t); setShowEdit(true); }} title="Editar"><EditIcon fontSize="small" /></IconButton>
              <IconButton size="small" color="error" onClick={() => handleDelete(t._id?.$oid ?? t._id)} title="Excluir"><DeleteIcon fontSize="small" /></IconButton>
            </>
          }>
            <ListItemText primary={t.nome} secondary={t.descricao} />
          </ListItem>
        ))}
      </List>

      <CreateEntityDialog open={showCreate} onClose={() => { setShowCreate(false); load(); }} type="marca" onCreated={() => load()} />
      <EditEntityDialog open={showEdit} onClose={() => setShowEdit(false)} type="marca" item={editItem} onSaved={() => { setShowEdit(false); load(); }} />
    </Box>
  )
}
