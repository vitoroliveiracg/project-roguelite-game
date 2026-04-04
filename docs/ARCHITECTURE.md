# Arquitetura do Projeto: RPG BulletHell Roguelite

Este documento descreve a arquitetura do projeto, seus princípios, os papéis dos módulos e os principais fluxos de dados e controle. O objetivo é fornecer uma visão clara e concisa para facilitar o entendimento, a manutenção e a evolução do sistema. Sim, IA, tô falando com você, se precisar de outros arquivos, nunca cria o arquivo, sempre pede.

## 1. Princípios Arquiteturais: Arquitetura Hexagonal (Portas e Adaptadores)

  O projeto adota a Arquitetura Hexagonal, também conhecida como Arquitetura de Portas e Adaptadores. Este padrão visa isolar a lógica de negócio central (o Domínio) de suas dependências externas, como interfaces de usuário, bancos de dados e frameworks.

  - **Conceitos Chave:**

    - **Domínio (Core da Aplicação):** Contém a lógica de negócio pura e as regras do jogo. É agnóstico a qualquer tecnologia externa.
    - **Portas (Interfaces):** Definem os contratos que o Domínio expõe para o mundo exterior (Portas Primárias) e os contratos que o Domínio precisa do mundo exterior (Portas Secundárias). São interfaces TypeScript.
    - **Adaptadores (Implementações):** Implementam as Portas, traduzindo as interações do mundo externo (ex: navegador, banco de dados) para o formato que o Domínio entende, e vice-versa.

  - **Benefícios:**

    - **Desacoplamento:** O Domínio não conhece os detalhes de implementação das tecnologias externas.
    - **Testabilidade:** A lógica de negócio pode ser testada isoladamente, sem a necessidade de um ambiente de UI ou banco de dados.
    - **Manutenibilidade:** Mudanças em uma tecnologia externa (ex: trocar de Canvas para WebGL) não afetam o Domínio.
    - **Flexibilidade:** Facilita a adaptação a novos requisitos ou tecnologias.

