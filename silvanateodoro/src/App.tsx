import { useState } from "react";
import MicrophoneInput from "./components/MicrophoneInput";

import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';

function App() {
  const [descDemo, setDescDemo] = useState("");

  return (
    <Container maxWidth="sm" sx={{ pt: '10vh', textAlign: 'center' }}>
      <Typography variant="h4" component="h1">Silvana Teodoro</Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>Gerencie produtos, marcas, fornecedores e tags.</Typography>

      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 1 }}>
        <Link href="/produtos" underline="hover">Produtos</Link>
        <Link href="/tags" underline="hover">Tags</Link>
        <Link href="/marcas" underline="hover">Marcas</Link>
        <Link href="/fornecedores" underline="hover">Fornecedores</Link>
      </Stack>

      {/* Minimal demo of dictation for product description (mobile) */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" component="h3">Ditado da descrição do produto</Typography>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
          <TextField
            placeholder="Descrição do produto..."
            value={descDemo}
            onChange={(e) => setDescDemo(e.currentTarget.value)}
            variant="outlined"
            size="medium"
            fullWidth
          />
          <MicrophoneInput
            value={descDemo}
            onChange={(v) => setDescDemo(v)}
          />
        </Stack>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>Toque no microfone para ditar (mobile)</Typography>
        <Typography variant="body1" sx={{ mt: 1, color: 'text.primary' }}><strong>Texto atual:</strong> {descDemo || <em>vazio</em>}</Typography>
      </Box>
    </Container>
  );
}

export default App;
