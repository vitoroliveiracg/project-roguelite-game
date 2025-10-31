export default class Dice {

  /** Rola um dado de `faces` lados @param faces número de lados do dado */
  public static rollDice(faces :number) :number{
    let result = Math.floor( Math.random() * faces ) + 1;
    return result;
  }

}