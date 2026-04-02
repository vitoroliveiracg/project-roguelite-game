export default class Skill {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly type: 'active' | 'passive' | 'rare',
        public readonly tier: number,
        public readonly requiredSkillId?: string
    ) {}
}