
import { Exponent, Input, Panel, Text } from "@repcomm/exponent-ts";

export class LabelInput extends Panel {
  label: Text;
  input: Input;
  
  constructor () {
    super();

    this.label = new Text()
    .mount(this);

    this.input = new Input()
    .mount(this);
  }
  setTextContent(text: string): this {
    this.label.setTextContent(text);
    return this;
  }
  getValue (): string {
    return this.input.getValue();
  }
  setValue (v: string): this {
    this.input.setValue(v);
    return this;
  }
}
