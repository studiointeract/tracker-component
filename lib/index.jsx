import React from 'react';

Tracker.Component = class extends React.Component {
  constructor(props) {
    super(props);
    this.__subs = {}, this.__comps = [];
    this.__subscribe = props.subscribe || Meteor.subscribe;
    this.__running = false;
    this.__cacheTimeout = 20000; // ms
  }

  subscribe(name, ...options) {
    return this.__subs[JSON.stringify(arguments)] = this.__subscribe.apply(this, [name, ...options]);
  }

  autorun(fn) {
    return this.__comps.push(Tracker.autorun(c => {
      this.__running = true; fn(); this.__running = false;
    }));
  }

  subscriptionsReady() {
    return !Object.keys(this.__subs).some(id => !this.__subs[id].ready());
  }

  setState(state) {
    if (!this._reactInternalInstance) {
      return this.state = Object.assign({}, this.state, state);
    } else {
      return super.setState.apply(this, arguments);
    }
  }

  componentWillUnmount() {
    setTimeout(() => {
      this.__comps.forEach(comp => { comp.stop(); comp = null });
    }, this.__cacheTimeout);
  }

  componentWillUpdate() {
    if (!this.__running) {
      this.__comps.forEach(comp => !comp.invalidate());
    }
  }

  render() {
    let composition = this.props.children.map(Child => <Child {...this.state} />);
    return composition.length == 1 ? composition : <div>{composition}</div>;
  }
};

export default Tracker;
