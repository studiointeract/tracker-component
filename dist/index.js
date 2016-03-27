'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _get2 = require('babel-runtime/helpers/get');

var _get3 = _interopRequireDefault(_get2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _meteorStandaloneTracker = require('meteor-standalone-tracker');

var _meteorStandaloneTracker2 = _interopRequireDefault(_meteorStandaloneTracker);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var TrackerComponent = function (_React$Component) {
  (0, _inherits3.default)(TrackerComponent, _React$Component);

  function TrackerComponent(props) {
    (0, _classCallCheck3.default)(this, TrackerComponent);

    var _this = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(TrackerComponent).call(this, props));

    _this.__subs = {};
    _this.__comps = [];
    _this.__funcs = [];
    _this._subscribe = props.subscribe || Meteor.subscribe;
    return _this;
  }

  (0, _createClass3.default)(TrackerComponent, [{
    key: 'subscribe',
    value: function subscribe(publicationName) {
      for (var _len = arguments.length, options = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        options[_key - 1] = arguments[_key];
      }

      this.__subs[publicationName] = this._subscribe.apply(this, [publicationName].concat(options));
    }
  }, {
    key: 'autorun',
    value: function autorun(fn) {
      var comp = _meteorStandaloneTracker2.default.autorun(fn);
      this.__comps.push(comp);
      return comp;
    }
  }, {
    key: 'subscriptionsReady',
    value: function subscriptionsReady() {
      var _this2 = this;

      return !(0, _keys2.default)(this.__subs).some(function (sub) {
        return !_this2.__subs[sub].ready();
      });
    }
  }, {
    key: 'setState',
    value: function setState(state) {
      if (!this._reactInternalInstance) {
        return this.state = (0, _assign2.default)({}, this.state, state);
      } else {
        return (0, _get3.default)((0, _getPrototypeOf2.default)(TrackerComponent.prototype), 'setState', this).apply(this, arguments);
      }
    }
  }, {
    key: 'componentWillUpdate',
    value: function componentWillUpdate(nextProps, nextState) {
      if (!_.isEqual(nextProps, this.props) || !_.isEqual(nextState, this.state)) {
        this.__comps.forEach(function (comp, i) {
          if (!comp.invalidated) {
            comp.invalidate();
          }
        });
      }
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      var _this3 = this;

      setTimeout(function () {
        (0, _keys2.default)(_this3.__subs).forEach(function (sub) {
          return _this3.__subs[sub].stop();
        });
        _this3.__comps.forEach(function (comp) {
          return comp.stop();
        });
      }, 20000);
    }
  }]);
  return TrackerComponent;
}(_react2.default.Component);

exports.default = TrackerComponent;