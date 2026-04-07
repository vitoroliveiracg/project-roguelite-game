// Mente do Diretor Molor usando a StdLib simplificada da Athena

!start.

+!start <- 
    // 1. Cria o servidor Socket (Corpo CArtAgO)
    makeArtifact("game_socket", "game.GameSocketArtifact", [], ArtId);
    focus(ArtId);
    
    // 2. Prepara a mente LLM usando a sua biblioteca Athena
    // Damos à IA o poder de inserir crenças meta-cognitivas na resposta!
    addPersona("Você é Molor, um arquimago diretor da academia. Responda com no máximo 2 frases, sendo impaciente, mas sábio. Se o jogador estiver muito ferido ou pedir para você ir até ele, inclua a exata string '[MOVE_TO_PLAYER]' no final da sua fala.");
    startThink("qwen3:1.7b");
    .wait(incorporated);
    .print("Molor está online. Mente LLM e Corpo TypeScript sincronizados.").


// 3. Evento puro BDI: O CArtAgO percebeu Diálogo e Percepções Espaciais!
+player_message(Msg) : Msg \== "" & player_position(Px, Py) & entity_hp(Hp) <-
    .print("O jogador disse: ", Msg, " | HP Lido: ", Hp);
    
    .concat("O jogador disse: '", Msg, "'. O HP dele é ", Hp, " (onde 1.0 é vida cheia). Se ele precisar de ajuda, adicione [MOVE_TO_PLAYER] na resposta.", Prompt);
    
    ask_llm(Prompt, RespostaDaLLM);
    .print("A LLM decidiu falar: ", RespostaDaLLM);
    
    speak(100, RespostaDaLLM);
    
    if ( .substring("[MOVE_TO_PLAYER]", RespostaDaLLM) ) {
        .print("A IA emitiu um comando motor! Movendo o corpo para X:", Px, " Y:", Py);
        move_to(100, Px - 40, Py); // Move o NPC no TypeScript para perto do Player
    }
    
    -+player_message("").