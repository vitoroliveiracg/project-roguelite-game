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
      - **Atualização de Estado:** Itera sobre todos os elementos a cada frame, chamando seus respectivos métodos `update`.
      - **Detecção de Colisão Otimizada:** A cada frame, reconstrói uma `Quadtree` com a posição atual de todos os objetos e a utiliza para verificar eficientemente as colisões, disparando os eventos `onColision` nas `HitBox`es correspondentes.
      Ele efetivamente desacopla a `DomainFacade` da complexidade de gerenciar uma coleção massiva e mutável de objetos.
    - **`objectType.type.ts`**: Um arquivo de tipo (`type`) que define uma união de strings literais (`'player' | 'slime' | ...`). Ele fornece uma maneira centralizada e com segurança de tipo (type-safe) para identificar os diferentes tipos de `ObjectElement` no jogo. Isso é crucial para a `RenderableFactory` na camada de adaptação, que o utiliza para decidir qual sprite ou animação carregar para cada entidade.
    - **`Entities/`**: Contém as classes que representam seres "vivos" ou com comportamento autônomo no jogo.
      - **`Entity.ts`**: Uma classe abstrata fundamental que herda de `ObjectElement`. Ela adiciona o conceito de "vida" e "movimento" a um objeto. Suas responsabilidades incluem: gerenciar `velocity` e `direction` (usando `Vector2D`), aplicar dano (`takeDamage`), e definir um contrato `update(deltaTime)` que força subclasses (como `Player` e `Slime`) a implementar sua própria lógica de comportamento a cada frame.
      - **`Attributes.ts`**: Uma classe complexa e central que encapsula **toda** a lógica de atributos de uma entidade. Ela gerencia os 6 atributos primários (força, destreza, etc.) e calcula uma vasta gama de atributos secundários derivados (dano crítico, velocidade, regeneração de HP/Mana, etc.). Também contém a lógica para ganho de experiência (`addXp`) e progressão de nível. É um componente puramente de dados e regras, sem conhecimento de sua posição no mundo.
      - **`IXPTable.ts`**: Uma interface simples que define o contrato para uma "curva de experiência". Ao desacoplar a lógica de `addXp` da `Attributes` dos valores concretos, ela permite que diferentes tipos de entidades (ou o jogo em diferentes dificuldades) progridam em ritmos distintos, simplesmente fornecendo uma implementação diferente desta interface.
      - **`Player/`**: Contém a lógica específica da entidade do jogador.
        - **`Player.ts`**: A implementação concreta da entidade controlada pelo usuário. Sua responsabilidade é traduzir as intenções do jogador (recebidas do `ActionManager` via métodos como `onUpAction` e `onLeftClickAction`) em ações de jogo concretas. Ela gerencia o estado de movimento, dispara eventos para criar projéteis (`shootBullet`) e emite o evento `playerMoved` para que outras entidades (como a IA dos inimigos) possam reagir à sua posição.
        - **`Classes/Class.ts`**: Uma classe abstrata que define o conceito de uma "Classe de Personagem" (ex: Guerreiro, Mago). Sua principal responsabilidade é associar um nome a uma `IXPTable`, permitindo que cada classe tenha sua própria curva de progressão de experiência de forma desacoplada.
      - **`Enemies/`**: Contém a hierarquia de classes para inimigos.
        - **`Enemy.ts`**: Classe abstrata que herda de `Entity`. Define o contrato base para todos os inimigos, estabelecendo que eles têm um `level`, concedem `xpGiven` ao serem derrotados, e possuem um ataque base (`onStrike`) que retorna um DTO `IAtack`.
        - **`Slime.ts`**: Uma implementação concreta de `Enemy`. Demonstra uma IA simples, ouvindo o evento `playerMoved` para atualizar a direção em que deve se mover. Sua responsabilidade é definir seu próprio comportamento e reagir a colisões, delegando a lógica de dano para a classe `Entity`.
      - **`bullets/`**: Contém a hierarquia de classes para projéteis.
        - **`Bullet.ts`**: Classe abstrata que herda de `ObjectElement` e implementa a interface `IAtack`. Ela define o contrato de um projétil: um objeto que se move e carrega consigo todas as informações de um ataque (dano, tipo, criticidade, quem atacou).
        - **`SimpleBullet.ts`**: Uma implementação concreta de `Bullet`. É responsável por definir sua própria velocidade, tempo de vida (baseado na distância percorrida), e sua `HitBox`. Adiciona uma lógica de `generateRandomNoiseAccelerator` para dar uma variação sutil à sua trajetória, tornando o comportamento mais orgânico.
      - **`geometryForms/`**: Contém classes para formas geométricas simples que podem existir no mundo.
        - **`circleForm.ts`**: Uma implementação concreta de `ObjectElement` que representa um círculo. É uma entidade simples com capacidade de movimento, servindo como um bom exemplo de um objeto de jogo básico, útil para testes de colisão, efeitos visuais ou como base para elementos de cenário mais complexos.
    - **`Items/`**: Contém a hierarquia de classes para todos os itens.
      - **`Item.ts`**: Classe base abstrata para todos os itens, definindo um contrato rico de propriedades (raridade, valor, etc.).
      - **`Weapons/Weapon.ts`**: Classe abstrata para armas, adicionando `baseDamage` e `attackSpeed`.
      - **`Weapons/RangedWeapons/RangedWeapon.ts`**: Especialização para armas de longo alcance, que disparam projéteis via eventos.
      - **`Attributes.ts`**: Uma **interface** simples que define a estrutura para requisitos de atributos de itens.

  - **`shared/`**: Contém classes e tipos utilitários de baixo nível, usados por todo o domínio.
    - **`Vector2D.ts`**: Classe para matemática vetorial 2D (direção, velocidade).
    - **`QuadTree.ts`**: Estrutura de dados para otimização de detecção de colisão.
    - **`Dice.ts`**: Utilitário para geração de números aleatórios (RNG).
    - **`Vertex2D.ts` e `Vertex2DMesh.ts`**: Classes para a definição de formas poligonais, usadas principalmente por `HitBox`.

  - **`hitBox/`**: Módulo responsável pela lógica de colisão.
    - **`HitBox.ts`**: Classe abstrata que serve como o contrato fundamental para todas as áreas de colisão. Sua responsabilidade é definir as propriedades essenciais (posição, rotação) e o comportamento esperado: um método `intersects(other)` para a lógica de detecção e um callback `onColision` que é invocado quando uma colisão ocorre, desacoplando a detecção do efeito.
    - **`HitBoxCircle.ts`**: Uma implementação concreta de `HitBox` para formas circulares. Sua única responsabilidade é implementar a lógica matemática para verificar a intersecção com outras `HitBox`es (atualmente, outras `HitBoxCircle`), encapsulando completamente a geometria de colisão de um círculo.

  - **`eventDispacher/`**: Implementa um sistema de eventos (Observer Pattern) para comunicação desacoplada dentro do Domínio.
    - **`eventDispacher.ts`**: O coração do sistema de eventos. Exporta um singleton (`gameEvents`) de uma classe `EventHandler` genérica e com tipagem forte. Sua única responsabilidade é registrar ouvintes (`on`) e notificar todos eles quando um evento é disparado (`dispatch`). É o principal mecanismo que permite a comunicação intra-domínio com baixo acoplamento.
    - **`ActionManager.ts`**: Atua como um tradutor de intenções. Ele recebe uma lista de ações genéricas (ex: `'up'`, `'leftClick'`) da `DomainFacade` e as converte em chamadas de método específicas na instância do `Player`. Ele centraliza a lógica de "o que fazer quando o jogador aperta um botão", desacoplando a `DomainFacade` dos detalhes da API da classe `Player`.
    - **`IGameEvents.ts`**: Um arquivo de contrato de tipos. Define a `GameEventMap`, uma interface que mapeia cada nome de evento ao seu respectivo payload. Isso garante a segurança de tipo (type-safety) em todo o sistema de eventos, prevenindo erros em tempo de compilação.
    - **`actions.type.ts`**: Outro arquivo de contrato de tipos, define a união de strings literais `action`. Ele serve como a "linguagem" compartilhada entre o `GameAdapter` e o `ActionManager` para descrever as ações do jogador.

  - **`ports/`**: Define as fronteiras do domínio.
    - **`domain-contracts.ts`**: Contém a **Porta Primária** `IGameDomain` e os DTOs (`RenderableState`) que o domínio usa para se comunicar com o exterior.
    - **`ILogger.ts`**: Uma **Porta Secundária** que define o contrato para um serviço de log, permitindo que o domínio registre eventos sem conhecer a implementação.

