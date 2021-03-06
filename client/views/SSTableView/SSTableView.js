// ==Builder==
// @uiclass
// @required
// @package           ShiftSpaceCoreUI
// @dependencies      SSView
// ==/Builder==

/*
  Class: SSTableView
    View controller for table views in the ShiftSpace environment
*/
var SSTableView = new Class({

  Extends: SSView,
  DelegateProtocol: ['userClickedRow, userSelectedRow, itemForRowColumn, rowCount'],
  name: 'SSTableView',
    
  defaults: function() 
  {
    return $merge(this.parent(), {
      multipleSelection: false,
      toggleSelection: false,
      showHeader: false
    });
  },


  initialize: function(el, options)
  {
    // need to pass this up to parent
    this.parent(el, options);

    // for speed
    this.contentView = this.element.getElement('> .SSScrollView .SSContentView');
    this.setModelRow(this.contentView.getElement('.SSModel').dispose());
    this.setModelRowController(this.controllerForNode(this.modelRow()));
    this.setColumnNames(this.element.getElements('> .SSScrollView .SSDefinition col').map(function(x) {return x.getProperty('name');}));
    this.setColumnTitles(this.element.getElements('> .SSScrollView .SSDefinition col').map(function(x) {return x.getProperty('title');}));
    this.initColumnSort();
    
    if(this.options.showHeader)
    {
      this.initTableHead();
      this.initColumnResizers();
    }

    // give time for double click
    this.element.addEvent('click', function(_evt) {
      this.eventDispatch.delay(300, this, _evt);
    }.bind(this));

    this.element.addEvent('dblclick', this.eventDispatch.bind(this));
    window.addEvent('resize', this.refreshColumnHeadings.bind(this));
  },


  validateTable: function()
  {
    if(!this.contentView.getElement('> .SSDefinition'))
    {
      throw new SSException(new Error("SSTableView missing table definition, refer to documentation."), this);
    }
  },

  /*
    Function: initTableHead
      Initialize the table head.  This needs lives outside of the scroll view.  It's contents are built based
      on the table definition in the table's colgroup element.
  */
  initTableHead: function()
  {
    var tableHead = this.element.getElement('> .SSControlView');
    if(!tableHead)
    {
      tableHead = new Element('div', {
        "class": "SSControlView"
      });
      tableHead.injectTop(this.element);
    }
    this.initColumnHeadings();
  },

  /*
    Function: initColumnHeadings
      Intializes the actual column headings.
  */
  initColumnHeadings: function()
  {
    var model = this.element.getElement('> .SSControlView .SSModel');
    this.__columnHeadingModel = model.dispose();

    if(model)
    {
      var tableHead = this.element.getElement('> .SSControlView');
      
      // get the column names
      this.columnTitles().length.times(function(idx) {
        // grab the column name
        var columnTitle = this.columnTitles()[idx];
        // clone the heading
        var columnHeading = model.clone(true);
        // grab the column definition and set the heading width to it's dimensions
        var column = this.columnForIndex(idx);
        columnHeading.setStyle('width', column.getStyle('width'));
        // put the proper column heading title in there
        columnHeading.getElement('span.SSColumnHeadingTitle').set('text', columnTitle);
        // add it
        tableHead.grab(columnHeading);
      }.bind(this));
    }
    else
    {
      // hmm we really need a table head cell controller
    }
  },
  
  
  columnCount: function()
  {
    return this.contentView.getElements('> .SSDefinition col').length;
  },


  updateColumnTitles: function(columnTitles)
  {
    var tableHead = this.element.getElement('> .SSControlView');
    columnTitles.length.times(function(idx) {
      var columnTitle = columnTitles[idx];
      this.columnHeadingForIndex(idx).getElement('span.SSColumnHeadingTitle').set('text', columnTitle);
    }.bind(this));
  },
  
  /*
    Function: refreshColumnHeadings (private)
      Called after a window resize event.
  */
  refreshColumnHeadings: function()
  {
    // make the column titles refres to the column definition width - David
    this.columnHeadings().length.times(function(idx) {
      var colWidth = this.columnForIndex(idx).getSize().x || this.columnForIndex(idx).getStyle('width');
      this.columnHeadingForIndex(idx).setStyle('width', colWidth+1);
    }.bind(this));
  },

  /*
    Function: initColumnResizers
      Intializes the column resizers.
  */
  initColumnResizers: function()
  {
    var resizers = this.element.getElements('> .SSControlView .SSResize');
    var table = this.contentView;

    // setup the column resizers
    resizers.each(function(resizer) {
      resizer.getParent().makeResizable({
        handle:resizer,
        modifiers:{x:'width', y:''},
        onStart: function()
        {
          resizer.addClass('SSActive');
          resizer.getParent().setStyle('cursor', 'col-resize');
          if(resizer.getParent().getNext()) resizer.getParent().getNext().setStyle('cursor', 'col-resize');
        },
        onComplete: function()
        {
          resizer.removeClass('SSActive');
          resizer.getParent().setStyle('cursor', '');
          if(resizer.getParent().getNext()) resizer.getParent().getNext().setStyle('cursor', '');
        }
      });
    });

    // make the columns resizer adjust the table as well
    resizers.length.times(function(idx) {
      resizer = resizers[idx];
      this.columnForIndex(idx).makeResizable({
        handle: resizer,
        modifiers:{x:'width', y:''}
      });
      table.makeResizable({
        handle: resizer,
        modifiers:{x:'width', y:''}
      });
    }.bind(this));
  },

  /*
    Function: eventDispatch
      Used to dispatch events to appropiate handlers.

    Parameters:
      theEvent - a raw DOM event.
  */
  eventDispatch: function(theEvent)
  {
    var evt = new Event(theEvent);
    var type;
    
    try
    {
      // capture IE8 error
      type = evt.type;
    }
    catch(err)
    {
      if($type(type) == 'undefined') type = null;
    }
    
    var target = evt.target;

    if(type == 'dblclick')
    {
      this.clickCount = 1;
    }
    else if(type == 'click' && this.clickCount > 0)
    {
      // a multi click event
      this.clickCount--;
      return;
    }
    
    switch(true)
    {
      case (type == 'click' && this.hitTest(target, '> .SSControlView .SSResize') != null):
        // don't do anything for columing resizing
      break;

      case (type == 'click' && this.hitTest(target, '> .SSControlView .SSColumnOrder') != null):
        // check first for column reordering
        this.handleColumnOrderHit(this.cachedHit());
      break;

      case (type == 'click' && this.hitTest(target, '> .SSControlView .SSColumnHeading') != null):
        // check next for column select
        this.handleColumnSelect(this.cachedHit());
      break;

      case (type == 'click' && this.hitTest(target, '> .SSScrollView .SSContentView .SSRow .SSActionCell') != null):
        // if the click is an row action let them handle it
      break;

      case (type == 'click' && this.hitTest(target, '> .SSScrollView .SSContentView .SSRow') != null):
        // finally check for general row click
        this.handleRowClick(this.cachedHit(), target);
      break;

      case (type == 'dblclick' && this.hitTest(target, '> .SSScrollView .SSContentView .SSRow > *') != null):
        if(this.modelRowController())
        {
          var row = this.cachedHit().getParent('.SSRow');
          var rowIndex = this.indexOfRow(row);
          var canEdit = true;

          if(this.delegate() && this.delegate().canEditRow)
          {
            canEdit = this.delegate().canEditRow({tableView:this, rowIndex:rowIndex});
          }

          if(canEdit) this.modelRowController().editCell(this.cachedHit());
        }
      default:
        SSLog('No hit!', SSLogForce);
      break;
    }

    // pass it on
    this.fireEvent(type, evt);
  },

  /*
    Function: handleColumnOrderHit
      Handles a column reordering event.

    Parameters:
      orderButton - the column reodering button that was actually hit.
  */
  handleColumnOrderHit: function(orderButton)
  {
    var index = this.columnIndexForNode(orderButton);
    var columnName = this.columnNames()[index];

    if(this.datasource())
    {
      // udpate the sort order
      if(this.sortOrderForColumn(index) == SSTableViewDatasource.DESCENDING)
      {
        this.setSortOrderForColumn(index, SSTableViewDatasource.ASCENDING);
      }
      else if(this.sortOrderForColumn(index) == SSTableViewDatasource.ASCENDING)
      {
        this.setSortOrderForColumn(index, SSTableViewDatasource.DESCENDING);
      }

      // tell the datasource to sort
      this.datasource().sortByColumn(columnName, this.sortOrderForColumn(index));
    }
  },

  /*
    Function: handleColumnSelect
      Handles column select events.

    Parameters:
      column - the actual DOM element representing the clicked column.
  */
  handleColumnSelect: function(column)
  {
    var index = this.columnIndexForNode(column);
    var lastSelectedColumn = this.selectedColumnIndex();

    if(index == lastSelectedColumn)
    {
      // was the previously selected column, just deselect
      this.deselectAll();
    }
    else
    {
      this.selectColumn(index);

      // update the sort order if not already sorted
      if(this.datasource()) this.datasource().sortByColumn(this.columnNames()[index], this.sortOrderForColumn(index));
    }
  },

  /*
    Function: selectedColumn
      Returns the DOM node representing the selected column.

    Returns:
      An HTML element.
  */
  selectedColumn: function()
  {
    return this.contentView.getElement('> .SSDefinition col.SSActive');
  },

  /*
    Function: selectedColumnIndex
      Returns the index of the current selected column.

    Returns:
      An HTML element.
  */
  selectedColumnIndex: function()
  {
    return this.indexOfNode(this.contentView.getElements('> .SSDefinition col'), this.selectedColumn());
  },

  /*
    Function: selectedRow
      Returns the DOM node representing the select table row.

    Returns:
      An HTML element.
  */
  selectedRow: function()
  {
    return this.contentView.getElement('.SSRow.SSActive');
  },
  
  /*
    Function: rowIsSelected
      Returns true/false if the row is selected.
      
    Returns:
      A boolean value.
  */
  rowIsSelected: function(index)
  {
    return this.rowForIndex(index).hasClass('SSActive');
  },
  
  /*
    Function: selectedRowIndex
      Returns the index of the selected row.

    Returns:
      An integer.
  */
  selectedRowIndex: function()
  {
    return this.indexOfNode(this.contentView.getElements('.SSRow'), this.selectedRow());
  },

  /*
    Function: deselectRow
      Deselects a row.

    Parameters:
      row - an HTML element.
  */
  deselectRow: function(idx)
  {
    var row = this.rowForIndex(idx);
    this.unhighlightRow(idx);
    
    if(this.modelRowController()) this.modelRowController().deselect(row);
    
    if(this.delegate() && this.delegate().userDeselectedRow)
    {
      this.delegate().userDeselectedRow({tableView:this, rowIndex:idx, target:row});
    }
  },

  /*
    Function: deselectColumn
      Deselects a column.

    Parameters:
      col - an HTML element.
  */
  deselectColumn: function(col)
  {
    var idx = this.selectedColumnIndex();
    this.unhighlightColumn(idx);
    this.columnHeadingForIndex(idx).removeClass('SSActive');
  },
  
  
  highlightColumn: function(idx)
  {
    var col = this.columnForIndex(idx);
    col.addClass('SSActive');
  },
  
  
  unhighlightColumn: function(idx)
  {
    var col = this.columnForIndex(idx);
    col.removeClass('SSActive');
  },
  
  
  highlightRow: function(idx)
  {
    var target = this.contentView.getElements(".SSRow")[idx];
    target.addClass('SSActive');
  },
  
  
  unhighlightRow: function(idx)
  {
    var row = this.rowForIndex(idx);
    row.removeClass('SSActive');
  },

  /*
    Function: selectRow
      Select a row by it's index.

    Parameters:
      idx - an integer.
  */
  selectRow: function(idx)
  {
    if(!this.options.multipleSelection)
    {
      this.deselectAll();
    }
    
    var target = this.rowForIndex(idx);
    this.highlightRow(idx);
    
    if(this.delegate() && this.delegate().userSelectedRow)
    {
      this.delegate().userSelectedRow({tableView:this, rowIndex:idx, target:target});
    }
  },

  /*
    Function: selectColumn
      Select a column by it's index.

    Parameters:
      idx - an integer.
  */
  selectColumn: function(idx)
  {
    this.deselectAll();
    this.highlightColumn(idx);
    this.columnHeadingForIndex(idx).addClass('SSActive');
  },

  /*
    Function: deselectAll
      Deselect all columns and rows.
  */
  deselectAll: function()
  {
    if(this.selectedRow()) this.deselectRow(this.selectedRowIndex());
    if(this.selectedColumn()) this.deselectColumn(this.selectedColumn());
  },

  /*
    Function: columnHeadingForIndex
      Returns the column heading DOM element by index.

    Parameters:
      idx - an integer.

    Returns:
      an HTML Element.
  */
  columnHeadingForIndex: function(idx)
  {
    return this.element.getElements('> .SSControlView .SSColumnHeading')[idx];
  },
  
  
  rowForIndex: function(idx)
  {
    return this.element.getElements('> .SSScrollView .SSContentView .SSRow')[idx];
  },
  
  
  columnHeadings: function()
  {
    return $A(this.element.getElements('> .SSControlView .SSColumnHeading'));
  },


  /*
    Function: columnForIndex
      Returns the col DOM element by index.

    Parameters:
      idx - an integer.
  */
  columnForIndex: function(idx)
  {
    return this.contentView.getElements('> .SSDefinition col')[idx];
  },

  /*
    Function: columnIndexForNode
      Returns the column index for a particular node.

    Parameters:
      _node - a HTML Element.

    Returns:
      an integer.
  */
  columnIndexForNode: function(_node)
  {
    var node = (_node.hasClass('SSColumnHeading')) ? _node : _node.getParent('.SSColumnHeading');
    return this.indexOfNode(this.element.getElements('> .SSControlView .SSColumnHeading'), node);
  },

  /*
    Function: handleRowClick
      Handles user click on a row.

    Parameters:
      row - the DOM node representing the row.
      target - the actual node that was clicked.
  */
  handleRowClick: function(row, target)
  {
    var rowIndex = this.indexOfRow(row);
    
    // deslect all if not multiple selection type table
    if(!this.options.multipleSelection)
    {
      this.deselectAll();
    }

    // check for selection toggling
    if(this.options.toggleSelection && this.rowIsSelected(rowIndex))
    {
      this.deselectRow(this.indexOfRow(row));
    }
    else if(!this.rowIsSelected(rowIndex))
    {
      // otherwise if not already selected, select it
      this.selectRow(rowIndex);
    }

    // notify the delegate
    if(this.delegate() && this.delegate().userClickedRow)
    {
      this.delegate().userClickedRow({tableView:this, rowIndex:rowIndex, target:target});
    }
  },

  /*
    Function: indexOfRow
      Returns the index for a table row HTML Element.

    Parameters:
      row - the HTML element representing the row.
  */
  indexOfRow: function(row)
  {
    return this.indexOfNode(this.contentView.getElements('.SSRow'), row);
  },

  /*
    Function: setDatasource
      Sets the data source for the table.  This should be an instance of <SSTableViewDatasource> or one of it's subclasses.

    Parameters:
      datasource - an instance of <SSTableViewDatasource>.
  */
  setDatasource: function(datasource)
  {
    if(datasource)
    {
      // remove the previous onload from the last datasource
      if(this.__datasource)
      {
        this.__datasource.removeEvent('onload');
      }
      this.__datasource = datasource;
      // listen for onload events on the new datasource
      this.__datasource.addEvent('onload', this.refresh.bind(this));
    }
    else
    {
      console.error('Error: SSTableView datasource is null.');
    }
  },

  /*
    Function: datasource
      Getter for the datasource of this table view.

    Returns:
      An instance of <SSTableViewDatasource>.
  */
  datasource: function()
  {
    return this.__datasource;
  },

  /*
    Function: reload
      Tell the datasource to refetch it's data.
  */
  reload: function()
  {
    if(this.datasource()) this.datasource().fetch();
  },


  setColumnTitles: function(columnTitles)
  {
    this.__columnTitles = columnTitles;
  },


  columnTitles: function()
  {
    return this.__columnTitles;
  },

  /*
    Function: setColumnNames
      Sets the column names.

    Parameters:
      columnNames - an Array of string representing the column names in order.
  */
  setColumnNames: function(columnNames)
  {
    this.__columnNames = columnNames;
  },

  /*
    Function: setColumnSortOrders
      Set sort orders for each column in the table.

    Parameters:
      newOrders - an Array representing the column sort orders.
  */
  setColumnSortOrders: function(newOrders)
  {
    this.__columnSortOrders = newOrders;
  },

  /*
    Function: columnSortOrders
      Getter for the column sort orders.

    Returns:
      An array.
  */
  columnSortOrders: function()
  {
    return this.__columnSortOrders;
  },

  /*
    Function: initColumnSort
      Initializes the column sort orders.
  */
  initColumnSort: function()
  {
    // initialize the private var
    this.setColumnSortOrders({});
    // intialize the contents
    this.columnNames().each(function(columnName) {
      this.columnSortOrders()[columnName] = SSTableViewDatasource.DESCENDING;
    }.bind(this));
  },

  /*
    Function: sortOrderForColumn
      Returns the sort order for a column by index.

    Parameters:
      index - an integer.
  */
  sortOrderForColumn: function(index)
  {
    return this.columnSortOrders()[this.columnNames()[index]];
  },

  /*
    Function: setSortOrderForColumn
      Sets the sort order for a column.

    Parameters:
      index - an integer.
      order - should be SSTableViewDatasource.ASCENDING or SSTableViewDatasource.DESCENDING.
  */
  setSortOrderForColumn: function(index, order)
  {
    this.columnSortOrders()[this.columnNames()[index]] = order;
  },

  /*
    Function: columnNames
      Getters for the column names property.

    Returns:
      An array of the column names in order.
  */
  columnNames: function()
  {
    return this.__columnNames;
  },

  /*
    Function: addRow
      Adds a row to the table view.

    Parameters:
      data - data for each column of the row to be created.
  */
  addRow: function(data)
  {
    var columnNames = this.columnNames();
    var controller = this.modelRowController();
    var newRow = (controller && controller.modelRowClone()) || this.modelRow().clone(true);
    
    // Weird the node needs to be in the DOM for this shit to work
    // if after the following, it fails completely
    this.contentView.getElement('tbody').grab(newRow);
    //newRow.injectInside(this.contentView.getElement('thead'));

    for(var i=0; i < columnNames.length; i++)
    {
      var columnName = columnNames[i];

      if(!controller)
      {
        newRow.getElement('> td[name='+columnName+']').set('text', data[columnName]);
      }
      else
      {
        controller.setProperty(newRow, columnName, data[columnName]);
      }
    }
  },

  /*
    Function: setModelRow
      Sets the model row (an instance of <SSTableRow>) for the table.

    Parameters:
      modelRow - the model row.
  */
  setModelRow: function(modelRow)
  {
    this.__modelRow = modelRow;
  },

  /*
    Function: modelRow
      Getter for the model row (an instance of <SSTableRow>) used by this table view instance.

    Returns:
      An HTML Element.
  */
  modelRow: function()
  {
    return this.__modelRow;
  },


  setModelRowController: function(modelRowController)
  {
    modelRowController.setDelegate(this);
  },

  /*
    Function: modelRowController
      Returns the actual view controller for the model row.

    Returns:
      An <SSTableRow> instance.
  */
  modelRowController: function()
  {
    return this.controllerForNode(this.modelRow());
  },


  columnChangedForRow: function(row, columnIndex, data)
  {
    if(this.datasource())
    {
      this.datasource().updateRowColumn(this.indexOfRow(row), this.columnNames()[columnIndex], data);
    }
  },

  /*
    Function: refresh
      Empties out the table content and reloads from the data source.
  */
  refresh: function()
  {
    // empty the content view
    this.contentView.getElement('tbody').empty();

    // update the presentation
    var datasource = this.datasource();

    if(datasource)
    {
      datasource.rowCount().times(function(n) {
        this.addRow(datasource.rowForIndex(n));
      }.bind(this));
    }
  },


  isVisible: function()
  {
    return (this.element.getStyle('display') != "none");
  },


  localizationChanged: function()
  {
    var newTitles = this.columnTitles().map(SSLocalizedString);
    if(this.options.showHeader) this.updateColumnTitles(newTitles);
    if(this.isVisible())
    {
      this.refresh();
    }
  }

});