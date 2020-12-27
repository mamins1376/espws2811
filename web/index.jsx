import "./style.scss";

import { h, render } from "preact";
import { useState, useEffect, useRef, useCallback } from "preact/hooks";
import { HexColorPicker } from "react-colorful";
import * as logger from "./logger";

const MESSAGE_SERVER_HELLO   = "H".charCodeAt(0);
const MESSAGE_SERVER_INVALID = "!".charCodeAt(0);

const MESSAGE_CLIENT_SET = "S".charCodeAt(0);

const main = () => {
  logger.debug("starting render");
  render(<App />, document.body);
  logger.debug("initial render done");
};

const App = () => {
  const [isOnline, setOnline] = useState(false);
  const [selectedLED, selectLED] = useState(0);
  const [LEDColors, setLEDColors] = useState([]);

  const socket = useSocket();

  useEffect(() => {
    logger.debug("registering message handler");

    const handleMsg = ({ data }) => {
      data = new Uint8Array(data);
      logger.debug("got data:", data);
      if (data[0] === MESSAGE_SERVER_HELLO) {
        const len = data[1];
        logger.debug(`SERVER: hello (${len})`);
        // validate frame
        if (len * 3 != data.length - 2)
          return logger.warning("invalid hello frame!");
        const colors = new Array(len);
        for (let i = 0; i < len;)
          colors[i] = "#" + Array.prototype.slice.call(data, 2+3*i, 2+3*(++i))
            .map(b => (b<16?"0":"")+b.toString(16)).reverse().join("");
        logger.debug("colors received:", colors);
        setOnline(true);
        setLEDColors(colors);
      } else if (data[0] === MESSAGE_SERVER_INVALID) {
      } else {
        logger.warning("unhandled message:", data);
      }
    };

    socket.current.addEventListener("message", handleMsg);
    return () => socket.current.removeEventListener("message", handleMsg);
  }, [setOnline, setLEDColors, socket]);

  const setLEDColor = useCallback(color => {
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
    socket.current.send(data.buffer);
  }, [selectedLED, LEDColors, socket]);

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

const useSocket = () => {
  const socket = useRef(null);
  const [failedAttempts, setFailedAttempts] = useState(0);

  useEffect(() => {
    if (socket.current)
      return logger.debug("socket already exists");

    let url = location.href.substr(7);
    if (url[0] == "/" || url.startsWith("localhost")) url = "192.168.1.9";
    url = "ws://" + (url + "/ws").replace("//","/");

    logger.debug("creating socket to", url);
    const ws = new WebSocket(url);
    ws.binaryType = "arraybuffer";

    const register = ws.addEventListener.bind(ws);
    register("open", e => {
      logger.debug("WS opened:", e);
      setFailedAttempts(0);
    });

    register("close", e => {
      socket.current = null;
      logger.warning("WS failed:", e.type);
      if (failedAttempts > 9) {
        logger.error("giving up on reconnect attempts");
      } else {
        const delay = (1 << failedAttempts) * 125;
        logger.info(`attempt #${failedAttempts + 1} to reconnect in`, delay / 1000, "seconds");
        setTimeout(() => setFailedAttempts(failedAttempts + 1), delay);
      }
    });

    register("message", e => logger.debug("WS message:", e));
    register("error", e => logger.warning("WS error:", e));
    socket.current = ws;
  }, [failedAttempts]);

  logger.debug("use socket:", socket.current);
  return socket;
};

main();
