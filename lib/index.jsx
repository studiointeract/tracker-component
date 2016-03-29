import React from 'react';
import Match from 'mtr-match';
import EJSON from 'ejson';

// We can't import Tracker from NPM, this is how you get a hold of it.
let Tracker = null;
if (!Package['tracker']) {
  const error =
    'Tracker is required for Tracker.Component (add it with: `meteor add tracker`).';
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
    this.__subscribe = props.subscribe || Meteor.subscribe;
    this.__allSubsReadyDep = new Tracker.Dependency();
    this.__allSubsReady = false;
    this.__props = props;
    this.__propsDep = new Tracker.Dependency();
  }

  /**
   * @summary A version of [Meteor.subscribe](#meteor_subscribe) that is stopped
   * when the template is destroyed.
   * @return {SubscriptionHandle} The subscription handle to the newly made
   * subscription. Call `handle.stop()` to manually stop the subscription, or
   * `handle.ready()` to find out if this particular subscription has loaded all
   * of its inital data.
   * @locus Client
   * @param {String} name Name of the subscription.  Matches the name of the
   * server's `publish()` call.
   * @param {Any} [arg1,arg2...] Optional arguments passed to publisher function
   * on server.
   * @param {Function|Object} [options] If a function is passed instead of an
   * object, it is interpreted as an `onReady` callback.
   * @param {Function} [options.onReady] Passed to [`Meteor.subscribe`](#meteor_subscribe).
   * @param {Function} [options.onStop] Passed to [`Meteor.subscribe`](#meteor_subscribe).
   * @param {DDP.Connection} [options.connection] The connection on which to make the
   * subscription.
   */
  subscribe(name, ...args) {
    // let handle = this.__subscribe.apply(this, args);
    // return this.__subs[handle] = handle;
    let subHandles = this.__subs;

    // If subscription already exists with these params, do nothing.
    if (Object.keys(subHandles).some(key => subHandles[key].name === name
        && EJSON.equals(subHandles[key].params, args))) {
      return;
    }

    // Duplicate logic from Meteor.subscribe
    let callbacks = {};
    if (args.length) {
      let lastParam = args[args.length - 1];

      if (typeof lastParam == 'function') {
        callbacks.onReady = args.pop();
      }
      else if (lastParam && (typeof lastParam.onReady === 'function' || typeof lastParam.onStop === 'function')) {
        callbacks = args.pop();
      }
    }

    let subHandle;
    let oldStopped = callbacks.onStop;
    callbacks.onStop = (error) => {
      // When the subscription is stopped, remove it from the set of tracked
      // subscriptions to avoid this list growing without bound
      delete subHandles[subHandle.subscriptionId];

      // Removing a subscription can only change the result of subscriptionsReady
      // if we are not ready (that subscription could be the one blocking us being
      // ready).
      if (! this.__allSubsReady) {
        this.__allSubsReadyDep.changed();
      }

      if (oldStopped) {
        oldStopped(error);
      }
    };

    // Component#subscribe takes the connection as one of the options in the last
    // argument
    subHandle = this.__subscribe.apply(this, [name, ...args, callbacks]);

    if (! subHandles[subHandle.subscriptionId]) {
      subHandles[subHandle.subscriptionId] = {
        name: name,
        params: args,
        handle: subHandle
      };

      // Adding a new subscription will always cause us to transition from ready
      // to not ready, but if we are already not ready then this can't make us
      // ready.
      if (this.__allSubsReady) {
        this.__allSubsReadyDep.changed();
      }
    }

    return subHandle;
  }

  /**
   * @summary A version of [Tracker.autorun](#tracker_autorun) that is stopped when the template is destroyed.
   * @locus Client
   * @param {Function} runFunc The function to run. It receives one argument: a Tracker.Computation object.
   */
  autorun(fn) {
    let comp = Tracker.autorun(fn);
    this.__comps.push(comp);
    return comp;
  }

  /**
   * @summary A reactive function that returns true when all of the subscriptions
   * called with [this.subscribe](#Tracker.Component-subscribe) are ready.
   * @return {Boolean} True if all subscriptions on this template instance are
   * ready.
   */
  subscriptionsReady() {
    this.__allSubsReadyDep.depend();

    this.__allSubsReady = Object.keys(this.__subs).every(sub => this.__subs[sub].handle.ready());

    return this.__allSubsReady;
  }

  set props(value) {
    this.__props = value;
  }

  get props() {
    this.__propsDep.depend();
    return this.__props;
  }

  setState(state) {
    if (!this._reactInternalInstance) {
      return this.state = Object.assign({}, this.state, state);
    }
    else {
      return super.setState.apply(this, arguments);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (!_.isEqual(nextProps, this.props)) {
      this.__props = nextProps;
      this.__propsDep.changed();
    }
  }

  componentWillUnmount() {
    Object.keys(this.__subs).forEach(sub => this.__subs[sub].handle.stop());
    this.__comps.forEach(comp => comp.stop());
  }
};

export default Tracker;
