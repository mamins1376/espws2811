import "./style.scss";

import { h, render } from "preact";
import { useState, useEffect } from "preact/hooks";
import { HexColorPicker } from "react-colorful";
import * as logger from "./logger";

const MESSAGE_SERVER_HELLO = "H".charCodeAt(0);

const MESSAGE_CLIENT_SET   = "S".charCodeAt(0);

const main = () => {
  logger.debug("starting render");
  render(<App socket={getSocket()} />, document.body);
  logger.debug("initial render done");
};

const getSocket = () => {
  let url = location.href.substr(7);
  if (url[0] == "/" || url.startsWith("localhost")) url = "192.168.1.9";
  url = "ws://" + (url + "/ws").replace("//","/");
  logger.debug("creating socket to", url);

  const socket = new WebSocket(url);
  socket.binaryType = "arraybuffer";
  socket.addEventListener("open", e => logger.debug("WS opened:", e));
  socket.addEventListener("message", e => logger.debug("WS message:", e));
  socket.addEventListener("error", e => logger.error("WS errored:", e));
  socket.addEventListener("close", e => logger.debug("WS closed:", e));

  return socket;
};

const App = ({ socket }) => {
  const [isOnline, setOnline] = useState(false);
  const [selectedLED, selectLED] = useState(0);
  const [LEDColors, setLEDColors] = useState([]);

  useEffect(() => {
    logger.debug("registering message handler");

    const handleMsg = ({ data }) => {
      data = new Uint8Array(data);
      logger.debug("got data:", data);
      if (data[0] === MESSAGE_SERVER_HELLO) {
        logger.debug("SERVER: hello");
        setOnline(true);
        setLEDColors(new Array(data[1]).fill(undefined));
      } else {
        logger.warning("unhandled message:", data);
      }
    };

    socket.addEventListener("message", handleMsg);
    return () => socket.removeEventListener("message", handleMsg);
  }, [setOnline, setLEDColors, socket]);

  const setLEDColor = color => {
    logger.debug("set led color:", color);

    const ledColors = LEDColors.slice();
    ledColors[selectedLED] = color;
    setLEDColors(ledColors);

    const data = new Uint8Array(5);
    color = parseInt(color.slice(1), 16);
    data[0] = MESSAGE_CLIENT_SET;
    data[1] = selectedLED;
    data[2] = (color >>  0) & 0xFF;
    data[3] = (color >>  8) & 0xFF;
    data[4] = (color >> 16) & 0xFF;
    socket.send(data.buffer);
  };

  logger.debug("rendering app");

  return (
    <div>
      <p>System is O{isOnline ? "n" : "ff"}line</p>
      <div className="leds">
        { LEDColors.map((c, i) => (
          <button onClick={() => selectLED(i)} style={{ backgroundColor: c ?? "black" }}
            className={ i === selectedLED ? "active" : "" } />
        )) }
      </div>
      <HexColorPicker color={LEDColors[selectedLED]} onChange={setLEDColor} />
    </div>
  );
};

main();
