// ==UserScript==
// @name           ShiftSpace
// @namespace      http://shiftspace.org/
// @description    An open source layer above any website
// @include        *
// @exclude        http://metatron.shiftspace.org/api/sandbox/*
// @exclude        http://shiftspace.org/api/sandbox/*
// @exclude        http://www.shiftspace.org/api/sandbox/*
// @exclude        %%SERVER%%sandbox/*
// @require        %%SERVER%%externals/mootools-1.2.3-core.js
// @require        %%SERVER%%externals/mootools-1.2.3.1-more.js
// @require        %%SERVER%%externals/Videobox.js
// ==/UserScript==

/*

WHOA, WHAT JUST HAPPENED?

If you've just clicked a link and you're seeing this source code, wondering what
just happened, this is a Greasemonkey userscript. To use ShiftSpace you probably
need to install a Firefox extension called Greasemonkey. (Or, if you're not
running Firefox, you ought to install it first.)

For more info about Greasemonkey, go to www.greasespot.net

- - - -

Avital says: "I will only grow vegetables if I love to grow vegetables."
Mushon says: "Make it a Dorongle!"
David says: "I am against smart!"
Avital says: "Who knows what will happen by 2012?! The dinosaurs might be back!"
Avital says: (replace any-string-in-the-world "There's no point, just use Lisp")
Avital says: "Strict mode?! Keep the errors to yourself!"

Script: shiftspace.user.js
    ShiftSpace: An Open Source layer above any webpage

License:
    - GNU General Public License
    - GNU Lesser General Public License
    - Mozilla Public License

Credits:
    - Created by Mushon Zer-Aviv, Dan Phiffer, Avital Oliver, David Buchbut,
      David Nolen and Joe Moore
    - Thanks to Clay Shirky, Johan Sundstrom, Eric Heitzman, Jakob Hilden,
      _why, Aaron Boodman and Nancy Hechinger

*/

if(typeof console != 'undefined' && console.log)
{
  console.log('Loading ShiftSpace');
}
else
{
  var console = {};
  console.log = function(){};
}

/*

Class: ShiftSpace
  A singleton controller object that represents ShiftSpace Core. All methods
  functions and variables are private.  Please refer to the documention on <User>,
  <ShiftSpace.Space>, <ShiftSpace.Shift>, <ShiftSpace.Plugin> to see public
  interfaces.
*/

