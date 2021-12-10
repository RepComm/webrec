
import {
  Button,
  Exponent,
  EXPONENT_CSS_BODY_STYLES,
  EXPONENT_CSS_STYLES,
  Panel,
  Text
} from "@repcomm/exponent-ts";
import { Compositor } from "./components/Compositor";
import { SourcePanel } from "./components/sourcepanel";

EXPONENT_CSS_BODY_STYLES.mount(document.head);
EXPONENT_CSS_STYLES.mount(document.head);

async function getDisplay(constraints?: DisplayMediaStreamConstraints): Promise<MediaStream> {
  return await navigator.mediaDevices.getDisplayMedia(constraints);
}

async function getCamera(constraints: MediaStreamConstraints): Promise<MediaStream> {
  return await navigator.mediaDevices.getUserMedia(constraints);
}

async function getMicrophone(constraints: MediaStreamConstraints): Promise<MediaStream> {
  constraints.video = false;
  return await navigator.mediaDevices.getUserMedia(constraints);
}

async function main() {
  const container = new Panel()
    .setId("container")
    .mount(document.body);

  const left = new Panel()
    .setId("left")
    .mount(container);

  const center = new Panel()
    .setId("center")
    .mount(container);

  const right = new Panel()
    .setId("right")
    .mount(container);

  const pScene = new Panel()
    .setId("scene")
    .mount(left);

  const compositor = new Compositor()
    .setId("compositor")
    .mount(center);

  // const video = new Exponent()
  //   .make("video")
  //   .applyRootClasses()
  //   .setId("video")
  //   .mount(center);

  const pAddSource = new SourcePanel()
    .mount(container);

  pAddSource.bShow.mount(pScene);
  pAddSource.bDone.on("click", async () => {
    let cfg = pAddSource.getConfig();
    
    // let v = video.element as HTMLVideoElement;
    switch (cfg.type) {
      case "Microphone":
        let streamMic = await getMicrophone(cfg.microphone);

        //TODO - add functionality for compositing the audio with webaudio api

        // v.srcObject = streamMic;
        break;
      case "Display":
        let streamDisplay = await getDisplay(cfg.display);
        compositor.createSource(streamDisplay);

        // v.srcObject = streamDisplay;
        break;
      case "Camera":
        let streamCamera = await getCamera(cfg.camera);

        compositor.createSource(streamCamera);

        // v.srcObject = streamCamera;
        break;
    }
    // video.on("loadedmetadata", (e) => {
    //   v.play();
    // });
    
    compositor.start();
  });

}

main();
