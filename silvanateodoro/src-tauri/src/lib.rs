// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use dotenv::dotenv;
use serde_json::json;
use std::env;
use std::sync::Arc;
pub mod connect;
pub mod models;

// bring model-level tauri commands into scope for `generate_handler!`
use crate::models::fornecedor::{
    create_fornecedor, delete_fornecedor, filter_fornecedores, get_fornecedor_by_id,
    update_fornecedor,
};
use crate::models::marca::{
    create_marca, delete_marca, filter_marcas, get_marca_by_id, update_marca,
};
use crate::models::produto::{
    create_produto, delete_produto, filter_produtos, get_produto_by_id,
    list_produtos_by_description, list_produtos_by_fornecedor, list_produtos_by_marca,
    list_produtos_by_tags, update_produto,
};
use crate::models::tag::{create_tag, delete_tag, filter_tags, get_tag_by_id, update_tag};

struct AppState {
    conn: Arc<crate::connect::Conn>,
}

#[tauri::command]
fn greet(name: &str) -> String {
    // lê a variável MONGO_URL (ou outra que você usar) e devolve uma resposta simples
    format!(
        "Hello, {}! You've been greeted from Rust!, com a mongo url",
        name
    )
}

#[tauri::command]
async fn list_fornecedores(
    state: tauri::State<'_, AppState>,
    page: Option<u64>,
    per_page: Option<u64>,
) -> Result<serde_json::Value, String> {
    let page = page.unwrap_or(1);
    let per_page = per_page.unwrap_or(20);
    use crate::models::updatable::Updatable as _;
    let (items, total) =
        crate::models::fornecedor::Fornecedor::list_paginated(&state.conn, page, per_page)
            .await
            .map_err(|e: mongodb::error::Error| e.to_string())?;
    Ok(json!({"items": items, "total": total}))
}

#[tauri::command]
async fn list_marcas(
    state: tauri::State<'_, AppState>,
    page: Option<u64>,
    per_page: Option<u64>,
) -> Result<serde_json::Value, String> {
    let page = page.unwrap_or(1);
    let per_page = per_page.unwrap_or(20);
    use crate::models::updatable::Updatable as _;
    let (items, total) = crate::models::marca::Marca::list_paginated(&state.conn, page, per_page)
        .await
        .map_err(|e: mongodb::error::Error| e.to_string())?;
    Ok(json!({"items": items, "total": total}))
}

#[tauri::command]
async fn list_produtos(
    state: tauri::State<'_, AppState>,
    page: Option<u64>,
    per_page: Option<u64>,
) -> Result<serde_json::Value, String> {
    let page = page.unwrap_or(1);
    let per_page = per_page.unwrap_or(20);
    use crate::models::updatable::Updatable as _;
    let (items, total) =
        crate::models::produto::Produto::list_paginated(&state.conn, page, per_page)
            .await
            .map_err(|e: mongodb::error::Error| e.to_string())?;
    Ok(json!({"items": items, "total": total}))
}

#[tauri::command]
async fn list_tags(
    state: tauri::State<'_, AppState>,
    page: Option<u64>,
    per_page: Option<u64>,
) -> Result<serde_json::Value, String> {
    let page = page.unwrap_or(1);
    let per_page = per_page.unwrap_or(20);
    use crate::models::updatable::Updatable as _;
    let (items, total) = crate::models::tag::Tag::list_paginated(&state.conn, page, per_page)
        .await
        .map_err(|e: mongodb::error::Error| e.to_string())?;
    Ok(json!({"items": items, "total": total}))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Carrega .env quando disponível (apenas para dev local)
    dotenv().ok();

    // inicializa conexão ao iniciar
    let rt = tokio::runtime::Runtime::new().expect("Failed to create Tokio runtime");
    let conn = rt.block_on(crate::connect::Conn::init());
    let conn_arc = Arc::new(conn);
    // garantir índice de tags (nome único) no startup
    let ensure_res =
        rt.block_on(async { crate::models::tag::Tag::ensure_indexes(conn_arc.as_ref()).await });
    match ensure_res {
        Ok(_) => println!("Tag index ensured"),
        Err(e) => eprintln!("Failed to ensure tag index: {}", e),
    }
    let state = AppState {
        conn: Arc::clone(&conn_arc),
    };

    // build the tauri::Builder: include stt plugin only when feature `stt` is enabled
    #[cfg(feature = "stt")]
    let builder = tauri::Builder::default()
        .manage(state)
        .manage(conn_arc)
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_stt::init());

    #[cfg(not(feature = "stt"))]
    let builder = tauri::Builder::default()
        .manage(state)
        .manage(conn_arc)
        .plugin(tauri_plugin_opener::init());

    builder
        .invoke_handler(tauri::generate_handler![
            greet,
            list_fornecedores,
            list_marcas,
            list_produtos,
            list_tags,
            // Fornecedor
            create_fornecedor,
            update_fornecedor,
            delete_fornecedor,
            get_fornecedor_by_id,
            filter_fornecedores,
            // Marca
            create_marca,
            update_marca,
            delete_marca,
            get_marca_by_id,
            filter_marcas,
            // Produto
            create_produto,
            update_produto,
            delete_produto,
            get_produto_by_id,
            filter_produtos,
            list_produtos_by_description,
            list_produtos_by_tags,
            list_produtos_by_marca,
            list_produtos_by_fornecedor,
            // Tag
            create_tag,
            update_tag,
            delete_tag,
            get_tag_by_id,
            filter_tags
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
