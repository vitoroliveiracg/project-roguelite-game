/**
 * Representa um vetor 2D com coordenadas X e Y.
 */
export default class Vector2D {
    public x
    public y
    
    constructor(x:number, y:number) {
        this.x = x;
        this.y = y;
    }

    /**
     * Normaliza o vetor, transformando-o em um vetor de unidade (magnitude = 1),
     * mantendo sua direção original.
     * * @returns {Vector2D} O próprio vetor, agora normalizado.
     */
    public normalize(): Vector2D {
        const magnitude = Math.sqrt(this.x * this.x + this.y * this.y);
        if (magnitude === 0) {
            this.x = 0;
            this.y = 0;
            return this;
        }
        this.x /= magnitude;
        this.y /= magnitude;
        return this;
    }

    /**
     * Multiplica o vetor por um escalar (velocidade/força).
     * @param {number} scalar O valor pelo qual multiplicar.
     * @returns {Vector2D} O vetor escalado.
     */
    public multiply(scalar:number): Vector2D {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    /**
     * Adiciona outro vetor a este vetor.
     * @param {Vector2D} other O outro vetor a ser somado.
     * @returns {Vector2D} O vetor resultante da soma.
     */
    public add(other:Vector2D): Vector2D {
        this.x += other.x;
        this.y += other.y;
        return this;
    }

    /**
     * Zera os valores do vetor
     * @returns {Vector2D} O vetor zerado
     */
    public reset() {
        this.x = 0
        this.y = 0
        return this
    }

    /**
     * Cria uma cópia exata desta instância do vetor.
     * @returns {Vector2D} Uma nova instância do vetor.
     */
    public clone(): Vector2D {
        return new Vector2D(this.x, this.y);
    }

    /**
     * Calcula o vetor perpendicular (90 graus de rotação) a este vetor.
     * O vetor perpendicular aponta para um dos lados (esquerda ou direita, dependendo da rotação interna).
     * Retorna um NOVO vetor.
     * @returns {Vector2D} Um novo vetor perpendicular.
     */
    public perpendicular(): Vector2D {
        // Se o vetor for (x, y), o perpendicular é (-y, x) ou (y, -x).
        // Vamos usar (-y, x)
        return new Vector2D(-this.y, this.x);
    }


    /**
     * Calcula o ângulo (em radianos) que o vetor faz com o eixo positivo X.
     * O resultado está no intervalo $(-\pi, \pi]$.
     * @returns {number} O ângulo em radianos.
     */
    public angle(): number {
        // Math.atan2(y, x) retorna o arco tangente de y/x, 
        // levando em conta os sinais de ambos para determinar o quadrante correto.
        const perpendicularVector = this.perpendicular() // Perpendicular porque nosso carteziano é invertido
        return Math.atan2(perpendicularVector.y, perpendicularVector.x);
    }
}