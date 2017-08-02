// This file is part of the YAWAT package.
// (c) 2007 Ulrich Germann. All rights reserved.
// This is NOT free software, but permission is granted to use this 
// software free of charge for academic research purposes.

var lastCellWithMarkup;
var markupDelay = 100;
function createAlignmentMatrix(){
    var P = currentPane;
    P.matrix = new AlignmentMatrix(P);
    P.div.insertBefore(P.matrix.div, P.text);
    
    // we can do the following only *after* the matrix has been added
    // (to determine offsetWidth, offsetHeight, etc., the respective 
    // element has to be part of the document).
    P.matrix.updateRulerOffsets();
    P.matrix.refresh();
    currentPane = null;
    hide(pleaseWaitBox);
}

AlignmentMatrix.prototype.updateRulerOffsets = function(){
    // updates the position of the markup layer / 'ruler', which 
    // changes when the window is resized or the matrix is rescaled
    this.grid.align = null;
    // otherwise, offsetWidth returns the width of the embedding element
    this.grid.trueWidth = this.grid.offsetWidth;
    this.grid.align = 'center';
    var w = this.grid.trueWidth;
    var firstColWidth = this.grid.rows[0].cells[1].offsetLeft;
    
    with (this.ruler) {
        style.top = -1 * this.grid.offsetHeight;
        style.width = w - 2 * firstColWidth;
        style.fontSize = Math.min(Math.max(.8 * parseInt(this.cellSize), 10), 20);
        style.left = Math.max(0, this.div.offsetWidth - w) / 2 + firstColWidth;
    }
}

function AlignmentMatrix(pane){
    this.pane = pane;
    this.E = pane.E;
    this.F = pane.F;
    this.div = document.createElement("div");
    this.div.style.textAlign = 'center';
    this.div.style.display = 'block';
    
    // setup the toolbar
    this.toolbar = document.createElement("div");
    this.toolbar.style.display = 'block';
    this.toolbar.style.padding = '3px';
    this.div.appendChild(this.toolbar);
    
    // add buttons
    this.minusButton = new Button(8681, "smaller", this);
    this.plusButton = new Button(8679, "bigger", this);
    this.minusButton.div.matrix = this;
    this.plusButton.div.matrix = this;
    this.minusButton.div.action = function(){
        resizeMatrix(this.matrix, -2);
    }
    this.plusButton.div.action = function(){
        resizeMatrix(this.matrix, +2);
    }
    
    this.toolbar.appendChild(this.minusButton.div);
    this.toolbar.appendChild(this.plusButton.div);
    
    this.cellSize = parseInt(window.innerHeight * .4 / this.E.words.length);
    this.cellSize = Math.min(36, Math.max(12, this.cellSize));
    
    this.cellSize = 12;
    
    this.grid = document.createElement('table');
    this.grid.onmouseout = onMouseOutGrid;
    for (var r = 0; r < this.E.words.length/*+2*/; r++) {
        var tr = this.grid.insertRow(this.grid.rows.length);
        tr.className = 'amatrix';
        var td = document.createElement('td');
        td.className = 'amatrix';
        var rowlabel = null;
        tr.style.fontSize = Math.max(.8 * parseInt(this.cellSize), 8);
        td.row = r;
        td.align = 'center';
        rowlabel = document.createTextNode(this.E.words[r].label);
        td.appendChild(rowlabel);
        td.style.fontSize = 'inherit';
        td.style.height = this.cellSize;
        tr.appendChild(td);
        for (var c = 0; c < this.F.words.length; c++) {
           td = document.createElement('td');
           td.className = 'amatrix';
           td.vAlign = 'middle';
           td.onmouseover = onMouseOverCell;
           td.onmouseout = onMouseOutCell;
           td.row = r;
           td.col = c;
           td.matrix = this;
           var cell = document.createElement('div');
	   cell.className = 'off';
           cell.style.width = this.cellSize;
           cell.style.height = this.cellSize + 1;
           cell.row = r;
           cell.col = c;
           cell.matrix = this;
           if (r == 0) 
              cell.width = this.cellSize;
           td.appendChild(cell)
           tr.appendChild(td);
        }
        td = document.createElement('td');
        td.className = 'amatrix';
        td.row = r;
        td.align = 'center';
        td.appendChild(rowlabel.cloneNode(true));
        td.style.fontSize = 'inherit';
        tr.appendChild(td);
    }
    this.grid.className = 'amatrix';
    this.grid.style.position = 'relative';
    this.grid.style.top = 0;
    this.grid.style.left = 0;
    this.div.appendChild(this.grid);
    
    // set up the column annotation ruler that floats over the matrix
    this.ruler = document.createElement('div');
    this.ruler.onmouseover = function(){
        hide(this);
    }
    this.ruler.before = document.createElement('div');
    this.ruler.after = document.createElement('div');
    with (this.ruler.before) {
        style.position = 'absolute';
        style.backgroundColor = '#FFFFDD';
        style.top = 0;
        style.whiteSpace = 'nowrap';
        style.border = 'thin solid black';
        style.borderRight = 'none';
    }
    with (this.ruler.after) {
        style.position = 'absolute';
        style.backgroundColor = '#FFFFDD';
        style.top = 0;
        style.whiteSpace = 'nowrap';
        style.border = 'thin solid black';
        style.borderLeft = 'none';
    }
    with (this.ruler) {
        style.position = 'relative';
        style.backgroundColor = '#66FF66';
        style.fontSize = Math.max(.8 * parseInt(this.cellSize), 8);
        appendChild(this.ruler.before);
        appendChild(this.ruler.after);
    }
    this.div.appendChild(this.ruler);

   if (pane.shadowAlignmentA)
   {
      var blocks = pane.shadowAlignmentA.split(' ');
      for (var b in blocks)
      {
	 var foo = blocks[b].split(':');
	 if (!foo[0].length || !foo[1].length)
	    continue;
	 rows = foo[0].split(',');
	 cols = foo[1].split(',');
	 if (rows.length==0||cols.length==0)
	    continue;
	 for (var r in rows)
	 {
	    r = parseInt(rows[r])
	    for (var c in cols)
	    {
	       c = parseInt(cols[c])
	       var cell = this.grid.rows[r].cells[c+1].firstChild;
	       cell.shadowA = 1;
	       cell.className = 'onlyA';
	    }
	 }
      }
   }
   if (pane.shadowAlignmentB)
   {
      var blocks = pane.shadowAlignmentB.split(' ');
      for (var b in blocks)
      {
	 var foo = blocks[b].split(':');
	 if (!foo[0].length || !foo[1].length)
	    continue;
	 rows = foo[0].split(',');
	 cols = foo[1].split(',');
	 if (rows.length==0||cols.length==0)
	    continue;
	 for (var r in rows)
	 {
	    r = parseInt(rows[r])
	    for (var c in cols)
	    {
	       c = parseInt(cols[c])
	       var cell = this.grid.rows[r].cells[c+1].firstChild;
	       cell.shadowB = 1;
	       if (cell.shadowA)
	       {
		  cell.className = 'AandB';
		  cell.shadowAB = 1;
	       }
	       else
	       {
		  cell.className = 'onlyB';
	       }
	       
	    }
	 }
      }
   }

   this.refresh(); 
}

