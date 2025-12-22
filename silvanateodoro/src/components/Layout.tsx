import { useState, useEffect, useMemo } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Drawer, List, ListItem, ListItemText, ListItemButton, useMediaQuery, Box, Divider, Tabs, Tab, BottomNavigation, BottomNavigationAction } from '@mui/material';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import LabelIcon from '@mui/icons-material/Label';
import BusinessIcon from '@mui/icons-material/Business';
import CategoryIcon from '@mui/icons-material/Category';
import MenuIcon from '@mui/icons-material/Menu';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import ProductsPage from '../pages/ProductsPage';
import TagsPage from '../pages/TagsPage';
import BrandsPage from '../pages/BrandsPage';
import SuppliersPage from '../pages/SuppliersPage';

const routes = [
  { label: 'Produtos', path: '/produtos', icon: <Inventory2Icon /> },
  { label: 'Tags', path: '/tags', icon: <LabelIcon /> },
  { label: 'Marcas', path: '/marcas', icon: <CategoryIcon /> },
  { label: 'Fornecedores', path: '/fornecedores', icon: <BusinessIcon /> },
];

export default function Layout(){
  const [open, setOpen] = useState(false);
  const mobile = useMediaQuery('(max-width:600px)');
  const desktop = useMediaQuery('(min-width:900px)');
  const navigate = useNavigate();
  const location = useLocation();
  const drawerWidth = 240;

  // active path from location or fallback to first route
  const activePath = useMemo(() => {
    const match = routes.find(r => location.pathname.startsWith(r.path));
    return match ? match.path : routes[0].path;
  }, [location.pathname]);

  useEffect(() => {
    // keyboard shortcuts: Ctrl+1..4
    function onKey(e: KeyboardEvent){
      if(e.ctrlKey){
        const k = e.key;
        if(k >= '1' && k <= String(routes.length)){
          const idx = Number(k) - 1;
          navigate(routes[idx].path);
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  const drawer = (
    <Box sx={{ width: drawerWidth }} role="presentation" onClick={() => setOpen(false)}>
      <List>
        {routes.map(r => (
          <ListItem key={r.path} component={Link} to={r.path} disablePadding>
            <ListItemButton>
              <ListItemText primary={r.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption">Versão móvel: {mobile ? 'sim' : 'não'}</Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', pt: { xs: 'env(safe-area-inset-top)', sm: 0 } }}>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={1}
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: (theme) => (theme as any).zIndex?.appBar ?? 1100,
          backdropFilter: 'saturate(1.1) blur(6px)',
          width: desktop ? `calc(100% - ${drawerWidth}px)` : '100%',
          ml: desktop ? `${drawerWidth}px` : 0,
        }}
      >
        <Toolbar sx={{ minHeight: { xs: '56px', sm: '64px' }, alignItems: 'center' }}>
          {!desktop && mobile && (
            <IconButton color="inherit" edge="start" onClick={() => setOpen(true)} sx={{ mr: 2, mt: 0 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>Silvana Teodoro</Typography>

          {/* Tabs for desktop */}
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Tabs value={activePath} onChange={(_, val) => navigate(val)} textColor="primary" indicatorColor="primary">
              {routes.map(r => (
                <Tab key={r.path} label={r.label} value={r.path} icon={r.icon} iconPosition="start" />
              ))}
            </Tabs>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer: permanent on desktop, temporary on mobile */}
      {desktop ? (
        <Drawer
          variant="permanent"
          open
          sx={{ width: drawerWidth, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', pt: { xs: 'env(safe-area-inset-top)', sm: 0 } } }}
        >
          {drawer}
        </Drawer>
      ) : (
        <Drawer
          open={open}
          onClose={() => setOpen(false)}
          ModalProps={{ keepMounted: true }}
          PaperProps={{ sx: { pt: { xs: 'env(safe-area-inset-top)', sm: 0 } } }}
        >
          {drawer}
        </Drawer>
      )}

      <Box component="main" sx={{ p: 2, flex: 1 }}>
        {/* Routed pages render here */}
        {mobile ? (
          <div {...useSwipeable({
            onSwipedLeft: () => { const i = routes.findIndex(r => r.path === activePath); if(i < routes.length - 1) navigate(routes[i+1].path); },
            onSwipedRight: () => { const i = routes.findIndex(r => r.path === activePath); if(i > 0) navigate(routes[i-1].path); },
            trackMouse: true
          })} style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', width: `${routes.length * 100}%`, transform: `translateX(-${(routes.findIndex(r => r.path === activePath) || 0) * (100 / routes.length)}%)`, transition: 'transform 300ms ease' }}>
              <div style={{ width: `${100 / routes.length}%`, paddingRight: 8 }}><ProductsPage /></div>
              <div style={{ width: `${100 / routes.length}%`, paddingRight: 8 }}><TagsPage /></div>
              <div style={{ width: `${100 / routes.length}%`, paddingRight: 8 }}><BrandsPage /></div>
              <div style={{ width: `${100 / routes.length}%`, paddingRight: 8 }}><SuppliersPage /></div>
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </Box>

      {/* Bottom navigation for mobile */}
      {mobile && (
        <Box sx={{ position: 'sticky', bottom: 0, zIndex: 1100, pb: { xs: 'env(safe-area-inset-bottom)', sm: 0 } }}>
          <BottomNavigation showLabels value={activePath} onChange={(_, val) => navigate(val)}>
            {routes.map(r => (
              <BottomNavigationAction key={r.path} label={r.label} value={r.path} icon={r.icon} />
            ))}
          </BottomNavigation>
        </Box>
      )}

      <Box component="footer" sx={{ p: 1, textAlign: 'center', bgcolor: '#fafafa' }}>
        <small style={{ color: '#666' }}>© {new Date().getFullYear()} Silvana Teodoro</small>
      </Box>
    </Box>
  );
}
