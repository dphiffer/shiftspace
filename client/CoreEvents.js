// ==Builder==
// @option
// @package           EventHandling
// ==/Builder==

// Set up event handlers, these should not be tied into core
window.addEvent('keydown', SSKeyDownHandler.bind(this));
window.addEvent('keyup', SSKeyUpHandler.bind(this));
window.addEvent('keypress', SSKeyPressHandler.bind(this));
window.addEvent('mousemove', SSMouseMoveHandler.bind(this));

// Used by keyboard handlers to maintain state information
var __keyState__ = {};

/*
  Function: SSKeyDownHandler
    Handles keydown events.

  Parameters:
    _event - generated by the Browser.
*/
function SSKeyDownHandler(_event) 
{
  var event = new Event(_event);
  var now = new Date();

  SSLog('SSKeyDownHandler');

  // Try to prevent accidental shift+space activation by requiring a 500ms
  //   lull since the last keypress
  if (__keyState__.keyDownTime &&
      now.getTime() - __keyState__.keyDownTime < 500)
  {
    __keyState__.keyDownTime = now.getTime();
    return false;
  }

  if (event.code != 16)
  {
    // Remember when last non-shift keypress occurred
    __keyState__.keyDownTime = now.getTime();
  }
  else if (!__keyState__.shiftPressed)
  {
    // Remember that shift is down
    __keyState__.shiftPressed = true;
    // Show the menu if the user is signed in
    if (ShiftSpace.ShiftMenu)
    {
      __keyState__.shiftMenuShown = true;
      ShiftSpace.ShiftMenu.show(__keyState__.x, __keyState__.y);
    }
  }

  // If shift is down and any key other than space is pressed,
  // then definately shiftspace should not be invocated
  // unless shift is let go and pressed again
  if (__keyState__.shiftPressed &&
    event.key != 'space' &&
    event.code != 16)
  {
    __keyState__.ignoreSubsequentSpaces = true;

    if (__keyState__.shiftMenuShown)
    {
      __keyState__.shiftMenuShown = false;
      ShiftSpace.ShiftMenu.hide();
    }
  }

  // Check for shift + space keyboard press
  if (!__keyState__.ignoreSubsequentSpaces &&
    event.key == 'space' &&
    event.shift)
  {
    //SSLog('space pressed');
    // Make sure a keypress event doesn't fire
    __keyState__.cancelKeyPress = true;

    /*
    // Blur any focused inputs
    var inputs = document.getElementsByTagName('input');
    .merge(document.getElementsByTagName('textarea'))
    .merge(document.getElementsByTagName('select'));
    inputs.each(function(input) {
      input.blur();
    });
    */

    // Toggle the console on and off
    if (__keyState__.consoleShown)
    {
      __keyState__.consoleShown = false;
      //SSLog('hide console!');
      if(ShiftSpace.Console) ShiftSpace.Console.hide();
    }
    else
    {
      // Check to see if there's a newer release available
      // There's probably a better place to put this call.
      if (SSCheckForUpdates()) {
        return;
      }
      //SSLog('show console!');
      __keyState__.consoleShown = true;
      if(ShiftSpace.Console) ShiftSpace.Console.show();
    }

  }
};


/*
  Function: SSKeyDownHandler
    Handles keyup events.
    
  Parameters:
    _event - generated by the Browser.
*/
function SSKeyUpHandler(_event) 
{
  var event = new Event(_event);
  console.log('SSKeyUpHandler');
  // If the user is letting go of the shift key, hide the menu and reset
  if (event.code == 16) 
  {
    __keyState__.shiftPressed = false;
    __keyState__.ignoreSubsequentSpaces = false;
    ShiftSpace.ShiftMenu.hide();
  }
}


/*
  Function: SSKeyPressHandler
    Handles keypress events.

  Parameters:
    _event - generated by the browser.
*/
function SSKeyPressHandler(_event)
{
  var event = new Event(_event);
  console.log('SSKeyPressHandler');
  // Cancel if a keydown already picked up the shift + space
  if (__keyState__.cancelKeyPress) 
  {
    __keyState__.cancelKeyPress = false;

    event.stopPropagation();
    event.preventDefault();
  }
}

/*
  Function: SSMouseMoveHandler
    Handles mouse events.
    
  Parameters:
    _event - generated by the browser.
*/
function SSMouseMoveHandler(_event) 
{
  var event = new Event(_event);
  __keyState__.x = event.page.x;
  __keyState__.y = event.page.y;

  if (event.shift) 
  {
    ShiftSpace.ShiftMenu.show(__keyState__.x, __keyState__.y);
  } 
  else if (ShiftSpace.ShiftMenu) 
  {
    ShiftSpace.ShiftMenu.hide();
  }
}

var SSNotificationCenterClass = new Class({
  Implements: [Events, Options]
});

var SSNotificationCenter = new SSNotificationCenterClass();