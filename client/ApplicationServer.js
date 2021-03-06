Hash.implement({
  extract: function(ary)
  {
    var result = $H();
    ary.each(function(key) {
      if(this[key])
      {
        result[key] = this[key];
        delete this[key];
      }
    }, this);
    return result;
  }
});


var ApplicationServer = new Class({
  
  Implements: [Events, Options],
  
  defaults:
  {
    server: "http://localhost/~davidnolen/shiftspace/shiftserver/"
  },
  

  initialize: function(options)
  {
    this.setOptions(this.defaults, options);
    this.setServer(this.options.server);
  },

  
  setServer: function(url)
  {
    this.__server = url;
  },
  
  
  server: function()
  {
    return this.__server;
  },
  

  isNull: function(v)
  {
    return v != null;
  },
  
  
  urlOrder: ['resource', 'id', 'action'],
  
  
  genUrl: function(parts)
  {
    var ary = this.urlOrder.map(function(pname) {
      return parts[pname];
    }).filter(this.isNull);
    
    return ary.join('/');
  },
  
  
  call: function(options)
  {
    var urlParts = $H(options).extract(this.urlOrder);
    
    options = $merge(options, {
      url: this.server() + this.genUrl(urlParts),
      emulation: false
    });
    
    console.log(this.genUrl(urlParts));
    
    if(options.json)
    {
      if(!options.headers) options.headers = {};
      options.headers['Content-type'] = 'application/json';
      options.data = JSON.encode(options.data);
      delete options.json;
    }
    
    return new Request(options);
  }.decorate(promise),
  
  
  create: function(resource, data)
  {
    return this.call({resource:resource, method:'post', data:data, json: true});
  },
  
  
  read: function(resource, id)
  {
    return this.call({resource:resource, id:id, method:'get'});
  },
  
  
  update: function(resource, id, data)
  {
    return this.call({resource:resource, id:id, method:'put', data:data});
  },
  
  
  delete: function(resource, id)
  {
    return this.call({resource:resource, id:id, method:'delete'});
  },
  
  
  post: function(options)
  {
    return this.call($merge(options, {method:'post'}));
  },
  
  
  get: function(options)
  {
    return this.call($merge(options, {method:'get'}));
  }

});


var confirm = promise(function (value) {
  console.log(value);
});

/*
var app = new ApplicationServer();
confirm(app.post({action:"login", data:fakemary, json:true}))
*/