import type IXPTable from "../../IXPTable";

export interface ISkill {
  id: string;
  name: string;
  type: 'active' | 'passive' | 'rare';
  tier: number;
  requiredSkillId?: string; // Nó anterior necessário
}

export default class Class {
  
  constructor(
    public readonly name: string,
    public xpTable : IXPTable,
    public readonly skills: ISkill[] = []
  ) {}

}