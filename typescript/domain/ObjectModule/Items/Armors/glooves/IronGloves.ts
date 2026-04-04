import Gloove from "./Gloove";

export default class IronGloves extends Gloove {
    public readonly visualId = 'iron-gloves';
    constructor() {
        super(3, 0, 'Luvas de Ferro', 'Protege as mãos sem perder a pegada.', 14, 'common', 14, 60, 100, [], 1, { strength: 2 }, false, true);
    }
}