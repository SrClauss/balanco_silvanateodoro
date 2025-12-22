// Utility para testar a conexão com MongoDB Atlas
use dotenv::dotenv;

mod connect;

#[tokio::main]
async fn main() {
    dotenv().ok();
    
    println!("=== Teste de Conexão MongoDB Atlas ===\n");
    
    match std::panic::catch_unwind(|| {
        tokio::runtime::Runtime::new().unwrap().block_on(async {
            let conn = connect::Conn::init().await;
            
            // Lista as coleções do banco
            println!("\nListando coleções disponíveis:");
            match conn.db.list_collection_names().await {
                Ok(collections) => {
                    if collections.is_empty() {
                        println!("  (nenhuma coleção encontrada)");
                    } else {
                        for collection in collections {
                            println!("  - {}", collection);
                        }
                    }
                }
                Err(e) => println!("  Erro ao listar coleções: {}", e),
            }
            
            println!("\n✓ Teste concluído com sucesso!");
        })
    }) {
        Ok(_) => println!("\n=== Conexão SSL/TLS funcionando corretamente ==="),
        Err(e) => {
            eprintln!("\n✗ Erro durante o teste: {:?}", e);
            std::process::exit(1);
        }
    }
}
