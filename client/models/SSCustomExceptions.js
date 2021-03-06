// ==Builder==
// @optional
// @package           System
// @dependencies      SSException
// ==/Builder==

var SSSpaceDoesNotExistError = new Class({
  Extends: SSException,
  
  name: 'SSSpaceDoesNotExistError',
  
  initialize: function(_error, spaceName)
  {
    this.parent(_error);
    this.spaceName = spaceName;
  },
  
  message: function()
  {
    return "Space " + this.spaceName + " does not exist.";
  }

});

var ShiftDoesNotExistError = new Class({
  
});