# Garantias de Engenharia e Cobertura de Testes (Domínio)

Este documento detalha as **regras de negócio testadas**, como elas **simulam o ambiente real do jogo** e quais **garantias técnicas e de performance** são atestadas pela nossa suíte de testes. A arquitetura é validada sob as premissas estritas de **Determinismo**, **Zero-Garbage Collection (Zero-GC)** e **Isolamento Hexagonal**.

---

## 1. Núcleo Matemático e Geometria Espacial
*A base de todo o motor físico e de cálculo do jogo.*

*   **Álgebra Linear e RNG (`Vector2D`, `Dice`)**
    *   **Regra Testada:** Operações matemáticas devem ser imutáveis ou mutar a própria referência sem alocar lixo, e a aleatoriedade deve respeitar limites exatos.
    - **Como é Simulado:** Injeção forçada de valores extremos no `Math.random()` e operações em cascata de vetores.
    - **Garantia Técnica:** Zero vazamento de memória na *Heap* (operações `*Mut` atestadas) e limites perfeitos nas rolagens de dados (ex: taxa crítica orgânica sem estouros).

*   **Motor de Particionamento Espacial (`QuadTree`)**
    *   **Regra Testada:** A busca espacial deve ser infinitamente mais rápida que a checagem bruta em cenários de estresse de "Bullet Hell".
    - **Como é Simulado:** Benchmark de injeção simultânea de 1.000+ entidades amontoadas em um mesmo frame e em uma mesma coordenada exata.
    - **Garantia Técnica:** O algoritmo atinge a complexidade $O(N \log N)$ comprovada. O método de limpeza (`clear`) recicla instâncias de nós previamente alocados em vez de destrui-los, preservando rigorosamente a premissa de Zero-GC.

*   **Colisões Data-Driven (`HitboxParser`)**
    *   **Regra Testada:** A engine não pode engolir e processar hitboxes malformadas enviadas do Editor Web.
    - **Como é Simulado:** Injeção de DTOs JSON corrompidos ou com pontos poligonais faltantes na camada de Domínio.
    - **Garantia Técnica:** Política estrita de **Fail-Fast**. O parser lança um erro terminal no momento do carregamento, impedindo que falhas silenciosas matemáticas (como cálculo de eixos em arrays inválidos) travem a *Thread* do Worker de Física.

---

## 2. Orquestração e Física Atrasada (Delayed Resolution)
*O maquinário central que faz o tempo passar.*

*   **Motor de Ciclo de Vida (`ObjectElementManager`)**
    *   **Regra Testada:** A resolução de colisões da física não pode interromper a travessia e sincronia do *Game Loop*.
    - **Como é Simulado:** Disparo de eventos de colisão de arrays empacotados injetados simulando a devolução de um Worker Assíncrono para o Domínio.
    - **Garantia Técnica:** A arquitetura do *Double Buffering*. Colisões pendentes são armazenadas em buffer temporário e processadas rigorosamente de forma unificada no início do frame `N+1`. Isso extingue gargalos e "travadinhas" (Stuttering) por engasgos de I/O na física.

---

## 3. Mensageria, Roteamento e Fail-Fast
*A espinha dorsal de comunicação orientada a eventos.*

*   **Prevenção de Stack Overflow (`eventDispacher`)**
    *   **Regra Testada:** Eventos de comunicação global de altíssima frequência não podem causar loops recursivos infinitos.
    - **Como é Simulado:** Injeção contínua de eventos core de movimentação (`playerMoved`) e auto-registro de fluxos retroalimentados.
    - **Garantia Técnica:** O Event Bus bloqueia cadeias de chamadas que poderiam sequestrar o *Event Loop* e travar o navegador.

*   **Metaprogramação de Teclas (`ActionBindings`, `ActionManager`)**
    *   **Regra Testada:** O jogador e as classes não podem registrar ou sobrepor conflitos de atalhos e loadouts dinâmicos de habilidades.
    - **Como é Simulado:** Registro manual de atalhos de teclado duplicados (ex: dois `@BindAction('down')`) na inicialização da classe.
    - **Garantia Técnica:** Validação Estática Imediata. Ao detectar conflitos, um erro é lançado estourando o *Boot* da Aplicação, blindando completamente problemas silenciosos de botões em ambiente de jogo.

