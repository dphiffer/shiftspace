// ==Builder==
// @optional
// @package           ShiftSpaceCore
// ==/Builder==

/*
  Class: AbstractUser
    Base class for representing users.
*/
var AbstractUser = new Class({
  
  Implements: Events,
  name: 'AbstractUser',
  
  defaultUserName: function()
  {
    return "";
  },
  
  
  initialize: function()
  {
    this.clearData();
  },
  
  
  data: function()
  {
    return {
      id: this.getId(),
      username: this.getUsername(),
      email: this.email()
    };
  },
  
  
  syncData: function(data)
  {
    this.setUsername(data.username || null);
    this.setEmail(data.email || null);
    this.setId(data.id || null);
  },
  
  
  clearData: function()
  {
    this.__username = null;
    this.__userId = null;
    this.__email = null;
  },
  
  
  setId: function(id)
  {
    this.__userId = id;
  },
  
  
  getId: function()
  {
    return this.__userId;
  },
  
  
  setUsername: function(username)
  {
    if(username != null && username != false)
    {
      this.__username = username;
    }
  },

  /*
    Function: getUsername
      Returns the logged in user's name.
      
    Returns:
      User name as string. Returns false if there is no logged in user.
  */
  getUsername: function() 
  {
    return (this.isLoggedIn() ? this.__username : this.defaultUserName());
  },
  
  
  setEmail: function(email)
  {
    if(email != '' && email != 'NULL' && email != null)
    {
      this.__email = email;
    }
    else
    {
      this.__email = '';
    }
  },
  
  
  email: function()
  {
    return this.__email;
  },
  
  
  /*
    Function: isLoggedIn
      Checks whether there is a logged in user.
      
    Returns:
      A boolean.
  */
  isLoggedIn: function(showErrorAlert) 
  {
    return (this.getId() != null);
  },
  
  
  query: function()
  {
    SSServerCall('user.query', null, function(json) {
      if(json.data) this.syncData(json.data);
      this.onQuery(json);
    }.bind(this));
  },
  
  
  onQuery: function(json)
  {
    SSPostNotification('onUserQuery', json);
  },
  
  /*
    Function: login (private)
      Login a user. Will probably be moved into ShiftSpace.js.

    Parameters:
      credentials - object with username and password properties.
  */
  login: function(credentials) 
  {
    SSServerCall('user.login', credentials, function(json) {
      if(!json['error'])
      {
        if(json.data) this.syncData(json.data);
        this.onLogin(json);
      }
      else
      {
        this.onLoginError(json);
      }
    }.bind(this));
  },
  
  
  onLogin: function(json)
  {
    SSPostNotification('onUserLogin', json);
  },
  
  
  onLoginError: function(json)
  {
    SSPostNotification('onUserLoginError', json);
  },
  
  /*
    Function: logout (private)
      Logout a user. Will probably be moved into ShiftSpace.js.
  */
  logout: function()
  {
    SSServerCall('user.logout', null, function(json) {
      this.clearData();
      if(!json['error'])
      {
        this.onLogout(json);
      }
      else
      {
        this.onLogoutError(json);
      }
    }.bind(this));
  },
  
  
  onLogout: function(json)
  {
    SSPostNotification('onUserLogout', json);
  },
  
  
  onLogoutError: function(json)
  {
    SSPostNotification('onUserLogoutError', json);
  },
  
  
  /*
    Function: join (private)
      Join a new user.  Will probably be moved into ShiftSpace.js.
  */
  join: function(userInfo, callack) 
  {
    SSServerCall('user.join', userInfo, function(json) {
      if(!json['error'])
      {
        var data = $get(json, 'data', 'contents', 'values');
        if(data) this.syncData(data);
        
        this.onJoin(json);
        this.onLogin(json);
        if(callack) callback(json);
      }
      else
      {
        this.onJoinError(json);
      }
    }.bind(this));
  },
  
  
  onJoin: function(json)
  {
    SSPostNotification('onUserJoin', json);
  },
  
  
  onJoinError: function(json)
  {
    SSPostNotification('onUserJoinError', json);
  },
  
  
  /*
    Function: update
      Update a user's info.
      
    Parameters:
      info - info to be updated.
  */
  update: function(info, callback) 
  {
    SSServerCall('user.update', info, function(json) {
      if(!json['error'])
      {
        if(json.data) this.syncData(json.data);
        this.onUpdate(json);
        if(callback) callback(json);
      }
      else
      {
        this.onUpdateError(json);
      }
    }.bind(this));
  },
  
  
  onUpdate: function(json)
  {
    SSPostNotification('onUserUpdate', json);
  },
  
  
  onUpdateError: function(json)
  {
    SSPostNotification('onUserUpdateError', json);
  },
  
  
  /*
    Function: resetPassword (private)
      Reset a user's password
      
    Parameters:
      info - ?
  */
  resetPassword: function(info) 
  {
    SSServerCall('user.resetPassword', info, function(json) {
      if(!json['error'])
      {
        this.onResetPassword(json);
      }
      else
      {
        this.onResetPasswordError(json);
      }
    });
  },
  
  
  onResetPassword: function(json)
  {
    SSPostNotification('onUserPasswordReset', json);
  },
  
  
  onResetPasswordError: function(json)
  {
    SSPostNotification('onUserPasswordResetError', json);
  }
});
