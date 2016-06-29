import React from 'react';
let Tracker; if (!Package['tracker'])
  throw new Error('Tracker is required for Tracker.Component (add it with: `meteor add tracker`).');
else Tracker = Package['tracker'].Tracker;

Tracker.Component = class extends React.Component {
  constructor(props) {
    super(props);
    this.__subs = {}, this.__comps = {}; this.__allcomps = []; this.__live = false;
    this.__subscribe = props && props.subscribe || Meteor.subscribe;
  }

  subscribe(name, ...options) {
    return this.__subs[JSON.stringify(arguments)] =
      this.__subscribe.apply(this, [name, ...options]);
  }

  autorun(fn) {
    this.__stateKeys = [];
    let c = Tracker.autorun(c => {
      this.__live = true; fn(c); this.__live = false;
    })
    this.__allcomps.push(c);
    this.__stateKeys.forEach(stateKey => {
      this.__comps[stateKey] = [...this.__comps[stateKey],c];
    });

    this.__stateKeys = null;
  }

  getState(stateKey) {
    this.__stateKeys.push(stateKey);
    return this.state[stateKey];
  }

  componentDidUpdate(prevProps) {
    // Always invalidate when props are changed
    // Assuming that the reference will change when the props change!
    if (prevProps!==this.props) {
      this.__allcomps.forEach(c => {
        c.invalidate();
      });
    }
  }

  subscriptionsReady() {
    return !Object.keys(this.__subs).some(id => !this.__subs[id].ready());
  }

  setState(state) {
    Object.keys(state).forEach((stateKey) =>
      this.__comps[stateKey] && this.__comps[stateKey]
        .forEach(c => c.invalidate())
    );

    if (!this._reactInternalInstance) {
      return this.state = Object.assign({}, this.state, state);
    } else {
      return super.setState.apply(this, arguments);
    }
  }

  componentWillUnmount() {
    Object.keys(this.__subs).forEach(sub => this.__subs[sub].stop());
    Object.keys(this.__comps).forEach(stateKey =>
      this.__comps[stateKey] && this.__comps[stateKey]
        .forEach(c => c.stop()));
  }

  render() {
    const { children } = this.props;
    const comp = (children instanceof Array ? children : [children]).map(c => React.cloneElement(c, this.state));
    return comp.length == 1 ? comp[0] : <div>{comp}</div>;
  }
};

export default Tracker;