---

## 4. O Motor Numérico e Controle de Grupo (CC)
*A planilha do RPG resistindo ao teste do tempo.*

*   **Escalabilidade Numérica (`Attributes`)**
    *   **Regra Testada:** Acúmulo de status defensivos não pode gerar imortalidade matemática e quebrar a curva de desafio.
    - **Como é Simulado:** Atribuição de conjuntos de armadura que totalizam mais de 100% de Redução de Dano sobre a entidade controlável.
    - **Garantia Técnica:** O Cap numérico arquitetural (blindado em 90% máximo) é respeitado. Exclusão comprovada da fragilidade de *God Mode*.

*   **Ticks de Tempo e Efeitos de Status (`StatusEffects`)**
    *   **Regra Testada:** Efeitos cinemáticos puros devem reagir ao avanço de tempo e controlar os limites algorítmicos.
    - **Como é Simulado:** Avanço do delta temporal (`ticks`) simulando penalidades de instâncias sobrepostas (Múltiplas queimaduras, lentidão, paralisação).
    - **Garantia Técnica:** Matemática estrita de debuffs: Um estado `Slow` corta em vetor a inércia em exatamente 40%; um `Stun` freia a aceleração a (0,0); e um `Fear` inverte a base relacional algorítmica da IA inimiga, forçando fuga.

---

## 5. Classes Complexas, Sandboxing e a IA Generativa
*Comportamentos vivos, magias dinâmicas e o Ollama.*

*   **O Axiomante (`Mage`)**
    *   **Regra Testada:** Fusões adjacentes e intercepção imediata de teclados superlotados.
    - **Como é Simulado:** Fuzzing simulando o jogador esmagando atalhos em sequência mais rápido que o sistema consegue processar (Buffer temporal superior a 9 entradas contínuas).
    - **Garantia Técnica:** A *Spell Parser* recusa sobrecargas preventivamente com falha silenciosa segura. Identifica e gera magias *Deep 2* atestadas (ex: fundir os polimorfos básicos de "Magia" e "Fogo" cospe o tiro consolidado "Potência").

*   **Pesca e Ancoragem Cinética (`FishingHook`)**
    *   **Regra Testada:** Projéteis persistentes que algemam corpos vetoriais no espaço.
    - **Como é Simulado:** Disparo do anzol num chefe/entidade se movendo em alta velocidade (simulação de recuo).
    - **Garantia Técnica:** Âncora perfeita atestada: a inércia do anzol zera e as suas coordenadas travam uma sobreposição simétrica aos offsets da vítima até seu limite de *HookTimeout*.

*   **O Antivírus de IA Generativa (`PraxisValidator`)**
    *   **Regra Testada:** Tolerância estritamente zero a códigos maliciosos ou "alucinados" gerados pela conexão HTTP da LLM (Ollama).
    - **Como é Simulado:** Uma pesada bateria de Fuzzing injetando 50 cargas destrutivas (*Payloads* de `eval`, `window.alert`, strings Unicode quebradas, e loops síncronos mortais `while(true)`) enviados ao córtex dinâmico do `CognitiveNPC`.
    - **Garantia Técnica:** Taxa de Sobrevivência de Sandbox em 100%. O *Parser* seca e cega funções danosas falhando graciosamente, salvando a fundação do jogo de quebras provocadas pela IA alucinando no Backend.

---

## 6. O Motor Físico do Combate e Elementos (Roguelite)
*A imprevisibilidade das magias e a pancadaria visceral.*

*   **Hitboxes Animadas via Offset (`AnimatedMeleeAttack`)**
    *   **Regra Testada:** Lâminas varrendo longas distâncias rotacionais precisam varrer em coordenadas consistentes de *offset*.
    - **Como é Simulado:** Teste da classe interpelando arquivos JSON de animações (Foices gigantestas), emulando as mudanças no espaço global.
    - **Garantia Técnica:** Uso validado do Produto Escalar de FOV nos varredores de área (não é possível causar dano em oponentes nas suas costas). Os vértices do JSON nativo respeitam exatamente as leis de matriz de rotação impostas sobre o portador.

