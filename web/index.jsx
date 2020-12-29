import "./style.scss";

import { h, render } from "preact";
import { useState, useEffect } from "preact/hooks";
import { HexColorPicker } from "react-colorful";
import * as logger from "./logger";

const MESSAGE_SERVER_HELLO   = "H".charCodeAt(0);
const MESSAGE_SERVER_INVALID = "!".charCodeAt(0);

const MESSAGE_CLIENT_SET = "S".charCodeAt(0);

render(<App />, document.body);

function App() {
  logger.debug("App called");

  const socket = useSocket();
  const [isOnline, setIsOnline] = useState(false);
  const [LEDColors, setLEDColors] = useState([]);
  const [selectedLED, setSelectedLED] = useState(0);

  useEffect(() => {
    const events = ["open", "close"];
    const updateIsOnline = ({ type }) => setIsOnline(type === events[0]);
    events.forEach(e => socket.addEventListener(e, updateIsOnline));
    return () => events.forEach(e => socket.removeEventListener(e, updateIsOnline));
  }, [socket]);

  useEffect(() => {
    function onMessage({ data }) {
      data = new Uint8Array(data);
      logger.debug("got data:", data);
      if (data[0] === MESSAGE_SERVER_HELLO)
        setLEDColors(decodeLEDColors(data.slice(1)));
      else if (data[0] === MESSAGE_SERVER_INVALID)
        logger.info("server said we send an invalid message");
      else
        logger.warning("unhandled message:", data);
    }

    const event = "message";
    socket.addEventListener(event, onMessage);
    return () => socket.removeEventListener(event, onMessage);
  }, [socket]);

  function modifyLEDColor(color) {
    logger.debug("modify led color:", color);

    const ledColors = LEDColors.slice();
    ledColors[selectedLED] = color;
    setLEDColors(ledColors);
    socket.send(encodeLEDColor(selectedLED, color));
  }

  return (
    <div>
      <p>System is O{isOnline ? "n" : "ff"}line</p>
      <div className="leds">
        { LEDColors.map((c, i) => (
          <button onClick={() => setSelectedLED(i)} style={{ backgroundColor: c }}
            className={ i === selectedLED ? "active" : "" } />
        )) }
      </div>
      <HexColorPicker color={LEDColors[selectedLED]} onChange={modifyLEDColor} />
    </div>
  );
}

function useSocket() {
  const maxAttempts = 9;
  const [attempts, setAttempts] = useState(0);
  let [socket, setSocket] = useState(null);

  if (!socket) {
    let url = location.href.substr(7);
    if (url[0] == "/" || url.startsWith("localhost"))
      url = "192.168.1.9";
    url = "ws://" + (url + "/ws").replace("//","/");

    logger.debug("creating socket to", url);
    socket = new WebSocket(url);
    socket.binaryType = "arraybuffer";

    socket.addEventListener("open", () => setAttempts(0));
    socket.addEventListener("close", () => {
      if (attempts > maxAttempts) {
        logger.warning("could not connect after multiple tries, giving up");
      } else {
        const delay = (1 << attempts) * 125;
        logger.info(`connection closed, retrying after ${delay/1000} seconds`);
        setTimeout(() => setSocket(null), delay);
      }
      setAttempts(attempts + 1);
    });

    setSocket(socket);
  }

  return socket;
}

function decodeLEDColors(data) {
  const len = data[0];
  data = data.slice(1);
  logger.debug(`SERVER: hello (${len})`);
  if (len * 3 != data.length)
    return logger.warning("invalid hello frame!");
  const colors = new Array(len);
  for (let i = 0; i < len;)
    colors[i] = "#" + Array.prototype.slice.call(data, 3*i, 3*(++i))
      .map(b => (b<16?"0":"")+b.toString(16)).reverse().join("");
  logger.debug("colors received:", colors);
  return colors;
}

function encodeLEDColor(index, color) {
  const data = new Uint8Array(5);
  color = parseInt(color.slice(1), 16);
  data[0] = MESSAGE_CLIENT_SET;
  data[1] = index;
  data[2] = (color >>  0) & 0xFF;
  data[3] = (color >>  8) & 0xFF;
  data[4] = (color >> 16) & 0xFF;
  return data.buffer;
}
