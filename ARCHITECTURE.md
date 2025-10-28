# Arquitetura do Projeto: RPG BulletHell Roguelite

Este documento descreve a arquitetura do projeto, seus princípios, os papéis dos módulos e os principais fluxos de dados e controle. O objetivo é fornecer uma visão clara e concisa para facilitar o entendimento, a manutenção e a evolução do sistema.

## 1. Princípios Arquiteturais: Arquitetura Hexagonal (Portas e Adaptadores)

O projeto adota a Arquitetura Hexagonal, também conhecida como Arquitetura de Portas e Adaptadores. Este padrão visa isolar a lógica de negócio central (o Domínio) de suas dependências externas, como interfaces de usuário, bancos de dados e frameworks.

**Conceitos Chave:**

- **Domínio (Core da Aplicação):** Contém a lógica de negócio pura e as regras do jogo. É agnóstico a qualquer tecnologia externa.
- **Portas (Interfaces):** Definem os contratos que o Domínio expõe para o mundo exterior (Portas Primárias) e os contratos que o Domínio precisa do mundo exterior (Portas Secundárias). São interfaces TypeScript.
- **Adaptadores (Implementações):** Implementam as Portas, traduzindo as interações do mundo externo para o formato que o Domínio entende, e vice-versa.

**Benefícios:**

- **Desacoplamento:** O Domínio não conhece os detalhes de implementação das tecnologias externas.
- **Testabilidade:** A lógica de negócio pode ser testada isoladamente, sem a necessidade de um ambiente de UI ou banco de dados.
- **Manutenibilidade:** Mudanças em uma tecnologia externa (ex: trocar de Canvas para WebGL) não afetam o Domínio.
- **Flexibilidade:** Facilita a adaptação a novos requisitos ou tecnologias.

## 2. Módulos Atuais como Atores

### 2.1. Camada de Domínio (`typescript/domain`)

Contém a lógica de negócio pura do jogo.

- **`DomainFacade.ts`:** A **Porta Primária** do Domínio. Implementa a interface `IGameDomain`, expondo operações de alto nível para a camada de Adaptação. Orquestra as entidades internas e protege a integridade da lógica de negócio.
- **`entities/Player.ts`:** Representa o jogador, suas propriedades e regras de movimento.
- **`entities/World.ts`:** Representa o ambiente do jogo, suas dimensões e regras de colisão.
- **`eventDispacher/eventDispacher.ts`:** Um sistema de eventos interno para comunicação desacoplada dentro do Domínio ou entre Domínio e Adapters (via `GameAdapter`).

### 2.2. Camada de Adaptação (`typescript/adapters/web`)

Implementa a interface de usuário e interage com as tecnologias web.

- **`domain-contracts.ts`:** Define a interface `IGameDomain` (a Porta) e os DTOs (Data Transfer Objects) para a comunicação entre Domínio e Adaptação.
- **`GameAdapter.ts`:** O **Adaptador Primário** para a interface web. Traduz eventos do navegador (input, resize) em chamadas para o `DomainFacade` e traduz os DTOs do Domínio em objetos visuais para a renderização. Orquestra o ciclo de vida dos componentes da apresentação.
- **`Game.ts`:** Um utilitário que abstrai o `requestAnimationFrame` do navegador para criar o game loop principal (`update` e `draw`).

#### canvasModule

- **`Canvas.ts`:** Abstrai o elemento HTML `<canvas>`, gerenciando sua criação e contexto 2D.

#### cameraModule

- **`Camera.ts`:** Gerencia a viewport do jogo, aplicando zoom e translação para seguir um alvo e restringir a visão aos limites do mundo.

#### mapModule

- **`Map.ts`:** Carrega e desenha a imagem de fundo do mapa do jogo.

#### renderModule

- **`IRenderable.ts`:** Define o contrato para qualquer objeto que possa ser desenhado na tela, permitindo polimorfismo na renderização.
- **`Renderable.ts`:** (Obsoleto/Não utilizado) Uma interface `Renderable` que parece ser uma versão antiga ou redundante de `IRenderable`.
- **`RenderableFactory.ts`:** Cria instâncias de `IRenderable` (ex: `Sprite`) a partir dos DTOs do Domínio, desacoplando o `GameAdapter` da criação concreta.
- **`Renderer.ts`:** Orquestra o processo de desenho no canvas, interagindo com a `Camera` e os `IRenderable`s.
- **`Sprite.ts`:** Uma implementação concreta de `IRenderable` que gerencia spritesheets animados.