### 2.2. Camada de Adaptação (`typescript/adapters/web`)

  Implementa a interface de usuário e interage com as tecnologias web.

  - **`index.ts`:** O ponto de entrada da aplicação, responsável por instanciar e conectar as camadas e iniciar o jogo.

  - **`Diretórios`:**
    - **`assets`:** define os assets do jogo
      - **`entities`:** assets das entidades do jogo
      - **`itens`:** assets dos itens do jogo
      - **`maps`:** assets dos mapas do jogo
    - **`GUIS`:** Arquitetura modular contendo as GUIS do jogo. Cada módulo possui um arquivo html, um ts e um css para definir as GUIS. Essas serão por cima do canvas do jogo
    - **`shared`:** Contém coisas 

  Tudo listado a seguir está no diretório `typescript/adapters/web/components/` e são componentes do jogo:

  - **`GameAdapter.ts`:** O **Adaptador Primário** e o orquestrador central da camada de adaptação. Sua responsabilidade é ser a "cola" que une a lógica de negócio do domínio com as tecnologias da web. Ele gerencia o ciclo de vida de todos os outros adaptadores (`Renderer`, `Camera`, `InputManager`), traduz os DTOs do domínio em objetos visuais (`IRenderable`) e converte os inputs do usuário em ações que o domínio entende.
    - **Coesão:** **Alta (Coesão de Comunicação/Sequencial)**. Embora o `GameAdapter` tenha muitas responsabilidades, todas elas estão focadas em um único propósito: adaptar o domínio para a web. Ele orquestra uma sequência de operações (input -> atualização do domínio -> sincronização visual -> desenho) que operam sobre o mesmo conjunto de dados (o estado do jogo), o que caracteriza uma coesão forte e um design bem definido para um orquestrador.

  - **`Game.ts`:** Um utilitário simples que abstrai a API `requestAnimationFrame` do navegador para criar um game loop clássico.
    - **Coesão:** **Altíssima (Coesão Funcional)**. Sua única e exclusiva responsabilidade é executar um loop contínuo, calcular o `deltaTime` entre os frames e invocar os callbacks de `update` e `draw` que lhe foram fornecidos. Ele é completamente agnóstico ao que essas funções fazem, tornando-o um componente genérico, reutilizável e extremamente focado.

  #### canvasModule
    - **`Canvas.ts`:** Abstrai o elemento HTML `<canvas>`. Sua responsabilidade é encapsular a criação do elemento, a obtenção do seu contexto 2D e fornecer uma API simples (`clear()`). Ele expõe o elemento e o contexto brutos para que outros componentes, como o `Renderer` e a `Camera`, possam operar diretamente sobre eles.
    - **Coesão:** **Altíssima (Coesão Funcional).** A classe tem um único propósito: gerenciar o elemento canvas. Ela não sabe o que é desenhado nele, apenas como criá-lo e limpá-lo.

  #### cameraModule
    - **`Camera.ts`:** Gerencia a viewport do jogo. Sua responsabilidade é calcular e aplicar as transformações de translação (para seguir um alvo) e escala (zoom) ao contexto do canvas, garantindo que a visão não ultrapasse os limites do mundo.  **Coesão:** A classe `Camera` tem um propósito único e matemático: calcular uma matriz de transformação. Ela não sabe *o que* está sendo desenhado, apenas *onde* a "janela" de visualização deve estar. Ela recebe um alvo e os limites do mundo e retorna uma transformação, nada mais. Também pode ser útil para determinar coordenadas do mapa já que ela sabe as coordenadas do mundo.

  #### mapModule
    - **`Map.ts`:** Responsável por carregar e desenhar a imagem de fundo do mundo do jogo. Encapsula a lógica de carregamento assíncrono da imagem e fornece um método `draw` para o `Renderer`. O método `waitUntilLoaded` é crucial para a fase de inicialização, garantindo que o jogo só comece após o mapa estar pronto.
    - **Coesão:** **Altíssima (Coesão Funcional).** Sua única responsabilidade é gerenciar o asset visual do mapa. Ela não sabe sobre o jogador, câmera ou qualquer outra entidade, apenas como carregar e desenhar a si mesma.

  #### renderModule

    - **`renderModule/IRenderable.ts`**: A interface fundamental da camada de apresentação. Define o contrato para qualquer objeto que possa ser desenhado na tela (`draw`) e sincronizado com o domínio (`updateState`). É a chave para o polimorfismo, permitindo que o `Renderer` trate todos os objetos visuais (sprites, formas de debug, etc.) de maneira uniforme.
      - **Coesão:** **Máxima (Coesão de Comunicação).** Como interface, sua única responsabilidade é definir um contrato, uma linguagem comum para a renderização.

    - **`renderModule/Renderer.ts`**: O orquestrador do processo de desenho. Sua única responsabilidade é, a cada frame, limpar o canvas, aplicar a transformação da câmera e iterar sobre uma lista de `IRenderable`s, chamando o método `draw` de cada um.
      - **Coesão:** **Altíssima (Coesão Funcional/Sequencial).** Ele não sabe *o que* está desenhando, apenas que precisa executar uma sequência de passos para renderizar um frame. É um especialista focado.

    - **`renderModule/RenderableFactory.ts`**: Uma implementação do padrão Factory. Sua responsabilidade é desacoplar o `GameAdapter` da criação de objetos visuais concretos. Ele mapeia o `entityTypeId` de um DTO do domínio para a classe `IRenderable` correta (ex: `Player`, `Slime`) e a instancia. Também gerencia o pré-carregamento e o cache de assets (imagens), centralizando a gestão de recursos visuais.
      - **Coesão:** **Alta (Coesão Funcional).** Todo o seu propósito gira em torno da criação de `IRenderable`s. O gerenciamento de cache e o pré-carregamento são responsabilidades que suportam diretamente sua função principal.

    - **`renderModule/DebugCircle.ts`**: Uma implementação concreta de `IRenderable` com um propósito muito específico: desenhar a representação visual de uma `HitBox` circular para fins de depuração. Ela recebe o estado da hitbox do domínio e desenha um círculo vermelho semitransparente na tela.
      - **Coesão:** **Altíssima (Coesão Funcional).** Sua única função é desenhar um círculo de debug.

    - **`renderModule/Sprite.ts`**: Uma classe que encapsula a lógica de um spritesheet animado. Embora não seja instanciada diretamente pela `RenderableFactory` (que usa as classes do `gameObjectModule`), sua lógica é a base para a renderização de sprites no `GameObjectElement`. Ela gerencia o carregamento da imagem, o avanço dos frames da animação e o desenho do frame correto no canvas.
      - **Coesão:** **Alta (Coesão Funcional).** Focada exclusivamente na lógica de animação e desenho de um spritesheet.

  #### keyboardModule

    - **`InputManager.ts`:** O adaptador de entrada do jogo. Sua responsabilidade é capturar todos os eventos brutos de hardware (teclado e mouse) e traduzi-los em um conjunto de `GameAction`s lógicas e abstratas (ex: 'move_up', 'mouse_left'). Ele carrega um mapa de teclas de um arquivo de configuração (`keymap.json`), permitindo fácil customização e remapeamento em tempo de execução.
    - **Coesão:** **Altíssima (Coesão Funcional).** A classe é um tradutor puro. Ela não sabe o que é um "jogador" ou o que acontece quando a ação 'move_up' é ativada. Sua única função é gerenciar o estado das teclas pressionadas e fornecer uma API simples (`isActionActive`) para o `GameAdapter` consultar. Isso desacopla completamente o resto da camada de adaptação dos detalhes específicos de hardware.

  #### gameObjectModule

    Este módulo contém as classes que representam visualmente os objetos do jogo. Cada classe aqui é uma implementação da interface `IRenderable` e atua como a contraparte visual de uma entidade do domínio.

    - **`gameObjectModule/GameObjectElement.ts`**: A classe base para todos os objetos visuais do jogo. Sua responsabilidade é implementar a lógica padrão de renderização de um objeto, que pode ser um spritesheet animado. Ela recebe um DTO (`EntityRenderableState`) do domínio e usa suas informações (`coordinates`, `size`, `rotation`) para se posicionar e se dimensionar corretamente. Se uma configuração de sprite (`SpriteConfig`) for fornecida, ela gerencia a animação frame a frame; caso contrário, ela desenha uma forma de fallback (um quadrado preto), garantindo que todo objeto de domínio tenha uma representação visual, mesmo que temporária.
      - **Coesão:** **Alta (Coesão Funcional).** A classe tem um propósito bem definido: ser a representação visual padrão de uma entidade de domínio. Ela encapsula toda a lógica de animação de sprite e posicionamento, servindo como um bloco de construção reutilizável para classes mais específicas.

    - **`gameObjectModule/playerModule/Player.ts`**: A implementação visual específica para o jogador. Ela herda de `GameObjectElement` e adiciona uma lógica crucial: a capacidade de trocar de animação com base no `state` recebido do domínio (ex: 'idle', 'walking'). Ela mantém uma referência a todas as configurações de sprite possíveis para o jogador e as troca dinamicamente no método `updateState`, garantindo que a aparência do jogador sempre reflita sua ação atual no jogo.
      - **Coesão:** **Altíssima (Coesão Funcional).** Sua única responsabilidade é ser a "pele" visual do jogador. Ela não contém nenhuma lógica de jogo, apenas a lógica de apresentação para gerenciar os diferentes estados de animação do avatar do jogador.

    - **`gameObjectModule/Enemies/Enemy.ts`**: A classe base para a representação visual de inimigos. Ela herda de `GameObjectElement` e fornece um método de fábrica estático (`createWithSprite`) que utiliza uma estratégia (`spritesStrategy`) para encontrar a configuração de sprite correta com base no `entityTypeId` e no `state` do inimigo.
      - **Coesão:** **Alta (Coesão Funcional).** Sua responsabilidade é ser a representação visual genérica de um inimigo, encapsulando a lógica de seleção de sprite para essa categoria de objeto.

    - **`gameObjectModule/Enemies/Slime.ts`**: Uma implementação concreta que herda de `Enemy`. Sua única responsabilidade é se registrar na `RenderableFactory` como o visual para a entidade de domínio `slime`. Ela reutiliza toda a lógica de criação e renderização de seu pai, `Enemy`.
      - **Coesão:** **Altíssima (Coesão de Especialização).** A classe existe apenas para especializar `Enemy` para um tipo específico, sem adicionar nova lógica.

    - **`gameObjectModule/bullets/Bullet.ts`**: A representação visual de um projétil. Assim como `Enemy`, ela herda de `GameObjectElement` e usa um método de fábrica para selecionar o sprite correto com base no estado do projétil (ex: 'travelling').
      - **Coesão:** **Alta (Coesão Funcional).** Focada unicamente em ser a representação visual de um projétil.

    - **`gameObjectModule/geometryForms/CircleForm.ts`**: Uma classe visual especial que herda de `GameObjectElement` mas sobrescreve o método `draw`. Em vez de renderizar um sprite, sua única responsabilidade é desenhar uma forma de círculo (um contorno vermelho) nas coordenadas fornecidas pelo domínio. É usada para fins de depuração ou para representar objetos que não têm um asset gráfico.
      - **Coesão:** **Altíssima (Coesão Funcional).** Tem um propósito singular e bem definido: desenhar um círculo.

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
      -   Cria os componentes da camada de adaptação: `InputManager`, `Canvas`, `GameMap`.
      -   Inicia o carregamento de assets visuais essenciais (ex: imagem do mapa) e aguarda sua conclusão (`map.waitUntilLoaded()`).

  3.  **Travessia da Fronteira (Adapter -> Domain):**
      -   O `GameAdapter` chama `domain.setWorld()`, passando as dimensões do mapa que acabou de carregar. Esta é a primeira grande interação com o domínio.

  4.  **"Despertar" do Domínio (`DomainFacade.setWorld`):**
      -   O domínio finalmente ganha vida. Ele cria suas entidades internas: `World`, `Player` (com seus `Attributes`), `ActionManager` e o `ObjectElementManager`.
      -   O `ObjectElementManager` é instruído a popular o mundo com os inimigos iniciais (`spawnInitialElements`).

  5.  **Finalização da Inicialização do Adaptador (`GameAdapter.initialize`):**
      -   Com o domínio pronto, o adaptador cria os componentes restantes que dependem do mundo: `Camera`, `Renderer`, `RenderableFactory`.
      -   A `RenderableFactory` pré-carrega todos os outros assets (`preloadAssets`).
      -   O `GameAdapter` executa `syncRenderables()` pela primeira vez para criar as representações visuais (`IRenderable`) dos objetos que já existem no domínio (jogador e inimigos iniciais).
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
          -   Ele reconstrói a `Quadtree` com as novas posições de todos os objetos.
          -   Ele chama `checkCollisions()`, que usa a `Quadtree` para encontrar pares de objetos que podem colidir e, em seguida, verifica a intersecção de suas `HitBox`es.

  4.  **`sync` (Sincronização Visual):**
      -   A última ação dentro de `update` é `syncRenderables()`.
      -   O `GameAdapter` chama `domain.getRenderState()` para obter uma "fotografia" do estado atual de todos os objetos do jogo (posição, estado, etc.) na forma de DTOs.
      -   Ele itera sobre esses DTOs. Para cada um, ele verifica se já existe um objeto visual (`IRenderable`) correspondente no seu mapa `renderables`.
          -   Se existe, ele chama `renderable.updateState(dto)` para atualizar sua aparência (ex: mudar a animação de 'idle' para 'walking').
          -   Se não existe, ele usa a `RenderableFactory` para criar um novo objeto visual.
      -   Ele também remove da tela quaisquer objetos visuais cujas entidades não existem mais no domínio.
      -   > **AVISO:** O método `syncRenderables` atualmente cria dois novos `Set`s (`activeIds` e `activeDebugIds`) a cada frame. Em um jogo com muitos objetos, isso pode levar a uma pressão desnecessária no Garbage Collector. Uma otimização futura poderia ser reutilizar esses `Set`s, limpando-os a cada frame em vez de recriá-los.

  5.  **`render` (Desenho na Tela):**
      -   Após o `update` terminar, o `Game.ts` chama `gameAdapter.draw()`.
      -   O `GameAdapter` atualiza o alvo da `Camera` (geralmente o jogador).
      -   Ele chama `renderer.drawFrame()`.
      -   O `Renderer` limpa o canvas, aplica a transformação da câmera (zoom e translação) e, finalmente, itera sobre todos os `IRenderable`s (incluindo o mapa e os objetos de debug), chamando o método `draw()` de cada um para que eles se desenhem na tela.

