// ==Builder==
// @optional
// @name              SpaceFunctions
// @package           Core
// ==/Builder==

var __spaces = $H();
var __focusedSpace = null;
var __defaultSpaces = null;
var __installedSpaces = null;
var __installedSpacesDataProvider = null;

function SSSpaceIsLoaded(space)
{
  return (SSSpaceForName(space) != null); 
}

var __loadingSpaces = [];

/*
Function: SSLoadSpace
  Loads the space's source code, executes it and stores an instance of the
  space class in the 'spaces' object

Parameters:
  space - the Space name to load
  callback - a callback function to run when the space is loaded.
*/
function SSLoadSpace(space, callback)
{
  if(__loadingSpaces.contains(space))
  {
    SSAddObserver(SSNotificationProxy, 'onSpaceLoad', function(spaceInstance) {
      if(spaceInstance.attributes().name == space) callback(spaceInstance);
    });
    return
  }
  
  if(space && SSSpaceIsLoaded(space))
  {
    callback(SSSpaceForName(space));
    return;
  }
  else if(space)
  {
    __loadingSpaces.push(space);
    
    var url = SSURLForSpace(space) + space + '.js';
    if (typeof ShiftSpaceSandBoxMode != 'undefined')
    {
      url += '?' + new Date().getTime();
      var newSpace = new Asset.javascript(url, {
        id: space,
        onload: function() 
        {
          if(callback) callback(SSSpaceForName(space));
          SSPostNotification("onSpaceLoad", SSSpaceForName(space));
        }
      });
    }
    else
    {
      SSLoadFile(url, function(rx) {
        var err;
        try
        {
          ShiftSpace.__externals.evaluate(rx.responseText);
        }
        catch(exc)
        {
          console.error('Error loading ' + space + ' Space - ' + SSDescribeException(exc));
          //throw exc;
        }

        if(callback) callback(SSSpaceForName(space));
        SSPostNotification("onSpaceLoad", SSSpaceForName(space));
      });
    }
  }
}

/*
Function: SSRegisterSpace
  Called by the Space class to register with ShiftSpace.

Parameters:
  instance - A space object.
*/
function SSRegisterSpace(instance) 
{
  var spaceName = instance.name;
  SSSetSpaceForName(instance, spaceName);
  instance.addEvent('onShiftUpdate', SSSaveShift.bind(this));
  var spaceDir = SSURLForSpace(spaceName);

  // if a css file is defined in the attributes load the style
  if (instance.attributes().css) 
  {
    if (instance.attributes().css.indexOf('/') == -1) 
    {
      var css = spaceDir + instance.attributes().css;
      instance.attributes().css = css;
    }
    setTimeout(SSLoadStyle.bind(ShiftSpace, [instance.attributes().css, instance.onCssLoad.bind(instance)]), 0);
  }

  // This exposes each space instance to the console
  if (typeof ShiftSpaceSandBoxMode != 'undefined') 
  {
    ShiftSpace[instance.attributes().name + 'Space'] = instance;
  }

  if(ShiftSpace.Console)
  {
    instance.addEvent('onShiftHide', ShiftSpace.Console.hideShift.bind(ShiftSpace.Console));
  }

  instance.addEvent('onShiftShow', function(shiftId) {
    if(ShiftSpace.Console) ShiftSpace.Console.showShift(shiftId);
  });
  instance.addEvent('onShiftBlur', function(shiftId) {
    SSBlurShift(shiftId);
    if(ShiftSpace.Console) ShiftSpace.Console.blurShift(shiftId);
  });
  instance.addEvent('onShiftFocus', function(shiftId) {
    SSFocusShift(shiftId);
    if(ShiftSpace.Console) ShiftSpace.Console.focusShift(shiftId);
  });
  instance.addEvent('onShiftSave', function(shiftId) {
    if(ShiftSpace.Console)
    {
      ShiftSpace.Console.blurShift(shiftId);
    }
  });

  instance.addEvent('onShiftDestroy', SSUnloadShift);
}


function SSIsAbsoluteURL(string)
{
  return (string.search("http://") == 0);
}