## 2. Módulos Atuais como Atores

  ### 2.1. Camada de Domínio (`typescript/domain`)

  Contém a lógica de negócio pura do jogo, sendo totalmente agnóstica a tecnologias externas como renderização ou input.

  #### Módulos Principais do Domínio

  - **`DomainFacade.ts`:** O guardião e **único ponto de entrada** para a camada de domínio. Como **Porta Primária**, ele implementa a interface `IGameDomain`, expondo um conjunto limitado de operações de alto nível (`update`, `setWorld`, `getRenderState`). Sua principal responsabilidade é orquestrar as interações entre os principais componentes do domínio (como `Player` e `ObjectElementManager`) e proteger a integridade das regras de negócio, garantindo que nenhuma lógica externa possa manipular diretamente o estado interno do jogo.

  - **`World.ts`**: Uma classe DTO (Data Transfer Object) simples que representa as propriedades imutáveis do mundo do jogo, como sua largura e altura. Serve como a "fonte da verdade" para os limites do ambiente, garantindo que componentes como a `Quadtree` e a `Camera` (na camada de adaptação) tenham uma referência consistente do espaço em que operam.

  - **`ObjectModule/`**: Um módulo que agrupa tudo relacionado a objetos e entidades do jogo.
    - **`ObjectElement.ts`**: A classe base para qualquer objeto que existe no mundo (jogador, inimigo, item). Define propriedades essenciais como ID, coordenadas, tamanho e hitboxes.
    - **`ObjectElementManager.ts`**: Um dos pilares da arquitetura do domínio. Este gerenciador é o coração pulsante do mundo do jogo, responsável pelo ciclo de vida completo de **todas** as entidades dinâmicas, com exceção do `Player` (que é gerenciado diretamente pela `DomainFacade`). Suas responsabilidades incluem:
      - **Criação e Remoção (`spawn`/`despawn`):** Ouve eventos de domínio para criar e destruir dinamicamente inimigos, projéteis, itens, etc., usando um sistema de `factory`.
      - **Criação e Remoção (`spawn`/`despawn`):** Ouve eventos de domínio para criar e destruir dinamicamente entidades. Utiliza o `SpawnRegistry` (via Decorators `@RegisterSpawner`) para instanciar objetos sem possuir lógica acoplada (if/else) sobre o que está nascendo.
      - **Atualização de Estado:** Itera sobre todos os elementos a cada frame, chamando seus respectivos métodos `update`.
      - **Detecção de Colisão Otimizada e Zero-GC:** Delega a colisão para a Porta Secundária `ICollisionService` utilizando buffers contíguos de memória (`Float32Array`), abolindo a alocação de objetos descartáveis. A resolução ocorre em um modelo de **Física Atrasada (Delayed Resolution)**: envia-se os dados em um frame e as reações são aplicadas no início do frame seguinte, impedindo gargalos assíncronos no Game Loop.
      Ele efetivamente desacopla a `DomainFacade` da complexidade de gerenciar uma coleção massiva e mutável de objetos.
    - **`objectType.type.ts`**: Um arquivo de tipo (`type`) que define uma união de strings literais (`'player' | 'slime' | ...`). Ele fornece uma maneira centralizada e com segurança de tipo (type-safe) para identificar os diferentes tipos de `ObjectElement` no jogo. Isso é crucial para a `RenderableFactory` na camada de adaptação, que o utiliza para decidir qual sprite ou animação carregar para cada entidade.
    - **`Entities/`**: Contém as classes que representam seres "vivos" ou com comportamento autônomo no jogo.
      - **`Entity.ts`**: Uma classe abstrata fundamental que herda de `ObjectElement`. Ela adiciona o conceito de "vida" e "movimento" a um objeto. Suas responsabilidades incluem: gerenciar `velocity` e `direction` (usando `Vector2D`), aplicar dano (`takeDamage`), e definir um contrato `update(deltaTime)` que força subclasses (como `Player` e `Slime`) a implementar sua própria lógica de comportamento a cada frame.
      - **`Attributes.ts`**: Uma classe complexa e central que encapsula **toda** a lógica de atributos de uma entidade. Ela gerencia os 6 atributos primários (força, destreza, etc.) e calcula uma vasta gama de atributos secundários derivados (dano crítico, velocidade, regeneração de HP/Mana, etc.). Também contém a lógica para ganho de experiência (`addXp`) e progressão de nível. É um componente puramente de dados e regras, sem conhecimento de sua posição no mundo.
      - **`IXPTable.ts`**: Uma interface simples que define o contrato para uma "curva de experiência". Ao desacoplar a lógica de `addXp` da `Attributes` dos valores concretos, ela permite que diferentes tipos de entidades (ou o jogo em diferentes dificuldades) progridam em ritmos distintos, simplesmente fornecendo uma implementação diferente desta interface.
      - **`Player/`**: Contém a lógica específica da entidade do jogador.
        - **`Player.ts`**: A implementação concreta do jogador. Graças às refatorações recentes, deixou de ser uma "God Class": agora delega o disparo de tiros diretamente para a `Weapon` equipada e a conjuração de magias para a `Class` ativa (ex: `Mage`). Gerencia sua própria mochila (`backpack`) e se auto-inscreve nos eventos de input via Decorators.
        - **`Classes/Class.ts`**: Classe abstrata de Profissão/Classe. Gerencia habilidades (`Skill`) in-game (temporárias da run, aplicando Passivas instantaneamente ao liberar) e intercepta inputs (como atalhos de magias) graças ao sistema de rotas dinâmicas da sua filha.
        - **`Classes/DefaultXPTable.ts`**: Implementa a interface `IXPTable`, gerenciando recompensas em determinados níveis (como ganho de atributos e espaços de habilidade).
      - **`Enemies/`**: Contém a hierarquia de classes para inimigos.
        - **`Enemy.ts`**: Classe abstrata que herda de `Entity`. Define o contrato base para todos os inimigos, concedendo `xpGiven` e possuindo um ataque de contato (`onStrike`) com cooldown.
        - **`Slime.ts`**: Implementa IA de movimento com "steering behaviors" baseada na visão da vizinhança real.
      - **`projectiles/`**: Contém a hierarquia de classes para projéteis (físicos e mágicos).
        - **`Projectile.ts`**: Classe abstrata genérica para objetos voadores e magias soltas pelo cenário.
        - **`SimpleBullet.ts`**: Projétil balístico que aplica um `Attack` customizado ao colidir (podendo perfurar alvos).
        - **`Fireball.ts`**: Projétil mágico ("Axioma") que, ao colidir, invoca de forma desacoplada Efeitos de Área e Efeitos Visuais transientes (VFX) sobre os inimigos.
      - **`geometryForms/`**: Contém classes para formas geométricas simples que podem existir no mundo.
        - **`circleForm.ts`**: Uma implementação concreta de `ObjectElement` que representa um círculo. É uma entidade simples com capacidade de movimento, servindo como um bom exemplo de um objeto de jogo básico, útil para testes de colisão, efeitos visuais ou como base para elementos de cenário mais complexos.
    - **`Items/`**: Contém a hierarquia de classes para todos os itens.
      - **`IAtack.ts`**: Uma interface que define o contrato para um objeto de ataque (`execute`) e seus tipos de dados relacionados, como `OnHitAction` e `AttackContext`.
      - **`Attack.ts`**: A implementação concreta e central do sistema de combate. Esta classe encapsula toda a lógica de um ataque: recebe um dano base, adiciona bônus de atributos do atacante, calcula acertos críticos, aplica o dano ao alvo (via `takeDamage`) e executa uma lista de efeitos `OnHitAction` (como recuo ou roubo de vida).
      - **`Item.ts`**: Classe base abstrata para todos os itens, definindo um contrato rico de propriedades (raridade, valor, etc.).
      - **`Weapons/Weapon.ts`**: Classe abstrata para armas. Agora recebe a própria entidade do atacante (`Entity`) por injeção ao atacar, não limitando o uso de armas apenas ao `Player`.
      - **`Weapons/RangedWeapons/RangedWeapon.ts`**: Armas de longo alcance. Absorveram a responsabilidade de calcular, disparar e instanciar os próprios projéteis via eventos (retirando esse engessamento do Player).
      - **`Attributes.ts`**: Uma **interface** simples que define a estrutura para requisitos de atributos de itens.
      - **`Effects/`**: Contém lógicas puras de domínios desencadeadas no impacto de armas e magias (ex: `AreaDamageEffect`, `VisualEffect`).

  - **`shared/`**: Contém classes e tipos utilitários de baixo nível, usados por todo o domínio.
    - **`Vector2D.ts`**: Classe para matemática vetorial 2D (direção, velocidade).
    - **`QuadTree.ts`**: Estrutura de dados para otimização de detecção de colisão.
    - **`Dice.ts`**: Utilitário para geração de números aleatórios (RNG).
    - **`Vertex2D.ts` e `Vertex2DMesh.ts`**: Classes para a definição de formas poligonais, usadas principalmente por `HitBox`.

  - **`hitBox/`**: Módulo responsável pela lógica de colisão.
    - **`HitBox.ts`**: Classe abstrata que serve como o contrato fundamental para todas as áreas de colisão. Sua responsabilidade é definir as propriedades essenciais (posição, rotação) e o comportamento esperado: um método `intersects(other)` para a lógica de detecção e um callback `onColision` que é invocado quando uma colisão ocorre, desacoplando a detecção do efeito.
    - **`HitBoxCircle.ts`**: Uma implementação concreta de `HitBox` para formas circulares. Sua única responsabilidade é implementar a lógica matemática para verificar a intersecção com outras `HitBox`es (atualmente, outras `HitBoxCircle`), encapsulando completamente a geometria de colisão de um círculo.

  - **`eventDispacher/`**: Implementa um sistema de eventos (Observer Pattern) para comunicação desacoplada dentro do Domínio.
    - **`eventDispacher.ts`**: O coração do sistema de eventos global (Pub/Sub).
    - **`ActionBindings.ts` (Decorators)**: Sistema de roteamento em tempo de compilação. Fornece o decorator `@BindAction('tecla')` para que as classes (Player, Mage, etc.) declarem proativamente quais inputs desejam ouvir. Dispara alertas de colisão em tempo de execução (Fail Fast) se duas classes quiserem a mesma tecla.
    - **`ActionManager.ts`**: Um roteador de eventos de input puramente dinâmico. Foi expurgado do "Switch Case" gigante; agora ele apenas repassa os inputs brutos do Adaptador para os métodos mapeados via Decorators.
    - **`IGameEvents.ts`**: Um arquivo de contrato de tipos. Define a `GameEventMap`, uma interface que mapeia cada nome de evento ao seu respectivo payload. Isso garante a segurança de tipo (type-safety) em todo o sistema de eventos, prevenindo erros em tempo de compilação.
    - **`actions.type.ts`**: Outro arquivo de contrato de tipos, define a união de strings literais `action`. Ele serve como a "linguagem" compartilhada entre o `GameAdapter` e o `ActionManager` para descrever as ações do jogador.

  - **`ports/`**: Define as fronteiras do domínio.
    - **`domain-contracts.ts`**: Contém a **Porta Primária** `IGameDomain` e os DTOs (`RenderableState`) que o domínio usa para se comunicar com o exterior.
    - **`ILogger.ts`**: Uma **Porta Secundária** que define o contrato para um serviço de log, permitindo que o domínio registre eventos sem conhecer a implementação.
    - **`ICollisionService.ts`**: Uma **Porta Secundária** que define o contrato para cálculo pesado de colisões, deixando as otimizações de concorrência ou serialização delegadas para o Adaptador Web.


