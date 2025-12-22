//implemente a conexão com o banco de dados aqui
//usando a MONGO_URL do .env

use mongodb::{bson::doc, Client, Database};
use std::env;

pub struct Conn {
    pub db: Database,
    pub client: Client,
}

impl Conn {
    pub async fn init() -> Self {
        // Carrega .env em modo de debug por redundância
        if cfg!(debug_assertions) {
            dotenv::dotenv().ok();
        }

        let mongo_url = env::var("MONGO_URL").expect("MONGO_URL must be set in .env");
        
        println!("Conectando ao MongoDB Atlas...");
        
        let client = Client::with_uri_str(&mongo_url)
            .await
            .expect("Falha ao inicializar cliente MongoDB");
        
        // Testa a conexão com um ping
        let db_name = env::var("MONGO_DB_NAME").unwrap_or_else(|_| "test".into());
        let admin_db = client.database("admin");
        
        println!("Testando conexão com comando ping...");
        match admin_db.run_command(doc! { "ping": 1 }).await {
            Ok(_) => println!("✓ Conectado com sucesso ao MongoDB Atlas!"),
            Err(e) => {
                eprintln!("✗ Falha ao fazer ping no MongoDB: {}", e);
                panic!("Teste de conexão falhou: {}", e);
            }
        }
        
        let db = client.database(&db_name);
        println!("Usando banco de dados: {}", db_name);
        
        Conn { db, client }
    }
}
