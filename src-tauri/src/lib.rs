use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;
use tauri::Emitter;
use tauri::Manager;
use std::io::{Read, Write};

const SECRET_KEY: &str = "Axiomante2026"; // Chave de Ofuscação (Palavra-Chave Encriptada)

fn xor_cipher(data: &[u8], key: &str) -> Vec<u8> {
    let key_bytes = key.as_bytes();
    if key_bytes.is_empty() { return data.to_vec(); }
    data.iter().enumerate().map(|(i, b)| b ^ key_bytes[i % key_bytes.len()]).collect()
}

// Comando IPC exposto para o Frontend chamar via 'invoke'
#[tauri::command]
async fn save_game_state(app: tauri::AppHandle, payload: String) -> Result<String, String> {
    let start = std::time::Instant::now();
    println!("[Rust IPC] Recebido DTO de Save State com {} bytes.", payload.len());
    
    let path = app.path().app_local_data_dir().map_err(|e| e.to_string())?.join("savegame.sav");
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    
    let encrypted_data = xor_cipher(payload.as_bytes(), SECRET_KEY);
    let mut file = std::fs::File::create(path).map_err(|e| e.to_string())?;
    file.write_all(&encrypted_data).map_err(|e| e.to_string())?;
    
    println!("[Rust IPC] Jogo salvo nativamente e criptografado em {:?}", start.elapsed());
    Ok("Progresso salvo com sucesso no disco!".to_string())
}

#[tauri::command]
async fn load_game_state(app: tauri::AppHandle) -> Result<String, String> {
    let path = app.path().app_local_data_dir().map_err(|e| e.to_string())?.join("savegame.sav");
    if !path.exists() { return Err("Nenhum save encontrado no disco.".to_string()); }
    
    let mut file = std::fs::File::open(path).map_err(|e| e.to_string())?;
    let mut encrypted_data = Vec::new();
    file.read_to_end(&mut encrypted_data).map_err(|e| e.to_string())?;
    
    let decrypted_data = xor_cipher(&encrypted_data, SECRET_KEY);
    let json = String::from_utf8(decrypted_data).map_err(|e| e.to_string())?;
    
    Ok(json)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Inicialização do Daemon do Ollama (IA Generativa) via Sidecar no Boot da Aplicação
            let shell = app.shell();
            let app_handle = app.handle().clone();
            
            match shell.sidecar("ollama") {
                Ok(command) => {
                    match command.args(["serve"]).spawn() {
                        Ok((mut rx, _child)) => {
                            tauri::async_runtime::spawn(async move {
                                while let Some(event) = rx.recv().await {
                                    match event {
                                        CommandEvent::Stdout(line) => {
                                            let text = String::from_utf8_lossy(&line);
                                            println!("[Ollama Stdout] {}", text);
                                            if text.contains("Listening on") {
                                                let _ = app_handle.emit("ollama-ready", ());
                                            }
                                        },
                                        CommandEvent::Stderr(line) => {
                                            let text = String::from_utf8_lossy(&line);
                                            eprintln!("[Ollama Log/Error] {}", text);
                                            // Se já estiver rodando na porta
                                            if text.contains("address already in use") || text.contains("Listening on") {
                                                let _ = app_handle.emit("ollama-ready", ());
                                            }
                                        },
                                        CommandEvent::Terminated(payload) => {
                                            println!("[Ollama] Processo sidecar encerrado (Código: {:?}).", payload.code);
                                            let _ = app_handle.emit("ollama-ready", ());
                                        },
                                        CommandEvent::Error(err) => {
                                            eprintln!("[Ollama Daemon Internal Error] {}", err);
                                            let _ = app_handle.emit("ollama-ready", ());
                                        }
                                        _ => {}
                                    }
                                }
                            });
                        }
                        Err(e) => {
                            eprintln!("[Erro] Falha ao spawnar o processo do Ollama: {}", e);
                            let _ = app_handle.emit("ollama-ready", ());
                        }
                    }
                }
                Err(e) => {
                    eprintln!("[Aviso Crítico] Tauri bloqueou/não encontrou o Sidecar 'ollama'. Motivo interno: {}", e);
                    let _ = app_handle.emit("ollama-ready", ());
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![save_game_state, load_game_state])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}