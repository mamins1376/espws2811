const { h, Component, render } = preact;

let domain = window.location.href;
domain = domain.startsWith("file:") ? "http://192.168.1.9" : domain.match(/(^.*)\//)[1];

Promise.prototype.drive = function() { this.catch(console.error.bind(console)) };

class App extends Component {
  state = {
    numLeds: null
  };

  componentDidMount() {
    this.checkEsp().drive();
  }

  async checkEsp() {
    const res = await fetch(`${domain}/ws2811`);
    const text = await res.text();
    const numLeds = parseInt(text);
    if (!isNaN(numLeds))
      this.setState({ numLeds });
  }

  render() {
    const is_online = this.state.numLeds !== null;
    return <p>System is {is_online ? "Online" : "Offline"}</p>;
  }
}

render(<App />, document.body);
