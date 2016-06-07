import React from 'react';
let Tracker; if (!Package['tracker'])
  throw new Error('Tracker is required for Tracker.Component (add it with: `meteor add tracker`).');
else Tracker = Package['tracker'].Tracker;

Tracker.Component = class extends React.Component {
  constructor(props) {
    super(props);
    this.__subs = {}, this.__comps = []; this.__live = false;
    this.__subscribe = props && props.subscribe || Meteor.subscribe;
  }

  subscribe(name, ...options) {
    if (this.__subs[name) {
      this.__subs[name].stop()
      delete this.__subs[name]
    }
    return this.__subs[name] =
      this.__subscribe.apply(this, [name, ...options]);
  }

  autorun(fn) { this.__comps.push(Tracker.autorun(c => {
    this.__live = true; fn(); this.__live = false;
  }))}

  componentDidUpdate() { !this.__live && this.__comps.forEach(c => {
    c.invalidated = c.stopped = false; !c.invalidate();
  })}

  subscriptionsReady() {
    return !Object.keys(this.__subs).some(id => !this.__subs[id].ready());
  }

  setState(state) {
    if (!this._reactInternalInstance)
      return this.state = Object.assign({}, this.state, state);
    else
      return super.setState.apply(this, arguments);
  }

  componentWillUnmount() {
    Object.keys(this.__subs).forEach(sub => this.__subs[sub].stop());
    this.__comps.forEach(comp => comp.stop());
  }

  render() {
    let comp = this.props.children.map(Child => <Child {...this.state} />);
    return comp.length == 1 ? comp : <div>{comp}</div>;
  }
};

export default Tracker;
