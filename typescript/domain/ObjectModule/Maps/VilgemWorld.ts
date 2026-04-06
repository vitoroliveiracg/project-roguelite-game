import GameWorld from "../GameWorld";
import HitBoxPolygon from "../../hitBox/HitBoxPolygon";
import type ObjectElement from "../ObjectElement";

export default class VilgemWorld extends GameWorld {
    public readonly mapId = 'vilgem';
    // Dimensões exatas da imagem de mapa que será carregada pelo Adaptador Web
    public readonly width = 8192; // 8 chunks de 1024px
    public readonly height = 8192;
    
    public readonly chunkSize = 1024;
    public readonly chunks = (() => {
        const grid: string[][] = [];
        for (let y = 0; y < 8; y++) {
            const row: string[] = [];
            for (let x = 0; x < 8; x++) {
                row.push(`vilgem-${x}-${y}`);
            }
            grid.push(row);
        }
        return grid;
    })();

    public generate(): void {
        this.eventManager.dispatch('log', { channel: 'init', message: 'Gerando o mundo de Vilgem...', params: [] });

        // Exemplo: Parede invisível de uma Casa ou Rio desenhados no mapa visual!
        const houseCollider = new HitBoxPolygon(
            { x: 500, y: 300 },
            0,
            // Um retângulo delimitador, ou um polígono complexo lido pelo seu HitboxParser!
            [ {x: 0, y: 0}, {x: 300, y: 0}, {x: 300, y: 200}, {x: 0, y: 200} ],
            { x: 0, y: 0 },
            (_otherElement: ObjectElement) => {
                // Como as colisões já são processadas via AABB/SAT no Worker, 
                // isso será uma barreira natural contra Player e Balas!
            }
        );

        this.eventManager.dispatch('spawn', {
            type: 'environmentCollider',
            coordinates: { x: 500, y: 300 },
            hitboxes: [houseCollider]
        });

        // Exemplo: Aqui você vai tirar os spawns de teste que estão grudados no ObjectElementManager
        // this.eventManager.dispatch('spawn', { type: 'slime', coordinates: { x: 800, y: 800 } });

        this.eventManager.dispatch('log', { channel: 'init', message: 'Mundo de Vilgem gerado com sucesso.', params: [] });
    }
}