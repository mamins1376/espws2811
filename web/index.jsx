import "./style.scss";

import { h, render } from "preact";
import { useState, useRef } from "preact/hooks";
import { HexColorPicker } from "react-colorful";
import * as logger from "./logger";

var socket;
(() => {
  let url = location.href.substr(7);
  if (url[0] == "/" || url.startsWith("[::1]")) url = "192.168.1.9";
  socket = new WebSocket("ws://" + (url + "/ws").replace("//","/"));

  socket.onopen = e => logger.debug("WS opened:", e);
  socket.onclose = e => logger.debug("WS closed:", e);
  socket.onerror = e => logger.error("WS errored:", e);
});

render(<App />, document.body);

function App() {
  const [isOnline, setOnline] = useState(false);
  const [selectedColor, selectColor] = useState("#000000");
  const LEDs = useRef([]);

  const MESSAGE_TYPE_INIT = "I";

  socket.onmessage = ({ data }) => {
    logger.info("ws message", data);
    if (!data)
      return;
    const payload = data.substr(1);
    switch (data[0]) {
      case MESSAGE_TYPE_INIT:
        const numLeds = parseInt(payload);
        if (!isNaN(numLeds)) {
          setOnline(true);
          LEDs.current = new Array(numLeds).fill("#000000");
        }
        break;
    }
  }

  logger.debug("rendering app");

  return (
    <div>
      <p>System is O{isOnline ? "n" : "ff"}line</p>
      <div className="leds">{
        LEDs.current.map(c => <div style={{ backgroundColor: c }} />)
      }</div>
      <HexColorPicker color={selectedColor} onChange={selectColor} />
    </div>
  );
}