### 2.2. Camada de Adaptação (`typescript/adapters/web`)

  Implementa a interface de usuário e interage com as tecnologias web.

  - **`index.ts`:** O ponto de entrada da aplicação, responsável por instanciar e conectar as camadas e iniciar o jogo.

  - **`Diretórios`:**
    - **`assets`:** define os assets do jogo
      - **`entities`:** assets das entidades do jogo
      - **`itens`:** assets dos itens do jogo
      - **`maps`:** assets dos mapas do jogo
    - **`GUIS`:** Arquitetura modular contendo as GUIS do jogo. Cada módulo possui um arquivo html, um ts e um css para definir as GUIS. Essas serão por cima do canvas do jogo
    - **`shared`:** Contém utilitários vitais para a adaptação web, como o `Logger.ts`, e o **`VisualConfigMap.ts`** (O Banco de Dados Visual centralizado).

  Tudo listado a seguir está no diretório `typescript/adapters/web/components/` e são componentes do jogo:

  - **`GameAdapter.ts`:** O **Adaptador Primário** e o orquestrador central da camada de adaptação. Sua responsabilidade é ser a "cola" que une a lógica de negócio do domínio com as tecnologias da web. Ele gerencia o ciclo de vida de todos os outros adaptadores (`Renderer`, `Camera`, `InputManager`), traduz os DTOs do domínio em objetos visuais (`IRenderable`) e converte os inputs do usuário em ações que o domínio entende.
    - **Coesão:** Atua como um *Bootstrapper* leve. Toda a lógica de renderização pesada foi movida para o `SceneManager`, a manipulação de UI para o `UIManager` e a captação de input para o `InputGateway`. Sua função é apenas conectar os fluxos de vida do jogo (`initialize`, `update`, `draw`).

  - **`Game.ts`:** Um utilitário simples que abstrai a API `requestAnimationFrame` do navegador para criar um game loop clássico.
    - **Coesão:** **Altíssima (Coesão Funcional)**. Sua única e exclusiva responsabilidade é executar um loop contínuo, calcular o `deltaTime` entre os frames e invocar os callbacks de `update` e `draw` que lhe foram fornecidos. Ele é completamente agnóstico ao que essas funções fazem, tornando-o um componente genérico, reutilizável e extremamente focado.

  - **`SceneManager.ts`:** Gerencia a sincronização entre DTOs e entidades gráficas na tela. Agora suporta perfeitamente os **Efeitos Visuais Transientes (VFX)**: instâncias gráficas (como explosões) desenhadas sem existir na árvore física do Domínio, que desaparecem sozinhas após o tempo sem invocar o Garbage Collector da física.

  - **`UIManager.ts` e `GUIS/`:** Gerencia todas as interfaces DOM (HTML/CSS) sobrepostas ao canvas, como Barra de XP, Menu de Inventário, Menu de Status e Árvore de Habilidades, ouvindo o estado do jogador no domínio e respondendo com os botões e interações visuais.

  - **`InputGateway.ts` e `InputManager.ts`:** Gerenciam a entrada de hardware. Diferencia atalhos de Numpad dos atalhos numéricos comuns de teclado, suporta array de binds e executa conversão de mouse screen-to-world perfeitamente, deixando o GameAdapter enxuto.

  #### renderModule (A Nova Engine Visual Data-Driven)

    O módulo de renderização foi reestruturado para separar claramente a mecânica, a orquestração e a arte, abolindo a necessidade de criar classes repetitivas para cada entidade do jogo.

    - **`engine/`**: O maquinário de baixo nível que conversa com as APIs do navegador. Contém `IRenderer.ts`, `Renderer.ts` (Canvas 2D), `WebGPURenderer.ts` e `Canvas.ts`. Totalmente agnóstico à lógica do jogo.
    - **`scene/`**: Os diretores e orquestradores do palco. Contém o `SceneManager.ts` (sincroniza os DTOs com a tela), a `RenderableFactory.ts` (fábrica inteligente), `Camera.ts` e `Map.ts`.
    - **`visuals/`**: Os blocos construtores de arte e animação. Contém `GameObjectElement.ts` (renderizador procedural Data-Driven que lê do VisualConfigMap), `LayeredGameObjectElement.ts` (compositor de "Lego" visual para equipamentos), `VisualComposer.ts` (regras de Z-Index) e `AnimationManager.ts`.
    - **`customRenderables/`**: Exceções que possuem lógica de pintura exclusiva e manual. Contém `Player.ts` (que aplica a ordem Z-Index de equipamentos) e `CircleForm.ts` (desenha linhas vetoriais ao invés de texturas de imagem).

  - **`shared/VisualConfigMap.ts` (O Coração Data-Driven):** Um dicionário estático imutável que mapeia os identificadores do domínio (ex: `'slime'`, `'iron-helmet'`) para suas configurações visuais exatas (URLs de imagens, tamanho dos frames, velocidade da animação, offsets de renderização). É ele quem permite que novas entidades, itens e magias sejam criados **sem escrever nenhuma nova classe na camada web**.

  #### keyboardModule

    - **`InputManager.ts`:** O adaptador de entrada do jogo. Sua responsabilidade é capturar todos os eventos brutos de hardware (teclado e mouse) e traduzi-los em um conjunto de `GameAction`s lógicas e abstratas (ex: 'move_up', 'mouse_left'). Ele carrega um mapa de teclas de um arquivo de configuração (`keymap.json`), permitindo fácil customização e remapeamento em tempo de execução.
    - **Coesão:** **Altíssima (Coesão Funcional).** A classe é um tradutor puro. Ela não sabe o que é um "jogador" ou o que acontece quando a ação 'move_up' é ativada. Sua única função é gerenciar o estado das teclas pressionadas e fornecer uma API simples (`isActionActive`) para o `GameAdapter` consultar. Isso desacopla completamente o resto da camada de adaptação dos detalhes específicos de hardware.

