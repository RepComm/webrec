
import { Exponent, Panel, Text } from "@repcomm/exponent-ts";

export class Option extends Exponent {
  constructor () {
    super();
    this.make("option")
    .applyRootClasses()
    .addClasses("select-panel-option");
  }
  setValue (text: string): this {
    this.setAttr("value", text);
    this.setTextContent(text);
    return this;
  }
  getValue (): string {
    return this.getAttr("value");
  }
}

export class Select extends Panel {
  private title: Text;
  private select: Exponent;

  private options: Set<string>;
  private optElements: Set<Option>;
  private inactiveOptElements: Set<Option>;
  constructor () {
    super ();

    this.addClasses("select-panel");

    this.title = new Text()
    .setTextContent("Title")
    .addClasses("select-panel-title")
    .mount(this);

    this.select = new Exponent()
    .make("select")
    .addClasses("select-panel-select")
    .applyRootClasses()
    .mount(this);
    
    this.options = new Set();
    this.optElements = new Set();
    this.inactiveOptElements = new Set();
  }
  setTitle (text: string): this {
    this.title.setTextContent(text);
    return this;
  }
  aquireOptElement (): Option {
    let result: Option;
    for (let opt of this.inactiveOptElements) {
      result = opt;
    }
    if (!result) result = new Option();
    return result;
  }
  setOptElementActive (opt: Option, active: boolean = true): this {
    if (active) {
      this.inactiveOptElements.delete(opt);
      this.optElements.add(opt);
      opt.mount(this.select);
    } else {
      this.inactiveOptElements.add(opt);
      this.optElements.delete(opt);
      opt.unmount();
    }
    return this;
  }
  recycleOptElements (): this {
    for (let opt of this.optElements) {
      this.setOptElementActive(opt, false);
    }
    return this;
  }
  redraw (): this {
    this.recycleOptElements();

    let opt: Option;
    for (let v of this.options) {
      opt = this.aquireOptElement();
      opt.setValue(v);
      this.setOptElementActive(opt, true);
    }
    return this;
  }
  hasOption (opt: string): boolean {
    return this.options.has(opt);
  }
  addOption (opt: string, redraw: boolean = true): this {
    if (this.hasOption(opt)) return this;
    this.options.add(opt);
    if (redraw) this.redraw();
    return this;
  }
  addOptions (opts: string[], redraw: boolean = true): this {
    for (let v of opts) {
      this.addOption(v, false);
    }
    this.redraw();
    return this;
  }
  removeOption (opt: string, redraw: boolean = true): this {
    this.options.delete(opt);
    if (redraw) this.redraw();
    return this;
  }
  getSelectedValue (): string {
    return this.select.getAttr("selectedOptions")[0].value;
  }
  setSelectedValue (opt: string): this {
    if (!this.options.has(opt)) return this;

    for (let e of this.optElements) {
      if (e.getValue() == opt) {
        e.setAttr("selected", "true");
      } else {
        e.removeAttr("selected");
      }
    }

    return this;
  }
}
