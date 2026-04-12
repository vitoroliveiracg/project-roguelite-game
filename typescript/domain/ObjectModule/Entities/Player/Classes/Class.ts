import type IXPTable from "../../IXPTable";
import type Skill from "../../../../Skills/Skill";
import type Player from "../Player";
import type { IEventManager } from "../../../../eventDispacher/IGameEvents"; 

export default abstract class Class {
  
  constructor(
    public readonly name: string,
    public xpTable : IXPTable,
    protected player: Player,
    protected eventManager: IEventManager
  ) {}

  public abstract getSkillForLevel(level: number): Skill | null;
  public abstract get allSkills(): Skill[];
}