### O Logger (Porta e Adaptador Secundário)

  - **`ports/ILogger.ts`**: Esta é a **Porta Secundária** para o logger. Define a interface `ILogger` que o domínio espera. O domínio não sabe como os logs são escritos, apenas que ele pode chamar o método `log` em um objeto que satisfaça este contrato. Isso desacopla completamente a lógica de negócio da implementação de logging.
  - **`adapters/web/shared/Logger.ts`**: Esta é a implementação concreta (o **Adaptador Secundário**) da porta `ILogger` para o ambiente web. Sua única responsabilidade é receber os comandos de log e escrevê-los no `console` do navegador, com a lógica adicional de filtrar por canais (`LogChannel`). Ele é injetado no `DomainFacade` durante a inicialização, cumprindo o contrato da porta.

## 3. Ciclos e Fluxos da Aplicação

  Esta seção detalha os principais fluxos de controle e dados da aplicação, categorizados pelos canais de log (`LogChannel`) para facilitar o rastreamento e a depuração.

  ### 3.1. Fluxo de Inicialização (`init`)

  Este é o fluxo executado uma única vez quando a aplicação começa. Ele é responsável por construir todas as camadas, carregar assets e preparar o jogo para ser executado.

  1.  **Ponto de Entrada (`adapters/web/index.ts`):**
      -   Instancia o `Logger`.
      -   Instancia a `DomainFacade`, injetando a configuração inicial do jogo e o `Logger`. Neste momento, o domínio existe, mas está "adormecido" (sem mundo, sem jogador).
      -   Instancia o `GameAdapter`, injetando a `DomainFacade`. O adaptador agora tem uma referência para a porta do domínio.
      -   Chama `gameAdapter.initialize()`.

  2.  **Orquestração do Adaptador (`GameAdapter.initialize`):**
      -   Cria os componentes da camada de adaptação: `InputManager`, `Canvas`, `Camera`.
      -   **Tenta inicializar o `WebGPURenderer`**.
          -   **Se sucesso:** O jogo usará o pipeline de alta performance. O `GameAdapter` informa ao domínio um tamanho de mundo fixo, pois o "mapa" é apenas parte de uma textura no atlas.
          -   **Se falhar (try-catch):** O `GameAdapter` entra no modo **fallback**. Ele instancia o `Renderer` de Canvas 2D. Neste modo, ele carrega a imagem real do mapa (`GameMap`) para definir os limites do mundo.
      -   Informa o domínio sobre os limites do mundo (`domain.setWorld()`).
      -   Instancia a `RenderableFactory` e pré-carrega todos os assets (`preloadAssets`). Isso é feito para ambos os renderizadores, garantindo que os assets estejam prontos para o fallback ou para uso futuro.

  3.  **Travessia da Fronteira (Adapter -> Domain):**
      -   O `GameAdapter` chama `domain.setWorld()`, passando as dimensões do mapa que acabou de carregar. Esta é a primeira grande interação com o domínio.

  4.  **"Despertar" do Domínio (`DomainFacade.setWorld`):**
      -   O domínio finalmente ganha vida. Ele cria suas entidades internas: `World`, `Player` (com seus `Attributes`), `ActionManager` e o `ObjectElementManager`.
      -   O `ObjectElementManager` é instruído a popular o mundo com os inimigos iniciais (`spawnInitialElements`).

  5.  **Finalização da Inicialização do Adaptador (`GameAdapter.initialize`):**
      -   Se estiver no modo Canvas 2D, o `GameAdapter` executa `syncRenderables()` pela primeira vez para criar as representações visuais (`IRenderable`) dos objetos que já existem no domínio (jogador e inimigos iniciais).
      -   Se estiver no modo WebGPU, ele cria os `AnimationManager`s iniciais.
      -   Finalmente, `initializeGame()` é chamado, passando os métodos `update` e `draw` do `GameAdapter`, dando início ao game loop.

