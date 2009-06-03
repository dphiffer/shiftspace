// ==Builder==
// @optional
// @name              ErrorWindow
// @package           ErrorHandling
// @dependencies      ShiftSpaceElement
// ==/Builder==

var __errorWindow,
    __errorWindowShiftPropertyModel,
    __errorWindowMinimized = true;

/*
  Function: SSCreateErrorWindow
    Create the error window.
*/
function SSCreateErrorWindow()
{
  // Create the model for the table
  __errorWindowShiftPropertyModel = new ShiftSpace.Element('tr');
  __errorWindowShiftPropertyModel.setStyle('display', '');
  var propertyName = new ShiftSpace.Element('td');
  propertyName.addClass('SSErrorWindowShiftProperty');
  var propertyValue = new ShiftSpace.Element('td');
  propertyName.injectInside(__errorWindowShiftPropertyModel);
  propertyValue.injectInside(__errorWindowShiftPropertyModel);

  // the error window
  __errorWindow = new ShiftSpace.Element('div', {
    'class': "SSErrorWindow SSDisplayNone"
  });

  // error title area
  var errorWindowTitle = new ShiftSpace.Element('div', {
    'class': "SSErrorWindowTitle"
  });
  errorWindowTitle.injectInside(__errorWindow);
  errorWindowTitle.set('text', 'Oops ... it seems this shift is broken');

  // the errow message area
  var errorWindowMessage = new ShiftSpace.Element('div', {
    'class': "SSErrorWindowMessage"
  });
  errorWindowMessage.injectInside(__errorWindow);
  errorWindowMessage.set('html', 'Help us improve our experimental fix feature, copy and paste the shift details and <a target="new" href="http://metatron.shiftspace.org/trac/newticket">file a bug report</a>.');

  var br = new ShiftSpace.Element('br');
  br.setStyle('clear', 'both');
  br.injectInside(__errorWindow);

  // add the bottom
  var errorWindowBottom = new ShiftSpace.Element('div', {
    'class': "SSErrorWindowBottom"
  });
  errorWindowBottom.injectInside(__errorWindow);

  // build the disclosure triangle and label
  var errorWindowDisclosure = new ShiftSpace.Element('div', {
    'class': "SSErrorWindowDisclosure"
  });
  var errorWindowExpandWrapper = new ShiftSpace.Element('div', {
    'class': "SSErrorWindowExpandWrapper SSUserSelectNone"
  });
  var errorWindowExpand = new ShiftSpace.Element('div', {
    'class': "SSErrorWindowExpand"
  });
  errorWindowExpand.injectInside(errorWindowExpandWrapper);
  var errorWindowExpandLabel = new ShiftSpace.Element('div', {
    'class': "SSErrorWindowExpandLabel SSDefaultCursor"
  });
  errorWindowExpandLabel.set('text', 'view shift details');
  errorWindowExpandLabel.injectInside(errorWindowExpandWrapper);
  errorWindowExpandWrapper.injectInside(errorWindowDisclosure);

  errorWindowDisclosure.injectInside(errorWindowBottom);

  // bulid the table where the shift data will be shows
  var errorWindowShiftStatusScroll = new ShiftSpace.Element('div', {
    'class': 'SSErrorWindowShiftStatusScroll SSDisplayNone'
  });
  var errorWindowShiftStatus = new ShiftSpace.Element('table', {
    'class': "SSErrorWindowShiftStatus",
    'col' : 2
  });
  errorWindowShiftStatus.injectInside(errorWindowShiftStatusScroll);
  errorWindowShiftStatusScroll.injectInside(errorWindowDisclosure);

  // build the ok button
  var errorWindowOk = new ShiftSpace.Element('div', {
    'class': "SSErrorWindowOk SSUserSelectNone"
  });
  errorWindowOk.set('text', 'OK');
  errorWindowOk.injectInside(errorWindowBottom);

  // build the fix button
  var errorWindowFix = new ShiftSpace.Element('div', {
    'class': "SSErrorWindowFix SSErrorWindowButton SSDisplayNone"
  });
  errorWindowFix.set('text', 'Fix');
  errorWindowFix.injectInside(errorWindowBottom);
  
  __errorWindow.set('tween', {
    duration: 300,
    transition: Fx.Transitions.Cubic.easeOut,
    onComplete: function()
    {
      // reset the error window
      __errorWindow.setStyles({
        width: 280,
        height: 100
      });
      errorWindowExpand.removeClass('SSErrorWindowExpandOpen');
      errorWindowExpandLabel.set('text', 'view shift details');
      errorWindowShiftStatusScroll.addClass('SSDisplayNone');
      __errorWindowMinimized = true;
    }
  });
  
  __errorWindow.set('morph', {
    duration: 500,
    transition: Fx.Transitions.Cubic.easeOut,
    onComplete: function()
    {
      if(!__errorWindowMinimized)
      {
        errorWindowShiftStatusScroll.removeClass('SSDisplayNone');
      }
    }
  });

  errorWindowOk.addEvent('click', function(_evt) {
    var evt = new Event(_evt);
    __errorWindow.tween('opacity', 0);
  });

  // add expand action
  errorWindowExpandWrapper.addEvent('click', function(_evt) {
    var evt = new Event(_evt);

    if(!__errorWindowMinimized)
    {
      errorWindowExpand.removeClass('SSErrorWindowExpandOpen');
      errorWindowExpandLabel.set('text', 'view shift details');
      errorWindowShiftStatusScroll.addClass('SSDisplayNone');
    }
    else
    {
      errorWindowExpand.addClass('SSErrorWindowExpandOpen');
      errorWindowExpandLabel.set('text', 'hide shift details');
    }

    if(__errorWindowMinimized)
    {
      __errorWindow.morph({
        width: 340,
        height: 300
      });
    }
    else
    {
      __errorWindow.morph({
        width: 280,
        height: 100
      });
    }

    __errorWindowMinimized = !__errorWindowMinimized;
  });

  __errorWindow.injectInside(document.body);
}