function cancelUnmarkupCell(evt){
    if (lastCellWithMarkup && lastCellWithMarkup.timeout) 
        window.cancelTimeout(lastCellWithMarkup.timeout);
}

AlignmentMatrix.prototype.getCellStatus = function(r, c){
    var retval;
    if (this.E.words[r].agroup &&
    this.E.words[r].agroup == this.F.words[c - 1].agroup) {
        retval = 'on';
    }
    else {
        retval = 'off';
    }
    return retval;
}


function cellOffsetTop(cell){
    var retval = cell.offsetTop;
    var grid = cell.matrix.grid;
    while (cell.offsetParent && cell.offsetParent != grid) {
        cell = cell.offsetParent;
        retval += cell.offsetTop
    }
    return retval;
}

function cellOffsetLeft(cell){
    var retval = cell.offsetLeft;
    var grid = cell.matrix.grid;
    while (cell.offsetParent && cell.offsetParent != grid) {
        cell = cell.offsetParent;
        retval += cell.offsetLeft
    }
    return retval;
}

function getAbsoluteTop(elem){
    var retval = elem.offsetTop;
    while (elem.offsetParent) {
        elem = elem.offsetParent;
        retval += elem.offsetTop
    }
    return retval;
}

function getAbsoluteLeft(elem){
    var retval = elem.offsetLeft;
    while (elem.offsetParent) {
        elem = elem.offsetParent;
        retval += elem.offsetLeft
    }
    return retval;
}


