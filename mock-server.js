const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ port: 8080 });

console.log("🧠 Servidor Athena (Mock) rodando na porta 8080...");

wss.on('connection', function connection(ws) {
  console.log("🎮 Jogo conectado ao servidor da IA!");

  // 1. Assim que o jogo conectar, o Molor inicia a conversa sozinho!
  setTimeout(() => {
    ws.send(JSON.stringify({
      action: "speak",
      targetId: 100, // ID aproximado do Molor (O ObjectManager começa a instanciar no 100)
      message: "Saudações, jovem Axiomante. Eu sou o Diretor Molor. Vejo que finalmente despertou no Sonho."
    }));
  }, 3000); // Espera 3 segundos após o jogo carregar

  // 2. Escuta as respostas que você digitar na tela do jogo
  ws.on('message', function message(data) {
    const perception = JSON.parse(data);
    console.log("📡 Recebido do jogo:", perception);

    if (perception.playerMessage) {
        console.log(`🗣️ Jogador digitou: "${perception.playerMessage}"`);
        
        // Simula o tempo que a LLM (Ollama) levaria para "pensar" e responder
        setTimeout(() => {
            ws.send(JSON.stringify({
                action: "speak",
                targetId: perception.agentId,
                message: `Muito audacioso você me dizer "${perception.playerMessage}"... O caos da magia aguarda o seu comando.`
            }));
        }, 1500);
    }
  });
});
