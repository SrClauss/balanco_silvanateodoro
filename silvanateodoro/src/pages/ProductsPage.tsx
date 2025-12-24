import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useConfirm } from '../lib/Confirm';
import { useNotify } from '../lib/Notifications';
import ProductForm from '../components/ProductForm';
import { ItemProduto } from '../types/entities';

export default function ProductsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(20);
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [editProduct, setEditProduct] = useState<any | null>(null);
  const [productFormResetKey, setProductFormResetKey] = useState<number>(0);

  const columns: GridColDef[] = [
    { field: 'descricao', headerName: 'Descrição', flex: 1, editable: false },
    { field: 'marca_nome', headerName: 'Marca', width: 150 },
    { field: 'fornecedor_nome', headerName: 'Fornecedor', width: 180 },
    { field: 'tags', headerName: 'Tags', width: 220, renderCell: (params:any) => {
        const row = params?.row ?? {};
        const tags = (row.tags ?? []) as any[];
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {tags.map((t:any, i:number) => {
              const label = !t ? '' : (typeof t === 'string' ? t : (t.nome ?? t.name ?? t.label ?? ''));
              return label ? <Chip key={i} label={label} size="small" /> : null;
            })}
          </Box>
        );
      } },
    { field: 'item_produto', headerName: 'Estoque', width: 120, valueGetter: (params:any) => {
        const row = params.reduce((acc:number, value:ItemProduto) => acc + (Number(value?.quantidade) || 0), 0);
        return JSON.stringify(row);
      } },
    { field: 'actions', headerName: 'Ações', width: 140, sortable: false, filterable: false, renderCell: (params) => {
        const row = params?.row ?? {};
        const idVal = row._id?.$oid ?? row._id ?? row.id;
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton size="small" color="success" onClick={() => { setEditProduct(row); setOpenForm(true); }} title="Editar"><EditIcon fontSize="small" /></IconButton>
            <IconButton size="small" color="error" onClick={async () => {
              const ok = await confirm.confirm({ title: 'Confirmar deleção', description: 'Deseja excluir este produto?', confirmText: 'Excluir' });
              if(!ok) return;
              try{
                await invoke('delete_produto', { id: String(idVal) });
                notify.notify({ message: 'Produto excluído', severity: 'success' });
                fetchData(page, pageSize);
              }catch(e){ console.error('delete produto', e); notify.notify({ message: 'Erro ao excluir', severity: 'error' }); }
            }} title="Excluir"><DeleteIcon fontSize="small" /></IconButton>
          </Box>
        );
      } }
  ];

  async function fetchData(p: number, perPage: number) {
    setLoading(true);
    try {
      const res: any = await invoke('list_produtos', { page: p + 1, per_page: perPage });
      // debug: log tags of first item (temporary)
      if(Array.isArray(res.items) && res.items.length > 0){
        console.debug('debug:first-produto-tags', res.items[0].tags);
      }
      setRows((res.items || []).map((it: any) => {
        // marca can be either a string or an object
        const marca_nome = typeof it.marca === 'string' ? it.marca : (it.marca?.nome ?? '');
        // fornecedor can be object with nome_fantasia or nome, or a string id
        const fornecedor_nome = (it.fornecedor && (it.fornecedor.nome_fantasia || it.fornecedor.nome)) ? (it.fornecedor.nome_fantasia || it.fornecedor.nome) : (typeof it.fornecedor === 'string' ? it.fornecedor : '');
        // compute total estoque as number to avoid type/coercion issues
        const estoque = (it.item_produto || []).reduce((acc:any, ip:any) => acc + (Number(ip?.quantidade) || 0), 0);
        return { id: it._id?.$oid ?? it._id, __raw: it, ...it, marca_nome, fornecedor_nome, estoque };
      }));
      setTotal(res.total || 0);
    } catch (e) {
      console.error('fetch produtos', e);
    } finally {
      setLoading(false);
    }
  }

  const notify = useNotify();
  const confirm = useConfirm();
  useEffect(() => {
    fetchData(page, pageSize);
  }, [page, pageSize]);

  const mobile = /Mobi|Android/i.test(navigator.userAgent) || window.innerWidth < 700;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h2">Produtos</Typography>
        <Button variant="contained" onClick={() => { setEditProduct(null); setProductFormResetKey(k => k + 1); setOpenForm(true); }}>Novo produto</Button>
      </Box>

      {mobile ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
          {rows.map(r => (
            <Box key={r.id} sx={{ border: '1px solid #ddd', p: 2, borderRadius: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography sx={{ fontWeight: 600 }}>{r.descricao}</Typography>
                  <Typography color="text.secondary">{r.marca_nome} — {r.fornecedor_nome}</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>{(r.tags || []).map((t:any, i:number) => {
                    const label = !t ? '' : (typeof t === 'string' ? t : (t.nome ?? t.name ?? t.label ?? ''));
                    return label ? <Chip key={i} label={label} size="small" /> : null;
                  })}</Box>
                  <Typography sx={{ mt: 1, fontWeight: 600 }}>Estoque: {Number(r.estoque ?? ((r.item_produto || []).reduce((acc:any, it:any) => acc + (Number(it?.quantidade) || 0), 0)))}</Typography>
                </Box>
                <Stack direction="column" spacing={1}>
                  <IconButton size="small" color="success" onClick={() => { setEditProduct(r); setOpenForm(true); }} title="Editar"><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={async () => {
                    const idVal = r._id?.$oid ?? r._id ?? r.id;
                    const ok = await confirm.confirm({ title: 'Confirmar deleção', description: 'Deseja excluir este produto?', confirmText: 'Excluir' });
                    if(!ok) return;
                    try{
                      await invoke('delete_produto', { id: String(idVal) });
                      notify.notify({ message: 'Produto excluído', severity: 'success' });
                      fetchData(page, pageSize);
                    }catch(e){ console.error('delete produto', e); notify.notify({ message: 'Erro ao excluir', severity: 'error' }); }
                  }} title="Excluir"><DeleteIcon fontSize="small" /></IconButton>
                </Stack>
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            pagination
            paginationMode="server"
            paginationModel={{ page, pageSize }}
            pageSizeOptions={[10, 20, 50]}
            rowCount={total}
            onPaginationModelChange={(model:any) => { setPage(model.page); setPageSize(model.pageSize); }}
            loading={loading}
            processRowUpdate={async (newRow, _oldRow) => {
              // only allow editing descricao inline for now
              try{
                const produto = { ...newRow.__raw, descricao: newRow.descricao };
                // ensure id is string
                produto._id = newRow._id?.$oid ?? newRow._id ?? newRow.id;
                await invoke('update_produto', { produto });
                notify.notify({ message: 'Produto atualizado', severity: 'success' });
                // update local state
                setRows((r)=> r.map(rr => rr.id === newRow.id ? { ...rr, descricao: newRow.descricao } : rr));
                return { ...newRow };
              }catch(e){
                console.error('update produto inline', e);
                notify.notify({ message: 'Erro ao atualizar produto', severity: 'error' });
                throw e;
              }
            }}
            onProcessRowUpdateError={(err:any) => { console.error('row update error', err); }}
          />
        </Box>
      )}

      <ProductForm open={openForm} resetKey={productFormResetKey} onClose={() => { setOpenForm(false); setEditProduct(null); fetchData(page, pageSize); }} onSaved={() => { notify.notify({ message: 'Produto salvo', severity: 'success' }); }} />
      <ProductForm open={!!editProduct && openForm} product={editProduct} onClose={() => { setOpenForm(false); setEditProduct(null); fetchData(page, pageSize); }} onSaved={() => { notify.notify({ message: 'Produto atualizado', severity: 'success' }); }} />

    </Box>
  );
}
