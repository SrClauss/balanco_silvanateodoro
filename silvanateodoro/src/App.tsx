import { useState } from "react";
import "./App.css";
import MicrophoneInput from "./components/MicrophoneInput";

function App() {
  const [descDemo, setDescDemo] = useState("");

  return (
    <main className="container">
      <h1>Silvana Teodoro</h1>
      <p style={{ color: '#666' }}>Gerencie produtos, marcas, fornecedores e tags.</p>

      <nav style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <a href="/produtos">Produtos</a>
        <a href="/tags">Tags</a>
        <a href="/marcas">Marcas</a>
        <a href="/fornecedores">Fornecedores</a>
      </nav>

      {/* Minimal demo of dictation for product description (mobile) */}
      <div style={{ marginTop: 24 }}>
        <h3>Ditado da descrição do produto</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            placeholder="Descrição do produto..."
            value={descDemo}
            onChange={(e) => setDescDemo(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <MicrophoneInput
            value={descDemo}
            onChange={(v) => setDescDemo(v)}
          />
        </div>
        <small style={{ color: '#666' }}>Toque no microfone para ditar (mobile)</small>
        <p style={{ marginTop: 12, color: '#333' }}><strong>Texto atual:</strong> {descDemo || <em>vazio</em>}</p>
      </div>
    </main>
  );
}

export default App;