AlignmentMatrix.prototype.updateRuler = function(cell){
    var contextSize = 7;
    var col = parseInt(cell.col); // make sure it's an integer and not a string
    // remove old markup
    clear(this.ruler.before);
    clear(this.ruler.after);
    this.ruler.after.style.paddingRight = 10;
    
    // fill left side of ruler (before the current cell)
    with (this.ruler.before) {
        for (var i = Math.max(col - contextSize, 0); i < col; i++) {
            appendChild(document.createTextNode(this.F.words[i].label + ' '));
        }
        style.paddingRight = 5;
    }
    
    // fill the right side, special mark-up for the current word
    var center = document.createElement("span");
    with (center) {
        appendChild(document.createTextNode(this.F.words[col].label));
        style.backgroundColor = 'yellow';
        style.paddingLeft = Math.max(10 - center.offsetWidth, 0) / 2;
        style.paddingRight = center.style.paddingLeft;
    }
    show(this.ruler);
    with (this.ruler.after) {
        appendChild(center);
        var stop = Math.min(col + contextSize + 1, this.F.words.length);
        for (var i = col + 1; i < stop; i++) {
            appendChild(document.createTextNode(' ' + this.F.words[i].label));
        }
        // adjust horizontal position
        style.left = cellOffsetLeft(cell) -
        parseInt(this.grid.rows[0].cells[1].offsetLeft);
    }
    // and adjust the horizontal position of the left part, too
    this.ruler.before.style.right = parseInt(this.ruler.style.width) -
    parseInt(this.ruler.after.style.left);
    
    // finally, adjust the vertical position
    this.ruler.style.top = cellOffsetTop(cell) - this.grid.offsetHeight - 2.5 * this.cellSize;
}

onMouseOverCell = function(evt){
    if (currentCTM || activeGroup || recentHighlight) 
        return false;
    overCell = this;
    
    // this.matrix.updateRuler(this);
    // markupWords(this);
    this.timeout = window.setTimeout("markupCell()", markupDelay);
    // window.status = this.offsetTop +' '+ getAbsoluteTop(this) + ' ' + cellOffsetTop(this);
}

function markupCell(){
    // to be called via a timeout handler to improve response speed
    // (because we don't go through the whole process for every cell
    // we run over)
    if (!overCell) 
        return;
    if (lastCellWithMarkup && lastCellWithMarkup.timeout) 
        window.clearTimeout(lastCellWithMarkup.timeout);
    
    if (lastCellWithMarkup && lastCellWithMarkup != overCell) 
        unmarkupWords(lastCellWithMarkup);
    
    // do the actual markup
    markupWords(overCell);
    overCell.matrix.updateRuler(overCell);
    
    lastCellWithMarkup = overCell;
}

function unmarkupCell(){
    // to be called via a timeout after leaving a cell
    if (lastCellWithMarkup) {
        if (!activeGroup) 
            unmarkupWords(lastCellWithMarkup);
        hide(lastCellWithMarkup.matrix.ruler);
        if (lastCellWithMarkup.timeout) 
            delete lastCellWithMarkup.timeout;
        lastCellWithMarkup = null;
    }
}

onMouseOutCell = function(evt){
   // window.status = this.row+' '+this.col;
   if (!currentCTM) {
       // unmarkupWords(this);
       if (this.timeout) {
           window.clearTimeout(this.timeout);
           delete this.timeout;
        }
    }
}

onMouseOutGrid = function(evt){
    if (!lastCellWithMarkup) 
        return;
    var M = lastCellWithMarkup.matrix;
    var L = M.div.offsetLeft + (M.div.offsetWidth - M.grid.trueWidth + 1) / 2;
    var R = L + M.grid.trueWidth - 5; // this is a hack
    var T = getAbsoluteTop(M.grid);
    var B = T + M.grid.offsetHeight;
    window.status = T + ' ' + L + ' ' + B + ' ' + R + ' ' + evt.pageX + ' ' + evt.pageY;
    if (evt.pageX <= L || evt.pageX >= R || evt.pageY <= T || evt.pageY >= B) 
        unmarkupCell();
}

function unmarkupWords(cell){
    var w1 = ('row' in cell) ? cell.matrix.E.words[cell.row] : null;
    var w2 = ('col' in cell) ? cell.matrix.F.words[cell.col] : null;
    if (w1) 
        w1.unhighlight();
    if (w2) 
        w2.unhighlight();
}

function markupWords(cell){
    var w1 = ('row' in cell) ? cell.matrix.E.words[cell.row] : null;
    var w2 = ('col' in cell) ? cell.matrix.F.words[cell.col] : null;
    var ag1 = w1 && w1.agroup ? w1.agroup : false;
    var ag2 = w2 && w2.agroup ? w2.agroup : false;
    if (w1 && w2) {
        if (ag1 && ag2) {
            if (ag1 == ag2 || (ag1.label != ag2.label)) {
                ag1.highlight();
                if (ag1 != ag2) 
                    ag2.highlight()
                w1.span.className = 'word ' + ag1.label + '3';
                w2.span.className = 'word ' + ag2.label + '3';
            }
            else {
                ag1.highlight(null, 'sideA');
                ag2.highlight(null, 'sideB');
                w1.span.className = 'word sideA3';
                w2.span.className = 'word sideB3';
            }
        }
        else {
            if (ag1) {
                ag1.highlight();
                w1.span.className = 'word ' + ag1.label + '3';
            }
            else 
                w1.span.className = 'word sideA3';
            
            if (ag2) {
                ag2.highlight();
                w2.span.className = 'word ' + ag2.label + '3';
            }
            else 
                w2.span.className = 'word sideB3';
        }
    }
    else 
        if (w1) {
            if (w1.agroup) {
                w1.agroup.highlight();
                w1.span.className = 'word ' + w1.agroup.label + '3';
            }
            else 
                w1.span.className = 'word sideA3';
        }
        else 
            if (w2) {
                if (w2.agroup) {
                    w2.agroup.highlight();
                    w2.span.className = 'word ' + w2.agroup.label + '3';
                }
                else 
                    w2.span.className = 'word sideB3';
            }
}


