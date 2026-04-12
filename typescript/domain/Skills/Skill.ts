import type Effect from "../ObjectModule/Items/Effects/Effect";
import type { action } from "../eventDispacher/actions.type";

export type SkillType = 'active' | 'passive' | 'rare' | 'essential' | 'attribute';

export default class Skill {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly description: string,
        public readonly type: SkillType,
        public readonly tier: number,
        public readonly requiredSkillId?: string,
        public readonly effect?: Effect,
        public readonly keybind?: action
    ) {}
}