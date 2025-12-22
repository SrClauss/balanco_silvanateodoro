// Test MongoDB connection standalone (without Tauri dependencies)
use mongodb::{bson::doc, Client};
use std::env;

#[tokio::main]
async fn main() {
    dotenv::dotenv().ok();
    
    println!("=== Teste de Conexão MongoDB Atlas ===\n");
    
    let mongo_url = env::var("MONGO_URL").expect("MONGO_URL must be set in .env");
    let db_name = env::var("MONGO_DB_NAME").unwrap_or_else(|_| "test".into());
    
    println!("Conectando ao MongoDB Atlas...");
    
    match Client::with_uri_str(&mongo_url).await {
        Ok(client) => {
            println!("✓ Cliente MongoDB criado com sucesso");
            
            // Test connection with ping
            let admin_db = client.database("admin");
            println!("\nTestando conexão com comando ping...");
            
            match admin_db.run_command(doc! { "ping": 1 }).await {
                Ok(_) => {
                    println!("✓ Ping bem-sucedido!");
                    println!("✓ Conexão SSL/TLS funcionando corretamente!");
                    
                    // List collections
                    let db = client.database(&db_name);
                    println!("\nUsando banco de dados: {}", db_name);
                    println!("\nListando coleções disponíveis:");
                    
                    match db.list_collection_names().await {
                        Ok(collections) => {
                            if collections.is_empty() {
                                println!("  (nenhuma coleção encontrada - banco vazio)");
                            } else {
                                for collection in collections {
                                    println!("  - {}", collection);
                                }
                            }
                        }
                        Err(e) => println!("  Aviso: Erro ao listar coleções: {}", e),
                    }
                    
                    println!("\n=== ✓ Teste concluído com sucesso! ===");
                    println!("A conexão com MongoDB Atlas está funcionando corretamente.");
                }
                Err(e) => {
                    eprintln!("✗ Falha no ping: {}", e);
                    eprintln!("Erro SSL/TLS ou de conectividade");
                    std::process::exit(1);
                }
            }
        }
        Err(e) => {
            eprintln!("✗ Falha ao criar cliente MongoDB: {}", e);
            eprintln!("Verifique a string de conexão e credenciais");
            std::process::exit(1);
        }
    }
}
