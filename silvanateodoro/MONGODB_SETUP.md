# MongoDB Atlas Connection Setup

## Configuração

Este projeto usa MongoDB Atlas como banco de dados. A conexão é configurada através de variáveis de ambiente.

### Arquivo `.env`

Crie um arquivo `.env` no diretório `src-tauri/` com as seguintes variáveis:

```env
MONGO_URL=mongodb+srv://username:password@cluster0.xxhetar.mongodb.net/?appName=Cluster0
MONGO_DB_NAME=test
```

**Nota:** O arquivo `.env` está no `.gitignore` e não deve ser commitado ao repositório.

### Credenciais Fornecidas

Para testes, use as seguintes credenciais:
- **URL Base:** `mongodb+srv://clausembergrodrigues_db_user:<password>@cluster0.xxhetar.mongodb.net/?appName=Cluster0`
- **Senha:** `MDB-ar1401al2312`
- **Database:** `test`

## Conexão SSL/TLS

A conexão com MongoDB Atlas utiliza SSL/TLS automaticamente quando usando o protocolo `mongodb+srv://`. 

O driver MongoDB Rust (versão 3.4.1) já inclui suporte nativo para SSL/TLS através das bibliotecas:
- `rustls` - Implementação pura em Rust de TLS
- `webpki-roots` - Certificados raiz de CA

**Não é necessária configuração adicional** para SSL/TLS - o driver cuida de tudo automaticamente.

## Testando a Conexão

### Método 1: Executar o utilitário de teste

```bash
cd src-tauri
cargo run --bin test-connection
```

Este comando irá:
1. Conectar ao MongoDB Atlas
2. Fazer ping no servidor
3. Listar as coleções disponíveis no banco de dados
4. Confirmar que SSL/TLS está funcionando

### Método 2: Executar a aplicação Tauri

```bash
cd silvanateodoro
npm install
npm run tauri dev
```

A aplicação irá conectar automaticamente ao MongoDB na inicialização e você verá mensagens de log confirmando a conexão.

## Resolução de Problemas

### Erro: "MONGO_URL must be set in .env"

**Solução:** Crie o arquivo `.env` no diretório `src-tauri/` com as variáveis corretas.

### Erro: "Server selection timeout" ou "No available servers"

**Possíveis causas:**
1. Sem acesso à internet
2. Firewall bloqueando conexões de saída
3. Credenciais incorretas
4. IP não está na lista de IPs permitidos no MongoDB Atlas

**Solução:** 
- Verifique sua conexão com a internet
- No MongoDB Atlas, vá em Network Access e adicione seu IP ou permita acesso de qualquer lugar (0.0.0.0/0)
- Verifique se as credenciais estão corretas

### Erro: "Authentication failed"

**Solução:** Verifique se a senha está correta no arquivo `.env`.

## Estrutura do Código

### `src-tauri/src/connect/mod.rs`

Módulo responsável pela conexão com MongoDB. Implementa:
- Carregamento de variáveis de ambiente do `.env`
- Criação do cliente MongoDB com SSL/TLS
- Teste de conexão com ping
- Gerenciamento do banco de dados

### `src-tauri/src/test_connection.rs`

Utilitário de teste standalone para verificar a conexão sem precisar executar toda a aplicação Tauri.

## Notas de Segurança

- **Nunca** commite o arquivo `.env` com credenciais reais
- Use variáveis de ambiente ou secrets management em produção
- Rotacione as senhas regularmente
- Configure Network Access no MongoDB Atlas para restringir IPs permitidos
