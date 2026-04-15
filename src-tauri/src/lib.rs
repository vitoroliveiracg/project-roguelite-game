use std::thread;
use tauri::Emitter;
use tauri_plugin_shell::ShellExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      let app_handle = app.handle().clone();

      // Thread paralela para Boot Silencioso do Motor de IA (Ollama)
      thread::spawn(move || {
          log::info!("Iniciando servidor do Ollama embutido (Sidecar)...");
          let _ = app_handle.emit("loading-progress", "Iniciando servidor do Ollama (Sidecar)...");
          
          let sidecar = app_handle.shell().sidecar("ollama");
          match sidecar {
              Ok(mut serve_cmd) => {
                  let _ = serve_cmd.args(["serve"]).spawn().expect("Falha ao rodar ollama serve");
                  thread::sleep(std::time::Duration::from_secs(2)); // Aguarda a porta 11434 abrir

                  log::info!("Verificando/baixando o modelo de IA (qwen2.5:0.5b). Pode demorar na primeira vez...");
                  let _ = app_handle.emit("loading-progress", "Verificando integridade do cérebro (Modelo Qwen2.5 0.5B)...");
                  let pull_cmd = app_handle.shell().sidecar("ollama").expect("Falha ao criar sidecar pull");
                  let _ = tauri::async_runtime::block_on(pull_cmd.args(["pull", "qwen2.5:0.5b"]).output()).expect("Falha ao rodar ollama pull");
              },
              Err(e) => {
                  log::error!("Sidecar 'ollama' não encontrado em src-tauri/bin/. Usando Ollama do sistema como fallback. Erro: {}", e);
                  let _ = app_handle.emit("loading-progress", "Avisando o SO para iniciar o Ollama nativo...");
                  // Fallback temporário para desenvolvimento usando std::process::Command
                  let mut serve_fallback = std::process::Command::new("ollama");
                  serve_fallback.arg("serve");
                  #[cfg(target_os = "windows")]
                  { use std::os::windows::process::CommandExt; serve_fallback.creation_flags(0x08000000); }
                  let _ = serve_fallback.spawn();
                  thread::sleep(std::time::Duration::from_secs(2));
                  let mut pull_fallback = std::process::Command::new("ollama");
                  pull_fallback.arg("pull").arg("qwen2.5:0.5b");
                  #[cfg(target_os = "windows")]
                  { use std::os::windows::process::CommandExt; pull_fallback.creation_flags(0x08000000); }
                  let _ = pull_fallback.output();
              }
          }
          
          log::info!("Aquecendo o modelo e travando na memória de vídeo (Sessão Perpétua)...");
          let _ = app_handle.emit("loading-progress", "Aquecendo a IA na Placa de Vídeo (Sessão Perpétua)...");
          let client = reqwest::blocking::Client::new();
          let _ = client.post("http://localhost:11434/api/generate")
              .json(&serde_json::json!({
                  "model": "qwen2.5:0.5b",
                  "prompt": "Sua inicialização no jogo foi concluída com sucesso.",
                  "keep_alive": -1 // O segredo! Trava o modelo na RAM/VRAM indefinidamente
              }))
              .send();

          log::info!("Motor Cognitivo Pronto! Desbloqueando a UI...");
          let _ = app_handle.emit("ollama-ready", ());
      });

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
