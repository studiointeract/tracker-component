# Tracker.Component

Current version 1.3.11

## Features

1. **Easy to use**, manages Tracker for you using autorun, and your subscriptions using the subscribe method, you don't have to manually setup the reactivity bindings or start/stop subscriptions, we promise!
2. **Server Side Rendering** supported (with data trough FlowRouter SSR).
3. **Lightweight** implementation, just see the implementation in `./lib/tracker-component.jsx`, there's no magic going on behind the scenes, only **50 lines of code**.

**Tracker.Component** is an improvement to what other methods offer ([see comparison](#comparison)). Using Tracker.Component you are no longer required to "freeze" all your reactivity in a single method or composition. You set the state from the reactive data sources (e.g: `collection.find().fetch()` or `Session.get('foo')` in `this.autorun`, which is also reactive to changes in `this.props` or `this.state`. Have fun!

## Installation

> [Go to using with Meteor 1.2](#using-trackercomponent-meteor-12)

`npm i --save tracker-component`

# Using Tracker.Component

`meteor create myapp --release METEOR@1.3`

In this example we render a couple cars from MongoDB.

> You'll probably recognize the autorun and subscribe from Blaze's Tracker implementation. That's the core idea, simplicity.

`npm i --save react react-dom`

```javascript
// main.jsx

import React from 'react';
import Tracker from 'tracker-component';

Models = new Mongo.Collection('models');
if (Meteor.isServer) {
  Meteor.publish('cars', () =>Models.find());
}

class Cars extends Tracker.Component {
  constructor(props) {
    super(props);
    this.subscribe('cars');
    this.autorun(() => {
      this.setState({
        cars: Models.find().fetch()
      });
    })
  }

  render() {
    let {cars = []} = this.state;
    return (
      <ul className="cars">
        {cars.map(car =>
          <li className="car">{car.brand} {car.model}</li>
        )}
      </ul>
    );
  }
}

if (Meteor.isClient) {
  Meteor.startup(() => {
    ReactDOM.render(React.createElement(Cars), document.body);
  });
}

```

## Fill with data from the server.

> Try adding new car models while running meteor, you'll notice it is fully reactive throughout the whole stack.

```javascript

// Bootstrap database with some cars.
Meteor.startup(function() {
  let models = {
    "Volvo": ['XC90', 'V90', 'V70'],
    "Tesla": ['Model S', 'Model X', 'Model 3', 'Roadster'],
    "DeLorean": ["DMC-12"]
  };

  Object.keys(models).forEach(brand => {
    models[brand].forEach(model => {
      car = { brand: brand, model: model };
      Models.upsert(car, car);
    });
  });
});

Meteor.publish('brand', (brand) => {
  // Simulate network latency to show the loader.
  // Meteor._sleepForMs(2000);
  if (brand) {
    return Models.find({ brand: brand });
  }
  return Models.find();
});

```

### Result on the client:

```html

<ul class="cars">
  <li>Volvo XC90</li>
  <li>Volvo V90</li>
  <li>Volvo V70</li>
  <li>Tesla Model S</li>
  <li>Tesla Model X</li>
  <li>Tesla Model 3</li>
  <li>Tesla Roadster</li>
  <li>DeLorean DMC-12</li>
</ul>

```

## Add Server Side Rendering

`meteor add kadira:flow-router-ssr`  
`npm i --save react-mounter` (for React 0.14.7)
`npm i --save react-mount-layout@^15.x` (for React 15.x, will replace with *react-mounter* when supporting 15.x)

```javascript

import React from 'react';
import { FlowRouter } from 'meteor/kadira:flow-router-ssr';
import './Cars.jsx';

const MainLayout = ({content}) => (
  <main>{content}</main>
);

FlowRouter.route("/", {
  action() {
    ReactLayout.render(MainLayout, {
      content: <Cars />
    });
  }
});

```

### Result on the server:

```html

<ul class="cars">
  <li>Volvo XC90</li>
  <li>Volvo V90</li>
  <li>Volvo V70</li>
  <li>Tesla Model S</li>
  <li>Tesla Model X</li>
  <li>Tesla Model 3</li>
  <li>Tesla Roadster</li>
  <li>DeLorean DMC-12</li>
</ul>

```

## Full example: What about adding a loading gif?

[http://github.com/studiointeract/tracker-component-example](http://github.com/studiointeract/tracker-component-example)

We got you're back on this one too! And have a look below, we've also added a select button to switch between selected car brand.

Just add `this.subscriptionsReady()` to your autorun like below and you will get a reactive boolean to use for a ready flag.

Notice! We advice in using "ready" flag rather "loading" due to that the data will default be ready when rendered on the server. The reason is basically to avoid having React complaining about different markup on server and client, which would happen when using the loading pattern.

```javascript
// Cars.jsx

Models = new Mongo.Collection('models');

Cars = class Cars extends Tracker.Component {
  constructor(props) {
    super(props);
    this.state = {
      brand: this.props.brand
    };
    this.autorun(() => {
      this.subscribe( 'brand', this.state.brand );
    });
    this.autorun(() => {
      this.setState({
        ready: this.subscriptionsReady(),
        cars: Models.find({ brand: this.state.brand }).fetch()
      });
    });
  }

  handleChange() {
    this.setState({brand: this.refs.brand.value});
  }

  render() {
    let {cars = []} = this.state;
    let selectBrand = this.handleChange.bind(this);
    let brands = ["Volvo", "Tesla", "DeLorean"];

    return (
      <div>
        <select ref="brand" onChange={selectBrand} defaultValue={this.state.selected}>
          {brands.map((brand, i) =>
            <option value={brand} key={i}>{brand}</option>
          )}
        </select>
        <ul className={["cars",
          this.state.ready ? "ready" : ""].join(' ')}>
          {cars.map((car, i) =>
            <li className="car" key={i}>{car.brand} {car.model}</li>
          )}
        </ul>
      </div>
    );
  }
}
Cars.propTypes = {
  brand: React.PropTypes.string
};
Cars.defaultProps = { brand: 'Volvo' };

```

Here's an example on some CSS to show a loading icon when we're waiting for the cars to arrive to the client. We have also added a transition with a delay that we reset when the class ready is set, this is to avoid flashing the icon when the data is really fast, which is usually the case.

Add `Meteor._sleepForMs(2000);` in the publication to get view of the beautiful loading icon.

```css

.cars:before {
  content: '';
  display: block;
  position: absolute;
  top: 16px;
  left: 0;
  width: 100%;
  height: 20px;
  background: url("/loader.gif") no-repeat center center;
  background-size: auto 20px;
  transition: opacity 0.1s ease 1s;
  opacity: 1;
}
.cars.ready:before {
  opacity: 0;
  transition: none;
}

```

# Using Tracker.Component (Meteor 1.2)

## Installation

`meteor add studiointeract:tracker-component@1.2.1`

In this example we render a couple cars from MongoDB.

> You'll probably recognize the autorun and subscribe from Blaze's Tracker implementation. That's the core idea, simplicity.

```javascript
Models = new Mongo.Collection('models');

Cars = class Cars extends Tracker.Component {
  constructor(props) {
    super(props);
    this.autorun(() => {
      this.setState({
        cars: Models.find().fetch()
      });
    })
  }

  render() {
    let {cars = []} = this.state;
    return (
      <ul className="cars">
        {cars.map(car =>
          <li className="car">{car.brand} {car.model}</li>
        )}
      </ul>
    );
  }
}

if (Meteor.isClient) {
  Meteor.startup(() => {
    ReactDOM.render(React.createElement(Cars), document.body);
  });
}

```

## Fill with data from the server.

> Try adding new car models while running meteor, you'll notice it is fully reactive throughout the whole stack.

```javascript
// Bootstrap database with some cars.
Meteor.startup(function() {
  let models = {
    "Volvo": ['XC90', 'V90', 'V70'],
    "Tesla": ['Model S', 'Model X', 'Model 3', 'Roadster'],
    "DeLorean": ["DMC-12"]
  };

  Object.keys(models).forEach(brand => {
    models[brand].forEach(model => {
      car = { brand: brand, model: model };
      Models.upsert(car, car);
    });
  });
});

// Publish cars by brand or all of them.
Meteor.publish('brand', (brand) => {
  // Simulate network latency to show the loader.
  // Meteor._sleepForMs(2000);
  if (brand) {
    return Models.find({ brand: brand });
  }
  return Models.find();
});

```

### Result on the client:

```html

<ul class="cars">
  <li>Volvo XC90</li>
  <li>Volvo V90</li>
  <li>Volvo V70</li>
  <li>Tesla Model S</li>
  <li>Tesla Model X</li>
  <li>Tesla Model 3</li>
  <li>Tesla Roadster</li>
  <li>DeLorean DMC-12</li>
</ul>

```

## Add Server Side Rendering

`meteor add kadira:flow-router-ssr`  
`meteor add kadira:react-layout`

```javascript
// router.jsx

const MainLayout = ({content}) => (
  <main>{content}</main>
);

FlowRouter.route("/", {
  action() {
    ReactLayout.render(MainLayout, {
      content: <Cars />
    });
  }
});

```

### Result on the server:

```html

<ul class="cars">
  <li>Volvo XC90</li>
  <li>Volvo V90</li>
  <li>Volvo V70</li>
  <li>Tesla Model S</li>
  <li>Tesla Model X</li>
  <li>Tesla Model 3</li>
  <li>Tesla Roadster</li>
  <li>DeLorean DMC-12</li>
</ul>

```

## Full example: What about adding a loading gif?

[http://github.com/studiointeract/tracker-component-example](http://github.com/studiointeract/tracker-component-example)

We got you're back on this one too! And have a look below, we've also added a select button to switch between selected car brand.

Just add `this.subscriptionsReady()` to your autorun like below and you will get a reactive boolean to use for a ready flag.

Notice! We advice in using "ready" flag rather "loading" due to that the data will default be ready when rendered on the server. The reason is basically to avoid having React complaining about different markup on server and client, which would happen when using the loading pattern.

```javascript

Models = new Mongo.Collection('models');

Cars = class Cars extends Tracker.Component {
  constructor(props) {
    super(props);
    this.state = {
      brand: this.props.brand
    };
    this.autorun(() => {
      this.subscribe( 'models', this.state.brand );
    });
    this.autorun(() => {
      this.setState({
        ready: this.subscriptionsReady(),
        cars: Models.find({ brand: this.state.brand }).fetch()
      });
    });
  }

  handleChange() {
    this.setState({brand: this.refs.brand.value});
  }

  render() {
    let {cars = []} = this.state;
    let selectBrand = this.handleChange.bind(this);
    let brands = ["Volvo", "Tesla", "DeLorean"];

    return (
      <div>
        <select ref="brand" onChange={selectBrand} defaultValue={this.state.selected}>
          {brands.map((brand, i) =>
            <option value={brand} key={i}>{brand}</option>
          )}
        </select>
        <ul className={["cars",
          this.state.ready ? "ready" : ""].join(' ')}>
          {cars.map((car, i) =>
            <li className="car" key={i}>{car.brand} {car.model}</li>
          )}
        </ul>
      </div>
    );
  }
}
Cars.propTypes = {
  brand: React.PropTypes.string
};
Cars.defaultProps = { brand: 'Volvo' };

```

## Comparison

|                | Tracker.Component  | [TrackerReact](https://github.com/ultimatejs/tracker-react) | [ReactMeteorData](https://github.com/meteor/react-packages/tree/devel/packages/react-meteor-data)   | [react-komposer](https://github.com/kadirahq/react-komposer#using-with-meteor)                      |
|:-------------- |:------------------:|:-----------------:|:----------------:|:--------------------:|
| Lines of code  | 50                 | 148               | 200              | 292                  |
| ES6 Class      | Yes                | -                 | -                | -                    |
| Composition    | -                  | Yes               | createContainer  | Yes                  |
| Mixin          | -                  | -                 | Yes              | -                    |
| [Subscriptions](#subscriptions) | this.subscribe | -    | -                | -                    |
| [SSR](#server-side-rendering) | Yes | Partial           | Partial          | Partial              |
| Reactivity     | this.autorun       | render            | getMeteorData    | composeWithTracker   |
| NPM            | Yes                | -                 | -                | Yes                  |

## Server Side Rendering

To get the server to render your component with prefilled data, you will need to have that data with known methods (ReactMeteorData, createContainer and TrackerReact) to manually load specific for the server, this method can potentially render more data then the client expected from a subscription and React will definitely complain when the client version takes over.

The issue is that you have to match up the selectors for find() with the current subscription. With Tracker.Component which has subscription support built in, you setup these in the constructor together with your find() for the collection, this ensures the data available is equally specified on both server and client.

## Subscriptions

With subscription management built in, your component will unsubscribe to the data you needed for the component when it is unmounted/destroyed, compared to known methods (ReactMeteorData, createContainer, TrackerReact and react-komposer) you will need to manage this yourself and potentially overload the client with data from multiple subscriptions that was never stopped, when the user is moving around your application.
