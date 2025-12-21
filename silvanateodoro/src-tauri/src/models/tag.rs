use crate::connect::Conn;
use crate::models::updatable::Updatable;
use mongodb::bson::oid::ObjectId;
use mongodb::bson::{self, doc, Bson, Document};
use mongodb::options::IndexOptions;
use mongodb::IndexModel;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Tag {
    pub id: Option<ObjectId>,
    pub nome: String,
}

#[async_trait::async_trait]
impl Updatable for Tag {
    fn collection_name() -> &'static str {
        "tags"
    }

    fn id_opt(&self) -> Option<ObjectId> {
        self.id
    }

    async fn update_all_products(&self, conn: &Conn) -> Result<String, mongodb::error::Error> {
        // atualiza tags embutidas nos produtos usando update pipeline ($map + $cond)
        if self.id.is_none() {
            return Ok("No id, skipping tag product update".into());
        }
        let id = self.id.unwrap();
        let tag_doc = match bson::to_bson(self).map_err(mongodb::error::Error::custom)? {
            Bson::Document(d) => d,
            _ => return Ok("invalid tag serialization".into()),
        };

        let filter = doc! { "tags._id": &id };
        let pipeline = vec![doc! {
            "$set": {
                "tags": {
                    "$map": {
                        "input": "$tags",
                        "as": "t",
                        "in": { "$cond": [ { "$eq": ["$$t._id", &id] }, tag_doc.clone(), "$$t" ] }
                    }
                }
            }
        }];

        let coll = conn.db.collection::<Document>("produtos");
        let res = coll.update_many(filter, pipeline).await?;
        Ok(format!(
            "Updated {} products for tag {}",
            res.modified_count, self.nome
        ))
    }
}

impl Tag {
    /// Garantir índices (nome único) — idempotente enquanto não houver duplicatas
    pub async fn ensure_indexes(conn: &crate::connect::Conn) -> Result<(), mongodb::error::Error> {
        let coll = conn.db.collection::<Document>("tags");

        let options = IndexOptions::builder().unique(true).build();

        let model = IndexModel::builder()
            .keys(doc! { "nome": 1 })
            .options(options)
            .build();

        // create_index returns the name of the index on success
        coll.create_index(model).await.map(|_| ())
    }
}

// --- Tauri commands for Tag ---
#[tauri::command]
pub async fn create_tag(
    conn: tauri::State<'_, std::sync::Arc<crate::connect::Conn>>,
    tag: Tag,
) -> Result<serde_json::Value, String> {
    let conn_ref = conn.as_ref();
    crate::models::updatable::Updatable::create(&tag, conn_ref)
        .await
        .map_err(|e| e.to_string())?;
    serde_json::to_value(&tag).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_tag(
    conn: tauri::State<'_, std::sync::Arc<crate::connect::Conn>>,
    tag: Tag,
) -> Result<String, String> {
    let conn_ref = conn.as_ref();
    crate::models::updatable::Updatable::update(&tag, conn_ref)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_tag(
    conn: tauri::State<'_, std::sync::Arc<crate::connect::Conn>>,
    id: String,
) -> Result<String, String> {
    let conn_ref = conn.as_ref();
    let oid = mongodb::bson::oid::ObjectId::parse_str(&id).map_err(|e| e.to_string())?;
    if let Some(t) = <Tag as crate::models::updatable::Updatable>::get_by_id(conn_ref, oid)
        .await
        .map_err(|e| e.to_string())?
    {
        crate::models::updatable::Updatable::delete(&t, conn_ref)
            .await
            .map_err(|e| e.to_string())?;
        Ok("deleted".into())
    } else {
        Err("not found".into())
    }
}

#[tauri::command]
pub async fn get_tag_by_id(
    conn: tauri::State<'_, std::sync::Arc<crate::connect::Conn>>,
    id: String,
) -> Result<Option<Tag>, String> {
    let conn_ref = conn.as_ref();
    let oid = mongodb::bson::oid::ObjectId::parse_str(&id).map_err(|e| e.to_string())?;
    <Tag as crate::models::updatable::Updatable>::get_by_id(conn_ref, oid)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn filter_tags(
    conn: tauri::State<'_, std::sync::Arc<crate::connect::Conn>>,
    attribute: String,
    value: serde_json::Value,
    page: Option<u64>,
    per_page: Option<u64>,
) -> Result<serde_json::Value, String> {
    let conn_ref = conn.as_ref();
    let b = mongodb::bson::to_bson(&value).map_err(|e| e.to_string())?;
    let (items, total) = <Tag as crate::models::updatable::Updatable>::filter_by_attribute(
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
