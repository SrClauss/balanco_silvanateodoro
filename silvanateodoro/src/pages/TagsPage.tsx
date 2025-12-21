import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { List, ListItem, ListItemText, Button, Box } from '@mui/material';
import CreateEntityDialog from '../components/CreateEntityDialog';
import EditEntityDialog from '../components/EditEntityDialog';
import { useConfirm } from '../lib/Confirm';
import { useNotify } from '../lib/Notifications';

export default function TagsPage(){
  const [items, setItems] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);

  async function load(){
    try{
      const res: any = await invoke('list_tags', { page: 1, per_page: 100 });
      setItems(res.items || []);
    }catch(e){console.error(e)}
  }

  useEffect(()=>{load()},[]);

  async function handleDelete(id: any){
    const confirm = useConfirm();
    const notify = useNotify();
    const ok = await confirm.confirm({ title: 'Excluir tag', description: 'Confirma exclusão desta tag?' });
    if(!ok) return;
    try{ await invoke('delete_tag', { id: id }); load(); notify.notify({ message: 'Tag excluída', severity: 'success' }); }catch(e){ console.error(e); notify.notify({ message: 'Erro ao excluir', severity: 'error' }); }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <h2>Tags</h2>
        <Button variant="contained" onClick={() => setShowCreate(true)}>Nova tag</Button>
      </Box>
      <List>
        {items.map(t => (
          <ListItem key={t._id?.$oid ?? t._id} divider secondaryAction={
            <>
              <Button size="small" onClick={() => { setEditItem(t); setShowEdit(true); }} sx={{ mr: 1 }}>Editar</Button>
              <Button size="small" color="error" onClick={() => handleDelete(t._id?.$oid ?? t._id)}>Excluir</Button>
            </>
          }>
            <ListItemText primary={t.nome} secondary={t.descricao} />
          </ListItem>
        ))}
      </List>

      <CreateEntityDialog open={showCreate} onClose={() => { setShowCreate(false); load(); }} type="tag" onCreated={() => load()} />
      <EditEntityDialog open={showEdit} onClose={() => setShowEdit(false)} type="tag" item={editItem} onSaved={() => { setShowEdit(false); load(); }} />
    </Box>
  )
}
