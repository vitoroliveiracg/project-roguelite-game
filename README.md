# project-roguelite-game

RPG roquelite bullet hell like game project

Flag debug: //! --debug

[dontpad](https://dontpad.com/project-roguelite-game)

## REQUISITOS

> Mapa

* Mapa geral contínuo, fast travel para regioes já visitadas

* Montaria para locomoção


> Armas e Classes

* Habilidades passivas das classes funcionam somente com as classes ativas

* Armas liberam classes mas as classes não são ligadas as armas, pegou o item e libera a classe, mas se tirou, tá desbloqueado

> Iniciar jogo

* World event que favorece uma classe e outro world event que desfavorecem outras classe (Dois tigrinn na tela) - Seu dano de pistola é reduzido e o dano de pistola de inimigos é aumentado; Dano de espada é aumentado e dano de espada de inimigos é diminuido (Pode variar)

* Primeira entrada, NPC fala com você explica as classes base (Guerreiro, Feiticeiro, Mago, Arqueiro, )

> Item Drop

* Item fica no chão se inventário cheio.

* Item tem range de atributos (e muito menor de ter efeito)

* Drops são raros e caem no chão. Pega ao passar perto (3% drop rate)


> Mobs

* Range máximo para aggro dos inimigos. Fora do range desespawna (difício escapar no início)


## Lista de tarefas a discutir

Épico 1: Interface de Usuário (UI) - Personagem

Baseado nos seus wireframes image_625278.png (Inventário), image_6200bd.jpg (Status) e image_62525c.png (Stats).

    Tarefa: Criar Moldura Principal da Interface do Personagem

        Implementar o container principal com 3 abas navegáveis: "Inv" (Inventário), "Status", "Skill".

        Garantir que o estado da aba selecionada seja mantido.

    Tarefa: Implementar Aba "Inv" (Inventário)

        Sub-tarefa: Criar a grade do inventário ("Bolsa") com slots.

        Sub-tarefa: Criar a UI do "Paper Doll" (boneco de equipamento).

        Sub-tarefa: Implementar os slots de equipamento específicos (ex: capacete, peitoral, arma 1, arma 2, bota, pernas, e 3 slots de acessórios/anéis, conforme image_625278.png).

        Sub-tarefa: Criar lógica de "Equipar/Desequipar" (arrastar e soltar, ou clique-direito) entre a Bolsa e o Paper Doll.

    Tarefa: Implementar Aba "Status"

        Sub-tarefa: Criar a seção "ATRIBUTOS" (conforme image_6200bd.jpg).

        Sub-tarefa: Implementar o sistema de "PONTOS: X" para distribuição.

        Sub-tarefa: Adicionar botões de "+"/"-" para alocar pontos em cada atributo.

        Sub-tarefa: Implementar o botão de "alocação automática" (conforme nota no rodapé de image_6200bd.jpg).

        Sub-tarefa: Criar a lista de exibição de status secundários (ex: "CRIT", "Dano", "Magia").

        Sub-tarefa: Implementar o cálculo e exibição de bônus percentuais (ex: "Dano +1024%", conforme image_62525c.png).

        Sub-tarefa: Criar a seção "habilidades passivas" para exibir ícones das passivas ativas.

        Sub-tarefa: Implementar a seção "GERAL" (provavelmente para os "broches" mencionados na sua lista).

Épico 2: Sistema de Habilidades (Skills)

Baseado nos seus wireframes image_62009f.jpg (Skill Tree) e image_625255.jpg (UI de Skills), e na sua tarefa Árvore de habilidades.

    Tarefa: Criar UI da "Árvore de Habilidades" (Skill Tree)

        Sub-tarefa: Implementar o layout visual da árvore com nós (círculos, retângulos) e linhas de conexão (conforme image_62009f.jpg).

        Sub-tarefa: Criar lógica de pré-requisitos (nó só pode ser habilitado se o anterior estiver).

        Sub-tarefa: Diferenciar visualmente tipos de nós: "Passiva", "Hab. ativa" (Habilidade Ativa) e "RARO".

        Sub-tarefa: Implementar o sistema de "Tiers" ou seções (conforme barra lateral 1, 2, 3, 4 em image_62009f.jpg).

        Sub-tarefa: Associar cada árvore a uma Classe (conforme ícones no topo de image_62009f.jpg: espada, cajado, arco, etc.).

    Tarefa: Criar UI de Gerenciamento de Skills Ativas/Passivas

        Requisito extraído de image_625255.jpg.

        Sub-tarefa: Criar a UI para equipar skills (conforme image_625255.jpg).

        Sub-tarefa: Implementar slots de skills "Ativo" (círculos) e "Passivo" (triângulo).

        Sub-tarefa: Implementar sistema de "Nível" para skills (ex: "Lv 5", "Lv 4").

        Sub-tarefa: Implementar sistema de desbloqueio de slots de skill (os cadeados em image_625255.jpg).

    Tarefa: [BACK-END] Lógica das Classes

        Implementar a lógica: "Armas liberam classes".

        Implementar a lógica: "classes não são ligadas as armas" (desbloqueio é permanente).

        Implementar a lógica: "Habilidades passivas das classes funcionam somente com as classes ativas".

Épico 3: Sistema de Mapas e Progressão

Baseado nos seus wireframes image_623b.png (Mapa da Run) e image_625293.jpg (Mapa-Múndi), e nas suas tarefas sobre mapas.

    Tarefa: Criar UI e Lógica do Mapa-Múndi

        Sub-tarefa: Implementar a UI do mapa-múndi (conforme image_625293.jpg).

        Sub-tarefa: Adicionar as diferentes zonas/ilhas (ex: "Vilgen", "Aun").

        Sub-tarefa: Implementar a funcionalidade de "Teletrans..." (Fast Travel) para zonas já visitadas.

        Sub-tarefa: Mostrar visualmente os caminhos/conexões entre as zonas.

        Sub-tarefa: Adicionar bússola e botão de fechar "X".

    Tarefa: Criar UI e Lógica do Mapa de Progressão (Run)

        Requisito extraído de image_623b.png (parece um mapa de "run" estilo Slay the Spire).

        Sub-tarefa: Implementar a UI de progressão baseada em nós (nodes).

        Sub-tarefa: Criar lógica para caminhos com bifurcações.

        Sub-tarefa: Criar diferentes tipos de nós (ex: combate, evento, loja, boss).

        Sub-tarefa: Exibir informações nos nós (ex: Nível "Lv 2", Custo/Recompensa "500").

        Sub-tarefa: Implementar a lógica de "Compositor de mapas" (geração procedural ou manual desses caminhos).

Épico 4: Sistema de Itens, Crafting e Drops

Baseado na sua lista de requisitos e no wireframe image_625255.jpg (que menciona "craftar").

    Tarefa: [BACK-END] Lógica de Drop de Itens

        Implementar taxa de drop (ex: 3%).

        Itens devem instanciar no chão ("caem no chão").

        Implementar coleta por proximidade ("Pega ao passar perto").

        Implementar a regra: "Item fica no chão se inventário cheio".

        Implementar sistema de atributos com ranges variáveis.

        Implementar chance de itens terem "efeitos" especiais.

    Tarefa: Sistema de Crafting (Criação de Itens)

        Requisito extraído de image_625255.jpg ("craftar").

        Sub-tarefa: Criar a UI de Crafting (a lista à esquerda em image_625255.jpg pode ser a lista de receitas).

        Sub-tarefa: Implementar um sistema de receitas (materiais necessários).

        Sub-tarefa: Implementar o desbloqueio de receitas (talvez os slots com cadeado "LISO"?).

        Sub-tarefa: Criar lógica para consumir materiais do inventário e criar o item.

Épico 5: Customização e Gameplay Inicial

Baseado nas suas tarefas e requisitos.

    Tarefa: Compositor de Sprites do Personagem

        Sub-tarefa: Criar a UI de seleção (cabelo, cor, olhos).

        Sub-tarefa: Implementar o sistema que "monta" o sprite do jogador com base nas escolhas.

        Sub-tarefa: Integrar com o "Paper Doll": itens equipados (capacete, espada) devem sobrepor ou alterar o sprite base.

    Tarefa: Lógica de Início de Jogo (Run)

        Sub-tarefa: Implementar o sistema de "World Events" (buffs/debuffs da run).

        Sub-tarefa: Criar a UI para exibir os eventos ativos (ex: "Dois tigrinn na tela").

        Sub-tarefa: Criar o diálogo/tutorial do NPC inicial para explicar as classes base.