var ShiftSpace = new (function() {
    // INCLUDE Bootstrap
    
    /*

    Function: initialize
    Sets up external components and loads installed spaces.

    */
    this.initialize = function() {
      // INCLUDE PostInitDeclarations
      
      // look for install links
      SSCheckForInstallSpaceLinks();
      if(SSLocalizedStringSupport()) SSLoadLocalizedStrings("en");
      
      // INCLUDE PACKAGE ShiftSpaceUI
      
      ShiftSpace.Console = new SSConsole();
      ShiftSpace.Notifier = new SSNotifierView();
      ShiftSpace.SpaceMenu = new SSSpaceMenu(null, {location:'views'}); // we need to say it lives in client/views - David
      ShiftSpace.Sandalphon = Sandalphon;
      
      // Add to look up table
      ShiftSpaceObjects.ShiftSpace = SSNotificationProxy;
      
      // FIXME: this should be more modular! - David 6/3/09
      SSSetInstalledSpacesDataProvider(ShiftSpaceUser);
      SSAddObserver(SSNotificationProxy, 'onInstalledSpacesDidChange', SSUpdateInstalledSpaces);
      
      // Set up user event handlers
      SSAddObserver(SSNotificationProxy, 'onUserLogin', function() {
      });

      SSAddObserver(SSNotificationProxy, 'onUserLogout', function() {
        SSLog('ShiftSpace detects user logout', SSLogForce);
      });
      
      SSLoadStyle('styles/ShiftSpace.css', function() {
        SSCreateErrorWindow();
      });
      
      // hide all pinWidget menus on window click
      window.addEvent('click', function() {
        if(ShiftSpace.Console)
        {
          __pinWidgets.each(function(x){
            if(!x.isSelecting) x.hideMenu();
          });
        }
      });

      SSCreatePinSelect();
      SSCheckForPageIframes();
      SSCreateModalDiv();
      SSCreateDragDiv();
      
      SSSync();
    };
    
    /*
    Function: SSSynch
      Synchronize with server: checks for logged in user.
    */
    function SSSync() 
    {
      SSLog('SSSync', SSLogForce);
      var params = {
        href: window.location.href
      };
      SSServerCall('query', params, function(json) {
        SSLog("sync'ed!", SSLogForce);
        if (json.error) 
        {
          console.error('Error checking for content: ' + json.error.message);
          return;
        }

        if(json.data.user)
        {
          ShiftSpace.User.syncData(json.data.user)
        }
        
        SSUpdateInstalledSpaces();
        
        // wait for Console and Notifier
        var ui = [ShiftSpace.Console, ShiftSpace.Notifier, ShiftSpace.SpaceMenu];
        if(!ui.every($msg('isLoaded')))
        {
          ui.each($msg('addEvent', 'load', function(obj) {
            if(ui.every($msg('isLoaded')))
            {
              SSPostNotification("onSync");
            }
          }.bind(this)))
        }
        else
        {
          SSPostNotification("onSync");
        }
        
        SSLog('SSInitDefaultSpaces', SSLogForce);
        SSInitDefaultSpaces();
        
        if(SSDefaultSpaces())
        {
          SSLog('SSSetup', SSLogForce);
          SSSetup();
        }
        else
        {
          SSAddObserver(SSNotificationProxy, "onDefaultSpacesAttributesLoad", SSSetup);
          SSLoadDefaultSpacesAttributes();
        }
      });
    }
    
    function SSSetup()
    {
      if (typeof ShiftSpaceSandBoxMode != 'undefined')
      {
        SSInjectSpaces();
      }

      // automatically load a space if there is domain match
      var installed = SSInstalledSpaces();
      for(var space in installed)
      {
        var domains = installed[space].domains;
        if(domains)
        {
          var host = "http://" + window.location.host;
          var domainMatch = false;
          for(var i = 0; i < domains.length; i++)
          {
            if(domains[i] == host)
            {
              domainMatch = true;
              continue;
            }
          }
          if(domainMatch)
          {
            SSLoadSpace(space, function(spaceInstance) {
              spaceInstance.showInterface();
            });
          }
        }
      }
    }

    // TODO: write some documentation here
    function SSCheckForUpdates()
    {
      // Only check once per page load
      if (alreadyCheckedForUpdate) 
      {
        return false;
      }
      alreadyCheckedForUpdate = true;

      var now = new Date();
      var lastUpdate = SSGetValue('lastCheckedForUpdate', now.getTime());

      // Only check every 24 hours
      if (lastUpdate - now.getTime() > 86400)
      {
        SSSetValue('lastCheckedForUpdate', now.getTime());

        GM_xmlhttpRequest({
          method: 'POST',
          url: SSInfo().server + 'server/?method=version',
          onload: function(rx)
          {
            if (rx.responseText != version)
            {
              if (confirm('There is a new version of ShiftSpace available. Would you like to update now?'))
              {
                window.location = 'http://www.shiftspace.org/api/shiftspace?method=shiftspace.user.js';
              }
            }
          }
        });

        return true;
      }
      return false;
    };

    /*
    Function: SSClearCache
      Expunge previously stored files.

    Parameters:
        url - (Optional) The URL of the file to remove. If not specified, all
              files in the cache will be deleted.
    */
    function SSClearCache(url) 
    {
      if (typeof url == 'string') 
      {
        // Clear a specific file from the cache
        SSLog('Clearing ' + url + ' from cache', SSLogSystem);
        SSSetValue('cache.' + url, 0);
      } 
      else 
      {
        // Clear all the files from the cache
        cache.each(function(url) {
          SSLog('Clearing ' + url + ' from cache', SSLogSystem);
          SSSetValue('cache.' + url, 0);
        });
      }
    };

    // In sandbox mode, expose something for easier debugging.
    if (typeof ShiftSpaceSandBoxMode != 'undefined')
    {
      unsafeWindow.ShiftSpace = this;
      this.sys = __sys__;
      this.SSTag = SSTag;
      this.spaceForName = SSSpaceForName;
    }

    return this;
})();

// NOTE: To keep SS extensions out of private scope - David
ShiftSpace.__externals = {
  evaluate: function(external, object)
  {
    with(ShiftSpace.__externals)
    {
      eval(external);
    }
  }
};
