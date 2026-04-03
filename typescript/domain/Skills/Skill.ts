import type Effect from "../ObjectModule/Items/Effects/Effect";
import type { action } from "../eventDispacher/actions.type";

export type SkillType = 'active' | 'passive';

export default class Skill {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly type: SkillType,
        public readonly tier: number,
        public readonly requiredSkillId?: string,
        public readonly effect?: Effect,
        public readonly keybind?: action
    ) {}
}