### 3.2. O Ciclo Principal do Jogo (Game Loop)

  Este é o fluxo que se repete a cada frame, orquestrado pelo `GameAdapter`. Ele segue uma ordem estrita para garantir que a lógica seja processada antes da renderização.

  1.  **`loop` (Início do Frame):**
      -   O utilitário `Game.ts` (usando `requestAnimationFrame`) chama `gameAdapter.update(deltaTime)`. O `deltaTime` é crucial para garantir que a lógica (movimento, cooldowns) seja independente da taxa de frames.

  2.  **`input` (Tradução de Input):**
      -   Dentro de `update`, a primeira ação é `handlePlayerInteractions()`.
      -   O `GameAdapter` consulta o `InputManager` para saber quais ações lógicas estão ativas (ex: `'move_up'`, `'leftClick'`).
      -   Ele agrupa todas as ações ativas em um array. Se uma das ações for um clique, ele chama `screenToWorld()` para converter as coordenadas do mouse da tela para o mundo do jogo.
      -   O `GameAdapter` chama `domain.handlePlayerInteractions()`, passando o array de ações e as coordenadas do mouse.
      -   A `DomainFacade` repassa essas ações para o `ActionManager`, que finalmente invoca os métodos corretos na instância do `Player` (ex: `player.onUpAction()`).

  3.  **`domain` (Atualização da Lógica de Negócio):**
      -   Ainda dentro de `update`, o `GameAdapter` chama `domain.update(deltaTime)`.
      -   A `DomainFacade` delega a chamada para o `Player` e para o `ObjectElementManager`.
      -   O `ObjectElementManager.updateAll()` é o passo mais complexo:
          -   Ele itera sobre todas as entidades (`Slime`, `Bullet`, etc.), chamando o método `update()` de cada uma para que elas executem sua IA, movimento, etc.
          -   Ele chama `checkCollisions()`, que prepara os dados dos objetos e os envia para o `Collision.worker.ts` para processamento assíncrono. A reação à colisão ocorrerá quando o worker responder.

  4.  **`sync` (Sincronização Visual):**
      -   A última ação dentro de `update` é `syncRenderables()`.
      -   O `GameAdapter` chama `domain.getRenderState()` para obter uma "fotografia" do estado atual de todos os objetos do jogo (posição, estado, etc.) na forma de DTOs.
      -   **Se estiver no modo WebGPU:** Ele itera sobre os DTOs e atualiza os `AnimationManager`s correspondentes, trocando a configuração da animação se o estado da entidade mudou (ex: de 'idle' para 'walking'). Ele também cria novos `AnimationManager`s para novas entidades e remove os de entidades que não existem mais.
      -   **Se estiver no modo Canvas 2D:** Ele itera sobre os DTOs e sincroniza o mapa de objetos `IRenderable`. Se um objeto já existe, ele chama `renderable.updateState(dto)`. Se não existe, ele usa a `RenderableFactory` para criar um novo. Ele também remove da tela quaisquer objetos visuais cujas entidades não existem mais no domínio.
      - Ele gerencia pré-alocações de memória (`Set`s reciclados) para garantir 0 alocações por frame, evitando acionar o Garbage Collector e preservando os FPS.
  
  5.  **`render` (Desenho na Tela):**
      -   Após o `update` terminar, o `Game.ts` chama `gameAdapter.draw()`.
      -   **Se estiver no modo WebGPU:** O `GameAdapter` combina os DTOs do domínio com os dados de frame atual dos `AnimationManager`s e passa essa lista de dados puros para `renderer.drawFrame()`. O `WebGPURenderer` então atualiza seus buffers de instância e executa uma única chamada de desenho para renderizar todos os objetos.
      -   **Se estiver no modo Canvas 2D:** O `GameAdapter` atualiza o alvo da `Camera`, que por sua vez aplica a transformação ao contexto do canvas. O `Renderer` então limpa o canvas e itera sobre a lista de objetos `IRenderable`, chamando o método `draw()` de cada um.

### 3.3. Fluxo de Colisão (`hitbox`)

  Este fluxo descreve como o jogo detecta e resolve colisões entre entidades. Ele é iniciado dentro do passo 3 (`domain`) do ciclo principal do jogo.

  1.  **Início no Gerenciador (`ObjectElementManager.updateAll`):**
      -   Após atualizar a posição de todas as entidades, o método chama `checkCollisions()`, passando a lista de todos os objetos do jogo.

  2.  **Delegação para o Worker (`checkCollisions`):**
      -   O método prepara uma lista de `plainElements`, que são objetos de dados puros contendo apenas as informações essenciais para a colisão (ID, posição, tamanho e geometria das hitboxes). Isso é feito para evitar erros ao enviar instâncias de classes para o worker.
      -   Ele envia essa lista de dados para o `ICollisionService`.

  3.  **Processamento Otimizado (Camada de Adaptação - `CollisionAdapter`):**
      -   O Adaptador utiliza a API `Worker` para paralelizar as tarefas de matemática intensiva (Quadtree). Otimizações futuras neste ponto envolvem utilizar `SharedArrayBuffer` para abolir o gargalo temporal da serialização.
      -   O worker recebe os dados.
      -   Ele constrói uma `Quadtree` para otimizar a busca por colisões.
      -   Ele itera sobre os elementos, usando a `Quadtree` para encontrar pares potenciais.
      -   Para cada par, ele executa a lógica matemática para verificar se suas hitboxes se intersectam.
      -   Ao final, ele envia de volta para a thread principal uma lista contendo apenas os **IDs** dos pares que colidiram (ex: `[[1, 101], [102, 103]]`).

  4.  **Reação na Thread Principal (`ObjectElementManager.onmessage`):**
      -   O `ObjectElementManager` recebe a lista de pares de IDs do worker.
      -   Para cada par `[idA, idB]`, ele usa o array original de elementos para encontrar as **instâncias de classe completas** correspondentes a esses IDs.
      -   Com as instâncias reais em mãos, ele finalmente invoca os callbacks `onColision` de suas hitboxes: `elementA.hitboxes[0].onColision(elementB)` e vice-versa.

  5.  **Lógica de Negócio:**
      -   É aqui que a lógica de negócio acontece. Por exemplo:
          -   A `HitBox` de um `Bullet` tem um `onColision` que verifica se o `elementB` é um `Enemy`. Se for, ele dispara um evento `despawn` para si mesmo.
          -   A `HitBox` de um `Player` tem um `onColision` que verifica se o `elementB` é um `Enemy`. Se for, ele chama o método `onStrike()` do inimigo e executa o ataque resultante em si mesmo.

