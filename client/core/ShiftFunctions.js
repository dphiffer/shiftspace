// ==Builder==
// @optional
// @name              ShiftFunctions
// @package           Core
// ==/Builder==

var __shifts = $H();
var __focusedShiftId = null; // Holds the id of the currently focused shift
var __defaultShiftStatus = 1;

function SSSetShift(id, shift)
{
  __shifts[id] = shift;
}

function SSGetShift(id)
{
  var shift = __shifts[id];
  if(shift) return shift;
  return SSLoadShift(id);
}

function SSUninternShift(id)
{
  delete __shifts[id];
}

/*
Function: SSInitShift
  Creates a new shift on the page.

Parameters:
  space - The name of the Space the Shift belongs to.
*/
var SSInitShift = function(space, options) 
{
  var tempId = 'newShift' + Math.round(Math.random(0, 1) * 1000000);
  var winSize = window.getSize();
  var position = (options && options.position && {x: options.position.x, y: options.position.y }) || 
                  {x: winSize.x/2, y: winSize.y/2};
                  
  var shift = {
    _id: tempId,
    space: {name: space.name},
    username: ShiftSpace.User.getUserName(),
    content: {position: position}
  };

  var noError = space.createShift(shift);
  
  if(noError)
  {
    SSSetShift(tempId, shift);
    SSShowNewShift(space, shift);
  }
  else
  {
    console.error("There was an error creating the shift");
  }
}.asPromise();

/*
  Function: SSShowNewShift
    Shows a new shift, different from showShift in that it immediately puts the shift in edit mode.

  Parameters:
    shiftId - a shift id.
*/
var SSShowNewShift = function(space, shift)
{
  var id = shift._id;
  space.onShiftCreate(id);
  SSEditShift(space, shift);
  SSFocusShift(space, shift);
}.asPromise();

/*
Function: SSFocusShift
  Focuses a shift.

Parameter:
  shiftId - the id of the shift.
*/
var SSFocusShift = function(space, shift)
{
  var id = shift._id;
  var lastFocusedShift = SSFocusedShiftId();

  // unfocus the last shift
  if (lastFocusedShift &&
      SSGetShift(lastFocusedShift) &&
      lastFocusedShift != id)
  {
    var lastSpace = SSSpaceForShift(lastFocusedShift);
    if(lastSpace.getShift(lastFocusedShift))
    {
      lastSpace.getShift(lastFocusedShift).blur();
      lastSpace.orderBack(lastFocusedShift);
    }
  }
  SSSetFocusedShiftId(id);
  space.orderFront(id);

  space.focusShift(id);
  space.onShiftFocus(id);

  // scroll the window if necessary
  var mainView = space.mainViewForShift(id);

  // TODO: move the windowing logic elsewhere - David 7/31/09
  if(mainView && !SSIsNewShift(id))
  {
    var pos = mainView.getPosition();
    var vsize = mainView.getSize();
    var viewPort = window.getSize();
    var windowScroll = window.getScroll();

    var leftScroll = (windowScroll.x > pos.x-25);
    var rightScroll = (windowScroll.x < pos.x-25);
    var downScroll = (windowScroll.y < pos.y-25);
    var upScroll = (windowScroll.y > pos.y-25);

    if(pos.x > viewPort.x+windowScroll.x ||
       pos.y > viewPort.y+windowScroll.y ||
       pos.x < windowScroll.x ||
       pos.y < windowScroll.y)
    {
      var scrollFx = new Fx.Scroll(window, {
        duration: 1000,
        transition: Fx.Transitions.Cubic.easeIn
      });

      if(!window.webkit)
      {
        scrollFx.scrollTo(pos.x-25, pos.y-25);
      }
      else
      {
        window.scrollTo(pos.x-25, pos.y-25);
      }
    }
  }
}.asPromise();

/*
  Function: SSBlurShift
    Blurs a shift.

  Parameters:
    shiftId - a shift id.
*/
function SSBlurShift(shiftId)
{
  // create a blur event so console gets updated
  var space = SSSpaceForShift(shiftId);
  space.blurShift(shiftId);
  space.onShiftBlur(shiftId);
}

/*
Function: SSDeleteShift
  Deletes a shift from the server.

Parameters:
  space - a space instance.
  shift - a shift.
*/
var SSDeleteShift = function(space, shift) 
{
  var id = shift._id;
  if(SSFocusedShiftId() == shiftId)
  {
    SSSetFocusedShiftId(null);
  }
  var p = SSApp.delete({resource:'shift', id:shift._id});
  p.op(function(value) { 
    SSUninternShift(id);
    if(space) space.onShiftDelete(shiftId);
    SSPostNotification('onShiftDelete', id);
  });
  return p;
}.asPromise();

/*
 Function: SSEditShift
   Edit a shift.

 Parameters:
   space - a space.
   shift - shift data
 */
