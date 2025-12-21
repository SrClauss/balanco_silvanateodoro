use crate::connect::Conn;
use crate::models::produto::Produto;
use crate::models::updatable::Updatable;
use mongodb::bson::oid::ObjectId;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Marca {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub nome: String,
    pub created_at: String,
    pub updated_at: String,
}

impl Marca {
    pub async fn update_all_products(&self, conn: &Conn) -> Result<String, mongodb::error::Error> {
        let produtos_collection = conn.db.collection::<Produto>("produtos");
        let filter = mongodb::bson::doc! { "marca": &self.nome };
        let update = mongodb::bson::doc! { "$set": { "marca": &self.nome } };
        let result = produtos_collection.update_many(filter, update).await?;
        Ok(format!(
            "Updated {} products for marca {}",
            result.modified_count, self.nome
        ))
    }
}

#[async_trait::async_trait]
impl Updatable for Marca {
    fn collection_name() -> &'static str {
        "marcas"
    }

    fn id_opt(&self) -> Option<mongodb::bson::oid::ObjectId> {
        self.id
    }

    async fn update_all_products(&self, conn: &Conn) -> Result<String, mongodb::error::Error> {
        self.update_all_products(conn).await
    }
}

// --- Tauri commands for Marca ---
#[tauri::command]
pub async fn create_marca(
    conn: tauri::State<'_, std::sync::Arc<crate::connect::Conn>>,
    marca: Marca,
) -> Result<serde_json::Value, String> {
    let conn_ref = conn.as_ref();
    marca.create(conn_ref).await.map_err(|e| e.to_string())?;
    serde_json::to_value(&marca).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_marca(
    conn: tauri::State<'_, std::sync::Arc<crate::connect::Conn>>,
    marca: Marca,
) -> Result<String, String> {
    let conn_ref = conn.as_ref();
    marca.update(conn_ref).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_marca(
    conn: tauri::State<'_, std::sync::Arc<crate::connect::Conn>>,
    id: String,
) -> Result<String, String> {
    let conn_ref = conn.as_ref();
    let oid = mongodb::bson::oid::ObjectId::parse_str(&id).map_err(|e| e.to_string())?;
    if let Some(m) = Marca::get_by_id(conn_ref, oid)
        .await
        .map_err(|e| e.to_string())?
    {
        m.delete(conn_ref).await.map_err(|e| e.to_string())?;
        Ok("deleted".into())
    } else {
        Err("not found".into())
    }
}

#[tauri::command]
pub async fn get_marca_by_id(
    conn: tauri::State<'_, std::sync::Arc<crate::connect::Conn>>,
    id: String,
) -> Result<Option<Marca>, String> {
    let conn_ref = conn.as_ref();
    let oid = mongodb::bson::oid::ObjectId::parse_str(&id).map_err(|e| e.to_string())?;
    Marca::get_by_id(conn_ref, oid)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn filter_marcas(
    conn: tauri::State<'_, std::sync::Arc<crate::connect::Conn>>,
    attribute: String,
    value: serde_json::Value,
    page: Option<u64>,
    per_page: Option<u64>,
) -> Result<serde_json::Value, String> {
    let conn_ref = conn.as_ref();
    let b = mongodb::bson::to_bson(&value).map_err(|e| e.to_string())?;
    let (items, total) = <Marca as crate::models::updatable::Updatable>::filter_by_attribute(
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
