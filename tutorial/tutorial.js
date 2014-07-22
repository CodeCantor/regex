(function() {

  window.RET = {};

  window.RET.examples = {};
  window.RET.orderedExamples = [];
  window.RET.currentIndex = 0;

  var incrementSelector = function(selector) {
    return function(e) {
      var $el = $(selector);
      $el.text(parseInt($el.text()) + 1);
    };
  };

  var addAnswerToList = function(selector) {
    return function(e) {
      var regex = e.detail.regex;
      var example = e.detail.example;


      $(selector).append('<li>'+example.name + ": " + regex.toString() + "</li>");      
    };
  };

  document.addEventListener('example-satisfied',
           addAnswerToList('#answers'));

  document.addEventListener('example-satisfied', function(e) {
    if(window.RET.currentIndex + 1 === window.RET.orderedExamples.length) {
      console.log('Congratulations! You\'ve finished all examples successfully!');
    } else {
      window.RET.currentIndex += 1;
      console.log('Next test!')
      printExample(currentExample());
    }
  });

  document.addEventListener('example-not-satisfied',
           addAnswerToList('#failed-answers'));

  document.addEventListener('example-not-satisfied',
           incrementSelector('#tries'));

  document.addEventListener('example-not-satisfied',
           incrementSelector('#fails'));

  document.addEventListener('example-satisfied',
           incrementSelector('#success'));

  document.addEventListener('example-satisfied',
           incrementSelector('#tries'));

  var registerExample = function(example) {
    window.RET.examples[example.name] = example;
    window.RET.orderedExamples.push(example);
  };

  var findExample = function(name) {
    return window.RET.examples[name];
  };

  var findExampleIndex = function(name) {
    return _.findIndex(window.RET.orderedExamples,
      {name: name});
  };

  var setCurrentExampleIndex = function(idx) {
    window.RET.currentIndex = idx;
  };

  var printTests = function(tests) {
    _.forEach(tests, function(el) {
      console.log(el.toString());
    });
  };

  var printExample = function(example) {
    console.log(example.name + ":");
    printTests(example.tests);
  };

  var showTestResultsWithErrors = function(regex, results) {
    console.log("Your regex is not good enough yet.");
    console.log("Your regex successfully matches:");
    printTests(results['true']);
    console.log("Sadly, your regex does not match these tests yet:");
    printTests(results['false']);
    exampleNotSatisfiedBy(regex);
  };

  var showTestResultsWithoutErrors = function(regex, results) {
    console.log('Congratulations! Your test passed!');
    exampleSatisfiedBy(regex);
  };

  var exampleNotSatisfiedBy = function(regex) {
    var event = new CustomEvent('example-not-satisfied', {'detail': {
      regex: regex,
      example: currentExample()
    }});
    document.dispatchEvent(event);
  }

  var exampleSatisfiedBy = function(regex) {
    var event = new CustomEvent('example-satisfied', {'detail': {
      regex: regex,
      example: currentExample()
    }});
    document.dispatchEvent(event);
  };

  var showTestResults = function(regex, results) {
    if('false' in results) {
      showTestResultsWithErrors(regex, results);
    } else {
      showTestResultsWithoutErrors(regex, results);
    }
  };

  var currentExample = function() {
    return window.RET.orderedExamples[window.RET.currentIndex];
  };

  var testCase = function(str, result, satisfies) {
    var t = {
      string: str,
      result: result,
      satisfies: satisfies
    };

    t.satisfiedBy = function(regex) {
      var r = _.isEqual(this.string.match(regex), this.result);
      if(!this.satisfies) {
        r = !r;
      }
      return r;
    };

    t.toString = function() {
      var r = this.string;
      r += ' =';
      if(!this.satisfies) {
        r += '!!';
      }
      r += '> [';
      r += _.map(this.result, function(el) { return '"' + el + '"';}).join(', ');
      r += ']';
      return r;
    }

    return t;
  };

  var example = function(name, initializer) {
    var result = {name: name, tests: []};

    result.satisfy = function(str, expectedResult) {
      result.tests.push(testCase(str, expectedResult, true));
    };

    result.refute = function(str, resultToAvoid) {
      result.tests.push(testCase(str, resultToAvoid, false));
    };

    result.satisfied = function(regex) {
      return _.groupBy(this.tests, function(element) {
        return element.satisfiedBy(regex);
      });
    };

    initializer.call(result);

    registerExample(result);

    return result;
  };

  example.show = function(name) {
    var find = findExample(name);

    if(find) {
      printExample(find);
    } else {
      console.log('Could not find ' + name + ' examples.');
    }
  };

  example.showCurrent = function() {
    printExample(currentExample());
  };

  example.changeTo = function(name) {
    var idx = findExampleIndex(name);

    if(idx >= 0) {
      setCurrentExampleIndex(idx);
    } else {
      console.log('Could not find ' + name + ' examples.');
    }
  };

  example.test = function() {
    var regex = null;
    if(typeof arguments[0] === 'string' && arguments.length > 1) {
      regex = new RegExp(arguments[0], arguments[1]);
    } else if(typeof arguments[0] === 'string') {
      regex = new RegExp(arguments[0]);
    } else if(arguments[0].constructor === RegExp) {
      regex = arguments[0];
    } else {
      console.log("The arguments cannot be converted to a regex.");
      return false;
    }

    var current = currentExample();

    var satisfied = current.satisfied(regex);

    showTestResults(regex, satisfied);

    return satisfied;
  };

  /*

  EXAMPLES

  */

  example('Basic regex', function() {
    this.satisfy("hola", ["hola"]);
  });

  example('Or', function() {
    this.satisfy("hola", ["hola"]);
    this.satisfy("adios", ["adios"]);
  });

  example('Basic quantifier 1', function() {
    this.satisfy("hola", ["hola"]);
    this.satisfy("hol", ["hol"]);
    this.refute("holaa", ["holaa"]);
  });

  window.e = window.example = example;

  window.e.showCurrent();
})()