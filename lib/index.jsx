import React from 'react';

// We can't import Tracker from NPM, this is how you get a hold of it.
let Tracker = null;
if (!Package['tracker']) {
  const error =
    'Tracker is required for Tracker.Component.';
  throw new Error(error);
}
else {
  Tracker = Package['tracker'].Tracker;
}

Tracker.Component = class extends React.Component {
  constructor(props) {
    super(props);
    this.__subs = {};
    this.__comps = [];
    this.__funcs = [];
    this._subscribe = props.subscribe || Meteor.subscribe;
  }

  subscribe(publicationName, ...options) {
    this.__subs[publicationName]
      = this._subscribe.apply(this, [publicationName, ...options]);
  }

  autorun(fn) {
    let comp = Tracker.autorun(fn);
    this.__comps.push(comp);
    return comp;
  }

  subscriptionsReady() {
    return !Object.keys(this.__subs).some(sub => !this.__subs[sub].ready());
  }

  setState(state) {
    if (!this._reactInternalInstance) {
      return this.state = Object.assign({}, this.state, state);
    }
    else {
      return super.setState.apply(this, arguments);
    }
  }

  componentWillUpdate(nextProps, nextState) {
    if (!_.isEqual(nextProps, this.props) || !_.isEqual(nextState, this.state)) {
      this.__comps.forEach((comp, i) => {
        if (!comp.invalidated) {
          comp.invalidate();
        }
      });
    }
  }

  componentWillUnmount() {
    setTimeout(() => {
      Object.keys(this.__subs).forEach(sub => this.__subs[sub].stop());
      this.__comps.forEach(comp => comp.stop());
    }, 20000);
  }
};

export default Tracker;