#### keyboardModule/

- **`keyboardHandler.ts`:** (A ser refatorado) Atualmente, um módulo separado para eventos de teclado, mas sua responsabilidade será unificada no `GameAdapter`.

#### index

- **`index.ts`:** O ponto de entrada da aplicação, responsável por instanciar e conectar as camadas e iniciar o jogo.

## 3. Ciclos e Fluxos da Aplicação

### 3.1. Fluxo de Inicialização

1. **`index.ts`:** Inicia a execução.
2. **`index.ts`:** Instancia `DomainFacade` (com a configuração inicial) e `GameAdapter` (injetando o `DomainFacade`).
3. **`GameAdapter.initialize()`:**  
  
- Cria `Canvas`, `Map`, `Camera`, `Renderer`, `RenderableFactory`.
- Carrega o mapa (`Map.waitUntilLoaded()`).
- Informa o Domínio sobre as dimensões do mundo (`domain.setWorld()`).
- Sincroniza os objetos visuais iniciais (`syncRenderables()`).
- Configura listeners de eventos do navegador (`handleEvents()`).
- Inicia o `Game` loop (`initializeGame()`).

### 3.2. Ciclo do Game Loop (`update` e `draw`)

O `Game.ts` orquestra o loop, chamando `GameAdapter.update()` e `GameAdapter.draw()` a cada frame.

#### `GameAdapter.update(deltaTime)` (Fase de Lógica)

1. **Input:** Processa as teclas pressionadas (`handleMovement()`), traduzindo-as em comandos para o Domínio.
2. **Domínio:** Chama `domain.update(deltaTime)` para avançar o estado de todas as entidades do jogo.
3. **Sincronização Visual:** Chama `syncRenderables()` para comparar o estado do Domínio com os objetos visuais e criar/atualizar/remover `IRenderable`s.
4. **Câmera:** Define o alvo da câmera (`camera.setTarget()`), geralmente o jogador.

#### `GameAdapter.draw()` (Fase de Desenho)

1. **Coleta de Estado:** Obtém o estado atual de todos os objetos visíveis do Domínio (`domain.getRenderState()`) como DTOs.
2. **Limpeza:** `Renderer.clear()` limpa o canvas.
3. **Desenho:** `Renderer.drawFrame()`:

- `camera.applyTransform()` ajusta o contexto do canvas para a visão da câmera.
- `map.draw()` desenha o mapa.
- Itera sobre os `IRenderable`s e chama `renderable.draw(ctx)` para cada um.

### 3.3. Fluxo de Input (Exemplo: Movimento do Jogador)

1. **`GameAdapter.handleEvents()`:** Um `window.addEventListener('keydown')` detecta uma tecla (ex: 'w').
2. **`GameAdapter.handleMovement()`:** Traduz a tecla pressionada em um comando de movimento (`{ direction: 'up' }`).
3. **`DomainFacade.handlePlayerMovement()`:** Recebe o comando e delega para a entidade `Player`.
4. **`Player.move()`:** Atualiza as coordenadas do jogador, aplicando as regras de movimento e colisão com o `World`.
5. **Próximo `GameAdapter.update()`:** `syncRenderables()` detecta a nova posição do jogador (via `domain.getRenderState()`) e atualiza o `Sprite` correspondente.
6. **Próximo `GameAdapter.draw()`:** O `Sprite` do jogador é desenhado na nova posição, visível através da `Camera`.

## 4. Estados da Aplicação

- **Estado de Domínio:** A representação pura da lógica do jogo (posições, atributos, inventário, regras). É mantido pelas entidades no `typescript/domain`.
- **Estado de Apresentação:** A representação visual do jogo (sprites, texturas, animações, posição na tela, estado da câmera). É mantido pelos componentes em `typescript/adapters/web`.
- **DTOs (`domain-contracts.ts`):** Atuam como a ponte entre esses dois estados, garantindo que apenas os dados necessários e formatados sejam transferidos entre as camadas, mantendo o desacoplamento.
