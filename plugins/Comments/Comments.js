var CommentsPlugin = new Class({
  
  Extends: ShiftSpace.Plugin,

  pluginType: ShiftSpace.Plugin.types.get('kInterfaceTypePlugin'),

  attributes:
  {
    name: 'Comments',
    title: null,
    icon: null,
    css: 'Comments.css',
    version: 0.2
  },
  
  setup: function()
  {
    // Listen to the relevant events
    if(ShiftSpace.Console) ShiftSpace.Console.addEvent('onHide', this.hideInterface.bind(this));
    
    ShiftSpace.User.addEvent('onUserLogin', function() {
      if(this.isVisible()) this.refresh();
    }.bind(this));
    
    ShiftSpace.User.addEvent('onUserLogout', function() {
      if(this.isVisible()) this.refresh();
    }.bind(this));
  },
  
  
  setCurrentShiftId: function(newShiftId)
  {
    this.__currentShiftId__ = newShiftId;
  },
  
  
  currentShiftId: function()
  {
    return this.__currentShiftId__;
  },
  
  
  showCommentsForShift: function(shiftId)
  {
    this.setCurrentShiftId(shiftId);
    this.loadCommentsForShift(shiftId, this.showInterface.bind(this));
  },
  
  
  loadCommentsForShift: function(shiftId, callback)
  {
    this.serverCall('load', {
      shiftId: shiftId
    }, function(json) {
      // load up the html
      if(!this.frame) 
      {
        this.delayedContent = json;
      }
      else
      {
        this.update(json);
      }
      if(callback && typeof callback == 'function') callback();
      if(callback && typeof callback != 'function') console.error("loadCommentsForShift: callback is not a function.");
    }.bind(this));
  },
  
  
  refresh: function()
  {
    this.loadCommentsForShift(this.currentShiftId());
  },
  
  
  addComment: function()
  {
    var newComment = $(this.frame.contentWindow.document.getElementById('comment-reply')).getProperty('value');
    SSLog('addComment ' + newComment);
    if(newComment != '')
    {
      this.serverCall('add', {
        shiftId: this.currentShiftId(),
        content: newComment
      }, function(json) {
        this.refresh();
        // notify listeners
        this.fireEvent('onCommentAdd', this.currentShiftId());
        // TODO: fix this at some point, we need a notification system - David
        if(ShiftSpace.Console) ShiftSpace.Console.addCommentToShift(this.currentShiftId());
      }.bind(this));
    }
  },
  
  
  deleteComment: function(debugId)
  {
    this.serverCall('delete', {
      id: debugId,
      shiftId: this.currentShiftId()
    });
  },
  
  
  updateComment: function(debugId)
  {
    this.serverCall('update', {
      id: debugId,
      comment: 'Updated comment!'
    });
  },
  
    
  editComment: function()
  {
    // show the editing interface
  },
  
  
  showInterface: function(animate)
  {
    if(!this.isShowing())
    {
      this.setIsShowing(true);
      
      if(!this.interfaceIsBuilt())
      {
        this.buildInterface();
      }
    
      this.element.removeClass('SSDisplayNone');
    
      if(!this.isVisible() && ShiftSpace.Console)
      {
        ShiftSpace.Console.halfMode(function() {
          var resizeFx = this.element.effects({
            duration: 300,
            transition: Fx.Transitions.Cubic.easeIn,
            onComplete: function()
            {
              this.setIsVisible(true);
              this.setIsShowing(false);
            }.bind(this)
          });
    
          resizeFx.start({
            height: [0, 370]
          });
        }.bind(this));
      }
    }
  },
  

  hideInterface: function(animate)
  { 
    SSLog('hideInterface');
    if(this.interfaceIsBuilt() && !this.isHiding())
    {
      this.setIsHiding(true);
      
      // put the Console back to normal width
      var resizeFx = this.element.effects({
        duration: 300,
        transition: Fx.Transitions.Cubic.easeIn,
        onComplete: function() {
          this.setIsShowing(false);
          this.setIsHiding(false);
          // hide ourselves
          this.element.addClass('SSDisplayNone');
          this.setIsVisible(false);
          if(ShiftSpace.Console) ShiftSpace.Console.fullMode();
        }.bind(this)
      });
    
      resizeFx.start({
        height: [this.element.getStyle('height'), 0]
      });
    }
  },
  

  setIsHiding: function(newValue)
  {
    this.__isHiding__ = newValue;
  },
  
  
  isHiding: function()
  {
    return this.__isHiding__;
  },
  
  
  setIsShowing: function(newValue)
  {
    this.__isShowing = newValue;
  },


  isShowing: function()
  {
    return this.__isShowing;
  },
  
  
  setIsVisible: function(newValue)
  {
    this.__isVisible = newValue;
  },
  
  
  isVisible: function()
  {
    return this.__isVisible;
  },
  

  attachEvents: function()
  {
    SSLog('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
    SSLog('attachEvents ' + this.minimizer);

    this.minimizer.addEvent('click', this.hideInterface.bind(this));

    var overflow = $(document.body).getStyle('overflow');

    this.element.makeResizable({
      modifiers: {x:'', y:'height'},
      invert: true,
      handle: this.comCount,
      onStart: function()
      {
        var windowSize = window.getSize().size;
        var windowScrollSize = window.getSize().scrollSize;
        var setOverflow = (windowSize.y == windowScrollSize.y);
        
        if(setOverflow) $(document.body).setStyle('overflow', 'hidden');
      },
      onComplete: function()
      {
        var windowSize = window.getSize().size;
        var windowScrollSize = window.getSize().scrollSize;
        var setOverflow = (windowSize.y == windowScrollSize.y);

        if(setOverflow) $(document.body).setStyle('overflow', overflow);
      }
    });
    
  },
  
  
  frameLoaded: function()
  {
    SSLog('frame loaded');
    this.loadStyle('Comments.css', this.frameCSSLoaded.bind(this), this.frame);
  },
  
  
  frameCSSLoaded: function()
  {
    // now we can add the html stuff
    SSLog('frame CSS loaded');
    
    if(this.delayedContent)
    {
      this.update(this.delayedContent);
      delete this.delayedContent;
    }
  },
  
  
  update: function(json)
  {
    SSLog('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> update');
    
    this.frame.contentWindow.document.body.innerHTML = json.html;
    $('com-count-span').setText(json.count);
    
    // attach events
    // can listen to window events?
    var self = this;
    
    var replyButton =  $(ShiftSpace._$(this.frame.contentWindow.document.body).getElementByClassName('com-reply'));
    if(replyButton) replyButton.addEvent('click', function(_evt) {
      var evt = new Event(_evt);
      SSLog('scroll!');
      self.frame.contentWindow.scrollTo(0, $(self.frame.contentWindow.document.body).getSize().size.y);
    });
    
    var submitButton = $(this.frame.contentWindow.document.getElementById('submit'));
    if(submitButton) submitButton.addEvent('click', function(_evt) {
      var evt = new Event(_evt);
      self.addComment();
    });
  },
  
  
  buildInterface: function()
  {
    this.setInterfaceIsBuilt(true);
    
    this.element = new ShiftSpace.Element('div', {
      id: 'SSComments',
      'class': 'InShiftSpace SSDisplayNone',
      'height': 0
    });
    
    this.comHeader = new ShiftSpace.Element('div', {
      id: "com-header",
      'class': "InShiftSpace"
    });
    this.comBody = new ShiftSpace.Element('div', {
      id: "com-body",
      'class': "InShiftSpace"
    });
    
    this.comHeader.setHTML('<div id="com-count"><span id="com-count-span">34</span> Comments</div>' +
		                       '<div class="com-minimize" title="Minimize console"/></div>'); 
		                       
    this.comHeader.injectInside(this.element);
    this.comBody.injectInside(this.element);
    
    this.element.injectInside(document.body);
    
    this.frameWrapper = new ShiftSpace.Element('div', {
      id: "SSCommentsFrameWrapper"
    });
    
    this.frameWrapper.injectInside(this.comBody);
    
    // add the iframe after the main part is in the DOM
    this.frame = new ShiftSpace.Iframe({
      id: "SSCommentsFrame", 
      onload: this.frameLoaded.bind(this)
    });
    
    this.frame.injectInside(this.frameWrapper);
    
    this.minimizer = $$('.com-minimize')[0];
    this.comCount = $$('.com-count')[0];
		SSLog(this.minimizer);
    
    this.attachEvents();
  }
  
  
});


var Comments = new CommentsPlugin();
ShiftSpace.__externals.Comments = Comments; // For Safari & Firefox 3.1