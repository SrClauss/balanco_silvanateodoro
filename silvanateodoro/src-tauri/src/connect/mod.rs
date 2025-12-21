//implemente a conexão com o banco de dados aqui
//usando a MONGO_URL do .env

use mongodb::{Client, Database};
use std::env;
pub struct Conn {
    pub db: Database,
}

impl Conn {
    pub async fn init() -> Self {
        // Carrega .env em modo de debug por redundância
        if cfg!(debug_assertions) {
            dotenv::dotenv().ok();
        }

        let mongo_url = env::var("MONGO_URL").expect("MONGO_URL must be set in .env");
        let client = Client::with_uri_str(&mongo_url)
            .await
            .expect("Failed to initialize MongoDB client");
        let db_name = env::var("MONGO_DB_NAME").unwrap_or_else(|_| "test".into());
        let db = client.database(&db_name);
        Conn { db }
    }
}
