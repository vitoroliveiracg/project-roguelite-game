# Requisitos para o **Sistema de Magia e a Academia** 

## O mago

| lvl | Skill               |
| --- | ------------------- |
| 1   | Teclas: 0, 1, 2 e 3 |
| 2   | Fire                |
| 3   | Water               |
| 4   | Nature              |
| 5   | Thunder             |
| 6   | Luz                 |
| 7   | Magic               |
| 8   |                     |
| 9   |                     |
| 10  |                     |
| 11  |                     |
| 12  |                     |
| 13  |                     |

| tipo    | tecla teclado | tecla numped | significado    |
| ------- | ------------- | ------------ | -------------- |
| form    | ~             | 0            | **Projectile** |
| form    | ,             | 1            | **Self**       |
| force   | .             | 2            | **Knockback**  |
| force   | ;             | 3            | **Pull**       |
| element | k             | 4            | **Fire**       |
| element | l             | 5            | **Water**      |
| element | ç             | 6            | **Ground**     |
| element | i             | 7            | **Dark**       |
| element | o             | 8            | **Light**      |
| element | p             | 9            | **Magic**      |

### Elementos base deep 2

| elemento 1 | elemento 2 | resultado     | cor       |     | Efeito                                                                                                                                                                                         |
| ---------- | ---------- | ------------- | --------- | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| magic      | fire       | **potência**  | `#FF4500` |     | Causa + uma quantidade fixa de knockback, exemplo, se eu escolher knockback eu tenho x, knockback + potentia , para cada potentia, + knockback                                                 |
| magic      | water      | **ice**       | `#D6FFFA` |     | Ice pode congelar                                                                                                                                                                              |
| magic      | ground     | **life**      | `#FF2C2C` |     | Cura o target                                                                                                                                                                                  |
| magic      | dark       | **caos**      | `#4A0080` |     | Caos vai fazer o projectile dar dano em área                                                                                                                                                   |
| magic      | light      | **ordem**     | `#FFF`    |     | Faz o projectile causar + 1/2 do dano total no inimigo específico que acertar o projectile, isso não pode ser combinado com efeitos em área, se a magia for em área o ordem só gasta mais mana |
| fire       | water      | **air**       | `#DBF4E0` |     | Air causa slow                                                                                                                                                                                 |
| fire       | ground     | **magma**     | `#F4614E` |     | Magma causa dano magico e dano físico, e dá um danosinho contínuo igual o fogo                                                                                                                 |
| fire       | dark       | **infernous** | `#8B0000` |     | Infernous faz o inimigo ficar cego, se acertar o jogador por exemplo a tela fica preta por alguns segundos (só vê as huds).                                                                    |
| fire       | light      | **thunder**   | cor atual |     | efeito atual. Chance de paralizar                                                                                                                                                              |
| water      | ground     | **nature**    | `#228B22` |     | Diminui resistencia do inimigo e tem chance de stunar                                                                                                                                          |
| water      | dark       | **abys**      | `#dc143c` |     | Abys pode causar fear (os target tem seus vetores de movimento invertidos)                                                                                                                     |
| water      | light      | **Holy**      | `#FFFFF0` |     | diferente do light (dano fixo), o holy vai dar dano x2 em inimigos do tipo dark                                                                                                                |
| ground     | dark       | **Decay**     | `#556B2F` |     | decay dano contínuo que ignora defesas mágicas ou armaduras,                                                                                                                                   |
| ground     | light      | **Crystal**   | `#E0FFFF` |     | crystal pode depois que a magia terminar, spwnar a mesma magia mas muito menor e com 1/8 do dano para todos os 8 lados da magia                                                                |

### Elementos base deep 3 (deep 2 + deep 1)


| element 1 | element 2 | resulted element | cor    |
| --------- | --------- | ---------------- | ------ |
| life      | dark      | **death**        | `#000` |
| thunder    | light      | **plasma**   | `#2335be`|
|           |           |                  |        |

### Elementos base deep 4 (deep 3  + deep 1)


| element 1 | element 2 | resulted element | cor       |
| --------- | --------- | ---------------- | --------- |
| death     | life      | **spirit**       | `#E0F8FF` |
|           |           |                  |           |
|           |           |                  |           |


