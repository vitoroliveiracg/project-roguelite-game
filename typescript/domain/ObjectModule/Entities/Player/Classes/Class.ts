import type IXPTable from "../../IXPTable";

export default abstract class Class {
  
  constructor(
    public readonly name: string,
    public xpTable : IXPTable,    
  ) {}

}