### 3.4. Fluxo de Criação de Projétil (`spawn`)

  Este fluxo detalha como uma ação do jogador (um clique do mouse) resulta na criação de uma nova entidade no domínio e sua subsequente aparição na tela.

  1.  **Captura de Input (Adapter):**
      -   O `InputManager` detecta um evento `mousedown` do navegador e ativa a ação `'mouse_left'`.
      -   No ciclo `update` do `GameAdapter`, o método `handlePlayerInteractions` consulta o `InputManager` e vê que a ação `'leftClick'` está ativa.
      -   Ele chama `screenToWorld()` para converter as coordenadas do mouse (em pixels da tela) para as coordenadas do mundo do jogo.

  2.  **Comando para o Domínio (Adapter -> Domain):**
      -   O `GameAdapter` invoca `domain.handlePlayerInteractions()`, passando a ação `'leftClick'` e as coordenadas do mundo calculadas.

  3.  **Processamento da Ação (Domain):**
      -   A `DomainFacade` repassa a ação para o `ActionManager`.
      -   O `ActionManager` chama o método correspondente na entidade `Player`: `player.onLeftClickAction(mouseWorldCoordinates)`.
      -   Dentro do `Player`, o método `shootBullet` calcula a direção do tiro, cria um objeto `Attack` com o dano e os efeitos do jogador.
      -   O `Player` então emite o evento intencional: `gameEvents.dispatch('spawn', { type: 'simpleBullet', coordinates, direction, attack })`. Este evento puramente agnóstico sinaliza que algo deve nascer no mundo, delegando o "como" ao gerente.

  4.  **Criação da Entidade (Domain - `ObjectElementManager`):**
      -   O `ObjectElementManager`, que está ouvindo o evento `'spawn'`, recebe a `factory`.
      -   Ele busca na memória das `strategies` estáticas do `SpawnRegistry` a respectiva classe para o tipo e chama a sua construção delegada, adicionando o item/magia no mapa.

  5.  **Sincronização Visual (Domain -> Adapter):**
      -   No mesmo ciclo de `update`, o `GameAdapter` chama `syncRenderables()`.
      -   **No modo Canvas 2D:** O `syncRenderables` percebe que não há um objeto visual para o ID da nova bala e chama a `RenderableFactory.create(bulletState)` para criar a instância visual.
      -   **No modo WebGPU:** O `syncRenderables` percebe um novo ID e cria um `AnimationManager` para a bala.

  6.  **Renderização (Adapter):**
      -   No passo de `draw` do mesmo frame, o renderizador apropriado (Canvas 2D ou WebGPU) recebe os dados da nova bala e a desenha na tela.

### 3.5. Fluxo de IA do Inimigo (`playerMoved`)

  Este fluxo descreve como um inimigo simples (como o `Slime`) reage à movimentação do jogador, demonstrando a comunicação intra-domínio via eventos.

  1.  **Gatilho do Movimento (Domain - Player):**
      -   Quando o `Player` processa uma ação de movimento (ex: `onUpAction`), seu método `move(deltaTime)` é chamado, o que altera suas coordenadas.
      -   Após atualizar sua posição, o `Player` dispara um evento global para o domínio: `gameEvents.dispatch('playerMoved', { x: this.coordinates.x, y: this.coordinates.y })`.

  2.  **Recepção do Evento (Domain - Enemy):**
      -   A classe `Slime`, em seu construtor, se registrou como ouvinte do evento `'playerMoved'`.
      -   O `EventHandler` notifica todos os ouvintes, incluindo cada instância de `Slime`. O método `onLastPlayerPos(payload)` do `Slime` é executado.

  3.  **Lógica da IA (Domain - Enemy):**
      -   Dentro de `onLastPlayerPos`, o `Slime` armazena a nova posição do jogador. Esta posição será usada no próximo ciclo de `update` para calcular a direção do movimento.

  4.  **Execução do Movimento (Domain - `updateAll`):**
      -   No mesmo ciclo de jogo, o `ObjectElementManager.updateAll()` chama o método `update(deltaTime)` de cada `Slime`.
      -   O `Slime.update()` dispara um evento `requestNeighbors` para obter uma lista de outros Slimes próximos. No callback desse evento, o método `moveSlime` é executado, que contém a IA de perseguição e desvio de obstáculos. Atualmente, a implementação do listener para `requestNeighbors` no `ObjectElementManager` está "stubada" e retorna uma lista vazia, mas a estrutura da IA do `Slime` está pronta para utilizar os vizinhos quando a funcionalidade for completada.

  5.  **Visualização (Adapter):**
      -   O fluxo segue o padrão: `syncRenderables` detecta a nova posição do `Slime`, atualiza o `GameObjectElement` correspondente, e o `Renderer` o desenha no novo local no próximo ciclo de `draw`.

### 3.6. Fluxo de Ataque e Dano (`damage`)

  Este fluxo descreve o que acontece quando um projétil atinge um inimigo, resultando em dano e, potencialmente, na morte do inimigo.

  1.  **Gatilho (Colisão):** O fluxo começa como uma continuação do **Fluxo de Colisão (3.3)**. O `ObjectElementManager` detecta uma colisão entre um `Bullet` e um `Enemy`.

  2.  **Invocação do Callback:** O `checkCollisions` invoca `hitboxA.onColision(elementB)`, onde `hitboxA` é a hitbox do `Bullet` e `elementB` é o `Enemy`.

  3.  **Lógica de Reação (Domain - Bullet):**
      -   O callback `onColision` da `HitBox` do `Bullet` verifica se o `elementB` é um `Enemy`.
      -   Se for, ele chama `attack.execute(enemy, direction)`, onde `attack` é o objeto `Attack` que a bala carrega.

  4.  **Aplicação do Dano (Domain - Entity/Attributes):**
      -   Dentro do `attack.execute`, o dano total é calculado (base + atributos + crítico).
      -   O método `target.takeDamage(damageInfo)` é chamado.
      -   O método `takeDamage` na classe `Entity` calcula o dano final após aplicar a defesa (`this.attributes.defence`) e subtrai o resultado do HP da entidade.

  5.  **Verificação de Morte (Domain - Entity):**
      -   Após aplicar o dano, `takeDamage` verifica se `this.attributes.hp <= 0`.
      -   Se o HP for zero ou menos, a entidade muda seu estado para `'dead'` e dispara um evento `despawn` para si mesma.

  6.  **Remoção da Entidade (Domain - `ObjectElementManager`):**
      -   O `ObjectElementManager`, que ouve o evento `'despawn'`, recebe o ID do inimigo e o remove de seu mapa `elements`. A partir do próximo frame, o inimigo não existe mais no domínio.

