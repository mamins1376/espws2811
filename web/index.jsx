const { h, Component, render } = preact;

let domain = window.location.href;
domain = domain.startsWith("file://") ? "http://192.168.1.9" : domain.match(/^.*\//);
console.log(domain);

class App extends Component {
  state = {
    happy: false
  };

  componentDidMount() {
    setTimeout(() => {
      this.setState({ happy: true });
    }, 1000);
  }

  render() {
    const mood = this.state.happy ? "good" : "bad";
    return <p>Have a supposedly {mood} day!</p>;
  }
}

render(<App />, document.body);
