import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useNotify } from '../lib/Notifications';
import ProductForm from '../components/ProductForm';

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
    { field: 'tags', headerName: 'Tags', width: 200, valueGetter: (params:any) => ((params.row.tags || []) as any[]).map((t:any)=>t.nome).join(', ') },
    { field: 'estoque', headerName: 'Estoque', width: 120, valueGetter: (params:any) => ((params.row.item_produto || []) as any[]).reduce((acc:any, it:any) => acc + (it?.quantidade || 0), 0) },
    { field: 'actions', headerName: 'Ações', width: 160, sortable: false, filterable: false, renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" onClick={() => { setEditProduct(params.row); setOpenForm(true); }}>Editar</Button>
        </Box>
    ) }
  ];

  async function fetchData(p: number, perPage: number) {
    setLoading(true);
    try {
      const res: any = await invoke('list_produtos', { page: p + 1, per_page: perPage });
      setRows((res.items || []).map((it: any) => ({ id: it._id?.$oid ?? it._id, __raw: it, ...it, marca_nome: it.marca?.nome, fornecedor_nome: it.fornecedor?.nome })));
      setTotal(res.total || 0);
    } catch (e) {
      console.error('fetch produtos', e);
    } finally {
      setLoading(false);
    }
  }

  const notify = useNotify();
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
                  <Typography sx={{ mt: 1 }}>{(r.tags || []).map((t:any)=>t.nome).join(', ')}</Typography>
                  <Typography sx={{ mt: 1, fontWeight: 600 }}>Estoque: {(r.item_produto || []).reduce((acc:any, it:any) => acc + (it?.quantidade || 0), 0)}</Typography>
                </Box>
                <Stack direction="column" spacing={1}>
                  <Button size="small" onClick={() => { setEditProduct(r); setOpenForm(true); }}>Editar</Button>
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
