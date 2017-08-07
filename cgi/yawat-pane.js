// This file is part of the YAWAT package.
// (c) 2007 Ulrich Germann. All rights reserved.
// This is NOT free software, but permission is granted to use this 
// software free of charge for academic research purposes.

var currentPane;

function StatusButton(id,checked)
{
    this.checked = checked;
    this.id      = id;
    this.span    = document.createElement("span");
    this.label   = document.createTextNode(" done")
    var bspan    = document.createElement("span");
    this.box     = document.createTextNode("")
    bspan.appendChild(this.box);
    this.span.appendChild(bspan);
    this.span.appendChild(this.label);
    bspan.style.cursor = 'pointer';

    this.id = id+"done";
    if (checked)
	      this.box.nodeValue = String.fromCharCode(parseInt(2611,16));
    else
	      this.box.nodeValue = String.fromCharCode(parseInt(2610,16));
    this.checked  = checked;
    bspan.button = this;
    bspan.onclick = function()
    {
	      var msg = (this.button.checked 
		               ? "Revert status to 'in progress'?" 
		               : "Change status to 'done'?");
	      // if (window.confirm(msg))
	      // {
	      changed = true;
	      if (bitext) bitext.saveButton.enable();
	      this.button.box.nodeValue = String.fromCharCode(parseInt(this.button.checked 
								                                                 ? 2610 : 2611,16));
	      this.button.checked = !this.button.checked;
	      if (this.button.checked)
	      {
	          var j = parseInt(id)+1;
	          var n = document.getElementById("pane"+j);
	          // alert(n + j);
	          while (n && n.pane.done.checked) 
	          {
		            ++j;
		            n = document.getElementById("pane"+j);
	          }
	          if (n) window.location.hash="atpane"+(j);
	          if (bitext) bitext.save();
	      }
    }
}


function Pane(E,F,A,id,done,extraA,extraB)
{
   // contains Aligment Matrix and Sentence Display
   this.div = document.createElement("div");
   this.div.pane = this;

   // this.div.style.border = 'thin solid black';
   this.div.className = 'pane';

   this.id = id;
   this.E = new Sentence(E,0,this,id);
   this.F = new Sentence(F,1,this,id);

   // create the elements displaying the two sentences
   this.text = document.createElement("table");
   this.text.width = '100%';
   this.text.style.borderCollapse = 'collapse';
   this.text.cellPadding = '5pt';
   with (this.text.insertRow(0).insertCell(0))
   {
      className = 'sentence1';
      appendChild(this.E.div);
      width='50%';
   }
   with (this.text.rows[0].insertCell(1))
   {
      className = 'sentence2';
      appendChild(this.F.div);
   }
   this.text.insertRow(1);
   this.div.appendChild(this.text);
   this.layout = 'vertical';

   var siddiv = document.createElement("div");
   siddiv.appendChild(document.createTextNode('['+id+'] '));
   this.done = new StatusButton(id,done);
   siddiv.appendChild(this.done.span);

   this.div.insertBefore(siddiv,this.div.firstChild);

   // create a button to toggle matrix display
   // this.showMatrixButton = new Button(9860,"show matrix",this); 
   this.showMatrixButton = new Button(10399,"show matrix",this); 
   this.div.insertBefore(this.showMatrixButton.div,this.div.firstChild);
   this.showMatrixButton.div.pane = this;
   with (this.showMatrixButton)
   {
      div.className = 'marginButton';
      div.action    = function() { this.root.toggleMatrix();  }
      div.style.width = this.showMatrixButton.div.offsetWidth;
   }

   var agrps = A.split(' ');
   if (agrps.length > 0)
   {
       for (var a in agrps)
       {
	         var foo = agrps[a].split(':');
	         if (foo.length < 3) break;
	         var ewrds = foo[0].length > 0 ? foo[0].split(',') : null;
	         var fwrds = foo[1].length > 0 ? foo[1].split(',') : null;
	         var ag = new AGroup(this);
	         
	         // Error.write(foo[0] + ' x ' + ewrds[1] + ' + ' +foo[2]);
           // log("["+this.id + "] "+ ewrds + ' + ' +fwrds + " ::: " + this.E.words.length + " / " + this.F.words.length);
	         if (ewrds)
	             for (var e in ewrds) 
	                 ag.addWord(this.E.words[parseInt(ewrds[e])]);
	         if (fwrds)
	             for (var f in fwrds) 
	                 ag.addWord(this.F.words[parseInt(fwrds[f])]);
	         ag.label = foo[2]; 
	         ag.unhighlight();
       }
   }
    
    // secondary alignment for diff-ing
    // log("xxx "+extraA);
    // log("yyy "+extraB);
    if (extraA != null)
    {
        this.shadowAlignmentA = extraA;
    }
    if (extraB != null)
    {
      // alert(extraB);
        this.shadowAlignmentB = extraB;
    }
    // var a = document.createElement("anchor");
    // a.name = "atpane"+id;
    // a.id   = "atpane"+id;
    // a.style.position.relative;
    // a.style.display = 'block';
    // a.style.marginTop = "-60px";
    // this.div.insertBefore(a,this.div.firstChild);
    this.div.id = "pane"+id;
}

Pane.prototype.toggleMatrix = function()
{
   if (!this.matrix)
   {
      pleaseWaitBox.show();
      currentPane = this;
      var t = window.setTimeout("createAlignmentMatrix()",100);
      return;
   }
   if (this.matrix.visible()) 
      hide(this.matrix.div);
   else
      show(this.matrix.div);
}

Pane.prototype.show = function()
{
   if (this.viewPane.div.style.visibility == 'hidden')
      this.close();
}

Pane.prototype.toggleLayout = function()
{
   
   if (this.layout == 'vertical')
      this.setLayout('horizontal');
   else
      this.setLayout('vertical');
}

Pane.prototype.setLayout = function(layout)
{
   if (layout == 'vertical')
   {
      if (this.text.rows[0].cells.length == 1)
      {
	 var F = this.text.rows[1].lastChild;
	 this.E.div.style.textAlign = 'right';
	 this.text.rows[0].appendChild(F);
      }
   }
   else if (layout == 'horizontal')
   {
      if (this.text.rows[0].cells.length == 2)
      {
	 var F = this.text.rows[0].lastChild;
	 this.text.rows[1].appendChild(F);
	 this.E.div.style.textAlign = 'left';
      }
   }
   this.layout = layout;
}

Pane.prototype.pack = function()
{
   // pack alignment info for saving
   var retval = this.id+''; // +'' enforce that it's a string
   var done = new Object();
   for (var e in this.E.words)
   {
      if (this.E.words[e].agroup)
      {
	        var foo = this.E.words[e].agroup.pack();
	        if (!done[foo]) 
	        {
	            retval += ' '+foo;
	            done[foo] = true;
	        }
      }

   }
   for (var f in this.F.words)
   {
      if (this.F.words[f].agroup)
      {
	        var foo = this.F.words[f].agroup.pack();
	        if (!done[foo])
	        {
	            retval += ' '+foo;
	            done[foo] = true;
	        }
      }
   }
   // retval += ' STATUS=' 
   return retval;
}