### 3.3. Fluxo de Colisão (`hitbox`)

  Este fluxo descreve como o jogo detecta e resolve colisões entre entidades. Ele é iniciado dentro do passo 3 (`domain`) do ciclo principal do jogo.

  1.  **Início no Gerenciador (`ObjectElementManager.updateAll`):**
      -   Após atualizar a posição de todas as entidades, o método chama `checkCollisions()`.

  2.  **Otimização com Quadtree (`checkCollisions`):**
      -   O método itera sobre cada `elementA` no jogo que possui hitboxes.
      -   Em vez de comparar `elementA` com *todos* os outros objetos (complexidade O(n²)), ele consulta a `Quadtree` (`collisionTree.retrieve(elementA)`). Isso retorna uma lista muito menor de `potentialColliders` que estão na mesma região do espaço, otimizando drasticamente a performance.

  3.  **Verificação de Pares:**
      -   Para cada `elementB` na lista de `potentialColliders`, o sistema realiza algumas verificações para evitar trabalho desnecessário:
          -   Ignora se `elementA` e `elementB` são o mesmo objeto.
          -   Usa um `Set` (`processedPairs`) para garantir que cada par de objetos (A-B) seja verificado apenas uma vez por frame, evitando a detecção duplicada (B-A).

  4.  **Intersecção de Hitboxes:**
      -   O sistema itera sobre todas as `hitboxA` de `elementA` e todas as `hitboxB` de `elementB`.
      -   Ele chama `hitboxA.intersects(hitboxB)`, que contém a lógica matemática específica para verificar se as duas formas (ex: dois círculos) se sobrepõem.

  5.  **Reação à Colisão (Callback):**
      -   Se `intersects` retorna `true`, a colisão é confirmada.
      -   O sistema invoca os callbacks `onColision` de ambas as hitboxes, passando a entidade com a qual colidiram: `hitboxA.onColision(elementB)` e `hitboxB.onColision(elementA)`.
      -   É aqui que a lógica de negócio acontece. Por exemplo:
          -   A `HitBox` de um `Bullet` tem um `onColision` que verifica se o `elementB` é um `Enemy`. Se for, ele dispara um evento `despawn` para si mesmo.
          -   A `HitBox` de um `Enemy` tem um `onColision` que verifica se o `elementB` é um `Bullet`. Se for, ele chama seu próprio método `takeDamage()`.
      -   > **AVISO:** O log atual em `ObjectElementManager.checkCollisions` (`logger.log("hitbox", \`object ${JSON.stringify(elementA)} colided ${JSON.stringify(elementA)}\`)`) contém um erro de digitação ("colided") e está logando o mesmo objeto duas vezes. Isso pode ser confuso durante a depuração e deve ser corrigido para `...colided with ${JSON.stringify(elementB)}`.

