use std::env;

fn main() {
    // Attempt to load .env in src-tauri (useful during local development)
    let _ = dotenv::from_filename(".env");

    // Embed MONGO_URL into compile-time env if present in .env or environment
    if let Ok(val) = env::var("MONGO_URL") {
        println!("Embedding MONGO_URL from environment into binary (compile-time)");
        println!("cargo:rustc-env=MONGO_URL={}", val);
    } else {
        println!("No MONGO_URL found in build environment (.env or env)");
    }

    tauri_build::build()
}