var SSEditShift = function(space, shift)
{
  var id = shift._id;
  var user = SSUserForShift(id);

  if(!space.canShowShift(SSGetShiftContent(id))) return;
  // if the user has permissions, edit the shift
  if(SSUserCanEditShift(id))
  {
    var content = shift.content;
    SSFocusSpace(space, (content && content.position) || null);
    SSShowShift(space, shift);

    space.editShift(id);
    space.onShiftEdit(id);
    SSFocusShift(space, shift);
    SSPostNotification('onShiftEdit', id);
  }
  else
  {
    window.alert("You do not have permission to edit this shift.");
  }
}.asPromise();

/*
Function: SSSaveNewShift
  Creates a new entry for the shift on the server.

Parameters:
  shiftJson - a shift json object, delivered from Shift.encode

See Also:
  Shift.encode
*/
function SSSaveNewShift(shift)
{
  var space = SSSpaceForName(shift.space.name);

  var params = {
    href: window.location.href.split("#")[0],
    space: {name: shift.space.name, version: space.attributes().version},
    summary: shift.summary,
    content: shift
  };
  
  var p = SSApp.create('shift', params);
  $if(SSApp.noErr(p),
      function() {
        var newShift = p.value();
        var newId = newShift._id;
        var oldId = shift._id;
        
        newShift.created = 'Just posted';
        
        var instance = space.getShift(oldId);
        instance.setId(newId);
        
        SSSetFocusedShiftId(newId);
        
        if(ShiftSpace.Console)
        {
          ShiftSpace.Console.show();
          ShiftSpace.Console.showShift(newId);
        }
        
        space.onShiftSave(newId);
        SSPostNotification('onShiftSave', newId);
      });
}

/*
  Function: SSSaveShift
    Saves a shift's JSON object to the server.

  Parameters:
    shiftJson - a shiftJson object, delivered from Shift.encode.

  See Also:
    Shift.encode
*/
function SSSaveShift(shift) 
{
  if (shift._id.substr(0, 8) == 'newShift') 
  {
    SSSaveNewShift(shift);
    return;
  }

  var space = SSSpaceForName(shift.space.name);
  var params = {
    summary: shift.summary,
    content: shift,
    space: {name: shift.space.name, version: space.attributes().version}
  };

  var p = SSApp.update('shift', shift._id, params);
  $if(SSApp.noErr(p),
      function() {
        ShiftSpace.Console.updateShift(p);
        SSSpaceForName(shift.space.name).onShiftSave(p.get('id'));
      });
}

/*
  Function: SSGetShifts
    Similar to SSLoadShifts, probably should be merged.  Only used by plugins.

  Parameters:
    shiftIds - an array of shift ids.
    callBack - a callback function.
    errorHandler - a error handling function.
*/
function SSGetShifts(shiftIds, callBack, errorHandler)
{
  var newShiftIds = [];
  var finalJson = {};

  newShiftIds = shiftIds;

  // put these together
  var params = { shiftIds: newShiftIds.join(',') };

  SSServerCall.safeCall('shift.get', params, function(json) {
    if(json.contains(null))
    {
      if(errorHandler && $type(errorHandler) == 'function')
      {
        errorHandler({
          type: __SSInvalidShiftIdError,
          message: "one or more invalid shift ids to SSGetShift"
        });
      }
    }
    else
    {
      // should probably filter out any uncessary data
      json.each(function(x) {
        finalJson[x.id] = x;
      });

      if(callBack) callBack(finalJson);
    }
  });
}

function SSGetPageShifts(shiftIds)
{
  var result = [];
  for(var i = 0; i < shiftIds.length; i++)
  {
    var cshift = SSGetShift(shiftIds[i]);
    var copy = {
      username: cshift.username,
      space: cshift.space.name,
      status: cshift.status
    };
    result.push(copy);
  }
  return result;
}


/*
  Function: SSGetPageShiftIdsForUser
    Gets all the shifts ids on the current page for the logged in user.

  Returns:
    An array of shift ids.
*/
function SSGetPageShiftIdsForUser()
{
  var shiftIds = [];

  if(ShiftSpace.User.isLoggedIn())
  {
    var username = ShiftSpace.User.getUserName();
    var allShifts = SSAllShifts();
    for(shiftId in allShifts)
    {
      if(SSUserForShift(shiftId) == username)
      {
        shiftIds.push(shiftId);
      }
    }
  }

  return shiftIds;
}

/*
Function: SSAllShiftIdsForSpace
  Returns all shift ids on the current url for a particular Space.

Parameters:
  spaceName - the name of the Space as a string.
*/
function SSAllShiftIdsForSpace(spaceName)
{
  var shiftsForSpace = [];
  var allShifts = SSAllShifts();
  for(shiftId in allShifts)
  {
    if(SSSpaceNameForShift(shiftId) == spaceName)
    {
      shiftsForSpace.push(shiftId);
    }
  }
  return shiftsForSpace;
}

/*
  Function: SSGetAuthorForShift
    Returns the username of the Shift owner as a string.

  Parameters:
    shiftId - a shift id.

  Returns:
    A user name as a string.
*/
function SSGetAuthorForShift(shiftId)
{
  return SSGetShift(shiftId).username;
}