### 3.4. Fluxo de Criação de Projétil (`spawn`)

  Este fluxo detalha como uma ação do jogador (um clique do mouse) resulta na criação de uma nova entidade no domínio e sua subsequente aparição na tela.

  1.  **Captura de Input (Adapter):**
      -   O `InputManager` detecta um evento `mousedown` do navegador e ativa a ação `'mouse_left'`.
      -   No ciclo `update` do `GameAdapter`, o método `handlePlayerInteractions` consulta o `InputManager` e vê que a ação `'leftClick'` está ativa.
      -   Ele chama `screenToWorld()` para converter as coordenadas do mouse (em pixels da tela) para as coordenadas do mundo do jogo.

  2.  **Comando para o Domínio (Adapter -> Domain):**
      -   O `GameAdapter` invoca `domain.handlePlayerInteractions()`, passando a ação `'leftClick'` e as coordenadas do mundo calculadas.
      -   > **AVISO:** O `GameAdapter` passa o `deltaTime` para `handlePlayerInteractions`, mas a `DomainFacade` não utiliza este parâmetro, o que representa uma pequena inconsistência na assinatura do método.

  3.  **Processamento da Ação (Domain):**
      -   A `DomainFacade` repassa a ação para o `ActionManager`.
      -   O `ActionManager` chama o método correspondente na entidade `Player`: `player.onLeftClickAction(mouseWorldCoordinates)`.
      -   Dentro do `Player`, o método `onLeftClickAction` (ou um método chamado por ele, como `shootBullet`) calcula a direção do tiro.
      -   O `Player` então dispara um evento de domínio: `gameEvents.dispatch('spawn', { factory: (id) => new SimpleBullet(...) })`. O payload do evento não é a bala em si, mas uma **função de fábrica** que sabe como criar uma.

  4.  **Criação da Entidade (Domain):**
      -   O `ObjectElementManager`, que está ouvindo o evento `'spawn'`, recebe a `factory`.
      -   Ele chama seu próprio método `spawn(factory)`, que executa a função, cria a instância do `SimpleBullet` com um novo ID único e a adiciona ao seu mapa interno de `elements`. A bala agora existe logicamente no jogo.

  5.  **Sincronização Visual (Domain -> Adapter):**
      -   No mesmo ciclo de `update`, o `GameAdapter` chama `syncRenderables()`.
      -   Ele obtém a lista de DTOs do domínio via `domain.getRenderState()`, que agora inclui o estado da nova bala.
      -   O `syncRenderables` percebe que não há um objeto visual para o ID da nova bala e chama a `RenderableFactory.create(bulletState)`.
      -   A `RenderableFactory` usa sua estratégia para `'simpleBullet'`, instancia a representação visual (`gameObjectModule/bullets/Bullet.ts`) e a adiciona ao mapa `renderables` do `GameAdapter`.

  6.  **Renderização (Adapter):**
      -   No passo de `draw` do mesmo frame, o `Renderer` recebe a lista de `renderables` que agora inclui a bala. Ele chama o método `draw()` da bala, e ela aparece na tela pela primeira vez.