*   **RNG e Modificadores de Armamento (`Weapons` e `Effects`)**
    *   **Regra Testada:** Rolagens determinísticas para geração de raridade e encadeamento em profundidade de *On Hit Actions* (ex: Drenagem ou *Lifesteal*).
    - **Como é Simulado:** Acertos crísticos mockados e disparos de "Lifesteal" em espadas forjadas por gerador de Randomização Roguelite.
    - **Garantia Técnica:** O sistema aplica curas reversas com precisão. Eleva multiplicadores puros de ataque (Arma Básica virando Espada "Poderosa" e flamejante no drop sem mexer na sua estrutura da classe). O isolamento calculador está blindado e polimórfico.

---

## 7. A Validação E2E de Excelência: Prova do Zero-GC
*Auditoria do Domínio simulado no mundo real.*

*   **`ZeroGC_SystemIntegration.test.ts` (Teste Arquitetural Definitivo)**
    *   **Regra Testada:** O *Game Loop* isolado do Domínio deve passar pelo teste de stress completo (Atirar, Interceptar colisões, Calcular morte, Dropar loot procedimental e Coletar) com a taxa de uso do Heap plana.
    - **Como é Simulado:** O EventBus é energizado com 60 execuções recursivas puras de 16.6ms (`ticks`). Uma bala `DynamicProjectile` viaja distâncias euclidianas inteiras sob as reações assíncronas falsas do Worker, até impactar a massa inimiga, forçando Drops orgânicos varridos fisicamente pelo Player em seguida.
    - **Garantia Técnica:** O teste audita nativamente e sem piedade a API sistêmica do NodeJS `process.memoryUsage().heapUsed` capturada no Frame 1 comparada com o encerramento no Frame 60. É provada matematicamente a margem neutra de oscilação contígua exigida em um autêntico motor livre de limpezas aleatórias (*Garbage Collector* evitado com sucesso).

---

## 8. Defesa Arquitetural e Fitness Functions
*A arquitetura que se autodefende contra acoplamentos indevidos.*

*   **Fronteiras Hexagonais (`HexagonalBoundaries`)**
    *   **Regra Testada:** O Domínio deve ser estritamente puro, agnóstico de infraestrutura e livre de dependências circulares ou eferentes com a camada de Adaptação.
    - **Como é Simulado:** O autoteste executa o parsing profundo da Árvore de Sintaxe Abstrata (AST) do FileSystem, rastreando vetores de importação ilegais e a presença de tokens de Apresentação (`window`, `localStorage`, `document`).
    - **Garantia Técnica:** O acoplamento eferente ($Ce$) para a infraestrutura é garantidamente $0$. Qualquer vazamento bloqueia instantaneamente a compilação (Fail-Fast na CI), mantendo o Core imaculado.

---

## 9. Determinismo e Sincronia de Estado
*Prevenção contra Efeito Borboleta e Dessincronização.*

*   **Hashing de Estado (`Desync_Deterministic`)**
    *   **Regra Testada:** A simulação da física e das respostas de IA deve gerar o exato mesmo resultado a cada execução, assegurando estabilidade para *Replays*, Multiplayer lockstep e Save States.
    - **Como é Simulado:** Congelamento matemático da entropia (Sementes RNG fixas) e injeção de inputs cinemáticos em frames milimétricos (ex: Frame 60 exato). O DTO resultante final é extraído, envelopado e sofre Hashing criptográfico em `SHA-256`.
    - **Garantia Técnica:** A asserção contra um "Master Checksum" prova matematicamente que Flutuações de ponto flutuante (IEEE 754) ou Condições de Corrida (*Race Conditions*) no Event Loop foram esterilizadas.

---

## 10. Resiliência de Game Loop e Mutação de Estado
*A blindagem contra falhas estruturais, bugs de interface e duplicação.*

