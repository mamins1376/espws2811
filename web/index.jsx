import { h, Component, render } from "preact";
import * as logger from "./logger";

Promise.prototype.drive = function() {
  this.catch(error);
};

class App extends Component {
  state = {
    is_online: false
  };

  componentDidMount() {
    let url = location.href.substr(7);
    if (url[0] == "/")
      url = "192.168.1.9"
    url += "/ws"
    url = url.replace("//", "/")
    const ws = this.ws = new WebSocket("ws://"+url);
    ws.onopen = (...a) => this.wsOnOpen(...a).drive();
    ws.onclose = (...a) => this.wsOnClose(...a).drive();
    ws.onmessage = (...a) => this.wsOnMessage(...a).drive();
    ws.onerror = (...a) => this.wsOnError(...a).drive();
  }

  async wsOnOpen() {
    logger.info("ws connected");
  }

  async wsOnClose() {
    logger.info("ws closed");
  }

  async wsOnMessage() {
    logger.info("ws message");
  }

  async wsOnError() {
    logger.error("ws error: ");
  }

  render() {
    return <p>System is {this.state.is_online ? "Online" : "Offline"}</p>;
  }
}

render(<App />, document.body);
