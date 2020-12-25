import { h, Component, render } from "preact/src/index.js";

const LOGLEVEL_DISABLED = -1;
const LOGLEVEL_FATAL = 0;
const LOGLEVEL_ERROR = 1;
const LOGLEVEL_WARNING = 2;
const LOGLEVEL_INFO = 3;
const LOGLEVEL_DEBUG = 4;
const LOGLEVEL = LOGLEVEL_DEBUG;

function fatal(...a) {
  if (LOGLEVEL >= LOGLEVEL_FATAL)
    console.error("[FATAL]: ", ...a);
}

function error(...a) {
  if (LOGLEVEL >= LOGLEVEL_ERROR)
    console.error("[ERROR]: ", ...a);
}

function warning(...a) {
  if (LOGLEVEL >= LOGLEVEL_ERROR)
    console.warn("[WARNING]: ", ...a);
}

function info(...a) {
  if (LOGLEVEL >= LOGLEVEL_INFO)
  console.log("[INFO]:", ...a);
}

function debug(...a) {
  if (LOGLEVEL >= LOGLEVEL_DEBUG)
  console.log("[DEBUG]:", ...a);
}

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
    ws.onmessage = (...a) => this.wsOnMessage(...a).drive();
  }

  async wsOnOpen() {
    info("ws connected");
  }

  async wsOnClose() {
    info("ws closed");
  }

  async wsOnMessage() {
    info("ws message");
  }

  async wsOnError() {
    error("ws error: ");
  }

  render() {
    return <p>System is {this.state.is_online ? "Online" : "Offline"}</p>;
  }
}

render(<App />, document.body);