*   **Idempotência de Inventário e Tela Preta (`GameAdapter_Resilience`, `DroppedItem`)**
    *   **Regra Testada:** O Game Loop jamais deve ejetar a *Call Stack* visual por falhas matemáticas ocultas, e falhas temporais da física não devem causar clonagem de itens coletáveis.
    - **Como é Simulado:** O motor de regras é sabotado forçando um `throw new Error()` na rotina de update, e o callback de colisão de um item no chão é engatilhado múltiplas vezes (Frames $N$ e $N+1$) superpondo a latência do *Double Buffering*.
    - **Garantia Técnica:** A orquestração do Adapter suporta a anomalia através de um Try-Catch global sem derrubar a API de `requestAnimationFrame`. Além disso, travas de estado (`isCollected`) blindam a matemática impedindo que o *Stuttering* físico duplique o loot do jogador. O Timeout da LLM também garante abortos síncronos da IA.

---

## 11. Performance e Otimização de I/O
*Proteção contra estrangulamento da Thread Principal e GPU.*

*   **Latência IPC e Render Thrashing (`IPCLatency_M13`, `RenderThrashing_M15`)**
    *   **Regra Testada:** A carga de transferência via Tauri (Save State/Criptografia) não pode perfurar o orçamento base de milissegundos, e a GPU não deve redesenhar matrizes que não sofreram translação ou mutação.
    - **Como é Simulado:** Mocks de lentidão injetados simulando o disco local travando por 20ms durante o `safeInvoke`, além do disparo forçado de DTOs paralisados contra o Rastreador Visual da Engine.
    - **Garantia Técnica:** O sistema atesta sua capacidade de alertar a arquitetura via logs/erros se a latência extrapolar a marca sagrada de 16.6ms (Garantindo estabilidade de FPS). Em paralelo, *Short-Circuits* matemáticos $O(1)$ evitam processamento redundante da GPU (*Render Thrashing* igual a zero para entidades hibernando).

---

## 12. Telemetria de Balanceamento Automatizado
*Auditoria do núcleo do Roguelite (Economia e Curva de Dificuldade).*

*   **Simulador de Time-To-Kill (`Balance_Telemetry_TTK`)**
    *   **Regra Testada:** Refatorações de atributos, status e itens não podem inadvertidamente quebrar a viabilidade das classes. O DPS deve ser matematicamente suficiente para romper hordas e evoluir o Nível do Avatar.
    - **Como é Simulado:** Um "Robô de Controle" injeta inputs rotacionais super-humanos ($10$ disparos/s fundindo magias complexas) contra *Spawns* iterativos de Slimes em um ambiente estritamente Headless e em fast-forward. O teste usa interceptores diretos (`Spies`) no método `takeDamage` das entidades para aferição pura.
    - **Garantia Técnica:** Prova-se que a conversão de *Stats* (Força, Inteligência, Dano Base) atinge um Patamar de Dano Por Segundo ($DPS > 4.0$) e curva de ganho de Experiência escalável (O jogador cruza o Nível 5 com folga em janela curta de combate), barrando modificações que quebrem a matemática econômica do Bullet Hell.

---

## 13. Validação de CI e Arquitetura
*A blindagem contra falhas de build e violações arquiteturais.*

*   **Validação de Workflows e Configs (`ci-validation`)**
    *   **Regra Testada:** O repositório deve conter todos os arquivos obrigatórios para os workflows do CI funcionarem, e as configurações devem evitar problemas conhecidos (ex.: MSI no Windows).
    - **Como é Simulado:** Parsing de arquivos YAML dos workflows, verificação de presença de `package.json`, `Cargo.toml`, `tauri.conf.json`, ícones, e validação de targets seguros (ex.: rejeição de MSI para evitar downloads falhos).
    - **Garantia Técnica:** Fail-Fast na CI local. O teste impede pushes com setups incompletos ou configs arriscadas, garantindo que builds não falhem por falta de arquivos ou targets problemáticos (ex.: WiX timeout).