### 3.5. Fluxo de IA do Inimigo (`playerMoved`)

  Este fluxo descreve como um inimigo simples (como o `Slime`) reage à movimentação do jogador, demonstrando a comunicação intra-domínio via eventos.

  1.  **Gatilho do Movimento (Domain - Player):**
      -   Quando o `Player` processa uma ação de movimento (ex: `onUpAction`), seu método `move(deltaTime)` é chamado, o que altera suas coordenadas.
      -   Após atualizar sua posição, o `Player` dispara um evento global para o domínio: `gameEvents.dispatch('playerMoved', { newPosition: this.coordinates })`.

  2.  **Recepção do Evento (Domain - Enemy):**
      -   A classe `Slime`, em seu construtor, se registrou como ouvinte do evento `'playerMoved'`.
      -   O `EventHandler` notifica todos os ouvintes, incluindo cada instância de `Slime`. O método `onPlayerMoved(payload)` do `Slime` é executado.

  3.  **Lógica da IA (Domain - Enemy):**
      -   Dentro de `onPlayerMoved`, o `Slime` recebe a nova posição do jogador.
      -   Ele calcula o vetor de direção de sua posição atual para a posição do jogador.
      -   Ele normaliza esse vetor e o armazena em sua propriedade `direction`. A partir deste momento, o `Slime` "sabe" para onde deve se mover.
      -   > **AVISO DE PERFORMANCE:** No modelo atual, cada instância de inimigo se registra individualmente para o evento `playerMoved`. Com centenas de inimigos, isso pode criar uma sobrecarga de notificações. Uma otimização futura poderia ser um "Gerenciador de IA" que ouve o evento uma única vez e atualiza os inimigos próximos ao jogador, em vez de notificar todos eles.

  4.  **Execução do Movimento (Domain - `updateAll`):**
      -   No mesmo ciclo de jogo, o `ObjectElementManager.updateAll()` chama o método `update(deltaTime)` de cada `Slime`.
      -   O `Slime.update()` chama seu método `move(deltaTime)` (herdado de `Entity`), que usa a propriedade `direction` (atualizada no passo anterior) para calcular e aplicar o movimento, alterando as coordenadas do `Slime`.

  5.  **Visualização (Adapter):**
      -   O fluxo segue o padrão: `syncRenderables` detecta a nova posição do `Slime`, atualiza o `GameObjectElement` correspondente, e o `Renderer` o desenha no novo local no próximo ciclo de `draw`.

