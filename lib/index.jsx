import React from 'react';

let Tracker = null;
if (!Package['tracker']) {
  throw new Error('Tracker is required for Tracker.Component (add it with: `meteor add tracker`).');
} else {
  Tracker = Package['tracker'].Tracker;
}

Tracker.Component = class extends React.Component {
  constructor(props) {
    super(props);
    this.__subs = [], this.__comps = [];
    this.__subscribe = props.subscribe || Meteor.subscribe;
    this.__running = false;
  }

  subscribe(name, ...options) {
    return this.__subs.push(this.__subscribe.apply(this, [name, ...options]));
  }

  autorun(fn) {
    return this.__comps.push(Tracker.autorun(() => {
      this.__running = true; fn(); this.__running = false;
    }));
  }

  subscriptionsReady() {
    return !this.__subs.some(sub => !sub.ready());
  }

  setState(state) {
    if (!this._reactInternalInstance) {
      return this.state = Object.assign({}, this.state, state);
    } else {
      return super.setState.apply(this, arguments);
    }
  }

  componentWillUpdate() {
    !this.__running && this.__comps.forEach(comp => !comp.invalidate());
  }

  componentWillUnmount() {
    this.__subs.forEach(sub => sub.stop());
    this.__comps.forEach(comp => comp.stop());
  }

  render() {
    let composition = this.props.children.map(Child => <Child {...this.state} />);
    return composition.length == 1 ? composition : <div>{composition}</div>;
  }
};

export default Tracker;
