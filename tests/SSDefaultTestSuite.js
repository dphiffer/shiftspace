var SSDefaultTestSuite = new Class({

  Extends: SSUnitTest.TestSuite,

  name: "SSDefaultTestSuite",

  initialize: function(options)
  {
    // important
    this.parent(options);
    
    console.log('Starting up adding tests');
    this.addTest(SSDefaultTest);
  }
});