/*
Function: SSGetShiftData
  Returns a copy of the shift data.

Parameters:
  shiftId - a shift id.

Returns:
  An copy of the shift's properties.
*/
function SSGetShiftData(shiftId)
{
  var shift = SSGetShift(shiftId);
  return {
    id : shift.id,
    title : shift.summary,
    summary: shift.summary,
    space: shift.space,
    href : shift.href,
    username : shift.username
  };
}


/*
  Function: SSLoadShift
    Load a single shift from the network.

  Parameters:
    shiftId - a shift id.
    callback - a callback handler.
*/
function SSLoadShift(id)
{
  var p = SSApp.get({resource:'shift', id:id});
  p.op(function (value) { if (value) SSSetShift(id, value); });
  return p;
}

/*
  Function: SSLoadShifts
    Same as SSLoadShift except handles an array of shift id.

  Parameters:
    shiftIds - an array of shift ids.
    callback - a callback handler.
*/
function SSLoadShifts(shiftIds, callback)
{
  // fetch a content from the network;
  var params = {shiftIds: shiftIds.join(',')};
  SSServerCall.safeCall('shift.get', params, function(_returnArray) {
    var returnArray = _returnArray;

    if(returnArray && returnArray.length > 0)
    {
      // filter out null shifts
      returnArray = returnArray.filter(function(x) { return x != null; });

      // update internal array
      returnArray.each(function (shiftObj) {
        SSSetShift(shiftObj.id, shiftObj);
      });

      if(callback && $type(callback) == 'function')
      {
        callback(returnArray);
      }
    }
  });
}

/*
  Function: SSShiftIsLoaded
    Check to see if the shift has it's content loaded yet.

  Parameters:
    shiftId - a shift id.

  Returns:
    a boolean value.
*/
function SSShiftIsLoaded(shiftId)
{
  return (SSGetShift(shiftId) && SSHasProperty(SSGetShift(shiftId), 'content'));
}

/*
  Function: SSUpdateTitleOfShift
    Tell the space to the update the title of the shift if necessary.

  Parameters:
    shiftId - a shift id.
    title - the new title.
*/
function SSUpdateTitleOfShift(shiftId, title)
{
  SSSpaceForShift(shiftId).updateTitleOfShift(shiftId, title);
  SSShowShift(shiftId);
}

/*
Function: SSShowShift
  Displays a shift on the page.

Parameters:
  space - The space instance
  shift - The shift data
*/
var SSShowShift = function(space, shift)
{
  try
  {
    space.showShift(shift);
    SSFocusShift(space, shift);
    space.onShiftShow(shift._id);
  }
  catch(err)
  {
    console.error(err);
  }
}.asPromise();

/*

Function: SSHideShift
  Hides a shift from the page.

Parameters:
    space - a space instance.
    shift - a shift.

*/
var SSHideShift = function(space, shift)
{
  var id = shift._id;
  space.hideShift(id);
  space.onShiftHide(id);
}.asPromise();

/*
  Function: SSAllShifts
    Returns the private shifts variable.
    
  Returns:
    The internal hash table of all currently loaed shifts.
*/
function SSAllShifts()
{
  return shifts;
}

/*
  Function: SSFocusedShiftId
    Returns the current focused shift's id.

  Returns:
    a shift id.
*/
function SSFocusedShiftId()
{
  return __focusedShiftId;
}

/*
  Function: SSSetFocusedShiftId
    Should never be called.

  Parameters:
    newId - a shift id.
*/
function SSSetFocusedShiftId(newId)
{
  __focusedShiftId = newId;
}

/*
  Function: SSSetShiftStatus
    Sets the shift public private status.

  Parameters:
    shiftId - a shift id.
    newStatus - the status.
*/
function SSSetShiftStatus(shiftId, newStatus) 
{
  SSGetShift(shiftId).status = newStatus;
  var params = {
    id: shiftId,
    status: newStatus
  };
  SSServerCall('shift.update', params, function() {
    SSPostNotification('onShiftUpdate', shiftId);
  });
}


/*
  Function: SSGetShiftContent
    Returns the actual content of shift.  The content is the actual
    representation of the shift as defined by the encode method of the
    originating Shift class.

  Parameters:
    shiftId - a shift id.

  Returns:
    A Javascript object with the shifts's properties.
*/
function SSGetShiftContent(shiftId)
{
  return SSGetShift(shiftId).content;
}

/*
  Function: SSGetUrlForShift
    Returns the url of a shift.

  Parameters:
    shiftId - a shift id.

  Returns:
    A url as a string.
*/
function SSGetUrlForShift(shiftId)
{
  return SSGetShift(shiftId).href;
}

/*
  Function: SSIsNewShift
    Used to check whether a shift is newly created and unsaved.

  Parameters:
    shiftId - a shift id.
*/
function SSIsNewShift(shiftId)
{
  return (shiftId.search('newShift') != -1);
}