### 3.6. Fluxo de Ataque e Dano (`damage`)

  Este fluxo descreve o que acontece quando um projétil atinge um inimigo, resultando em dano e, potencialmente, na morte do inimigo.

  1.  **Gatilho (Colisão):** O fluxo começa como uma continuação do **Fluxo de Colisão (3.3)**. O `ObjectElementManager` detecta uma colisão entre um `Bullet` e um `Enemy`.

  2.  **Invocação do Callback:** O `checkCollisions` invoca `hitboxB.onColision(elementA)`, onde `hitboxB` é a hitbox do `Enemy` e `elementA` é o `Bullet`.

  3.  **Lógica de Reação (Domain - Enemy):**
      -   O callback `onColision` da `HitBox` do `Enemy` verifica se o `elementA` é uma instância de `Bullet`.
      -   Se for, ele chama seu próprio método `takeDamage(bullet)`.
      -   > **AVISO:** Atualmente, o método `takeDamage` na classe `Entity` recebe o objeto de ataque (`IAtack`), o que é um bom design. Isso permite que a entidade que recebe o dano reaja a diferentes tipos de dano, efeitos críticos, etc., no futuro.

  4.  **Aplicação do Dano (Domain - Entity/Attributes):**
      -   O método `takeDamage` (na classe `Entity`) calcula o dano final após aplicar a defesa (`this.attributes.defence`).
      -   Ele então subtrai o dano do HP da entidade: `this.attributes.hp -= finalDamage`.

  5.  **Verificação de Morte (Domain - Entity):**
      -   Após aplicar o dano, `takeDamage` verifica se `this.attributes.hp <= 0`.
      -   Se o HP for zero ou menos, a entidade dispara dois eventos:
          1.  `gameEvents.dispatch('enemyDefeated', { xpGiven: this.xpGiven, killedBy: attackerId })` para notificar o sistema sobre a recompensa.
          2.  `gameEvents.dispatch('despawn', { objectId: this.id })` para solicitar sua própria remoção do jogo.

  6.  **Remoção da Entidade (Domain - `ObjectElementManager`):**
      -   O `ObjectElementManager`, que ouve o evento `'despawn'`, recebe o ID do inimigo e o remove de seu mapa `elements`. A partir do próximo frame, o inimigo não existe mais no domínio.

