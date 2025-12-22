import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import Layout from './components/Layout';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProductsPage from './pages/ProductsPage';
import TagsPage from './pages/TagsPage';
import BrandsPage from './pages/BrandsPage';
import SuppliersPage from './pages/SuppliersPage';
import { NotifyProvider } from './lib/Notifications';
import { ConfirmProvider } from './lib/Confirm';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotifyProvider>
        <ConfirmProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout /> } >
                <Route index element={<App />} />
                <Route path="produtos" element={<ProductsPage />} />
                <Route path="tags" element={<TagsPage />} />
                <Route path="marcas" element={<BrandsPage />} />
                <Route path="fornecedores" element={<SuppliersPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ConfirmProvider>
      </NotifyProvider>
    </ThemeProvider>
  </React.StrictMode>
);
