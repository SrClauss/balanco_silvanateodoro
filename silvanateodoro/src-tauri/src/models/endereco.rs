use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Endereco {
    pub rua: String,
    pub numero: Option<i32>,
    pub complemento: Option<String>,
    pub bairro: String,
    pub cidade: String,
    pub estado: String,
    pub cep: String,
}

impl Endereco {
    pub fn full_address(&self) -> String {
        let numero = self.numero.map_or("".to_string(), |n| n.to_string());
        let complemento = match &self.complemento {
            Some(comp) => format!(", {}", comp),
            None => "".to_string(),
        };
        format!(
            "{} {}, {} , {} , {} , {} , {}",
            self.rua, numero, complemento, self.bairro, self.cidade, self.estado, self.cep
        )
    }

    pub fn new(
        rua: String,
        numero: Option<i32>,
        complemento: Option<String>,
        bairro: String,
        cidade: String,
        estado: String,
        cep: String,
    ) -> Self {
        Endereco {
            rua,
            numero,
            complemento,
            bairro,
            cidade,
            estado,
            cep,
        }
    }
}