## Axiomante

Usa IA para fazer as combinações. Caos puro controlado.

## Épico 6: Sistema de Conjuração do Mago Programador

*Transformar o teclado em um console de criação de realidade.*

* **Tarefa: Implementar o Buffer de Entrada (Sintaxe de Teclas)** 
    -   [x] Criar no `ActionManager` uma fila que escuta as teclas.
    -   [x] Implementar um "tempo de expiração" do buffer (se o jogador não terminar a sequência, o código "limpa").
* **Tarefa: Criar o Analisador de Magias (Parser de magias diferentes)** 
    -   [x] **Lógica de Receitas:** Identificar sequências fixas (ex: `Projectile` + `Fire` + `Projectile` = "Bola de Fogo") e rodar códigos específicos para essas seletas seequências.
    -   [x] **Lógica de Atributos:** Magias conhecidas herdam efeitos visuais e multiplicadores de dano específicos.

## Épico 7: Renderização Dinâmica (O "Lego" Visual) de magias não listadas

*Unir modelos 2D para dar vida às magias brutas e refinadas não listadas=.*

* **Tarefa: Sistema de Composição de Modelos 2D** 
    -   Criar a lógica para sobrepor os modelos básicos de cada categoria (ex: uma bola do `Projectile` recebendo a cor e textura do `Fire`).
    -   Garantir que a rotação e escala do modelo acompanhem a direção que o personagem olha já que o mago só usa o teclado.
* **Tarefa: Gatilho de Substituição de Arte** 
    -   Implementar a troca automática: se o `Parser` identificar uma magia pronta (ex: "Bola de Fogo"), o motor de renderização substitui o "Lego" de modelos básicos por uma **Sprite Animada** feita à mão.

---

## Um lugar do mapa: A Academia de Magia (Torre de Desafios)

*O hub de progressão intelectual do jogador que existirá num ponto do mapa do mundo.*Lembre-se que a ideia da arquitetura é justamente poder desenvolver o domínio sem precisar de realmente ter 

* **Tarefa: Arquitetura da Torre (Níveis de Puzzle)** 
    -   Criar a UI da Torre com progressão vertical (cada andar é um novo desafio).
    -   Implementar o "Estado de Conhecimento": Magias só podem ser usadas em combate após serem "estabilizadas" na torre.
* **Tarefa: Mecânica de Conexão (Estilo Thaumcraft)** 
    - **Nodos de Elementos:** Posicionar os elementos base ($4-9$) em extremidades opostas de uma grade.
    - **Ponte de Magias:** Implementar a lógica onde o jogador deve preencher o caminho entre dois elementos usando magias que ele já conhece.
    - **Exemplo:** Para ligar **Fogo** a **Água**, o jogador deve colocar no meio o nodo da magia **Fumaça** .
* **Tarefa: Recompensa de Estabilização** 
    -   Ao completar um andar da torre, disparar um evento de domínio que libera permanentemente o uso daquela combinação ou elemento no mundo exterior.

---

## Épico 9: Interações Elementares e Meio Ambiente

*Como o código do mago interage com o código do mundo.*

* **Tarefa: Reações Químicas de Combate** 
    -   Definir o que acontece quando elementos opostos se chocam (ex: Projétil de Água apagando Projétil de Fogo de um inimigo).
* **Tarefa: Buffs de "Axioma"** 
    -   Implementar passivas que o Axiomante ganha ao "digitar" rápido ou sem errar a sequência (ex: bônus de velocidade de conjuração por "digitação perfeita").

---

### Tabela de Prioridades Sugerida

| Ordem | Componente | Por que começar por aqui? |
| :--- | :--- | :--- |
| **1º** | **Buffer de Entrada** | Sem capturar as teclas na ordem, não existe Mago Programador. |
| **2º** | **Lógica de Receitas** | Permitir que o jogador execute ao menos uma "Bola de Fogo" básica. |
| **3º** | **Puzzle da Academia** | É o que vai ditar o ritmo de jogo e a progressão das runs. |
| **4º** | **Motor de Caos (IA)** | Deixe para quando o básico já estiver divertido; é o tempero final. |


 

 

 

