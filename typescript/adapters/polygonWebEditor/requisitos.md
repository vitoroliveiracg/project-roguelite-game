# Hitbox Editor — Documento de Requisitos

## Nome do Sistema

**Hitbox Editor Tool**

## Objetivo

Ferramenta visual para:

* carregar sprites arrastando os arquivos
* definir hitboxes manualmente
* editar polígonos e círculos
* exportar dados compatíveis com o sistema `HitBox`

---

# 1. Escopo

O sistema permitirá:

criação visual de hitboxes
edição em tempo real
visualização sobre o sprite
exportação estruturada
integração direta com a engine

Não faz parte do escopo:

animação... Se quiser fazer animação de acordo com o polígono, faz para cada frame e pega os polígonos
física
colisão runtime

---

# 2. Usuário alvo

* Desenvolvedor da engine
* Game designer
* Você

---

# 3. Arquitetura Geral

Será um adaptador do domínio já existente

```
polygonWebEditor
│
├── EditorApp
├── CanvasRenderer
├── InputController
├── Tools
│   ├── PolygonTool
│   ├── CircleTool
│   └── SelectTool
│
├── Models
│   ├── HitboxModel
│   └── PointModel
│
└── Exporter
```

---

# 4. Requisitos Funcionais

---

## RF01 — Carregar Sprite

**Descrição**

Usuário deve poder carregar imagem.

**Entrada**

* PNG / JPG

**Resultado**

* Sprite exibido no canvas

---

## RF02 — Criar Pontos

**Descrição**

Clique do mouse cria vértice.

**Regras**

* clique esquerdo → adiciona ponto
* pontos conectados sequencialmente
* preview de linha ativa

---

## RF03 — Fechar Polígono

**Descrição**

Finalizar criação da hitbox.

**Ações possíveis**

* Enter
* Clique no primeiro ponto
* Botão UI

**Resultado**

```ts
{
 type:"polygon",
 points:[...]
}
```

---

## RF04 — Selecionar Hitbox

Usuário pode:

* clicar na hitbox
* destacar seleção
* editar apenas a ativa

---

## RF05 — Mover Pontos

**Interação**

* drag & drop do vértice

---

## RF06 — Remover Pontos

**Ações**

* botão direito
* tecla Delete

---

## RF07 — Criar Círculo

Modo alternativo:

1. clique centro
2. arrasta raio

Resultado:

```ts
{
 type:"circle",
 center:{x,y},
 radius:r
}
```

---

## RF08 — Múltiplas Hitboxes

Editor suporta:

* várias hitboxes por sprite

Exemplo:

```ts
[
  polygonHitbox,
  circleHitbox,
  polygonHitbox
]
```

---

## RF09 — Visual Debug

Mostrar:

* pontos
* linhas
* centro
* raio
* seleção ativa

---

## RF10 — Exportar Hitbox

Formato compatível com sua engine:

```ts
{
 hitboxes:[
   {
     type:"polygon",
     coordinates:{x:0,y:0},
     rotation:0,
     points:[...]
   }
 ]
}
```

---

## RF11 — Importar Hitbox

Editor deve abrir JSON salvo.

---

# 5. Requisitos de Interação

| Ação         | Resultado   |
| ------------ | ----------- |
| Click        | criar ponto |
| Drag         | mover       |
| Shift        | snap grid   |
| Delete       | remover     |
| Enter        | finalizar   |
| Scroll       | zoom        |
| Space + Drag | pan         |

---

# 6. Renderização

O editor deve desenhar:

Ordem:

```
Sprite
↓
Hitboxes
↓
Pontos
↓
UI overlays
```

---

# 7. Requisitos Não Funcionais

---

## RNF01 — Performance

* 60 FPS mínimo
* Canvas 2D suficiente

---

## RNF02 — Independência

Editor NÃO depende da engine runtime.

---

## RNF03 — Serialização

Compatível com:

```ts
HitBox.getDebugShape()
```

---

## RNF04 — Extensibilidade

Permitir novos tipos:

* capsule
* rectangle
* convex hull

---

# 8. Modelo de Dados

---

## HitboxModel

```ts
interface HitboxModel{
 type:'polygon'|'circle';
 coordinates:{x:number,y:number};
 rotation:number;
 points?:Point[];
 radius?:number;
}
```

---

## Point

```ts
interface Point{
 x:number;
 y:number;
}
```

---

# 9. Ferramentas (Tool System)

Inspirado em engines reais:

```
Tool (abstract)
 ├─ PolygonTool
 ├─ CircleTool
 └─ SelectTool
```

Cada tool controla:

* input
* render overlay
* comportamento

---

# 10. Estados do Editor

```
Idle
CreatingPolygon
CreatingCircle
DraggingPoint
MovingHitbox
```

---

# 🔥 11. Integração com sua Engine

Export direto:

```ts
new HitBoxPolygon(
 coordinates,
 rotation,
 points,
 onCollision
);
```

Você elimina conversão manual.

---

# ⭐ 12. Funcionalidades Futuras (Nível Engine Profissional)

* auto trace alpha sprite
* convex decomposition
* simulação de colisão
* mirror hitbox
* hot reload
* edição runtime
* salvar por frame de animação

---

# 🚀 O PULO DO GATO (arquitetura correta)

O segredo é:

👉 **Editor NÃO É PARTE DO JOGO**

Faça:

```
/engine
/editor
```

Separados.

Todas as engines sérias fazem isso.

---

Se quiser, no próximo passo eu posso te mostrar algo MUITO forte:

🔥 **a arquitetura usada por Unity / Godot para editores internos**
(é exatamente o que você está começando a construir sem perceber).
