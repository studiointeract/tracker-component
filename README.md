# Tracker.Component

Current version 1.0.0

## Features

1. **Easy to use**, using no componentDidMount or componentDidUpdate and no actual interaction with Tracker, we promise!
2. **Server Side Rendering** supported, though make sure to use FlowRouter SSR.
3. **Lightweight** implementation, just check the Tracker.Component implementation in the `tracker-component.jsx` file, there's no magic behind the scene (**45 lines of code**).

### Meteor 1.3

`meteor add studiointeract:tracker-component`

### Meteor 1.2

`meteor add studiointeract:tracker-component@1.2.1`

**Tracker.Component** is an improvement to what ReactMeteorData and TrackerReact offers. Using Tracker.Component instead you are no longer required to "freeze" all your reactivity in a single method. Any reactive data sources (e.g: `collection.find().fetch()` or `Session.get('foo')` used in your render method or by methods called by your render method are automatically reactive! This replicates the standard helper experience from Meteor/Blaze. Enjoy!

Notice! You have to call .fetch() on your cursors to actually get data.

# Using Tracker.Component

In this example we render a couple cars from MongoDB.

> You'll probably recognize the autorun and subscribe from Blaze's Tracker implementation. That's the core idea, simplicity.

```javascript
Models = new Mongo.Collection('models');

Cars = class Cars extends Tracker.Component {
  constructor(props) {
    super(props);
    this.autorun(() => {
      this.setState({
        cars: Models.find().fetch();
      });
    })
  }

  render() {
    let {cars = []} = this.state;
    return (
      <ul className="cars">
        {cars.map(car =>
          <li className="car">{brand} {model}</li>
        )}
      </ul>
    );
  }
}

```

## Fill with data from the server.

```javascript
// Bootstrap database with some cars.
Meteor.startup(function() {
  if (!Models.find().count()) {
    let models = {
      "Volvo": ['XC90', 'V90', 'V70'],
      "Tesla": ['Model S', 'Model X', 'Model 3', 'Roadster'],
      "DeLorean": ["DMC-12"]
    };

    Object.keys(models).forEach(brand => {
      models[brand].forEach(model => {
        Models.insert({ brand: brand, model: model });
      });
    });
  }
});

Meteor.publish('models', (brand) => {
  // Simulate network latency to show the loader.
  // Meteor._sleepForMs(2000);
  return Models.find({ brand: brand });
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

## What about adding a loading gif?

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

## Notes

* The component will stop old subscriptions and computations after 20seconds to avoid the case when the user quickly goes back to show the component and having the data disappear.