function SSLoadDefaultSpacesAttributes()
{
  var defaultSpaces = {};
  __defaultSpacesList.length.times(function(i) {
    try
    {
      var spaceName = __defaultSpacesList[i];
      SSLoadSpaceAttributes(spaceName, function(attrs) {
        defaultSpaces[spaceName] = attrs;
        defaultSpaces[spaceName].position = i;
        if(i == (__defaultSpacesList.length-1)) 
        {
          SSInitDefaultSpaces(defaultSpaces);
          SSPostNotification("onDefaultSpacesAttributesLoad", defaultSpaces);
        }
      });
    }
    catch (exc)
    {
      console.error("Error attempting to load attributes for " + spaceName + ".");
    }
  });
}

/*
Function: SSLoadSpaceAttributes
  Loads the attributes for the space. This is a json file named attrs.json
  that sits in that space's directory.
*/
function SSLoadSpaceAttributes(space, callback)
{
  SSLoadFile(ShiftSpace.info().spacesDir+space+'/attrs.json', function(response) {
    // check to see that the resources urls are full
    var json = JSON.decode(response.responseText);
    
    if(!json.name)
    {
      throw new SSException("No name for " + json.name + " space specified.");
    }
    if(!json.url)
    {
      throw new SSException("No url for " + json.name + " space specified.");
    }
    
    if (!json.icon)
    {
      json.icon = json.url + json.name + '.png';
    }
    
    // clear whitespace
    if(json.url) json.url = json.url.trim();
    if(json.icon) json.icon = json.icon.trim();
    if(json.css) json.css = json.css.trim();
    
    if(!SSIsAbsoluteURL(json.url)) json.url = json.url.substitute({SPACEDIR:ShiftSpace.info().spacesDir});
    if(!SSIsAbsoluteURL(json.icon)) json.icon = json.url + json.icon;
    if(!SSIsAbsoluteURL(json.css)) json.css = json.url + json.css;
    
    // position default to end
    json.position = $H(SSInstalledSpaces()).getLength();
    
    callback(json);
  });
}

function SSGetSpaceAttributes(space)
{
  // TODO: fix the resolution of the icon url - David
  return SSInstalledSpaces()[space];
}

/*
Function: SSInstallSpace
  Loads the JavaScript source of a Space, then loads the space into memory.
  The source URL is saved in the 'installed' object for future reference.

Parameters:
  space - The Space name to install
*/
function SSInstallSpace(space)
{
  if(!SSURLForSpace(space))
  {
    var url = SSInfo().spacesDir + '/' + space + '/' + space + '.js';
    var count = $H(SSInstalledSpaces()).getLength();
    
    SSLoadSpaceAttributes(space, function(attrs) {
      // TODO: throw an error if no attributes file - David
      if(!attrs)
      {
        var attrs = {
          url:url, 
          name:space, 
          position: count, 
          icon: space+'/'+space+'.png',
          autolaunch: false
        };
      }
      
      var installed = SSInstalledSpaces();
      installed[space] = attrs;
      
      SSSetInstalledSpaces(installed);
      SSLoadSpace(space, function() {
        alert(space + " space installed.");
        SSPostNotification('onSpaceInstall', space);
      });
      
    });
  }
};

/*
Function: SSUninstallSpace
  Removes a space from memory and from stored caches.

Parameters:
    space - the Space name to remove
*/
function SSUninstallSpace(spaceName) 
{
  var url = SSURLForSpace(spaceName);
  SSRemoveSpace(spaceName);
  var installed = SSInstalledSpaces();

  delete installed[spaceName];

  if($H(installed).getLength() == 0)
  {
    SSSetInstalledSpaces(null);
  }
  else
  {
    SSSetInstalledSpaces(installed);
  }

  SSClearCache(url);
  // let everyone else know
  SSPostNotification('onSpaceUninstall', spaceName);
};


function SSSetInstalledSpaces(installed)
{
  __installedSpacesDataProvider.setInstalledSpaces(installed);
}


function SSInstalledSpaces()
{
  return __installedSpaces || SSDefaultSpaces();
}


function SSUpdateInstalledSpaces(force)
{
  __installedSpaces = __installedSpacesDataProvider.installedSpaces();
}


function SSInitDefaultSpaces(defaults)
{
  if(defaults)
  {
    SSSetValue('defaultSpaces', defaults);
  }

  __defaultSpaces = defaults || SSGetValue('defaultSpaces');
}