### 3.7. Fluxo de Experiência e Level Up (`xp`)

Este fluxo descreve como o jogador ganha experiência e sobe de nível após derrotar um inimigo.

1.  **Gatilho (Morte do Inimigo):** O fluxo começa quando um `Enemy` morre e dispara o evento `enemyDefeated` (passo 5 do fluxo anterior).

2.  **Recepção do Evento (Domain - Player):**
    -   A entidade `Player`, em seu construtor, se registrou como ouvinte do evento `'enemyDefeated'`.
    -   Seu método `onEnemyDefeated(payload)` é chamado, e ele verifica se foi o assassino (`payload.killedBy === this.id`).

3.  **Adição de Experiência (Domain - Player/Attributes):**
    -   Se o jogador foi o assassino, ele chama `this.attributes.addXp(payload.xpGiven, this.class.xpTable)`.
    -   O método `addXp` na classe `Attributes` adiciona a experiência, aplica bônus de `insight` e entra em um loop `while` para verificar se o XP atual ultrapassa o necessário para o próximo nível.

4.  **Level Up:**
    -   Se o jogador sobe de nível dentro do loop `while`, seu `_level` é incrementado, o XP atual é ajustado e o XP necessário para o próximo nível é recalculado com base na `IXPTable` da classe do jogador.
    -   > **AVISO:** O método `addXp` atualmente não dispara um evento de "level up". Adicionar um `gameEvents.dispatch('levelUp', { newLevel: this._level })` seria uma excelente melhoria, permitindo que outros sistemas (como a UI ou um sistema de efeitos visuais) reajam a este marco importante sem acoplar-se diretamente à classe `Attributes`.

## 4. Guia do Desenvolvedor (How-To)

  Esta seção serve como um guia prático para realizar tarefas comuns de desenvolvimento dentro da arquitetura atual.

### 4.1. Como Criar um Novo Inimigo (Ex: "Goblin")

  Criar uma nova entidade requer passos em ambas as camadas (Domínio e Adaptação) para garantir que a lógica e a apresentação estejam conectadas.

  1.  **Camada de Domínio (Lógica):**
      -   **Crie a Classe de Lógica:** Em `domain/ObjectModule/Entities/Enemies/`, crie um novo arquivo `Goblin.ts`. A classe `Goblin` deve herdar de `Enemy`.
      -   **Defina o Comportamento:** Implemente o construtor e, se necessário, sobrescreva o método `update(deltaTime)` para dar ao Goblin uma IA ou comportamento único (ex: talvez ele se mova mais rápido ou atire projéteis).
      -   **Defina o Tipo:** Abra `domain/ObjectModule/objectType.type.ts` e adicione `'goblin'` à união de tipos `objectTypeId`. Isso garante a segurança de tipo em todo o sistema.
      -   **Faça-o Aparecer:** Para testar, vá para `domain/ObjectModule/ObjectElementManager.ts` e, no método `spawnInitialElements()`, adicione uma chamada para criar uma instância do seu novo `Goblin`.

  2.  **Camada de Adaptação (Visual):**
      -   **Adicione os Assets:** Coloque os arquivos de imagem (ex: `goblin-idle.png`, `goblin-walking.png`) no diretório `adapters/web/assets/entities/`.
      -   **Configure os Sprites:** Em `adapters/web/components/renderModule/RenderableFactory.ts`, adicione as configurações para as animações do seu Goblin ao mapa `spriteConfigs`.
        ```typescript
        // Exemplo em spriteConfigs:
        ['goblin-idle', { imageSrc: new URL('../../assets/entities/goblin-idle.png', import.meta.url).href, ... }],
        ['goblin-walking', { imageSrc: new URL('../../assets/entities/goblin-walking.png', import.meta.url).href, ... }],
        ```
      -   **Crie a Classe Visual:** Em `adapters/web/components/gameObjectModule/Enemies/`, crie um arquivo `Goblin.ts`. Esta classe deve herdar da classe visual `Enemy` (de `Enemies/Enemy.ts`). Na maioria dos casos, esta será uma classe "casca" que apenas reutiliza a lógica do pai, semelhante ao `Slime.ts`.

  3.  **Conecte as Camadas:**
      -   **Registre na Fábrica:** Em `adapters/web/components/renderModule/RenderableFactory.ts`, importe sua nova classe visual `Goblin` e adicione-a ao mapa `creationStrategies`. A chave deve corresponder ao `objectTypeId` que você definiu.
        ```typescript
        // Exemplo em creationStrategies:
        import Goblin from "../gameObjectModule/Enemies/Goblin";
        // ...
        ['goblin', (params) => Goblin.createWithSprite(params)],
        ```

  Pronto! Ao iniciar o jogo, o `ObjectElementManager` criará a entidade `Goblin` no domínio. O `GameAdapter` receberá seu DTO, e a `RenderableFactory` usará a estratégia `'goblin'` para criar sua representação visual com o sprite correto.

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

