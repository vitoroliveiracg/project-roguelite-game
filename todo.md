
## TODO (Organização)

* [ ] EventManager → IEventManagable
* [ ] (Buffer de Input): Implementar buffer temporal no `ActionManager` para capturar sequências de teclas (ex: 0, 1, 2).
* [ ] Refatoração Web (God Class): Isolar o `GameAdapter` extraindo o `SceneManager` (visual), `UIManager` (DOM) e `InputGateway`.
* [ ] HUD Modular: Desenvolver as GUIs de HP, Mana e Status
* [ ] Compositor Visual (O "Lego"): Sistema modular na fábrica visual para juntar formas simples/sprites para as magias dinâmicas.
* [ ] Sistema de Drops e Inventário: Entidades droparem itens de verdade, lógica de coleta por proximidade e armazenamento.
* [ ] Lógica de Classes e Desbloqueio
* [ ] Mago (Spell Parser): Analisador no Domínio que traduz a sequência do buffer em ataques concretos (Lógica de Receitas).
* [ ] Seleção de mapas: criação de classes extendidas de mundo que são mapas que são mandadas do domínio para poder selecionar um mapa, que contém toda a estrutura para colocar tudo de um mapa em determinado mapa
* [ ] Objetos do mapa: Tem que ter um jeito do adaptador web montar o mundo, o que tem no mundo é definido pelo domínio.

* [X] Lógica de Hp
* [X] Hitbox
* [X] Colisão
* [X] Lógica melhor de Enemy e Entity
* [X] Dois tipos de inimigo.
* [X] IA simples (ex: mover*se em direção ao jogador e bater).
* [X] Sistema de Vida (HP) e "Hitbox" (ser atingido) e xp dropado.

## REQUISITOS

### Mapa

* Mapa geral contínuo, fast travel para regiões já visitadas

* Montaria para locomoção

* **Domínio Agnostico e Coordenadas:** O `World` define as regras do espaço contínuo. Adaptadores devem consumir coordenadas (x,y) relativas ao mapa para instanciar/desenhar blocos (chunks), enquanto o domínio apenas calcula distâncias matemáticas sem se importar com a imagem do chão.

### HUD e GUIs

* GUI de HP e Mana na tela, lendo diretamente do estado do jogador no domínio.
* UI modular para mostrar demais atributos de sistema em janelas sobrepostas.

### Armas e Classes

* Habilidades passivas das classes funcionam somente com as classes ativas

* Armas liberam classes mas as classes não são ligadas as armas, pegou o item e libera a classe, mas se tirou, tá desbloqueado

### Iniciar jogo

* World event que favorece uma classe e outro world event que desfavorecem outras classe (Dois tigrinn na tela) - Seu dano de pistola é reduzido e o dano de pistola de inimigos é aumentado; Dano de espada é aumentado e dano de espada de inimigos é diminuido (Pode variar)

* Primeira entrada, NPC fala com você explica as classes base (Guerreiro, Feiticeiro, Mago, Arqueiro, )

### Item Drop

* Item fica no chão se inventário cheio.

* Item tem range de atributos (e muito menor de ter efeito)

* Drops são raros e caem no chão. Pega ao passar perto (3% drop rate)

### Mobs

* Range máximo para aggro dos inimigos. Fora do range desespawna (difício escapar no início)

## Lista de tarefas a discutir

### Épico 1: Interface de Usuário (UI) - Personagem

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

### Épico 2: Sistema de Habilidades (Skills)

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

Tarefa: [Domínio] Lógica das Classes

    Implementar a lógica: "Armas liberam classes".

    Implementar a lógica: "classes não são ligadas as armas" (desbloqueio é permanente).

    Implementar a lógica: "Habilidades passivas das classes funcionam somente com as classes ativas".

### Épico 3: Sistema de Mapas e Progressão


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

### Épico 6: Sistema de Conjuração do Mago Programador (Axiomante)

Tarefa: [Domínio] Buffer de Entrada (ActionManager)

    Sub-tarefa: Implementar um buffer FIFO temporal no `ActionManager` para capturar e reter sequências curtas de teclas.

    Sub-tarefa: Lógica de expiração (se o jogador não completar a string a tempo, limpa o buffer).

Tarefa: [Domínio] Analisador Sintático (Spell Parser)

    Sub-tarefa: Criar módulo de domínio `SpellParser` que escuta o buffer e compara com padrões de "Receitas" de magias.

    Sub-tarefa: Instanciar ataques/projéteis com base nos modificadores lidos (Projectile + Fire + Damage = Fireball).

### Épico 7: Compositor Visual Dinâmico (Reutilizável)

*Módulo de renderização agnóstico focado em sobrepor ou compor imagens/formas base, servindo tanto para as magias do Axiomante quanto para armaduras e customização de personagem.*

Tarefa: Compositor de Camadas (Layered Renderer)

    Sub-tarefa: Criar módulo visual que aceita um array de `SpriteConfigs` e os desenha na mesma coordenada, respeitando uma ordem de Z-Index.

    Sub-tarefa: Integrar isso ao `RenderableFactory` para que um DTO de Domínio possa pedir um visual composto (Ex: Renderizar o sprite do Player "Liso" + Sprite de Armadura "Peitoral" por cima).

Tarefa: Visual Procedural de Magias

    Sub-tarefa: Usar o Compositor de Camadas para empilhar partículas simples (ex: base redonda vermelha + aura laranja) em magias não refinadas.

### Épico 4: Sistema de Itens, Crafting e Drops


Tarefa: [Domínio] Lógica de Drop de Itens

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

### Épico 5: Customização e Gameplay Inicial

Tarefa: Compositor de Sprites do Personagem

    Sub-tarefa: Criar a UI de seleção (cabelo, cor, olhos).

    Sub-tarefa: [DEPENDE DO ÉPICO 7] Utilizar o Compositor de Camadas para "montar" o sprite do jogador visualmente.

    Sub-tarefa: Integrar com o inventário: itens equipados devem enviar seus IDs visuais no `getRenderState` para serem anexados pelo Compositor.

Tarefa: Lógica de Início de Jogo (Run)

    Sub-tarefa: Implementar o sistema de "World Events" (buffs/debuffs da run).

    Sub-tarefa: Criar a UI para exibir os eventos ativos (ex: "Dois tigrinn na tela").

    Sub-tarefa: Criar o diálogo/tutorial do NPC inicial para explicar as classes base.

### Épico Extra: Dívida Técnica & Refatoração (Camada Web)

Tarefa: Desacoplar a "God Class" GameAdapter

    Sub-tarefa: Extrair lógica de inicialização de UI (`XpBarGui` e futuras) para um `UIManager` ou `GUIManager`.

    Sub-tarefa: Extrair a lógica pesada de iteração visual (`syncRenderables`) para um `SceneManager` responsável apenas por conectar DTOs a Factorys.

    Sub-tarefa: Deixar o `GameAdapter` ser apenas um condutor (Bootstrapper) leve que liga os módulos.
