import "./style.scss";

import { h, Component, render } from "preact";
import { HexColorPicker } from "react-colorful";
import * as logger from "./logger";

const MESSAGE_TYPE_INIT = "I";

class App extends Component {
  state = {
    isOnline: false,
    leds: [],
    selectedColor: null
  };

  componentDidMount() {
    let url = location.href.substr(7);
    if (url[0] == "/" || url.startsWith("[::1]"))
      url = "192.168.1.9"
    url += "/ws"
    url = url.replace("//", "/")
    const ws = this.ws = new WebSocket("ws://"+url);
    ws.onopen = (...a) => this.wsOnOpen(...a).drive();
    ws.onclose = (...a) => this.wsOnClose(...a).drive();
    ws.onmessage = (...a) => this.wsOnMessage(...a).drive();
    ws.onerror = (...a) => this.wsOnError(...a).drive();
  }

  async wsOnOpen(event) {
    logger.info("ws connected:", event);
  }

  async wsOnClose(event) {
    logger.info("ws closed", event);
  }

  async wsOnMessage({ data }) {
    logger.info("ws message", data);
    if (!data)
      return;
    const payload = data.substr(1);
    switch (data[0]) {
      case MESSAGE_TYPE_INIT:
        const numLeds = parseInt(payload);
        if (!isNaN(numLeds))
          this.setState({
            leds: new Array(numLeds).fill("000000"),
            isOnline: true
          });
        break;
    }
  }

  async wsOnError(event) {
    logger.error("ws error: ", event);
  }

  selectColor(event) {
    console.log(event);
    this.setState({ selectedColor: "444" });
  }

  render = (_props, { isOnline, leds, selectedColor }) =>
    <div>
      <p>System is O{isOnline ? "n" : "ff"}line</p>
      <div className="leds">{
        leds.map(c => <div style={"background:#"+c} />)
      }</div>
      <HexColorPicker color={selectedColor} onChange={this.selectColor} />
    </div>;
}

render(<App />, document.body);
