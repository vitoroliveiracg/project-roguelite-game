# Revisões

Documentação de revisão de projeto por uma IA incorporando um Revisor 2 e um Arquiteto Sênior muito chato e muito rigoroso de uma big tech bilhonária.

## Revisão 1

  **STATUS DO CODE REVIEW:** ❌ REJEITADO (BLOCKER)

  **Revisor:** Arquiteto Sênior (L8) / "Revisor 2"
  **Projeto:** RPG Roguelite Bullet Hell

  Li a sua documentação (`ARCHITECTURE.md`) onde você exalta o uso de Arquitetura Hexagonal e WebGPU. A intenção e a ambição do projeto são notáveis e elogiáveis. No entanto, a execução apresenta falhas críticas de arquitetura, violações graves de paradigmas de desenvolvimento de jogos (Game Dev) e anti-patterns de TypeScript que causariam gargalos massivos de performance e manutenção em um ambiente de produção real. 

  Se isso fosse para produção, o PR não passaria. Segue o relatório detalhado (Post-Mortem) do seu design, categorizado por gravidade, com as devidas diretrizes de refatoração.

  ---

  ### 🚨 1. GRAVIDADE CRÍTICA: O Desastre da Física Assíncrona (O Game Loop Destruído)

  A pior violação de arquitetura deste projeto está na forma como o Domínio interage com o Worker de colisão. 

  No arquivo `ObjectElementManager.ts`, você tem:
  ```typescript
  public async updateAll(deltaTime: number, player: Player): Promise<void> {
      // ...
      await this.checkCollisions(allElements);
  }
  ```

  **O Problema:** Você está chamando um `await` **dentro da fase de atualização (update lockstep)** do seu game loop. O ciclo de física de um jogo (especialmente um Bullet Hell) precisa ser determinístico e estritamente síncrono no que diz respeito ao avanço de estado. Ao pausar o loop do domínio para esperar a resolução de uma Promise de um Web Worker, seu game loop perde a sincronia com a taxa de atualização da tela (vsync). Se o Worker demorar 30ms para processar uma árvore cheia, o seu jogo vai simplesmente parar, engasgar (stuttering massivo) e pular frames de renderização. Você atrelou a taxa de atualização do Domínio à latência de IPC (Inter-Process Communication) do navegador.

  **A Solução de Arquitetura:**
  Workers para física em jogos não devem bloquear o loop principal. O padrão correto é **Double Buffering** ou **Delayed Resolution**. 
  1. No frame `N`, o Domínio envia os dados para o Worker de forma síncrona ("fogo e esquece").
  2. O Domínio continua calculando o resto. 
  3. No frame `N+1` (ou quando o Worker responder via evento, não bloqueante), você enfileira os resultados das colisões e os resolve na fase inicial de física do próximo tick.

  ### 🚨 2. GRAVIDADE CRÍTICA: Inferno de Garbage Collection (GC Thrashing)

  Em um Bullet Hell, você terá centenas ou milhares de balas e inimigos em tela. Seu código atual aloca memória loucamente a cada milissegundo.

  1. **No `checkCollisions` (`ObjectElementManager.ts`)**: Você faz um `elements.map(...)` instanciando milhares de novos objetos literais a cada 16ms (60fps). 
  2. **No `getAllRenderableStates()` (`ObjectElementManager.ts`)**: Você recria o state inteiro fazendo push num array de novos objetos, instanciando novos DTOs de Hitbox, etc.
  3. **No `DomainFacade.ts` (`getRenderState`)**: O estado do player aloca arrays novos (`backpack.map`, `classes.map`).

  **O Problema:** A cada segundo do seu jogo, você está gerando dezenas de milhares de objetos descartáveis. O Garbage Collector do V8 engine será invocado repetidamente (Major GC pauses), o que vai derrubar os FPS de 60 para 15 instantaneamente. 

  **A Solução de Arquitetura:** 
  Você precisa de **Object Pooling** e **Mutabilidade Reutilizável** na ponte de transferência. O estado de renderização e os buffers de física devem usar `SharedArrayBuffer` ou instâncias pré-alocadas de `Float32Array` que são **mutadas** in-place, nunca recriadas com `map()` ou `new Object()`.

  ### 🟠 3. GRAVIDADE ALTA: Abuso do Observer Pattern (Global Event Bus)

  Você criou um sistema de eventos global `IGameEvents`. Até aí, tudo bem para a UI. Mas olhe o que você fez no `Slime.ts`:

  ```typescript
  this.eventManager.on("playerMoved", this.onLastPlayerPos.bind(this) )
  ```

  **O Problema:** Toda vez que o jogador se move (basicamente todo frame de input), um evento global é despachado. Se você tiver 200 Slimes na tela, o seu `EventHandler` vai iterar sobre um array de 200 callbacks sincronicamente *só porque o jogador andou um pixel*. Isso é uma complexidade $O(N)$ cravada no lugar errado.

  **A Solução de Arquitetura:** 
  Inimigos não devem assinar eventos globais para saber onde o jogador está. O `Slime` na sua função `update(deltaTime)` deve **perguntar** (Pull) ativamente a posição do jogador (passando a referência do player ou via uma Query Espacial na QuadTree) apenas se o jogador estiver dentro do seu "Agro Range". 

  ### 🟠 4. GRAVIDADE ALTA: Orientação a Objetos (OOP) vs Data-Oriented Design em Bullet Hells

  Você está criando um jogo tipo "Vampire Survivors / Bullet Hell". Para esse gênero, **Orientação a Objetos profunda (Herança)** é uma escolha perigosa para a performance da CPU (Cache Misses).

  Você tem `ObjectElement -> Bullet -> SimpleBullet`. Isso espalha os dados das balas pela memória Heap. Quando o loop itera chamando `element.update()`, o processador sofre penalidades de cache buscando onde está a função virtual e os dados da bala.

  **Para o futuro:** Big Techs e motores de jogos usam **ECS (Entity Component System)** ou **DOD (Data-Oriented Design)** para esse escopo. Recomendo fortemente mudar as balas para arrays simples de dados (`Float32Array` de posições e velocidades) manipuladas por um único `System` procedural, ao invés de classes com métodos encapsulados.

  ### 🟡 5. GRAVIDADE MÉDIA: A God Class Oculta e Vazamento da Camada Hexagonal

  A classe `Player.ts` possui quase 300 linhas e sabe lidar com: Inventário (`equipItem`), Mover (`onUpAction`), Árvore de Habilidade (`unlockSkill`), Instanciar Projetil (`shootBullet`), Subir Nível (`processLevelUp`). **Isso fere fatalmente o Princípio de Responsabilidade Única (SRP).** Ela deve ser desmembrada em `InventorySystem`, `CombatSystem`, etc.

  Além disso, seu `DomainFacade.ts` supostamente não deveria saber da UI. Porém, em `getRenderState()`, você tem isso:
  ```typescript
  backpack: this.player.backpack.map(item => ({ name: item.name, iconId: item.iconId })),
  ```
  O Domínio não deveria saber o que é um `iconId`. "Ícone" é conceito da camada de Adaptação (Apresentação). O Domínio envia o `itemId`, e a UI (RenderableFactory) que faça o bind com o ícone.

  ### 🟡 6. CODE SMELLS E DECEPÇÕES NO TYPESCRIPT

  Para um projeto de arquitetura pretensiosa, há falhas basilares no código:

  1. **Typos e Inglês Macarrônico (Inaceitável):**
    * `inteligence` -> **intelligence**
    * `wisdown` -> **wisdom**
    * `accuracity` -> **accuracy**
    * `pircing` -> **piercing**
    * `accelator` -> **accelerator**
    * `enimie` -> **enemy**
    *(Um dev júnior gastará horas achando que a propriedade sumiu do intellisense porque escreveu a palavra certa e você a errada).*

  2. **O Uso do `any`**:
    No arquivo `ObjectElement.ts`: `public state :any = ""`. 
    No `DomainFacade.ts`: `manageSkillTree(action: '...', payload: any): void;`.
    O TypeScript existe exatamente para abolir o `any`. Usar `any` no estado principal do elemento é jogar o superset no lixo. Crie Generics ou Enums estritos para os estados estatais de renderização.

  3. **Inconsistência da API de `Vector2D`**:
    Em `Vector2D.ts`, o método estático `Vector2D.add(a, b)` retorna um NOVO vetor. Mas o método de instância `this.add(other)` **muta** o objeto atual. Mutações colaterais escondidas criam bugs indetectáveis de física. Seja imutável de vez, ou mude o nome para `this.addMut(...)`.

  ---

  ### CONCLUSÃO E PRÓXIMOS PASSOS (Aprovado com Ressalvas se, e somente se...)

  Sua separação de WebGPU e Canvas é muito bem estruturada (padrão Strategy excelente na Presentation Layer), o Worker de física foi uma ótima sacada, mas o **Domínio está amarrando as pernas do adaptador**.

  **Plano de Ação para o próximo Sprint:**
  1. Desacople a chamada do Worker de física para não travar o `updateAll` (Transforme em Fire-and-Forget com resolução no frame posterior).
  2. Remova os `.map()` e `.filter()` massivos da geração de DTOs do RenderState. Adote pré-alocação de memória.
  3. Extraia as lógicas do `Player` para sistemas desacoplados (ECS-like).
  4. Corrija imediatamente os Typos das propriedades na classe `Attributes.ts`.
  5. Substitua `any` por tipos união (Union Types) estritos (Ex: `type PlayerState = 'idle' | 'walking' | 'dead'`).

