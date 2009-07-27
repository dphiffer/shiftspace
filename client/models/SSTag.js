// ==Builder==
// @optional
// @package           ShiftSpaceCore
// @dependencies      SSAbstractStream
// ==/Builder==

var SSTag = new Class({
  
  Extends: SSAbstractStream,
  name: "SSTag",
  
  
  defaults: function()
  {
    return $merge(this.parent(), {
      createStream: false,
      private: 0
    });
  },
  
  
  initialize: function(tagName, options)
  {
    options = options || {};
    
    options.displayName = tagName;
    options.uniqueName = tagName;
    options.meta = "tag";

    if(options.category)
    {
      options.meta = "category";
      options.superStream = true;
    }

    this.parent(options);
    
    this.isUnique(tagName,
                  this.create.bind(this, [options]),
                  this.notUnique.bind(this));
  },
  
  
  onCreate: function(json)
  {
    this.parent(json);
    SSPostNotification('tagCreated');
  },
  
  
  notUnique: function(stream)
  {
    this.setData(stream);
  },
  
  
  addTag: function(id, resource, options)
  {
    var objectRef = (resource && !this.options.category) ? [resource, id].join(":") : id;
    
    var defaults = {
      displayString: null,
      uniqueName: objectRef,
      objectRef: objectRef,
      hasReadStatus: false
    };
    
    this.postEvent($merge(defaults, options), this.onAddTag.bind(this));
  },
  
  
  onPostEvent: function(json)
  {
    this.onAddTag(json);
  },
  
  
  onAddTag: function(json)
  {
    this.fireEvent('onAddTag', json);
  },
  
  
  removeTag: function(id, resource)
  {
    var objectRef = (resource) ? [resource, id].join(":") : id; 
    this.deleteEventByObjectRef(objectRef);
  },
  
  
  onDeleteEvent: function(json)
  {
    this.onRemoveTag(json);
  },

  
  onRemoveTag: function(json)
  {
    SSLog('onRemoveTag', SSLogForce);
    SSLog(json, SSLogForce);
  }
  
});

SSTag.tagClasses = ["SSTag"];
SSTag.isTag = function(obj)
{
  return SSTagClasses.indefOf(obj.name) != -1;
}

SSTag.find = function(objectRef, callback) {
  SSAbstractStream.findStreamsWithEvents(objectRef, callback);
};

SSTag.tag = function(tagName)
{
  return new SSTag(tagName);
}