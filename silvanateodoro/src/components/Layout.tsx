import { useState } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Drawer, List, ListItem, ListItemText, ListItemButton, useMediaQuery, Box, Divider } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link, Outlet } from 'react-router-dom';

export default function Layout(){
  const [open, setOpen] = useState(false);
  const mobile = useMediaQuery('(max-width:600px)');

  const drawer = (
    <Box sx={{ width: 250 }} role="presentation" onClick={() => setOpen(false)}>
      <List>
        <ListItem component={Link} to="/produtos"><ListItemButton><ListItemText primary="Produtos" /></ListItemButton></ListItem>
        <ListItem component={Link} to="/tags"><ListItemButton><ListItemText primary="Tags" /></ListItemButton></ListItem>
        <ListItem component={Link} to="/marcas"><ListItemButton><ListItemText primary="Marcas" /></ListItemButton></ListItem>
        <ListItem component={Link} to="/fornecedores"><ListItemButton><ListItemText primary="Fornecedores" /></ListItemButton></ListItem>
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption">Versão móvel: {mobile ? 'sim' : 'não'}</Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      <AppBar position="static">
        <Toolbar>
          {mobile && (
            <IconButton color="inherit" edge="start" onClick={() => setOpen(true)} sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Silvana Teodoro</Typography>
          <Box component="nav" sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Link to="/produtos" style={{ color: 'inherit', textDecoration: 'none', marginRight: 12 }}>Produtos</Link>
            <Link to="/tags" style={{ color: 'inherit', textDecoration: 'none', marginRight: 12 }}>Tags</Link>
            <Link to="/marcas" style={{ color: 'inherit', textDecoration: 'none', marginRight: 12 }}>Marcas</Link>
            <Link to="/fornecedores" style={{ color: 'inherit', textDecoration: 'none' }}>Fornecedores</Link>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer open={open} onClose={() => setOpen(false)}>
        {drawer}
      </Drawer>

      <Box component="main" sx={{ p: 2, flex: 1 }}>
        {/* Render the routed pages here */}
        <Outlet />
      </Box>

      <Box component="footer" sx={{ p: 1, textAlign: 'center', bgcolor: '#fafafa' }}>
        <small style={{ color: '#666' }}>© {new Date().getFullYear()} Silvana Teodoro</small>
      </Box>
    </Box>
  );
}
