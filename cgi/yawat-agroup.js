// This file is part of the YAWAT package.
// (c) 2007 Ulrich Germann. All rights reserved.
// This is NOT free software, but permission is granted to use this 
// software free of charge for academic research purposes.

function AGroup(pane)
{ // a group of associated words
   this.type = 'agroup';
   this.pane = pane;
   this.label    = 'unspec';
   this.side     = new Array(2);
   this.side[0]  = new Object();
   this.side[1]  = new Object();
   this.count     = new Array(2);
   this.count[0] = 0; // number of words on one side
   this.count[1] = 0; // ... and on the other side
   this.changedWords = null;
}

AGroup.prototype.contains = function(wrd)
{ // checks if this group contains /wrd/
   return wrd.agroup == this;
}

AGroup.prototype.addWord  = function(wrd)
{ // adds /wrd/ to the group
   
  // log("adding "+wrd);
  if (typeof wrd != 'object')
    wrd = document.getElementById(wrd);
  //if (!wrd) return;
   // var wasbi = this.count[0]*this.count[1];
   // we need this to check later if we have to change the 
   // group label; there are different tag sets for monolingual
   // and bilingual groups

   // Some stuff that matters only when we are currently editing the group
   // by clicking on words in the sentence pair display (not on cells in the 
   // matrix). In that case, words can be 'stolen' from other groups. 
   // We save the information necessary to re-assign the word to its 
   // original group if the edit is cancelled.
   if (this.changedWords) 
   { 
      if (wrd.id in this.changedWords)
      {  
	 if (wrd.prev_agroup == this) // welcome back!
	    delete this.changedWords[wrd.id];
      }
      else 
      {
	 if (wrd.agroup)
	 { // bye-bye to your old group, but don't forget where you came from
	    wrd.prev_agroup = wrd.agroup;
	    wrd.agroup.delWord(wrd);
	    if (wrd.prev_agroup) 
	       wrd.prev_agroup.unhighlight();
	 }
	 this.changedWords[wrd.id] = wrd; 
	 // we'll keep in mind that your status has changed ...
      }
   }
   else
   {
      changed = true;
      if (bitext) bitext.saveButton.enable();
   }

   protocol("add "+wrd.id+" to "+this.descriptor());

   // now actuall add the word to this group
   wrd.agroup = this;
   this.side[wrd.side][wrd.id] = wrd;
   this.count[wrd.side]++;

   // change group label if necessary (different tag sets, see above)
   this.updateLabel(); 

   // update the Alignment Matrix (if visible)
   this.updateMatrix(wrd,'on');

   this.highlight(wrd);
   // update sentence pair display
   // this.updateDisplay(wrd);
} // end of member function addWord


AGroup.prototype.updateLabel = function()
{
   if ((this.label in biLabels) == this.bi())
      return; // all is in order
   if (this.prev_label)
   { // we had a label before, let's re-use it
      this.label = this.prev_label;
   }
   else 
   {
      if (activeGroup) this.prev_label = this.label;
      this.label = this.bi() ? defaultBiLabel : defaultMoLabel;
   }
}

AGroup.prototype.delWord = function(wrd)
{
   protocol("del "+wrd.id+" from "+this.descriptor());
   this.side[wrd.side][wrd.id].agroup = null;
   delete this.side[wrd.side][wrd.id];
   this.count[wrd.side]--;

   if (this.changedWords)
   {
      if (wrd.id in this.changedWords)
      {
	 if (wrd.prev_agroup)
	 {
	    wrd.prev_agroup.addWord(wrd);
	    wrd.prev_agroup = null;
	 }
	 delete this.changedWords[wrd.id];
      }
      else
      {
	 this.changedWords[wrd.id] = wrd;
	 wrd.prev_agroup = this;
	 wrd.agroup = null;
	 wrd.span.className = 'word unaligned1';
      }
   }
   else
   {
      changed = true;
      if (bitext) bitext.saveButton.enable();
   }
   this.updateLabel(); 
   this.updateMatrix(wrd,'off');
   wrd.unhighlight();
   // this.unhighlight();
   // this.updateDisplay(wrd);
} // end of member function delWord


