
import { Exponent } from "@repcomm/exponent-ts";

export class Canvas extends Exponent {
  element: HTMLCanvasElement;
  constructor () {
    super();
    this.make("canvas");
    this.applyRootClasses();
    
  }
}