### 4.3. Como Criar um Novo Projétil (Ex: "Fireball")

  O processo é semelhante ao de criar um inimigo, mas focado nos módulos de projéteis.

  1.  **Camada de Domínio (Lógica):**
      -   **Crie a Classe de Lógica:** Em `domain/ObjectModule/Entities/bullets/`, crie `Fireball.ts`. A classe `Fireball` deve herdar de `Bullet`.
      -   **Defina o Comportamento:** No construtor, defina suas propriedades únicas (dano, velocidade, etc.). Você pode sobrescrever o `update` para adicionar lógicas especiais (ex: aceleração) ou o `onColision` na sua `HitBox` para criar um efeito de explosão (disparando um novo evento `spawn` para um efeito visual de explosão, por exemplo).
      -   **Defina o Tipo:** Em `domain/ObjectModule/objectType.type.ts`, adicione `'fireball'` à união de tipos `objectTypeId`.

  2.  **Camada de Adaptação (Visual):**
      -   **Adicione o Asset:** Coloque a imagem `fireball.png` em `adapters/web/assets/entities/`.
      -   **Configure o Sprite:** Em `adapters/web/components/renderModule/RenderableFactory.ts`, adicione a configuração para a animação da `Fireball` ao mapa `spriteConfigs`.
        ```typescript
        // Exemplo em spriteConfigs:
        ['fireball-travelling', { imageSrc: new URL('../../assets/entities/fireball.png', import.meta.url).href, ... }],
        ```
      -   **Crie a Classe Visual:** Em `adapters/web/components/gameObjectModule/bullets/`, crie `Fireball.ts`. Esta classe deve herdar da classe visual `Bullet` e, na maioria dos casos, não precisará de lógica adicional.

  3.  **Conecte as Camadas:**
      -   **Registre na Fábrica:** Em `adapters/web/components/renderModule/RenderableFactory.ts`, importe sua nova classe visual `Fireball` e adicione-a ao mapa `creationStrategies`.
        ```typescript
        // Exemplo em creationStrategies:
        import Fireball from "../gameObjectModule/bullets/Fireball";
        // ...
        ['fireball', (params) => Fireball.createWithSprite(params)],
        ```

  4.  **Dispare o Projétil:**
      -   Em qualquer lugar do domínio onde o projétil deva ser criado (ex: em uma habilidade do `Player` ou no ataque de um `Enemy`), dispare o evento `spawn` com a fábrica da sua nova `Fireball`.
        ```typescript
        gameEvents.dispatch('spawn', { factory: (id) => new Fireball(...) });
        ```

### 4.4. Como Adicionar um Novo Estado de Animação ao Jogador (Ex: "attack")

  1.  **Adicione o Asset:** Coloque o spritesheet `player-attack.png` em `adapters/web/assets/entities/player/`.
  2.  **Configure o Sprite:** Em `adapters/web/components/renderModule/RenderableFactory.ts`, adicione a nova configuração de animação ao mapa `spriteConfigs`.
      ```typescript
      ['player-attack', { imageSrc: new URL('../../assets/entities/player/player-attack.png', import.meta.url).href, ... }],
      ```
  3.  **Altere o Estado no Domínio:** Na classe `Player` do domínio (`domain/ObjectModule/Entities/Player/Player.ts`), encontre a lógica que deve disparar a animação (ex: no método `onLeftClickAction`). Nesse ponto, altere a propriedade `state` da entidade.
      ```typescript
      // Em algum método do Player.ts do domínio
      this.state = 'attack';
      // Opcional: Adicionar um timer para voltar ao estado 'idle' após a animação
      ```
  4.  **Verifique a Sincronização:** A classe `Player` da camada de adaptação (`adapters/web/components/gameObjectModule/playerModule/Player.ts`) já está programada para ouvir as mudanças de estado. Quando o `syncRenderables` passar o novo DTO com `state: 'attack'`, ela automaticamente procurará a configuração `'player-attack'` e trocará a animação. Não é necessário fazer mais nada!

### 4.5. Como Criar um Novo Item Consumível (Ex: Poção de Cura)

  Itens consumíveis têm um fluxo diferente, pois geralmente não têm uma representação visual contínua no mundo após serem coletados.

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

### 4.6. Como Adicionar uma Nova Interface de Usuário (UI)

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
