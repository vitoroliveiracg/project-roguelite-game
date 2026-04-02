import type IXPTable from "../../IXPTable";
import type Skill from "../../Skills/Skill";

export default abstract class Class {
  
  constructor(
    public readonly name: string,
    public xpTable : IXPTable
  ) {}

  public abstract getSkillForLevel(level: number): Skill | null;
  public abstract get allSkills(): Skill[];
}