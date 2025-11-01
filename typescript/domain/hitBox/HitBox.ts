/**
 * Define as propriedades básicas comuns a todas as HitBoxes.
 * Esta classe é abstrata e não pode ser instanciada diretamente.
 */
export abstract class HitBox {
    /** Posição da HitBox em relação ao mundo, ponto de refencia principal dela */
    public coordinates: {x:number, y:number}

    /** Rotação da HitBox */
    public rotation:number = 0

    constructor(coordinates: {x:number, y:number}, rotation:number = 0) {
        this.coordinates = coordinates
        this.rotation = rotation
    }

    /**
     * Atualiza a posição da HitBox junto com a rotação
     * @param coodinates Novo conjunto de coordenadas x e y da posição da HitBox.
     * @param rotation Novo ângulo em radianos da HitBox.
     */
    public update(coodinates: {x:number, y:number}, rotation:number): void {
        console.log("[HitBoxCircule] update")
        this.updatePosition(coodinates)
        this.updateRotation(rotation)
    }

    /**
     * Atualiza a posição da HitBox.
     * @param coordinates Novo conjunto de coordenadas x e y da posição da HitBox.
     */
    public updatePosition(coodinates: {x:number, y:number}): void {
        this.coordinates = coodinates
    }

    /** Atualiza a rotação. 
     * @param rotation Novo ângulo em radianos da HitBox.
     */
    public updateRotation(rotation: number): void {
        this.rotation = rotation;
    }

    /**
     * MÉTODO OBRIGATÓRIO: Verifica se esta HitBox está colidindo com outra HitBox.
     * A implementação específica depende do tipo de HitBox (círculo, polígono, etc.).
     * @param other A outra HitBox com a qual verificar a colisão.
     * @returns True se houver colisão, false caso contrário.
     */
    public abstract intersects(other: HitBox): boolean;
}