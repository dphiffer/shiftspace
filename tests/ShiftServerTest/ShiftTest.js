// ==Builder==
// @test
// @suite             ShiftServerTest
// @dependencies      ShiftServerTestUtils
// ==/Builder==

var ShiftTest = new Class({
  Extends: SSUnitTest.TestCase,
  name: 'ShiftTest',

  onStart: function()
  {
    SSApp.confirm(SSApp.logout());
    SSApp.confirm(SSApp.login(admin));
    SSApp.confirm(SSApp['delete']('user', 'fakemary'));
    SSApp.confirm(SSApp.logout());
  },

  onComplete: function()
  {
    SSApp.confirm(SSApp.logout());
  },

  setup: function() 
  { 
    SSApp.confirm(SSApp.join(fakemary));
  },

  tearDown: function()
  {
    SSApp.confirm(SSApp['delete']('user', 'fakemary'));
  },
  
  create: $fixture(
    "Create a shift.",
    function()
    {
      var shiftA = SSApp.confirm(SSApp.create('shift', noteShift));
      var shiftB = SSApp.confirm(SSApp.read('shift', shiftA._id));
      SSUnit.assertEqual(shiftA._id, shiftB._id);
    }
  ),

  
  shiftDeleteOnUserDelete: $fixture(
    "Ensure a user's shift are deleted if his account is deleted",
    function()
    {
      var shift = SSApp.confirm(SSApp.create('shift', noteShift));
      SSApp.confirm(SSApp['delete']('user', 'fakemary'));
      SSApp.confirm(SSApp.login(admin));
      var json = SSApp.confirm(SSApp.read('shift', shift._id));
      SSUnit.assertEqual(SSGetType(json), ResourceDoesNotExistError);
    }
  ),
  
  
  createNotLoggedIn: $fixture(
    "Error trying to create shift if not logged in.",
    function()
    {
      SSApp.confirm(SSApp.logout());
      var json = SSApp.confirm(SSApp.create('shift', noteShift));
      SSUnit.assertEqual(SSGetType(json), UserNotLoggedInError);
      SSApp.confirm(SSApp.login(admin));
    }
  ),
  
  
  read: $fixture(
    "Read a shift.",
    function()
    {
      var shift = SSApp.confirm(SSApp.create('shift', noteShift));
      SSUnit.assertEqual(shift.space.name, "Notes");
      SSUnit.assertEqual(shift.content.text, "Hello world!");
    }
  ),
  

  draft: $fixture(
    "A draft should not be visible to anybody but a logged in owner.",
    function()
    {
      var shift = SSApp.confirm(SSApp.create('shift', noteShift));
      SSApp.confirm(SSApp.logout());
      SSApp.confirm(SSApp.join(fakedave));
      var json = SSApp.confirm(SSApp.read('shift', shift._id));
      SSUnit.assertEqual(SSGetType(json), PermissionError);
      SSApp.confirm(SSApp.logout());
      SSApp.confirm(SSApp.login(admin));
    }
  )/*,

  
  testPublishPublic: function()
  {
    this.doc("Publish a shift to the public.");
    var shiftId = SSGetData(app.create('shift', noteShift));
    app.action('shift/'+shiftId+'/publish', {
      private: false
    });
    // TODO: check that the shift is on the user's public stream - David 7/16/09
    logout();
    app.action('join', fakedave);
    
    // check it's readable by all
    var json = SSGetData(app.read('shift', shiftId));
    this.assertEqual(json.space.name, "Notes");
    
    // check comments stream
    json = SSGetData(app.get('shift/'+shiftId+'/comments'));
    this.assertEqual($type(json), "array");
    logout();
    
    login(admin);
    app.delete('user', 'fakedave');
  },
  
  
  testPublishPrivate: function()
  {
    this.doc("A private published shift should be visible only to people who have permission.");
    
    var shiftId = SSGetData(app.create('shift', noteShift));
    logout();
    
    join(fakedave);
    var json = app.read('shift', shiftId);
    this.assertEqual(SSGetType(json), PermissionError);
    logout();
    
    login(fakemary);
    app.action('shift/'+shiftId+'/publish', {
      users: ['fakedave']
    });
    logout();
    
    login(fakedave);
    json = SSGetData(app.read('shift', shiftId));
    this.assertEqual(json.space.name, "Notes");
    logout();
    
    join(fakejohn);
    json = app.read('shift', shiftId);
    this.assertEqual(SSGetType(json), PermissionError);
    logout();
    
    login(admin);
    app.delete('user', 'fakedave');
    app.delete('user', 'fakejohn');
  },


  testComment: function()
  {
    this.doc("Comment on a shift.");
    
    var shiftId = SSGetData(app.create('shift', noteShift));
    app.action('shift/'+shiftId+'/publish', {
      private: false
    });
    logout();
    
    join(fakedave);
    json = app.action('shift/'+shiftId+"/comment", {
      text: "Hey what a cool shift!"
    });
    json = SSGetData(app.get('shift/'+shiftId+'/comments'));
    this.assertEqual(json[0].content.text, "Hey what a cool shift!");
    logout();
    
    login(admin);
    app.delete('user', 'fakedave');
  },

  
  testReadPrivateComments: function()
  {
    this.doc("Error if attempt to read on private should. Should work for those with permission.");

    var shiftId = SSGetData(app.create('shift', noteShift));
    logout();
    
    join(fakedave);
    var json = app.get('shift/' + shiftId + '/comments');
    this.assertEqual(SSGetType(json), PermissionError);
    logout();
    
    // publish the shift
    login(fakemary);
    app.action('shift/'+shiftId+'/publish', {
      users: ['fakedave']
    });
    logout();
    
    login(fakedave);
    json = SSGetData(app.get('shift/' + shiftId + '/comments'));
    this.assertEqual($type(json), "array");
    logout();
    
    login(admin);
    app.delete('user', 'fakedave');
  },

  
  testNotify: function()
  {
    this.doc("A user on the shift comment stream notify list should get a message sent to his messageStream.");
    
    var shiftId = SSGetData(app.create('shift', noteShift));
    app.action('shift/'+shiftId+'/publish', {
      private: false
    });
    logout();
    
    join(fakedave);
    json = SSGetData.attempt(app.action('shift/'+shiftId+'/notify'));
    json = SSGetData.attempt(app.get('/user/fakedave'));
    this.assertEqual(json.notify.length, 1);
    logout();
    
    join(fakejohn);
    app.action('shift/'+shiftId+"/comment", {
      text: "Hey what a cool shift!"
    });
    logout();
    
    login(fakedave);
    json = SSGetData.attempt(app.get('user/fakedave/messages'));
    this.assertEqual(json[0].content.text, "Hey what a cool shift!");
    app.action('shift/'+shiftId+'/unnotify');
    json = SSGetData.attempt(app.get('/user/fakedave'));
    this.assertEqual(json.notify.length, 0);
    logout();
    
    login(fakejohn)
    app.action('shift/'+shiftId+"/comment", {
      text: "My other comment!"
    });
    json = SSGetData.attempt(app.get('shift/'+shiftId+'/comments'));
    this.assertEqual(json.length, 2);
    logout();
    
    login(fakedave);
    json = SSGetData.attempt(app.get('user/fakedave/messages'));
    this.assertEqual(json.length, 1);
    logout();
    
    login(admin);
    app.delete('user', 'fakedave');
    app.delete('user', 'fakejohn');
  },

  
  testUpdate: function()
  {
    this.doc("Update a shift");
    
    var shiftId = SSGetData.attempt(app.create('shift', noteShift));

    var json = SSGetData.attempt(app.update('shift', shiftId, {
      content: {
        text: "Changed the note!",
        position: {x:500, y:400},
        size: {x:500, y:400}
      }
    }));

    json = SSGetData.attempt(app.read('shift', shiftId));
    var content = json.content;
    
    this.assertEqual(content.text, "Changed the note!");
    this.assertEqual(content.position.x, 500);
    this.assertEqual(content.position.y, 400);
  },

  
  testUpdatePermission: function()
  {
    this.doc("Error updating a shift without the proper permissions. Admin allowed.");
    
    var shiftId = SSGetData.attempt(app.create('shift', noteShift));
    logout();
    // no logged in user
    var errType = SSGetType.attempt(app.update('shift', shiftId, {
      content: {
        text: "Changed the note!",
        position: {x:500, y:400},
        size: {x:500, y:400}
      }
    }));
    this.assertEqual(errType, UserNotLoggedInError);
    
    // wrong user
    join(fakedave);
    errType = SSGetType.attempt(app.update('shift', shiftId, {
      content: {
        text: "Changed the note!",
        position: {x:500, y:400},
        size: {x:500, y:400}
      }
    }));
    this.assertEqual(errType, PermissionError);
    logout();
    
    login(admin);
    app.update('shift', shiftId, {
      content: {
        text: "Changed the note!",
        position: {x:500, y:400},
        size: {x:500, y:400}
      }
    });
    var json = SSGetData.attempt(app.read('shift', shiftId));
    var content = json.content;
    this.assertEqual(content.text, "Changed the note!");
    this.assertEqual(content.position.x, 500);
    this.assertEqual(content.position.y, 400);
    
    app.delete('user', 'fakedave');
    // admin should be able to read
  },

  
  testDelete: function()
  {
    this.doc("Delete a shift.");
    
    var shiftId = SSGetData.attempt(app.create('shift', noteShift));
    app.delete('shift', shiftId);
    var errType = SSGetType.attempt(app.read('shift', shiftId))
    this.assertEqual(errType, ResourceDoesNotExistError);
  },
  
  
  testDeletePermission: function()
  {
    this.doc("Error deleting a shift without permission. Admin allowed");
    
    var shiftId = SSGetData.attempt(app.create('shift', noteShift));
    logout();
    
    var errType = SSGetType.attempt(app.delete('shift', shiftId));
    this.assertEqual(errType, UserNotLoggedInError);
    
    join(fakedave);
    errType = SSGetType.attempt(app.delete('shift', shiftId));
    this.assertEqual(errType, PermissionError);
    logout();
    
    login(admin);
    var json = app.delete('shift', shiftId);
    this.assertEqual(JSON.encode(json), ack);
    
    app.delete('user', 'fakedave');
  }*/
})