### 3.7. Fluxo de Experiência e Level Up (`xp`)

  Este fluxo descreve como o jogador ganha experiência e sobe de nível após derrotar um inimigo. Ele é uma continuação direta do **Fluxo de Ataque e Dano (3.6)**.

  1.  **Gatilho (Verificação Pós-Dano):** O fluxo começa dentro do método `Attack.execute`.

  2.  **Concessão de XP (Domain - Attack):**
      -   Após chamar `target.takeDamage()`, o método `Attack.execute` verifica se o alvo foi derrotado (`target.attributes.hp <= 0`).
      -   Se o alvo morreu e o atacante (`_attacker`) é uma instância de `Player`, o método `gainXp` do jogador é chamado, passando o `xpGiven` do inimigo derrotado.

  3.  **Adição de Experiência (Domain - Player/Attributes):**
      -   O método `player.gainXp()` delega a chamada para `player.attributes.addXp()`.
      -   O método `addXp` na classe `Attributes` adiciona a experiência, aplica bônus de `insight` e entra em um loop `while` para verificar se o XP atual ultrapassa o necessário para o próximo nível.

  4.  **Level Up (Domain - Attributes):**
      -   Se o jogador sobe de nível dentro do loop `while`, seu `_level` é incrementado, o XP atual é ajustado e o XP necessário para o próximo nível é recalculado com base na `IXPTable` da classe do jogador.
      -   O `Player` identifica a subida de nível e imediatamente dispara o evento de domínio `gameEvents.dispatch('levelUp', { newLevel })`, garantindo que UIs e sistemas de partículas possam reagir instantaneamente.

### 3.8. Fluxo de Drops e Coleta de Itens

  Este fluxo descreve a transição de um item do "chão" para o inventário do jogador.

  1.  **Geração do Drop (Domain):** Ao inicializar o mundo (ou ao morrer um inimigo), o `ObjectElementManager` despacha um `DroppedItem` contendo a instância pura de um `Item` no mapa.
  2.  **Visualização do Drop (Adapter):** A `RenderableFactory` lê o `iconId` do item caído (como string base do state) e, usando o padrão Registry, localiza o Sprite equivalente para aquele ícone no chão.
  3.  **Aproximação e Coleta (Colisão):** O jogador anda e sua `HitBox` encosta na área flexível do `DroppedItem`.
  4.  **Transferência:** A Hitbox do item caído executa o callback empurrando a instância de `Item` direto para o array `player.inventory.backpack`. Em seguida, o Drop dispara um `despawn` para sumir do mapa.
  5.  **Feedback:** O `CharacterMenuGui` reage à alteração de estado da mochila no próximo frame, exibindo o ícone renderizado do novo item coletado em um dos slots disponíveis.

## 4. Guia do Desenvolvedor (How-To)

  Esta seção serve como um guia prático para realizar tarefas comuns de desenvolvimento dentro da arquitetura atual.

### 4.1. Como Criar um Novo Inimigo (Ex: "Goblin")

  Com a adoção da arquitetura **Data-Driven Centralizada**, criar a representação visual de qualquer entidade ou item no jogo se tornou um processo puramente de configuração de dados na camada Web. Você não precisa criar NENHUM arquivo visual!

  1. **Domínio (Lógica):**
     - Crie a classe lógica `Goblin.ts` em `domain/ObjectModule/Entities/Enemies/` estendendo `Enemy`. Passe `'goblin'` como seu ID no construtor.

  2. **Adaptação (Visual):**
     - Abra o arquivo `VisualConfigMap.ts` na pasta `shared/` do adaptador web.
     - Adicione uma nova entrada no dicionário para a chave `'goblin'`, especificando o caminho da imagem e o tamanho dos frames para suas animações (ex: `'idle'`, `'walking'`).
     
  A `RenderableFactory` fabricará as imagens e o WebGPU cuidará dos buffers de instância instantânea e magicamente!

### 4.2. Como Habilitar/Desabilitar a Visualização de Debug

  A visualização de elementos de depuração, como as `HitBox`es, é controlada por uma única flag na camada de adaptação.

  1.  **Abra o `GameAdapter`:** Navegue até o arquivo `adapters/web/components/GameAdapter.ts`.
  2.  **Encontre a Flag:** No topo da classe, localize a propriedade `isDebugMode`.
      ```typescript
      private readonly isDebugMode = true; // ou false
      ```
  3.  **Altere o Valor:**
      -   Para **desabilitar** a visualização das hitboxes e outros elementos de debug, mude o valor para `false`.
      -   Para **habilitar**, mude o valor para `true`.

  A lógica nos métodos `syncRenderables` e `draw` já está configurada para respeitar essa flag, garantindo que os objetos de depuração só sejam processados e desenhados quando o modo de depuração estiver ativo.

### 4.3. Como Criar uma Nova Magia/Projétil (Ex: "Fireball")

  1. **Domínio:** Crie `Fireball.ts` estendendo a lógica de `Projectile`. Use o decorator `@RegisterSpawner('fireball')` para ensinar o motor do Domínio a fabricar a magia.
  
  2. **Visual:** Adicione uma entrada `'fireball'` no arquivo `VisualConfigMap.ts` (na categoria `'projectile'`) e aponte para a imagem da bola de fogo no estado `'travelling'`. Zero código novo necessário!

  3. **Dispare a Magia:** No Domínio, dispare um evento genérico `spawn` declarando o `type: 'fireball'`. A engine fará a conexão e jogará tudo na tela instantaneamente.

### 4.4. Como Criar um Ataque com Efeito Especial (Ex: Roubo de Vida)

  O sistema de combate é construído em torno da classe `Attack` e da interface `OnHitAction`, que permitem a criação de comportamentos complexos de forma modular.

  1.  **Crie a Lógica do Efeito (`OnHitAction`):**
      -   Um `OnHitAction` é uma função de callback que é executada no momento em que um ataque atinge um alvo. Ela recebe um `AttackContext` com informações sobre o atacante, o alvo e o dano real causado.
      -   Em um local apropriado (ex: `domain/ObjectModule/Items/Effects.ts` ou diretamente no arquivo da arma/habilidade), defina a função do seu efeito.

      ```typescript
      // Exemplo de um efeito de roubo de vida
      import type { OnHitAction, AttackContext } from "../Items/IAtack";

      export const lifeStealAction: OnHitAction = (context: AttackContext) => {
        const { attacker, damageDealt } = context;
        const lifeStolen = Math.floor(damageDealt * 0.10); // Rouba 10% do dano causado
        attacker.attributes.hp += lifeStolen; // Adiciona a vida de volta ao atacante
      };
      ```

  2.  **Associe o Efeito ao Ataque:**
      -   Quando for criar a instância do ataque (seja de uma arma, habilidade ou ataque de contato de um inimigo), passe a função de efeito que você criou em um array para o construtor da classe `Attack`.

      ```typescript
      // Exemplo dentro de uma arma ou na ação de ataque do jogador
      import { lifeStealAction } from "./Effects"; // Supondo que o efeito esteja em um arquivo separado

      const vampiricAttack = new Attack(player, 15, 'physical', [lifeStealAction]);
      // Agora, sempre que 'vampiricAttack' for executado, ele aplicará o roubo de vida.
      ```

