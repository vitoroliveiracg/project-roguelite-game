package game;

import cartago.*;
import org.java_websocket.server.WebSocketServer;
import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import java.net.InetSocketAddress;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

public class GameSocketArtifact extends Artifact {
    
    private GameWebSocketServer server;
    private WebSocket activeGameConnection = null;

    void init() {
        server = new GameWebSocketServer(new InetSocketAddress(8080));
        server.start();
        System.out.println("[CArtAgO] Servidor BDI escutando na porta 8080...");
        defineObsProperty("player_message", "");
    }

    // === AÇÕES QUE O JASON PODE EXECUTAR (E REFLETIR NO TYPESCRIPT) ===

    @OPERATION
    void speak(int targetId, String message) {
        if (activeGameConnection != null && activeGameConnection.isOpen()) {
            JsonObject json = new JsonObject();
            json.addProperty("action", "speak");
            json.addProperty("targetId", targetId);
            json.addProperty("message", message);
            activeGameConnection.send(json.toString());
        }
    }

    @OPERATION
    void move_to(int targetId, double x, double y) {
        if (activeGameConnection != null && activeGameConnection.isOpen()) {
            JsonObject json = new JsonObject();
            json.addProperty("action", "move_to");
            json.addProperty("targetId", targetId);
            JsonObject pos = new JsonObject();
            pos.addProperty("x", x);
            pos.addProperty("y", y);
            json.add("targetPos", pos);
            activeGameConnection.send(json.toString());
        }
    }

    // === SERVIDOR WEBSOCKET ===

    private class GameWebSocketServer extends WebSocketServer {
        public GameWebSocketServer(InetSocketAddress address) { super(address); }

        @Override
        public void onOpen(WebSocket conn, ClientHandshake handshake) {
            activeGameConnection = conn;
            System.out.println("[CArtAgO] Motor TypeScript conectado!");
        }

        @Override
        public void onMessage(WebSocket conn, String message) {
            beginExtSession();
            try {
                JsonObject json = JsonParser.parseString(message).getAsJsonObject();
                
                // 1. Extrai Percepções de Espaço (Proximidade do Player)
                if (json.has("playerPosition")) {
                    JsonObject pos = json.getAsJsonObject("playerPosition");
                    double px = pos.get("x").getAsDouble();
                    double py = pos.get("y").getAsDouble();
                    if (hasObsProperty("player_position")) getObsProperty("player_position").updateValues(px, py);
                    else defineObsProperty("player_position", px, py);
                }
                
                // 2. Extrai Percepções de Sobrevivência (HP do Player)
                if (json.has("hpPercentage")) {
                    double hp = json.get("hpPercentage").getAsDouble();
                    if (hasObsProperty("entity_hp")) getObsProperty("entity_hp").updateValue(hp);
                    else defineObsProperty("entity_hp", hp);
                }
                
                // 3. Extrai Intenção de Diálogo
                if (json.has("playerMessage")) {
                    String msg = json.get("playerMessage").getAsString();
                    if (!msg.isEmpty()) {
                        if (hasObsProperty("player_message")) getObsProperty("player_message").updateValue(msg);
                        else defineObsProperty("player_message", msg);
                    }
                }
            } catch (Exception e) { e.printStackTrace(); }
            endExtSession();
        }

        @Override
        public void onClose(WebSocket conn, int code, String reason, boolean remote) { activeGameConnection = null; }
        @Override public void onError(WebSocket conn, Exception ex) {} @Override public void onStart() {}
    }
}