/*
  Function: SSShowErrorWindow
    Show the error window.

  Parameters:
    shiftId - a shift id.
*/
function SSShowErrorWindow(shiftId)
{
  /*
  __errorWindow.getElement('.SSErrorWindowTitle').set('text', title);
  __errorWindow.getElement('.SSErrorWindowMessage').set('text', message);
  */

  if(shiftId) SSErrorWindowUpdateTableForShift(shiftId);

  // is this shift fixable, if so show the fix button
  var space = SSSpaceForShift(shiftId);
  var fixButton = __errorWindow.getElement('.SSErrorWindowFix');

  if(space && space.fix && SSUserCanEditShift(shiftId))
  {
    fixButton.removeClass('SSDisplayNone');
    fixButton.removeEvents();

    fixButton.addEvent('click', function(_evt) {
      var evt = new Event(_evt);

      // close the error window
      SSHideErrorWindow();

      var shift = SSGetShift(shiftId);

      // hmm add the shift, not show it
      // load the shift
      space.addShift({
        id: shiftId,
        username: shift.username,
        summary: shift.summary
      });
      // set the current shift
      space.setCurrentShiftById(shiftId);
      // edit the shift
      space.editShift(shiftId);

      // attempt to fix it
      var err = space.fix({
        id: shiftId,
        username: shift.username,
        summary: shift.summary,
        content: unescape(shift.content)
      });

    });
  }
  else
  {
    fixButton.addClass('SSDisplayNone');
  }

  __errorWindow.setOpacity(0);
  __errorWindow.removeClass('SSDisplayNone');
  __errorWindow.tween('opacity',0.95);
}

/*
  Function: SSHideErrorWindow
    Hide the error window.
*/
function SSHideErrorWindow()
{
  __errorWindow.addClass('SSDisplayNone');
}

/*
  Function: SSErrorWindowUpdateTableForShift
    Update object description table for a shift.

  Parameters:
    shiftId - a shift id.
*/
function SSErrorWindowUpdateTableForShift(shiftId)
{
  var statusTable = __errorWindow.getElement('.SSErrorWindowShiftStatus');
  // clear out the table of it's contents
  statusTable.empty();

  var theShift = SSGetShift(shiftId);
  var shiftContent;

  try
  {
    shiftContent = SSGetShiftContent(shiftId);
  }
  catch(err)
  {
    shiftContent = {
      id: theShift.id,
      content: unescape(theShift.content)
    };
  }

  for(var prop in shiftContent)
  {
    var newPair = __errorWindowShiftPropertyModel.clone(true);
    var tds = newPair.getElements('td');

    tds[0].set('text', prop);
    tds[1].set('text', shiftContent[prop]);

    newPair.injectInside(statusTable);
  }
}