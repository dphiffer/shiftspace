// ==Builder==
// @required
// @package           System
// @dependencies      SandalphonCore
// ==/Builder==

var SSSandalphonError = SSException;

SSSandalphonError.NoControllerForCSSId = new Class({
  Extends: SSSandalphonError,
  Implements: SSExceptionPrinter,
  name: "SSSandalphonError.NoSuchSubView"
});

var SSInstantiationListeners = {};
function SSAddInstantiationListener(element, listener)
{
  var id = element._ssgenId();
  if(!SSInstantiationListeners[id])
  {
    SSInstantiationListeners[id] = [];
  }
  SSInstantiationListeners[id].push(listener);
}

function SSNotifyInstantiationListeners(element)
{
  var listeners = SSInstantiationListeners[element.getProperty('id')];
  if(listeners)
  {
    listeners.each(function(listener) {
      if(listener.onInstantiate)
      {
        listener.onInstantiate();
      }
    });
  }
}

var __controllers__ = $H();

function SSClearControllersTable()
{
  __controllers__ = $H();
}

function SSClearObjects()
{
  ShiftSpaceObjects.empty();
  ShiftSpaceNameTable.empty();
}

// NOTE: we generate ids and store controller refs ourselves this is because of weird garbage collection
// around iframes and wrappers around dom nodes when SS runs under GM - David
function SSSetControllerForNode(controller, _node)
{
  var node = $(_node);

  // generate our own id
  node._ssgenId();
  // keep back reference
  __controllers__.set(node.getProperty('id'), controller);
}

// return the controller for a node
function SSControllerForNode(_node)
{
  var node = $(_node);
  
  if(node == null)
  {
    throw new SSSandalphonError.NoControllerForCSSId(new Error(), "No controller for element " + _node);
  }
  
  return __controllers__.get(node.getProperty('id')) ||
         (node.getProperty('uiclass') && new SSViewProxy(node)) ||
         null;
}

function SSControllerOrNode(object)
{
  return SSControllerForNode(object) || object;
}

function SSIsController(object)
{
  if($type(object) == 'element')
  {
    return false;
  }
  else if(object._genId)
  {
    return true;
  }
  return false;
}

function SSGetInlineOptions(el)
{
  var options = el.getProperty('options');
  return (options) ? JSON.decode(options.replace("\n", "")) : {};
}

var __ssappdelegate__;
function SSSetAppDelegate(delegate)
{
  __ssappdelegate__ = delegate;
}

function SSAppDelegate()
{
  return __ssappdelegate__;
}