use crate::connect::Conn;
use mongodb::bson::oid::ObjectId;
use mongodb::bson::{self, doc, Bson, Document};
use mongodb::error::Error;
use serde::de::DeserializeOwned;
use tokio_stream::StreamExt;

#[async_trait::async_trait]
pub trait Updatable: serde::Serialize + Sync + Sized {
    /// nome da coleção onde a entidade é persistida (ex.: "fornecedores")
    fn collection_name() -> &'static str;

    /// retorna o id da entidade, se existir (clonado)
    fn id_opt(&self) -> Option<ObjectId>;

    /// atualiza os produtos relacionados a esta entidade (padrão: no-op)
    async fn update_all_products(&self, _conn: &Conn) -> Result<String, Error> {
        Ok("No related products".into())
    }

    /// implementação padrão: persiste a entidade (insert ou replace/upsert) e em seguida chama `update_all_products`
    async fn update(&self, conn: &Conn) -> Result<String, Error> {
        // serializa para documento
        let bson = bson::to_bson(self).map_err(Error::custom)?;
        let mut doc = match bson {
            Bson::Document(d) => d,
            _ => return Err(Error::custom("failed to serialize entity to document")),
        };

        let coll = conn.db.collection::<Document>(Self::collection_name());

        match self.id_opt() {
            Some(id) => {
                // garante que _id esteja presente no documento
                doc.insert("_id", Bson::ObjectId(id));
                coll.replace_one(doc! {"_id": id}, doc).await?;
            }
            None => {
                // remove _id se existir e insere
                doc.remove("_id");
                coll.insert_one(doc).await?;
            }
        }

        // após salvar, atualiza produtos relacionados
        let update_msg = self.update_all_products(conn).await?;

        Ok(format!("Entity saved and {}", update_msg))
    }

    /// create padrão: insere a entidade
    async fn create(&self, conn: &Conn) -> Result<mongodb::results::InsertOneResult, Error> {
        let bson = bson::to_bson(self).map_err(Error::custom)?;
        let doc = match bson {
            Bson::Document(d) => d,
            _ => return Err(Error::custom("failed to serialize entity to document")),
        };
        let coll = conn.db.collection::<Document>(Self::collection_name());
        coll.insert_one(doc).await
    }

    /// delete padrão: remove por _id
    async fn delete(&self, conn: &Conn) -> Result<mongodb::results::DeleteResult, Error> {
        if let Some(id) = &self.id_opt() {
            let coll = conn.db.collection::<Document>(Self::collection_name());
            coll.delete_one(doc! {"_id": *id}).await
        } else {
            Err(Error::custom("id is required for delete"))
        }
    }

    /// list paginado (retorna (items, total_count))
    async fn list_paginated(
        conn: &Conn,
        page: u64,
        per_page: u64,
    ) -> Result<(Vec<Self>, i64), Error>
    where
        Self: DeserializeOwned + Unpin + Send + Sync + 'static,
    {
        let coll = conn.db.collection::<Self>(Self::collection_name());

        // Use aggregation pipeline for skip/limit since `find` in this driver version
        // does not accept options in the same overload.
        let skip = ((page.saturating_sub(1)) * per_page) as i64;
        let limit = per_page as i64;
        let pipeline = vec![doc! { "$skip": skip }, doc! { "$limit": limit }];

        let mut cursor = coll.aggregate(pipeline).await?;
        let mut items: Vec<Self> = Vec::new();
        while let Some(res) = cursor.next().await {
            let doc = res?;
            let item: Self = bson::from_document(doc).map_err(Error::custom)?;
            items.push(item);
        }

        let total_u64 = coll.count_documents(doc! {}).await?;
        let total = total_u64.try_into().unwrap_or(total_u64 as i64);
        Ok((items, total))
    }

    /// get by id padrão
    async fn get_by_id(conn: &Conn, id: ObjectId) -> Result<Option<Self>, Error>
    where
        Self: DeserializeOwned + Unpin + Send + Sync + 'static,
    {
        let coll = conn.db.collection::<Self>(Self::collection_name());
        let filter = doc! { "_id": id };
        let res = coll.find_one(filter).await?;
        Ok(res)
    }

    /// filter by attribute (partial filter) com paginação
    async fn filter_by_attribute(
        conn: &Conn,
        attribute: &str,
        value: Bson,
        page: u64,
        per_page: u64,
    ) -> Result<(Vec<Self>, i64), Error>
    where
        Self: DeserializeOwned + Unpin + Send + Sync + 'static,
    {
        let mut filter_doc = Document::new();
        filter_doc.insert(attribute, value);

        let skip = ((page.saturating_sub(1)) * per_page) as i64;
        let limit = per_page as i64;
        let pipeline = vec![
            doc! { "$match": filter_doc.clone() },
            doc! { "$skip": skip },
            doc! { "$limit": limit },
        ];

        let coll = conn.db.collection::<Self>(Self::collection_name());
        let mut cursor = coll.aggregate(pipeline).await?;
        let mut items: Vec<Self> = Vec::new();
        while let Some(res) = cursor.next().await {
            let doc = res?;
            let item: Self = bson::from_document(doc).map_err(Error::custom)?;
            items.push(item);
        }

        let total_u64 = conn
            .db
            .collection::<Self>(Self::collection_name())
            .count_documents(filter_doc)
            .await?;
        let total = total_u64.try_into().unwrap_or(total_u64 as i64);
        Ok((items, total))
    }
}
