use crate::models::fornecedor::Fornecedor;
use crate::models::tag::Tag;
use crate::models::updatable::Updatable as _;
use mongodb::bson::oid::ObjectId;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Produto {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub codigo_interno: String,
    pub descricao: String,
    pub tamanho: String,
    pub fornecedor: Fornecedor,
    pub marca: String,
    pub preco_custo: f64,
    pub preco_venda: f64,
    pub fotos: Vec<String>,
    pub item_produto: Vec<ItemProduto>,
    pub update_automatico: bool,
    pub tags: Vec<Tag>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ItemProduto {
    pub id: Option<ObjectId>,
    pub data_aquisicao: String,
    pub quantidade: i32,
}

#[async_trait::async_trait]
impl crate::models::updatable::Updatable for Produto {
    fn collection_name() -> &'static str {
        "produtos"
    }

    fn id_opt(&self) -> Option<ObjectId> {
        self.id
    }
}

// --- Tauri commands for Produto ---
#[tauri::command]
pub async fn create_produto(
    conn: tauri::State<'_, std::sync::Arc<crate::connect::Conn>>,
    produto: Produto,
) -> Result<serde_json::Value, String> {
    let conn_ref = conn.as_ref();
    crate::models::updatable::Updatable::create(&produto, conn_ref)
        .await
        .map_err(|e| e.to_string())?;
    serde_json::to_value(&produto).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_produto(
    conn: tauri::State<'_, std::sync::Arc<crate::connect::Conn>>,
    produto: Produto,
) -> Result<String, String> {
    let conn_ref = conn.as_ref();
    crate::models::updatable::Updatable::update(&produto, conn_ref)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_produto(
    conn: tauri::State<'_, std::sync::Arc<crate::connect::Conn>>,
    id: String,
) -> Result<String, String> {
    let conn_ref = conn.as_ref();
    let oid = mongodb::bson::oid::ObjectId::parse_str(&id).map_err(|e| e.to_string())?;
    if let Some(p) = <Produto as crate::models::updatable::Updatable>::get_by_id(conn_ref, oid)
        .await
        .map_err(|e| e.to_string())?
    {
        crate::models::updatable::Updatable::delete(&p, conn_ref)
            .await
            .map_err(|e| e.to_string())?;
        Ok("deleted".into())
    } else {
        Err("not found".into())
    }
}

#[tauri::command]
pub async fn get_produto_by_id(
    conn: tauri::State<'_, std::sync::Arc<crate::connect::Conn>>,
    id: String,
) -> Result<Option<Produto>, String> {
    let conn_ref = conn.as_ref();
    let oid = mongodb::bson::oid::ObjectId::parse_str(&id).map_err(|e| e.to_string())?;
    <Produto as crate::models::updatable::Updatable>::get_by_id(conn_ref, oid)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn filter_produtos(
    conn: tauri::State<'_, std::sync::Arc<crate::connect::Conn>>,
    attribute: String,
    value: serde_json::Value,
    page: Option<u64>,
    per_page: Option<u64>,
) -> Result<serde_json::Value, String> {
    let conn_ref = conn.as_ref();
    let b = mongodb::bson::to_bson(&value).map_err(|e| e.to_string())?;
    let (items, total) = Produto::filter_by_attribute(
        conn_ref,
        &attribute,
        b,
        page.unwrap_or(1),
        per_page.unwrap_or(20),
    )
    .await
    .map_err(|e| e.to_string())?;
    Ok(serde_json::json!({"items": items, "total": total}))
}

#[tauri::command]
pub async fn list_produtos_by_description(
    conn: tauri::State<'_, std::sync::Arc<crate::connect::Conn>>,
    descricao: String,
    page: Option<u64>,
    per_page: Option<u64>,
) -> Result<serde_json::Value, String> {
    let conn_ref = conn.as_ref();
    // case-insensitive substring match using regex
    let regex = mongodb::bson::Regex {
        pattern: descricao,
        options: "i".to_string(),
    };
    let b = mongodb::bson::Bson::RegularExpression(regex);
    let (items, total) = <Produto as crate::models::updatable::Updatable>::filter_by_attribute(
        conn_ref,
        "descricao",
        b,
        page.unwrap_or(1),
        per_page.unwrap_or(20),
    )
    .await
    .map_err(|e| e.to_string())?;
    Ok(serde_json::json!({"items": items, "total": total}))
}

#[tauri::command]
pub async fn list_produtos_by_tags(
    conn: tauri::State<'_, std::sync::Arc<crate::connect::Conn>>,
    tag_ids: Vec<String>,
    page: Option<u64>,
    per_page: Option<u64>,
) -> Result<serde_json::Value, String> {
    let conn_ref = conn.as_ref();
    let mut objs = Vec::new();
    for s in tag_ids {
        let oid = mongodb::bson::oid::ObjectId::parse_str(&s).map_err(|e| e.to_string())?;
        objs.push(mongodb::bson::Bson::ObjectId(oid));
    }
    // use $all to require all tags
    let all_doc = mongodb::bson::doc! { "$all": mongodb::bson::Bson::Array(objs) };
    let (items, total) = <Produto as crate::models::updatable::Updatable>::filter_by_attribute(
        conn_ref,
        "tags._id",
        mongodb::bson::Bson::Document(all_doc),
        page.unwrap_or(1),
        per_page.unwrap_or(20),
    )
    .await
    .map_err(|e| e.to_string())?;
    Ok(serde_json::json!({"items": items, "total": total}))
}

#[tauri::command]
pub async fn list_produtos_by_marca(
    conn: tauri::State<'_, std::sync::Arc<crate::connect::Conn>>,
    marca: String,
    page: Option<u64>,
    per_page: Option<u64>,
) -> Result<serde_json::Value, String> {
    let conn_ref = conn.as_ref();
    let b = mongodb::bson::Bson::String(marca);
    let (items, total) = <Produto as crate::models::updatable::Updatable>::filter_by_attribute(
        conn_ref,
        "marca",
        b,
        page.unwrap_or(1),
        per_page.unwrap_or(20),
    )
    .await
    .map_err(|e| e.to_string())?;
    Ok(serde_json::json!({"items": items, "total": total}))
}

#[tauri::command]
pub async fn list_produtos_by_fornecedor(
    conn: tauri::State<'_, std::sync::Arc<crate::connect::Conn>>,
    fornecedor_id: String,
    page: Option<u64>,
    per_page: Option<u64>,
) -> Result<serde_json::Value, String> {
    let conn_ref = conn.as_ref();
    let oid = mongodb::bson::oid::ObjectId::parse_str(&fornecedor_id).map_err(|e| e.to_string())?;
    let (items, total) = <Produto as crate::models::updatable::Updatable>::filter_by_attribute(
        conn_ref,
        "fornecedor._id",
        mongodb::bson::Bson::ObjectId(oid),
        page.unwrap_or(1),
        per_page.unwrap_or(20),
    )
    .await
    .map_err(|e| e.to_string())?;
    Ok(serde_json::json!({"items": items, "total": total}))
}
