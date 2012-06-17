var TestRunner = function(proper, operations, assertions) {

  // Run the test suite
  this.run = function() {
    _.each(operations, function(op, index) {
      proper.execute(op);

      // Check against assertions
      assertions[index].apply(this, [proper]);
    });
  }
}