// ==Builder==
// @uiclass
// @customView
// @package           ShiftSpaceCoreUI
// @dependencies      SSFramedView
// ==/Builder==

var SSNotifierView = new Class({
  
  Extends: SSFramedView,
  name: 'SSNotifierView',

  initialize: function(el, options)
  {
    this.parent(el, options);
    this.setIsOpen(false);
    this.setIsAnimating(false);
    this.setShiftIsDown(false);
    
    SSAddObserver(this, 'onUserLogin', this.handleLogin.bind(this));
    SSAddObserver(this, 'onUserLogout', this.handleLogout.bind(this));
    SSAddObserver(this, 'onSync', this.handleSync.bind(this));

    /*
    SSAddObserver(this, 'showNotifier', this.show.bind(this));
    SSAddObserver(this, 'hideNotifier', this.hide.bind(this));

    SSAddObserver(this, 'openNotifier', this.open.bind(this));
    SSAddObserver(this, 'closeNotifier', this.close.bind(this));
    */
  },
  
  
  show: function()
  {
    if(this.showFx)
    {
      if(!this.isVisible()) this.showFx.start('.SSNotifierVisible');
    }
    else
    {
      SSAddObserver(this, 'onNotifierLoad', this.show.bind(this));
    }
  },
  
  
  hide: function()
  {
    this.showFx.start('.SSNotifierHidden');
  },
  
  
  handleSync: function()
  {
    ShiftSpace.User.getShifts(function(shifts) {
      if(shifts && shifts.length > 0)
      {
        this.show();
      }
    }.bind(this));
  },
  
  
  handleLogin: function()
  {
    this.updateControls();
  },
  
  
  handleLogout: function()
  {
    this.updateControls();
  },
  
  
  updateControls: function()
  {
    if(this.SSUsername)
    {
      this.SSUsername.set('text', ShiftSpace.User.getUsername());
    }
    
    if(this.SSLogInOut)
    {
      if(ShiftSpace.User.isLoggedIn())
      {
        this.SSLogInOut.set('text', 'Logout')
      }
      else
      {
        this.SSLogInOut.set('text', 'Login');
      }
    }
  },
  
  
  setIsVisible: function(val)
  {
    this.__visible = val;
  },
  
  
  isVisible: function()
  {
    return this.__visible;
  },
  
  
  setIsOpen: function(val)
  {
    this.__isOpen = val;
  },
  
  
  isOpen: function()
  {
    return this.__isOpen;
  },
  
  
  setIsAnimating: function(val)
  {
    this.__isAnimating = val;
  },
  
  
  isAnimating: function()
  {
    return this.__isAnimating;
  },
  
  
  attachEvents: function()
  {
    this.document().body.addEvent('mouseenter', this['open'].bind(this));
    this.document().body.addEvent('mouseleave', this['close'].bind(this));
    
    this.SSLogInOut.addEvent('click', function() {
      if(ShiftSpace.User.isLoggedIn())
      {
        ShiftSpace.User.logout()
      }
      else
      {
        ShiftSpace.Console.showLogin();
      }
    }.bind(this));
    
    window.addEvent('keyup', function(_evt) {
      var evt = new Event(_evt);
      SSLog('keyup', SSLogForce);
      if(evt.key == 'shift') this.handleKeyUp.bind(this, [evt]);
    }.bind(this));

    window.addEvent('keydown', function(_evt) {
      var evt = new Event(_evt);
      SSLog('keydown', SSLogForce);
      if(evt.key == 'shift') this.handleKeyDown.bind(this, [evt]);
    }.bind(this));
  },
  
  
  handleKeyUp: function(evt)
  {
    SSLog('handleKeyup ' + evt, SSLogForce);
    this.setShiftIsDown(false);
  },
  
  
  handleKeyDown: function(evt)
  {
    SSLog('handleKeyDown ' + evt, SSLogForce);
    this.setShiftIsDown(true);

    if(!this.isVisible())
    {
      
    }
    else
    {
      
    }
  },
  
  
  'open': function()
  {
    this.openTime = new Date();
    $clear(this.closeTimer);
    $clear(this.hideTimer);

    if(!this.isOpen() && !this.isAnimating())
    {
      this.openFx.start('width', window.getSize().x);
      this.setIsOpen(true);
    }
  },
  
  
  'close': function()
  {
    var now = new Date();
    
    if(this.isOpen() && !this.isAnimating())
    {
      var delta = now.getTime() - this.openTime.getTime();
    
      if(delta >= 3000)
      {
        this.setIsOpen(false);
        this.closeFx.start('width', 200);
      }
      else
      {
        $clear(this.closeTimer);
        this.closeTimer = this.close.delay(3000-delta, this);
      }
    }
  },
  
  
  showControls: function()
  {
    this.window().$$('.SSNotifierSubView').removeClass('SSActive');
    this.SSNotifierControlsView.addClass('SSActive');
  },
  
  
  hideControls: function()
  {
    this.window().$$('.SSNotifierSubView').removeClass('SSActive');
    this.SSNotifierDefaultView.addClass('SSActive');
  },
  
  
  onInterfaceLoad: function(ui)
  {
    this.parent(ui);
    this.element.setProperty('id', 'SSNotifier');
    this.element.addClass('SSNotifierHidden');
  },
  
  
  awake: function(context)
  {
  },
  
  
  onContextActivate: function(context)
  {
    if(context == this.element.contentWindow)
    {
      this.mapOutletsToThis();
      this.updateControls();
    }
  },
  
  
  setShiftIsDown: function(val)
  {
    this.__shiftIsDown = val;
  },
  
  
  shiftIsDown: function()
  {
    return this.__shiftIsDown;
  },
  
  
  initAnimations: function()
  {
    this.showFx = new Fx.Morph(this.element, {
      duration: 300,
      transition: Fx.Transitions.Cubic.easeOut,
      onStart: function()
      {
        this.setIsVisible(!this.isVisible());
      }.bind(this),
      onComplete: function()
      {
        if(!this.shiftIsDown()) this.hide.delay(3000, this);
      }.bind(this)
    });
    
    this.openFx = new Fx.Tween(this.element, {
      duration: 300,
      transition: Fx.Transitions.Cubic.easeOut,
      onStart: function()
      {
        this.setIsAnimating(true);
      }.bind(this),
      onComplete: function()
      {
        this.element.addClass('SSNotifierOpen');
        this.element.setStyle('width', null);
        this.setIsAnimating(false);
        this.showControls();
      }.bind(this)
    });
    
    this.closeFx = new Fx.Tween(this.element, {
      duration: 300, 
      transition: Fx.Transitions.Cubic.easeOut,
      onStart: function()
      {
        this.hideControls();
        this.setIsAnimating(true);
        this.element.setStyles({
          width: window.getSize().x
        });
        this.element.removeClass('SSNotifierOpen');
      }.bind(this),
      onComplete: function()
      {
        this.setIsAnimating(false);
        this.hideTimer = this.hide.delay(3000, this);
      }.bind(this)
    });
  },
  
  
  buildInterface: function()
  {
    SSLog('buildInterface', SSLogForce);
    this.parent();
    
    this.initAnimations();
    this.attachEvents();
    
    SSPostNotification('onNotifierLoad', this);
  }
});