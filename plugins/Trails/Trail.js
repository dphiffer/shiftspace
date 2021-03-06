// for check if window clicks occur during deletion
var Trail = new Class({
  initialize : function( _focusedShift, json)
  {
    json = this.normalize(json);
    
    // clear these globals
    Trail.gFocusedNode = null;
    Trail.gHoveredNode = null;
    
    var focusedShift = _focusedShift;
    
    // scroll to offset
    if(json.offset)
    {
      this.offset = {x: json.offset.x, y: json.offset.y};
      delete json.offset;
    }
    else
    {
      this.offset = {x: 0, y:0};
    }
    
    // scroll to the scroll offset if there is one
    if(!focusedShift)
    {
      $('SSTrailsPlugInScrollArea').setStyles({
        left: -500000 - this.offset.x,
        top: -500000 - this.offset.y
      });
    }
    else
    {
      var winSize = { x: self.innerWidth,
                      y: self.innerHeight };
      var winCenter = { x: 500000 + winSize.x/2,
                        y: 500000 + winSize.y/2 };
      var shiftLoc = json[_focusedShift].loc;
      var offsetLoc = { x: 500000 + shiftLoc.x,
                        y: 500000 + shiftLoc.y };
      
      var v = { x: offsetLoc.x - winCenter.x,
                y: offsetLoc.y - winCenter.y };
      
      // center the shift
      $('SSTrailsPlugInScrollArea').setStyles({
        left: -500000 - v.x - 40,
        top: -500000 - v.y - 30
      });
    }
    
    // convert the json object into a trail
    var temp = Trail.parse( json );
    
    // store the important references
    this.nodes = temp.nodes;
    this.links = temp.links;
    this.dict = temp.dict;
    this.linkTable = temp.linkTable;
    
    // zoom the focused shift
    this.dict[focusedShift].zoom();
    
    function setParent( x ) { x.parentTrail = this; };

    //  set references back to the parent trail
    this.nodes.each( setParent.bind( this ) );
    this.links.each( setParent.bind( this ) );
  },
  
  normalize: function(aTrail)
  {
    for(var trailId in aTrail)
    {
      var aShift = aTrail[trailId];
      if(!aShift.loc)
      {
        aShift.loc = {x:0, y:0};
      }
    }
    return aTrail;
  },
  
  /*
    Takes a shift in json format.
  */
  addShift : function( newShift )
  {
    var newNode = new TrailPage( Trail.kNULL, newShift );
    
    // add to the nodes list
    this.nodes.push( newNode );
    newNode.parentTrail = this;

    // add to the dicitonary
    this.dict[newNode.id] = newNode;
  },
  
  /*
    Remove any link connected to a shift
  */
  removeShift : function( aShift )
  {
    // remove references to the shift
    this.nodes.remove( aShift );
    delete this.dict[aShift.id];
    
    // get the connected nodes
    var connectedNodes = aShift.nodes;
    
    // remove all the links
    connectedNodes.each( function( nodeId ) {
      var linkRef = this.linkTable[aShift.id+':'+nodeId] || this.linkTable[nodeId+':'+aShift.id];

      // remove ref to this node in the sibling shift
      var otherShift = linkRef.getSibling( aShift );
      otherShift.nodes.remove( aShift.id );

      // remove the link
      this.links.remove( linkRef );
      linkRef.destroy();
      
      // reset flags
      Trail.gFocusedNode = null;
      Trail.gHoveredNode = null;
      
    }.bind( this ));
    
    aShift.destroy();
  },
  
  /*
    Add link to the trail.
  */
  addLink : function( newLink )
  {
    if( !this.links.contains( newLink ) )
    {
      // add to links array
      this.links.push( newLink );
      
      // add to linkTable as well
      var pair = newLink.getPair();
      this.linkTable[pair[0] + ':' + pair[1]] = newLink;

      // set ref back
      newLink.parentTrail = this;
    }
  },
  
  destroy : function()
  {
    var len = this.nodes.length;
    for( var i = 0; i < len; i++ )
    {
      this.nodes[i].destroy();
    }
    
    var len = this.links.length;
    for( var i = 0; i < len; i++ )
    {
      this.links[i].destroy();
    }
    
    // clear globals
    Trail.gFocusedNode = null;
    Trail.gHoveredNode = null;
  },
  
  // returns all the linked nodes
  getLinkedNodes : function( nodesArray )
  {
    var self = this;
    return nodesArray.map( function( x ) { return self.dict[x]; } );
  },
  
  deleteLink : function( nodeA, nodeB )
  {
    var linkToDelete = ( this.linkTable[nodeA.id+':'+nodeB.id] || this.linkTable[nodeB.id+':'+nodeA.id] );
    linkToDelete.destroy();
  },
  
  /*
    Convert to a Json object
  */
  encode : function()
  {
    var jsonobj = {};
    
    var len = this.nodes.length;
    for( var i = 0; i < len; i++ )
    {
      var curNode = this.nodes[i];
      var loc = curNode.getRealPosition();
      var id = curNode.id;

      // just store location and nodes
      jsonobj[id] = {
        loc : { x : loc.x, y : loc.y },
        nodes : curNode.nodes
      };
    }
    var ids = this.nodes.map(function(node) { return node.id});

    return { structure: Json.toString( jsonobj ), nodes: ids };
  },
  
  setDelegate: function(newDelegate)
  {
    this.__delegate = newDelegate;
  },
  
  delegate: function()
  {
    return this.__delegate;
  },
  
  isEditable: function()
  {
    return this.delegate().userCanEdit();
  }
});

/*
Class method.  This will take a json object in the following format

var aTrail = {
  node1 : {
    title : 'Foo',
    url : 'http://www.foo.com',
    loc : { x : 100, y : 100 },
    descr : 'Bar',
    nodes : ['node1', 'node2']
  }
}
*/
Trail.parse = function( json )
{
  var nodesHash = {};
  var linksHash = {};
  var linksList = [];

  // this is returned in case an actual trail object is being generated
  var nodes = [];
  var links = [];
  
  if(json.target)
  {
    var target = json.target;
    delete json.target;
  }
  else
  {
    var target = null;
  }
  
  for( var node in json )
  {
    var options = json[node];
    
    options.id = node;
    options.target = target;
    
    // create a new page store in the hash
    var newNode = new TrailPage( Trail.kNULL, options );
    nodes.push( newNode );

    nodesHash[node] = newNode;

    // parse the nodes
    newNode.nodes.each( function( x ) {
      if( !linksHash[node+':'+x] &&
          !linksHash[x+':'+node] )
      {
        linksHash[node+':'+x] = 1;
        linksHash[x+':'+node] = 1;

        // store the pair
        linksList.push( [node, x] );
      }
    } );
  }

  // link each pair
  var linkTable = {};
  linksList.each( function( pair ) {
    var newLink = new TrailLink( nodesHash[pair[0]], nodesHash[pair[1]] );
    linkTable[pair[0]+':'+pair[1]] = newLink;
    links.push( newLink );
  } );
  
  return { nodes : nodes, links : links, dict : nodesHash, linkTable : linkTable };
}

Trail.kNULL = 'null';
Trail.gDeleteFocusNode = null;
Trail.gFocusedNode = null;
Trail.gHoveredNode = null;

ShiftSpace.__externals.Trail = Trail; // For Safari