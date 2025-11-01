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

    //? --- Métodos de Mutação (Alteram 'this') ---

    /**
     * Normaliza o vetor, transformando-o em um vetor de unidade (magnitude = 1),
     * mantendo sua direção original.
     * * @returns {Vector2D} O próprio vetor, agora normalizado.
     */
    public normalize(): Vector2D {
        const magnitude = this.magnitude(); // Usa o novo método
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
     * Zera os valores do vetor.
     * @returns {Vector2D} O vetor zerado.
     */
    public reset(): Vector2D {
        this.x = 0
        this.y = 0
        return this
    }

    /**
     * Inverte os valores de X e Y do vetor.
     * @returns {Vector2D} O vetor invertido.
     */
    public invert(): Vector2D {
        this.x = -this.x
        this.y = -this.y
        return this
    }

    //? --- Métodos de Retorno (Retornam um novo Vector2D ou um valor) ---

    /**
     * Cria uma cópia exata desta instância do vetor.
     * @returns {Vector2D} Uma nova instância do vetor.
     */
    public clone(): Vector2D {
        return new Vector2D(this.x, this.y);
    }


    /**
     * Calcula a magnitude (comprimento) deste vetor.
     * @returns {number} A magnitude do vetor.
     */
    public magnitude(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * Calcula o produto escalar (Dot Product) entre este vetor e outro.
     * @param {Vector2D} other O outro vetor.
     * @returns {number} O resultado escalar do produto.
     */
    public dot(other: Vector2D): number {
        return this.x * other.x + this.y * other.y;
    }

    /**
     * Subtrai outro vetor deste vetor (result = this - other). Retorna um NOVO vetor.
     * @param {Vector2D} other O vetor a ser subtraído.
     * @returns {Vector2D} Um novo vetor resultante da subtração.
     */
    public subtract(other: Vector2D): Vector2D {
        this.x -= other.x;
        this.y -= other.y;
        return this;
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