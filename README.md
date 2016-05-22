# Tracker.Component

Current version 1.3.21

## Features

1. **[Easy to use](#using-trackercomponent)**, manages Tracker for you using autorun, and your subscriptions using the subscribe method, you don't have to manually setup the reactivity bindings or start/stop subscriptions, we promise!
3. **[Subscriptions](#subscriptions)** are managed through the built in `this.subscribe` and ensures your subscription are correctly stopped when your component unmounts.
4. **[Composition](#composition) and [Class Inheritance](#class-inheritance)** is easy to achieve, and the preferred methods rather than using Mixins, [read more about Mixin](#mixin).
5. **[Lightweight](lib/index.jsx)** implementation, have a look in [`index.jsx`](lib/index.jsx), there's no magic going on, only **48 lines of code**.
6. **[Server Side Rendering](#server-side-rendering)** supported (with data managed trough FlowRouter SSR).

**Tracker.Component** is an improvement to what other methods offer ([see comparison](#comparison)) for React. Using Tracker.Component you are no longer required to "freeze" all your reactivity in a single method or composition. You set the state from the reactive data sources (e.g: `collection.find().fetch()` or `Session.get('foo')` in `this.autorun`, which is also reactive to changes in `this.props` or `this.state`. Have fun!

## Installation

`npm i --save tracker-component`

# Using Tracker.Component

> [Go to using with Meteor 1.2](#using-trackercomponent-meteor-12)

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
  Meteor.publish('cars', () => Models.find());
}

class Models extends Tracker.Component {
  constructor(props) {
    super(props);
    this.subscribe('cars');
    this.autorun(() => {
      this.setState({
        cars: Models.find().fetch()
      });
    });
  }
}

const Cars = ({ cars = [] }) => (
  <ul className="cars">
    {cars.map(car =>
      <li className="car">{car.brand} {car.model}</li>
    )}
  </ul>
);

if (Meteor.isClient) {
  Meteor.startup(() => {
    ReactDOM.render(<Models><Cars /></Models>, document.body);
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

<body>
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
<body>

```

## Full example: What about adding a loading gif?

[http://github.com/studiointeract/tracker-component-example](http://github.com/studiointeract/tracker-component-example)

We got you're back on this one too! And have a look below, we've also added a select button to switch between selected car brand.

Just add `this.subscriptionsReady()` to your autorun like below and you will get a reactive boolean to use for a ready flag.

Notice! We advice in using "ready" flag rather "loading" due to that the data will default be ready when rendered on the server. The reason is basically to avoid having React complaining about different markup on server and client, which would happen when using the loading pattern.

```javascript
// main.jsx

Models = new Mongo.Collection('models');

Brands = class Cars extends Tracker.Component {
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
          {super.render()}
        </select>
      </div>
    );
  }
}
Brands.propTypes = {
  brand: React.PropTypes.string
};
Brands.defaultProps = { brand: 'Volvo' };

const Cars = ({ cars = [], ready }) => (
  <ul className={["cars", ready ? "ready" : ""].join(' ')}>
    {cars.map((car, i) =>
      <li className="car" key={i}>{car.brand} {car.model}</li>
    )}
  </ul>
);

if (Meteor.isClient) {
  ReactDOM.render(<Brands><Cars /></Brands>, document.body);
}

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

### Add Server Side Rendering

First off, remove the rendering to DOM from `main.jsx`:

```javascript
if (Meteor.isClient) {
  ReactDOM.render(<Brands><Cars /></Brands>, document.body);
}
```

Add some packages, both Meteor and NPM.

`meteor add kadira:flow-router-ssr`  
`npm i --save react-mounter` (for React 0.14.7)

If you prefer React 15.x you can use react-mount-layout for that, a fork of react-mounter:
`npm i --save react-mount-layout@^15.x` (for React 15.x, will replace with *react-mounter* when supporting React 15.x)

```javascript
// router.jsx

import React from 'react';
import { FlowRouter } from 'meteor/kadira:flow-router-ssr';

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

#### Result on the server:

```html

<main>
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
</main>

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
    ReactDOM.render(<Cars />, document.body);
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

<body>
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
</body>

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

<main>
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
</main>

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

## Increase Performance using PureRenderMixin

As described on its own [documentation](https://facebook.github.io/react/docs/pure-render-mixin.html) this is a utility to increase rendering performance for react components where

* the render function is a pure function of its props
* the props are not nested data structures (more on this on the docs)

Here's the official ES6 example:

```javascript
import PureRenderMixin from 'react-addons-pure-render-mixin';
class FooComponent extends React.Component {
  constructor(props) {
    super(props);
    this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this);
  }

  render() {
    return <div className={this.props.className}>foo</div>;
  }
}
```

## Comparison

|                 | Tracker.Component  | [TrackerReact](https://github.com/ultimatejs/tracker-react) | [ReactMeteorData](https://github.com/meteor/react-packages/tree/devel/packages/react-meteor-data)   | [react-komposer](https://github.com/kadirahq/react-komposer)                      |
|:--------------- |:------------------:|:-----------------:|:----------------:|:--------------------:|
| Lines of code   | 48                 | 148               | 200              | 292                  |
| [ES6 Class Inheritance](#class-inheritance) | Yes | -    | -                | -                    |
| [Composition](#composition) | Yes    | Yes               | [createContainer](http://guide.meteor.com/v1.3/react.html#using-createContainer) | Yes               |
| [Mixin](#mixin) | -                  | -                 | Yes              | -                    |
| [Subscriptions](#subscriptions) | this.subscribe | -     | -                | -                    |
| [SSR](#server-side-rendering) | Yes  | Partial           | Partial          | Partial              |
| Reactivity      | this.autorun       | render            | getMeteorData    | [composeWithTracker](https://github.com/kadirahq/react-komposer#using-with-meteor)                  |
| NPM module      | Yes                | -                 | -                | Yes                  |

## Server Side Rendering

To get the server to render your component with prefilled data, you will need to have that data with known methods (ReactMeteorData, createContainer and TrackerReact) to manually load specific for the server, this method can potentially render more data then the client expected from a subscription and React will definitely complain when the client version takes over.

The issue is that you have to match up the selectors for find() with the current subscription. With Tracker.Component which has subscription support built in, you setup these in the constructor together with your find() for the collection, this ensures the data available is equally specified on both server and client.

## Subscriptions

With subscription management built in, your component will unsubscribe to the data you needed for the component when it is unmounted/destroyed, compared to known methods (ReactMeteorData, createContainer, TrackerReact and react-komposer) you will need to manage this yourself and potentially overload the client with data from multiple subscriptions that was never stopped, when the user is moving around your application.

With Tracker.Component you subscribe to publications per component like this:

> Notice! The `autorun` method is also reactive to changes on `this.props` and `this.state`, which makes it possible to react accordingly on changes to these and change the subscriptions.

```javascript
Cars = class Cars extends Tracker.Component {
  constructor(props) {
    super(props);
    this.state = {
      brand: this.props.brand
    };
    this.subscribe('brands');
    this.autorun(() => {
      this.subscribe( 'brand', this.state.brand );
    });
  }
}
```

## Class Inheritance

With Class Inheritance we talk about the method we can extend existing Components with new functionality and a method of overloading existing method with your own, the benefits is that you are in full control of the component how it behaves and if you don't like how a particular method or handler does things, you can replace it with your own implementation.

> This is the default method for Tracker.Component because it requires you to write the least amount of code.

## Composition

With Composition in React we mean the method to split up data management and pure rendering components, composition is actually a known method in mathematics, "the pointwise application of one function to the result of another to produce a third function" (ref. [Function Composition](https://en.wikipedia.org/wiki/Function_composition)).

Composition can be achieved with known methods (createContainer, TrackerReact and react-komposer) by passing your data management function to the compostion method which resolves in a method that takes your Component as an argument.

With Tracker.Component this can be achivieved with (full example):

```javascript
// main.jsx

import React from 'react';
import Tracker from 'tracker-component';

Models = new Mongo.Collection('models');
if (Meteor.isServer) {
  Meteor.publish('cars', brand => Models.find({ brand: brand }));
}

class Composition extends Tracker.Component {
  constructor(props) {
    super(props);
    this.subscribe('cars', this.props.brand);
    this.autorun(() => {
      this.setState({
        cars: Models.find({ brand: this.props.brand }).fetch()
      });
    });
  }
}

const Cars = ({ cars = [] }) => (
  <ul className="cars">
    {cars.map(car =>
      <li className="car">{car.brand} {car.model}</li>
    )}
  </ul>
);

if (Meteor.isClient) {
  Meteor.startup(() => {
    ReactDOM.render(<Composition brand={ 'Volvo' }><Cars /></Composition>, document.body);
  });
}
```
### Results:

```html

<body>
  <ul class="cars">
    <li>Volvo XC90</li>
    <li>Volvo V90</li>
    <li>Volvo V70</li>
  </ul>
</body>

```

## Mixin

Mixins are a method of previous versions of React, we used them to extend the components with extra features on top, the new way to achive the same functionality is through [Composition](#composition) or [Class Inheritance](#class-inheritance). Don't forget to read the article on Mixins by Dan Abramov, [Mixins Are Dead. Long Live Composition](https://medium.com/@dan_abramov/mixins-are-dead-long-live-higher-order-components-94a0d2f9e750#.l18k55fdx).

## Stopping computations

Usually you don't need to stop the computation as it will automatically will be
stopped when the component is destroyed, though notice that if you re-implement
componentWillUnmount, be sure to call the super implementation as noticed below.

> Supported from version 1.3.18.

### Alt 1: Stopping by reference.

Use the returned reference to the computation and stop it from there.

```js
const comp = this.autorun(() => {});
comp.stop();
```

### Alt 2: Stopping from inside the autorun.

You can always just pick up the reference to the computation passed in the
arguments of your autorun implementation and stop it.

```js
const comp = this.autorun(c => {
  c.stop();
});
```

## Notes

Beware, if you re-implement componentWillUpdate or componentWillUnmount, don't forget to call the super implementation (`super.componentWillUpdate()` or `super.componentWillUnmount()`).

## Credits

Made by the [creative folks at Studio Interact](http://studiointeract.com).