function SSDefaultSpaces()
{
  return __defaultSpaces;
}


function SSURLForSpace(spaceName)
{
  var installed = SSInstalledSpaces();
  return (installed[spaceName] && installed[spaceName].url) || null;
}


function SSUninstallAllSpaces()
{
  for(var spaceName in SSInstalledSpaces())
  {
    SSUninstallSpace(spaceName);
  }
}


function SSResetSpaces()
{
}

/*
  Function: SSpaceForName
    Returns the space associated with a particular name.
    
  Parameters:
    space - the name of the space.
    
  Returns:
    The space instance.
*/
function SSSpaceForName(name)
{
  return __spaces[name];
}

/*
  Function: SSSetSpaceForName
    Set the space instance for a name.
    
  Parameters:
    space - a space instance.
    name - the name of the space.
    
  Returns:
    nothing
*/
function SSSetSpaceForName(space, name)
{
  __spaces[name] = space;
}

function SSSetSpacePositions(spaceName, newpos)
{
  
}

function SSSpacesByPosition()
{
  var spaces = SSInstalledSpaces();
  var result = [];
  $H(spaces).each(function(v, k) {
    result.push(v);
  });
  result.sort(function(a, b) {
    return a.position - b.position;
  });
  return result;
}

function SSSpaceForPosition(index)
{
  return SSSpacesByPosition()[index];
}

/*
  Function: SSRemoveSpace
    Removes a space from the interal instances hash.
    
  Parameters:
    name - the name of the space to remove.
    
  Return:
    nothing.
*/
function SSRemoveSpace(name)
{
  delete __spaces[name];
}

/*
  Function:
    Returns the number of installed spaces.
    
  Returns:
    An int.
*/
function SSSpacesCount()
{
  var length;
  for(var space in __spaces) length++;
  return length;
}

function SSAllSpaces()
{
  return __spaces;
}

/*
SSFocusSpace
Focuses a space.

Parameter:
  space - a ShiftSpace.Space instance
*/
function SSFocusSpace(space, position)
{
  var lastFocusedSpace = SSFocusedSpace();

  if(lastFocusedSpace && lastFocusedSpace != space)
  {
    // check to see if focused space
    lastFocusedSpace.setIsVisible(false);
    lastFocusedSpace.hideInterface();
  }

  // set the focused space private var
  SSSetFocusedSpace(space);
  space.setIsVisible(true);
  space.showInterface();
}

/*
  Function: SSFocusedSpace
    Returns the currently focused space object.

  Returns:
    A space object.
*/
function SSFocusedSpace()
{
  return __focusedSpace;
}

/*
  Function: SSSetFocusedSpace
    Should never be called

  Parameters:
    newSpace - a space object.
*/
function SSSetFocusedSpace(newSpace)
{
  __focusedSpace = newSpace;
}


/*
  Function: SSSpaceForShift
    Returns the space singleton for a shift.

  Parameters:
    shiftId - a shift id.

  Returns:
    The space singleton.
*/
function SSSpaceForShift(shiftId)
{
  var shift = SSGetShift(shiftId);
  return SSSpaceForName(shift.space);
}


function SSSpaceNameForShift(shiftId)
{
  var shift = SSGetShift(shiftId);
  return shift.space;
}


function SSCheckForInstallSpaceLinks()
{
  $$('.SSInstallFirstLink').setStyle('display', 'none');

  $$('.SSInstallSpaceLink').each(function(x) {
    x.setStyle('display', 'block');
    x.addEvent('click', SSHandleInstallSpaceLink);
  });
}


function SSHandleInstallSpaceLink(_evt)
{
  var evt = new Event(_evt);
  var target = evt.target;
  var spaceName = target.getAttribute('title');
  
  // first check for the attributes file
  SSInstallSpace(spaceName);
}


function SSGetInfoForInstalledSpace(spaceName, callback)
{
  // fetch data for the space
}


function SSSetInstalledSpacesDataProvider(dataProvider)
{
  __installedSpacesDataProvider = dataProvider;
}


function SSInjectSpaces()
{
  for (var space in SSInstalledSpaces())
  {
    try
    {
      SSLoadSpace(space);
    }
    catch(err)
    {
      SSLog('Error: could not load ' + space, SSLogForce);
    }
  }
}