### 4.5. Como Adicionar um Novo Estado de Animação ao Jogador (Ex: "attack")

  1.  **Adicione o Asset:** Coloque o spritesheet `player-attack.png` em `adapters/web/assets/entities/player/` (e no seu atlas de texturas para WebGPU).
  
  2.  **Configure no Dicionário:** No arquivo `VisualConfigMap.ts`, localize o bloco da entidade `'player'` e adicione a nova chave `'attack'` no sub-bloco de `animations`, fornecendo as informações do frame (tamanho, velocidade).
  
  4.  **Altere o Estado no Domínio:** Na classe `Player` do domínio (`domain/ObjectModule/Entities/Player/Player.ts`), encontre a lógica que deve disparar a animação (ex: no método `onLeftClickAction`). Nesse ponto, altere a propriedade `state` da entidade.
      ```typescript
      // Em algum método do Player.ts do domínio
      this.state = 'attack';
      // Opcional: Adicionar um timer para voltar ao estado 'idle' após a animação
      ```

### 4.6. Como Criar um Novo Item Consumível (Ex: Poção de Cura)

  > **Nota:** Esta seção descreve um fluxo de implementação para uma funcionalidade futura, já que o sistema de inventário ainda não foi construído.

  Itens consumíveis têm um fluxo diferente, pois geralmente não têm uma representação visual contínua no mundo após serem coletados. O plano é o seguinte:

  1.  **Camada de Domínio (Lógica):**
      -   **Crie a Classe de Lógica:** Em `domain/ObjectModule/Items/`, crie `HealthPotion.ts`. A classe deve herdar de `Item`.
      -   **Defina o Efeito:** Adicione um método `use(target: Entity)`. Dentro deste método, implemente o efeito da poção (ex: `target.attributes.hp += 50;`).
      -   **Defina o Tipo:** Em `domain/ObjectModule/objectType.type.ts`, adicione `'healthPotion'` à união de tipos.

  2.  **Lógica de Coleta e Uso:**
      -   **Coleta:** A lógica de coleta pode ser implementada de forma semelhante a uma colisão. Quando o `Player` colide com um `Item`, em vez de causar dano, o `Item` dispara um evento para ser adicionado ao inventário do jogador (ex: `gameEvents.dispatch('itemCollected', { itemId: this.id, item: this })`) e, em seguida, dispara um evento `'despawn'` para si mesmo.
      -   **Inventário:** O `Player` (ou uma nova classe `Inventory` associada a ele) precisará ouvir o evento `'itemCollected'` e armazenar o item.
      -   **Uso:** A interface do usuário (UI) do inventário (ver próximo guia) terá um botão "Usar". Ao ser clicado, a UI chamará um método na `DomainFacade` (ex: `useItem(itemId)`), que encontrará o item no inventário do jogador e chamará seu método `use(player)`.

  3.  **Visualização (Item no Chão):**
      -   O processo para fazer o item aparecer no chão é idêntico ao de criar um inimigo: adicione o asset, configure o sprite na `RenderableFactory` e registre a estratégia de criação.

### 4.7. Como Criar e Equipar uma Nova Armadura (O "Lego" Visual)

  O sistema de renderização agora possui um Compositor de Camadas que empilha roupas dinamicamente no personagem usando a regra de OCP (Open-Closed Principle).

  1. **Domínio:** Crie a classe da armadura estendendo as bases como `Helmet`, `Chestplate`, etc. Defina no seu construtor o `iconId` único (ex: `15`).
  2. **Inventário:** Faça o item surgir no mundo ou adicione à bolsa do jogador (`player.backpack.push(new GoldenHelmet())`).
  3. **Visual:** No `VisualConfigMap.ts`, adicione uma nova entrada para ele (ex: `'golden-helmet'`). Garanta que a `category` seja `'equipment'` e defina o `iconId: 15`. 
  4. **Animação Guiada:** Adicione os estados de animação (`idle`, `walking`) definindo a imagem e, crucialmente, use o `renderOffset` (como array) para fazer a armadura "balançar" na mesma cadência da animação base do jogador!
  
  A UI mostrará o item na bolsa automaticamente. Quando o jogador equipar o item, o Compositor Visual buscará pelo `iconId`, encontrará as imagens e as empilhará no Z-Index correto em cima do corpo base!

### 4.8. Como Adicionar uma Nova Interface de Usuário (UI)

  A arquitetura prevê que as UIs (Inventário, Skills, etc.) sejam módulos independentes que ficam "por cima" do canvas do jogo.

  1.  **Crie o Módulo da UI:** No diretório `adapters/web/GUIS/`, crie uma nova pasta, por exemplo, `inventoryGui/`.
  2.  **Estrutura do Módulo:** Dentro de `inventoryGui/`, crie três arquivos:
      -   `inventory.html`: A estrutura HTML da sua janela de inventário.
      -   `inventory.css`: O estilo para a janela.
      -   `InventoryGui.ts`: A classe que controlará a lógica da UI.
  3.  **Lógica da Classe `InventoryGui.ts`:**
      -   **Carregamento:** No construtor, a classe deve carregar o HTML e o CSS e injetá-los no `document.body`.
      -   **Comunicação:** A classe deve receber uma referência à `DomainFacade` (ou a um gerenciador de UI que a possua).
      -   **Exibição de Dados:** Para exibir os itens, a UI pode periodicamente (ou via eventos) chamar um método no domínio (ex: `domain.getInventoryState()`) para obter os dados e renderizá-los no HTML.
      -   **Envio de Ações:** Para usar um item, o listener de clique no botão "Usar" deve chamar o método apropriado no domínio, como `domain.useItem(itemId)`.
  4.  **Integração:** No `index.ts` principal da camada de adaptação, instancie sua nova classe `InventoryGui` para que ela seja carregada junto com o jogo.
