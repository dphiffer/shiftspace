// ==Builder==
// @uiclass
// @required
// @package           ShiftSpaceCoreUI
// @dependencies      SSView
// ==/Builder==

var SSFramedView = new Class({
  
  Extends: SSView,
  name: 'SSFramedView',
  
  
  defaults: function()
  {
    return $merge(this.parent(), {
      location: 'customViews'
    });
  },
  
  
  initialize: function(el, options)
  { 
    // Check for Sandalphon Mode
    if(typeof SandalphonToolMode == 'undefined')
    {
      this.parent(el, options);
    }
    else
    {
      this.parent(el, $merge(options, {
        generateElement: false
      }));
    }

    if(typeof SandalphonToolMode == 'undefined')
    {
      var url = 'client/'+this.options.location+'/'+this.name+'/'+this.name+'Frame.css';
      SSLoadFile(url, this.onStyleLoad.bind(this));
    }
  },
  
  
  onStyleLoad: function(response)
  {
    var style = response.responseText;
    if(style) Sandalphon.addStyle(style);
    Sandalphon.load('/client/'+this.options.location+'/'+this.name+'/'+this.name, this.onInterfaceLoad.bind(this))
  },
  
  
  onInterfaceLoad: function(ui) 
  {
    this.ui = ui;
    this.element = new IFrame({
      'class': this.name+'Frame',
      events: {
        load: this.buildInterface.bind(this)
      }
    });
    
    var frag = Sandalphon.convertToFragment(this.ui['interface']);
    var id = frag.getProperty('id');
    if(id)
    {
      this.element.setProperty('id', id);
    }
    
    SSSetControllerForNode(this, this.element);
    this.element.injectInside(document.body);
  },
  
  
  contentDocument: function()
  {
    return new Document(this.element.contentDocument);
  },
  
  
  contentWindow: function()
  {
    return new Window(this.element.contentWindow);
  },
  
  
  forwardEvents: function()
  {
    
  },
  
  
  buildInterface: function()
  {
    var context = this.contentWindow();
    var doc = this.contentDocument();
    
    // forward key up and down events to parent window
    context.addEvent('keyup', function(evt) {
      evt = new Event(evt);
      SSFireEvent('keyup', evt);
    });
    context.addEvent('keydown', function(evt) {
      evt = new Event(evt);
      SSFireEvent('keydown', evt); 
    });
    
    this.element.getElement = function(sel) {
      return this.contentWindow().$$(sel)[0];
    }.bind(this);
    
    this.element.getElements = function(sel) {
      return this.contentWindow().$$(sel);
    }.bind(this);
    
    // store the name on the window for debugging
    context.__ssname = this.element.getProperty('id');
    context.__sscontextowner = this;
    
    Sandalphon.addStyle(this.ui.styles, context);
    
    var children = Sandalphon.convertToFragment(this.ui['interface'], context).getChildren();
    
    $(doc.body).setProperty('class', this.name + 'FrameBody');
    $(doc.body).adopt.apply($(doc.body), children);
    
    Sandalphon.activate(context);
  },
  
  
  subViews: function()
  {
    return this.contentWindow().$$('*[uiclass]').map(SSControllerForNode);
  }
  
});