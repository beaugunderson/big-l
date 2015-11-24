'use strict';

var clean = require('./lib/clean-curve.js');
var consoleFormat = require('./lib/console-format.js');
var ruleSplit = require('./lib/rule-split.js');
var split = require('./lib/unicode-split.js');
var system = require('./system.js');
var _ = require('lodash');

function getArgument(type, symbol, required) {
  if (!type[symbol].arguments || (Math.random() < 0.05 && !required)) {
    return '';
  }

  return type[symbol].arguments.map(function (arg) {
    if (arg === 'style') {
      return "'red'";
    } else if (arg === 'angle') {
      return Math.round((180 / _.random(2, 16)) * 100) / 100;
    } else if (arg === 'number') {
      return _.random(1, 10);
    } else if (/^[0-9]/.test(arg)) {
      arg = arg.split('-');

      var randomFloat = false;

      if (/\./.test(arg)) {
        randomFloat = true;
      }

      return Math.round(_.random(parseFloat(arg[0], 10),
                                 parseFloat(arg[1], 10),
                                 randomFloat) * 100) / 100;
    }

    return '';
  }).join(',');
}

module.exports = function () {
  var controlWeight = _.random(0.3, 0.7);
  var index = 0;
  var remainingCharacters = 100;
  var rule;
  var rules = {};
  var start = '';
  var symbols = 'abcdefghijklmnopqrstuvwxyz'.split('');

  // remove control symbols from potential symbols
  symbols = _.difference(symbols, system.controlSymbols);

  // console.log('tags:', system.tags.join(', '));

  // _.each(system.symbolsByTag, function (s, tag) {
  //   console.log('%s: %s', tag, consoleFormat(s.join('')));
  // });

  // console.log('available node symbols:', symbols.join(' '));
  // console.log('available control symbols:', consoleFormat(system.emojiSymbols.join('')));

  var chosenSymbols = [];

  ['drawing', 'movement', 'heading', 'appearance'].forEach(function (tag) {
    chosenSymbols = chosenSymbols.concat(
      _.sample(system.symbolsByTag[tag],
               _.random(1, system.symbolsByTag[tag].length)));
  });

  // console.log('chosen symbols:', consoleFormat(chosenSymbols.join('')));

  chosenSymbols = _.flatten(chosenSymbols.map(function (symbol) {
    // use multiple sets of arguments
    return _.times(_.random(1, 5), function () {
      return symbol + getArgument(system.commands, symbol);
    });
  }));

  console.log('chosen symbols:', consoleFormat(chosenSymbols.join('')));

  var chosenSettings = [];

  ['setting'].forEach(function (tag) {
    chosenSettings = chosenSettings.concat(
      _.sample(system.symbolsByTag[tag],
               _.random(1, system.symbolsByTag[tag].length)));
  });

  // console.log('chosen settings:', consoleFormat(chosenSettings.join('')));

  chosenSettings = chosenSettings.map(function (symbol) {
    return symbol + '=' + getArgument(system.settings, symbol, true);
  });

  console.log('chosen settings:', consoleFormat(chosenSettings.join('')));

  chosenSettings = chosenSettings.join('; ');

  remainingCharacters -= split(chosenSettings).length;

  function randomSymbol() {
    return Math.random() > controlWeight ?
      _.sample(ruleSymbols) :
      _.sample(chosenSymbols);
  }

  var ruleCount = _.random(1, 7);

  // select some symbols to use as nodes
  var ruleSymbols = _.take(symbols, ruleCount);

  remainingCharacters -= (5 * ruleSymbols.length);

  console.log('rule symbols:', ruleSymbols.join(' '));

  // generate random start symbol (small)
  var initialCount = _.random(2, 10);

  remainingCharacters -= initialCount;

  // start += _.times(initialCount, randomSymbol).join('');
  start += _.sample(ruleSymbols, initialCount).join('');

  console.log('start:', start);

  var avgLength = Math.floor(remainingCharacters / ruleSymbols.length);

  // generate a rule for each symbol
  for (var i = 0; i < ruleSymbols.length && remainingCharacters > 0; i++) {
    rule = '';

    // insert random node or control symbols
    _.times(_.random(Math.min(avgLength, remainingCharacters)), function () {
      rule += randomSymbol();
    });

    var ruleArray = ruleSplit(rule);
    var bracketPairsToAdd = _.random(Math.floor(ruleArray.length / 6));

    // insert push/pop symbols, which need to be matched
    if (ruleArray.length > 1 && bracketPairsToAdd > 0) {
      console.log('%s rule: %s', ruleSymbols[i], consoleFormat(rule));

      _.times(bracketPairsToAdd, function () {
        index = _.random(ruleArray.length - 1);

        ruleArray = ruleArray.slice(0, index).concat('[',
          ruleArray.slice(index));

        index += _.random(2, ruleArray.length - index - 2);

        ruleArray = ruleArray.slice(0, index).concat(']',
          ruleArray.slice(index));
      });
    }

    if (ruleArray.length) {
      rule = ruleArray.join('');
      rules[ruleSymbols[i]] = rule;

      remainingCharacters -= ruleArray.length;

      console.log('%s rule: %s', ruleSymbols[i], consoleFormat(rule));
    }
  }

  var rulesString = _.map(rules, function (r, symbol) {
    return symbol + '=' + r;
  }).join('; ');

  var curve = [
    start,
    rulesString,
    chosenSettings
  ].join('; ');

  console.log('-clean: %s', consoleFormat(curve));

  var oldCurve;

  while (oldCurve !== curve) {
    oldCurve = curve;

    curve = clean(curve, ruleSymbols);

    console.log('+clean: %s', consoleFormat(curve));
  }

  return curve;
};
