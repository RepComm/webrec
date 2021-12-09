
import { Button, Panel, Text } from "@repcomm/exponent-ts";
import { LabelInput } from "./labelinput";
import { Select } from "./select";

export type SourceType = "Camera"|"Display"|"Microphone";
const SRC_TYPE_CAMERA: SourceType = "Camera";
const SRC_TYPE_DISPLAY: SourceType = "Display";
const SRC_TYPE_MICROPHONE: SourceType = "Microphone";

export interface SourceConfig {
  type: SourceType;
  display?: DisplayMediaStreamConstraints;
  camera?: MediaStreamConstraints;
  microphone?: MediaStreamConstraints;
}

export class SourcePanel extends Panel {
  title: Text;

  sType: Select;

  iAudio: LabelInput;
  iCamera: LabelInput;
  iDisplay: LabelInput;

  bShow: Button;
  bDone: Button;

  constructor () {
    super();

    this.bShow = new Button()
    .setTextContent("Add")
    .on("click", ()=>{
      this.show();
    })
    .setStyleItem("max-height", "2em");

    this.hide();

    this.addClasses("pSourceConfig");

    this.title = new Text()
    .setTextContent("Source Options")
    .mount(this);

    this.sType = new Select()
    .addOption(SRC_TYPE_CAMERA)
    .addOption(SRC_TYPE_DISPLAY)
    .addOption(SRC_TYPE_MICROPHONE)
    .mount(this)
    .redraw();

    this.iAudio = new LabelInput()
    .setTextContent("Audio")
    .setValue("false")
    .mount(this);
    this.iAudio.input.setType("checkbox");

    this.bDone = new Button()
    .setTextContent("Done")
    .mount(this)
    .on("click", ()=>{
      this.hide();
    });
  }

  show () {
    this.setStyleItem("display", "flex");
  }
  hide () {
    this.setStyleItem("display", "none");
  }

  getConfig (): SourceConfig {
    let result: SourceConfig = {
      type: this.sType.getSelectedValue() as SourceType,
    };

    switch (result.type) {
      case SRC_TYPE_CAMERA:
        result.camera = {
          audio: (this.iAudio.getValue() === "true"),
          video: true
        };
        break;
      case SRC_TYPE_DISPLAY:
        result.display = {
          audio: (this.iAudio.getValue() === "true"),
          video: true
        };
        break;
      case SRC_TYPE_MICROPHONE:
        result.microphone = {
          audio: true,
          video: false
        };
        break;
      default:
        throw `Unhandled selection type ${result.type}`;
        break;
    }
    return result;
  }
}