function handleLeftClickOnCell(cell){
    var w1 = cell.matrix.E.words[cell.row];
    var w2 = cell.matrix.F.words[cell.col];
    var ag1 = w1.agroup;
    var ag2 = w2.agroup;

   protocol("left click on ("+cell.row+","+cell.col+")");

    
    if (ag1 && ag2) {
        if (ag1 == ag2) {
            if (ag1.count[0] == 1) {
                ag1.delWord(w2);
            }
            else 
                if (ag1.count[1] == 1) {
                    ag2.delWord(w1);
                }
                else { // no unambiguous interpretation, requires contextmenu
                    // we should open for editing here; should be trivial
                    activeGroup = ag1;
                    ag1.edit();
                    return false;
                }
        }
        else {
            for (var w in ag2.side[0]) 
                ag1.addWord(ag2.side[0][w]);
            for (var w in ag2.side[1]) 
                ag1.addWord(ag2.side[1][w]);
        }
    }
    else 
        if (ag1) {
            ag1.addWord(w2);
        }
        else 
            if (ag2) {
                ag1 = ag2;
                ag2.addWord(cell.matrix.E.words[cell.row]);
            }
            else {
                ag1 = new AGroup('unaligned');
                ag1.pane = cell.matrix.pane;
                ag1.addWord(w1);
                ag1.addWord(w2);
            }
    
    if (w1.agroup == w2.agroup) {
        ag1.highlight();
        w1.span.className = 'word ' + ag1.label + '3';
        w2.span.className = 'word ' + ag1.label + '3';
    }
    else {
        w1.span.className = 'word ' + (w1.agroup ? w1.agroup.label + '3' : 'sideA3');
        w2.span.className = 'word ' + (w2.agroup ? w2.agroup.label + '3' : 'sideB3');
    }
}


function resizeMatrix(M, delta){
    // triggered by the increase matrix size / reduce matrix size buttons over
    // the matrix
    var newSize = parseInt(M.cellSize) + delta;
    if (newSize >= 4 && newSize <= 36) {
        // resize the matrix cells
        for (var r = 0; r < M.grid.rows.length; r++) {
            M.grid.rows[r].style.fontSize = Math.max(.8 * parseInt(newSize), 8);
            for (var c = 1; c + 1 < M.grid.rows[r].cells.length; c++) {
                if (M.grid.rows[r].cells[c].firstChild) {
                    with (M.grid.rows[r].cells[c]) {
                        firstChild.style.height = newSize + 1 + 'px';
                        firstChild.style.width = newSize + 'px';
                    }
                }
            }
        }
        M.cellSize = newSize;
        M.updateRulerOffsets();
    }
}

AlignmentMatrix.prototype.refresh = function(){
   for (var x in this.E.words) {
      var w = this.E.words[x];
      if (w.agroup) 
         w.agroup.updateMatrix(w, 'on');
   }
}

function handleRightClickOnCell(target, x, y){
   protocol("right click on ("+target.row+","+target.col+")");
    CTM1.show1(target, x, y);
}

AlignmentMatrix.prototype.visible = function(){
    return this.div.offsetWidth > 0;
}

AlignmentMatrix.prototype.setCellStatus = function(r, c, status){
   r = parseInt(r);
   c = parseInt(c);
   var cell = this.grid.rows[r].cells[c+1].firstChild;
   if (cell.shadowAB)
   {
      cell.className = (status == 'off') ? 'AandB' : 'on';
   }
   else if (cell.shadowA)
   {
      cell.className = (status == 'off') ? 'onlyA' : 'AandMe';
   }
   else if (cell.shadowB)
   {
      cell.className = (status == 'off') ? 'onlyB' : 'BandMe';
   }
   else
   {
      cell.className = ((status == 'off') ? 'off'     
			: (diffMode ? 'onlyMe' : 'on'));
   }
}
