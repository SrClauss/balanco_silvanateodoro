import { useEffect, useMemo } from 'react';
import { AppBar, Toolbar, Typography, useMediaQuery, Box, Tabs, Tab, BottomNavigation, BottomNavigationAction } from '@mui/material';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import LabelIcon from '@mui/icons-material/Label';
import BusinessIcon from '@mui/icons-material/Business';
import CategoryIcon from '@mui/icons-material/Category';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
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
  const mobile = useMediaQuery('(max-width:600px)');
  const navigate = useNavigate();
  const location = useLocation();

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
          width: '100%'
        }}
      >
        <Toolbar sx={{ minHeight: { xs: '56px', sm: '64px' }, alignItems: 'center' }}>

          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>Silvana Teodoro</Typography>

          {/* Tabs for desktop */}
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Tabs value={activePath} onChange={(_, val) => navigate(val)} textColor="primary" indicatorColor="primary">
              {routes.map(r => (
                <Tab key={r.path} label={r.label} value={r.path} icon={r.icon} iconPosition="top" />
              ))}
            </Tabs>
          </Box>
        </Toolbar>
      </AppBar>



      <Box component="main" sx={{ p: 2, flex: 1 }}>
        {/* Routed pages render here */}
        {mobile ? (
          <Box {...useSwipeable({
            onSwipedLeft: () => { const i = routes.findIndex(r => r.path === activePath); if(i < routes.length - 1) navigate(routes[i+1].path); },
            onSwipedRight: () => { const i = routes.findIndex(r => r.path === activePath); if(i > 0) navigate(routes[i-1].path); },
            trackMouse: true
          })} sx={{ overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', width: `${routes.length * 100}%`, transform: `translateX(-${(routes.findIndex(r => r.path === activePath) || 0) * (100 / routes.length)}%)`, transition: 'transform 300ms ease' }}>
              <Box sx={{ width: `${100 / routes.length}%`, pr: 1 }}><ProductsPage /></Box>
              <Box sx={{ width: `${100 / routes.length}%`, pr: 1 }}><TagsPage /></Box>
              <Box sx={{ width: `${100 / routes.length}%`, pr: 1 }}><BrandsPage /></Box>
              <Box sx={{ width: `${100 / routes.length}%`, pr: 1 }}><SuppliersPage /></Box>
            </Box>
          </Box>
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
        <Typography variant="caption" color="text.secondary">© {new Date().getFullYear()} Silvana Teodoro</Typography>
      </Box>
    </Box>
  );
}
