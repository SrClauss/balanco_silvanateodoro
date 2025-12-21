use crate::connect::Conn;
use crate::models::endereco::Endereco;
use crate::models::produto::Produto;
use crate::models::updatable::Updatable;
use mongodb::bson;
use mongodb::bson::oid::ObjectId;
use serde::{Deserialize, Serialize};
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Fornecedor {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub razao_social: Option<String>,
    pub nome_fantasia: String,
    pub cnpj: Option<String>,
    pub contato_nome: Option<String>,
    pub endereco: Option<Endereco>,
    pub telefone: Option<String>,
    pub email: Option<String>,
    pub ativo: bool,
    pub updated_at: String,
    pub created_at: String,
}

impl Fornecedor {
    pub async fn update_all_products(&self, conn: &Conn) -> Result<String, mongodb::error::Error> {
        let produtos_collection = conn.db.collection::<Produto>("produtos");
        let filter = mongodb::bson::doc! { "fornecedor._id": &self.id };
        let fornecedor_bson = bson::to_bson(self).map_err(mongodb::error::Error::custom)?;
        let update = mongodb::bson::doc! { "$set": { "fornecedor": fornecedor_bson } };

        let result = produtos_collection.update_many(filter, update).await?;
        Ok(format!(
            "Updated {} products for fornecedor {}",
            result.modified_count, self.nome_fantasia
        ))
    }
}

#[async_trait::async_trait]
impl Updatable for Fornecedor {
    fn collection_name() -> &'static str {
        "fornecedores"
    }

    fn id_opt(&self) -> Option<mongodb::bson::oid::ObjectId> {
        self.id
    }

    async fn update_all_products(&self, conn: &Conn) -> Result<String, mongodb::error::Error> {
        self.update_all_products(conn).await
    }
}

// --- Tauri commands for Fornecedor ---
#[tauri::command]
pub async fn create_fornecedor(
    conn: tauri::State<'_, std::sync::Arc<crate::connect::Conn>>,
    fornecedor: Fornecedor,
) -> Result<serde_json::Value, String> {
    let conn_ref = conn.as_ref();
    fornecedor
        .create(conn_ref)
        .await
        .map_err(|e| e.to_string())?;
    serde_json::to_value(&fornecedor).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_fornecedor(
    conn: tauri::State<'_, std::sync::Arc<crate::connect::Conn>>,
    fornecedor: Fornecedor,
) -> Result<String, String> {
    let conn_ref = conn.as_ref();
    fornecedor.update(conn_ref).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_fornecedor(
    conn: tauri::State<'_, std::sync::Arc<crate::connect::Conn>>,
    id: String,
) -> Result<String, String> {
    let conn_ref = conn.as_ref();
    let oid = mongodb::bson::oid::ObjectId::parse_str(&id).map_err(|e| e.to_string())?;
    if let Some(f) = <Fornecedor as crate::models::updatable::Updatable>::get_by_id(conn_ref, oid)
        .await
        .map_err(|e| e.to_string())?
    {
        f.delete(conn_ref).await.map_err(|e| e.to_string())?;
        Ok("deleted".into())
    } else {
        Err("not found".into())
    }
}

#[tauri::command]
pub async fn get_fornecedor_by_id(
    conn: tauri::State<'_, std::sync::Arc<crate::connect::Conn>>,
    id: String,
) -> Result<Option<Fornecedor>, String> {
    let conn_ref = conn.as_ref();
    let oid = mongodb::bson::oid::ObjectId::parse_str(&id).map_err(|e| e.to_string())?;
    Fornecedor::get_by_id(conn_ref, oid)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn filter_fornecedores(
    conn: tauri::State<'_, std::sync::Arc<crate::connect::Conn>>,
    attribute: String,
    value: serde_json::Value,
    page: Option<u64>,
    per_page: Option<u64>,
) -> Result<serde_json::Value, String> {
    let conn_ref = conn.as_ref();
    let b = mongodb::bson::to_bson(&value).map_err(|e| e.to_string())?;
    let (items, total) = <Fornecedor as crate::models::updatable::Updatable>::filter_by_attribute(
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