AGroup.prototype.updateMatrix = function(wrd,status)
{
   if (this.pane.matrix)
   {
      for (var w in this.side[1-wrd.side])
      {
	 var x = this.side[1-wrd.side][w];
	 var r = (wrd.side == 0) ? wrd.idx :   x.idx;
	 var c = (wrd.side == 0) ?   x.idx : wrd.idx;
	 this.pane.matrix.setCellStatus(r,c,status);
      }
   }

}

AGroup.prototype.edit = function(wrd)
{ // edit this group
   if (wrd.agroup)
      protocol("edit "+wrd.agroup.descriptor());
   else
      protocol("new alignment group");
   this.changedWords = new Object();
   this.highlight(wrd);
}

AGroup.prototype.highlight = function(wrd,classLabel)
{
   var ag    = this.agroup;
   var cname = classLabel ? classLabel : this.label;
   var tag   = (this == activeGroup) ? '3' : '2';
   cname = 'word '+cname;

   for (var foo in this.side[0])
      this.side[0][foo].span.className = cname+tag;

   for (var foo in this.side[1])
   {
      this.side[1][foo].span.className = cname+tag;
   }

   if (wrd)
      wrd.span.style.borderColor = ((wrd.agroup == activeGroup) 
			       ? 'magenta' 
			       : null);
}

AGroup.prototype.unhighlight = function()
{
   for (var foo in this.side[0])
      this.side[0][foo].span.className = 'word '+this.label+'1'; 
   for (var foo in this.side[1])
      this.side[1][foo].span.className = 'word '+this.label+'1'; 
}

AGroup.prototype.closeEdit = function(wrd)
{
   changed = true;
   if (bitext) bitext.saveButton.enable();
   for (var foo in this.changedWords)
   {
      var w = this.changedWords[foo];
      if (w.prev_agroup)
      {
	 w.prev_agroup.prev_label = null;
	 w.prev_agroup.updateLabel();
      }
   }
   activeGroup.unhighlight();
   activeGroup = null;
   this.changedWords = false;
   if (wrd) 
   {
      wrd.span.style.border=null;
      wrd.highlight(wrd);
   }
   this.prev_label = null;
}

AGroup.prototype.cancelEdit = function()
{
   // activeGroup = null;
   // log("cancel edit");
   var resetMe = this.changedWords;
   this.changedWords = null;
   // var wasbi = this.bi();
   for (var foo in resetMe)
   {
      var wrd = resetMe[foo]
      // var wasbi = this.bi();
      if (this.contains(wrd) && wrd.prev_agroup != this)
      {
	 delete this.side[wrd.side][wrd.id];
	 this.count[wrd.side]--;
      }
      if (wrd.prev_agroup)
      {
	 wrd.prev_agroup.addWord(wrd);
	 wrd.prev_agroup = null;
	 wrd.agroup.updateLabel();
      }
      else
      {
	 wrd.agroup = null;
	 this.updateMatrix(wrd,'off');
      }
      wrd.unhighlight();
   }
   // this.changedWords = false;
   this.unhighlight();
   activeGroup = null;
   return false;
}

AGroup.prototype.bi = function() 
{ // is this a 'bilingual' group ? 
   return (this.count[0]*this.count[1] > 0); 
}

AGroup.prototype.pack = function()
{
   var s0 = '',s1 = '';
   for (var w in this.side[0])
   {
      if (s0.length > 0) s0 += ',';
      s0 += this.side[0][w].idx;
   }
   for (var w in this.side[1])
   {
      if (s1.length > 0) s1 += ',';
      s1 += this.side[1][w].idx+'';
   }
   return s0+":"+s1+":"+this.label;
}

AGroup.prototype.descriptor = function()
{
   var s0 = '',s1 = '';
   for (var w in this.side[0])
   {
      if (s0.length > 0) s0 += ',';
      s0 += this.side[0][w].idx;
   }
   for (var w in this.side[1])
   {
      if (s1.length > 0) s1 += ',';
      s1 += this.side[1][w].idx+'';
   }
   return this.pane.id+"["+s0+":"+s1+"]";
}