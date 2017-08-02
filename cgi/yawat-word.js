// This file is part of the YAWAT package.
// (c) 2007 Ulrich Germann. All rights reserved.
// This is NOT free software, but permission is granted to use this 
// software free of charge for academic research purposes.

function Word(label,side,idx,pane,pane_id)
{
   // We need to pass pane and pane id separately because
   // the pane isn't created yet at the time the Word constructor
   // is called. ;; this needs to be checked again
   this.side  = side
   this.idx   = idx;
   this.label = label;
   this.id    = pane_id+'.'+side+'.'+idx;
   this.pane  = pane;
   this.span  = document.createElement("span");
   this.span.appendChild(document.createTextNode(label));
   this.span.word = this;
   this.span.id   = this.id;
   this.span.onmouseover   = onMouseOverWord;
   this.span.onmouseout    = onMouseOutWord;
   this.span.className     = 'word unaligned1';
}

function onMouseOverWord(evt)
{
   if (!evt) evt = window.event;
   var wrd = evt.target ? evt.target.word : evt.srcElement.word;
   if (currentCTM || recentHighlight) return false; 
   if (activeGroup && activeGroup.pane != wrd.pane)
      return false;

   // if (wrd.agroup) window.status = wrd.agroup.label;
   wrd.highlight();
   if (activeGroup)
      this.style.border = 'medium solid magenta';
}

function onMouseOutWord(evt)
{
   if (!evt) evt = window.event;
   var wrd = evt.target ? evt.target.word : evt.srcElement.word;
   // if (activeGroup && activeGroup.pane != wrd.pane)
   // return false;

   wrd.span.style.border = null;
   if (!currentCTM && !(activeGroup && wrd.agroup == activeGroup))
      wrd.unhighlight();
}

Word.prototype.highlight = function ()
{
   var wrd = this;
   if (activeGroup)
   {
      if (wrd.agroup)
      {
	 if (wrd.agroup != activeGroup)
	    wrd.agroup.highlight(wrd);
	 wrd.span.className = 'word '+wrd.agroup.label+'3';
      }
      else
      {
	 wrd.span.className = 'word unaligned3';
      }
      wrd.span.style.borderColor = 'magenta';
   }
   else if (wrd.agroup)
      wrd.agroup.highlight();
   else
      wrd.span.className = 'word unaligned2';
}

Word.prototype.unhighlight = function()
{
   var wrd = this;
   wrd.span.style.border = null;
   if (wrd.agroup)
      wrd.agroup.unhighlight();
   else
      wrd.span.className = 'word unaligned1';
}

function handleLeftClickOnWord(wrd)
{
   protocol("left click on word "+wrd.id+" ('"+wrd.label+"')");
   if (activeGroup && activeGroup.pane == wrd.pane)
   {  // i.e., we are currently editing a word group
      // and the word we clicked on is in the same pane
      if (activeGroup.contains(wrd))
      {
	 // protocol("T: del " + wrd.id + " from group " 
	 // + activeGroup.descriptor());
	 activeGroup.delWord(wrd);
      }
      else
      {
	 // protocol("T: add " + wrd.id + " to group " 
	 // + activeGroup.descriptor());
	 activeGroup.addWord(wrd);
      }
   }
   else if (!activeGroup)
   {
      if (!wrd.agroup)
      {
	 activeGroup = new AGroup(wrd.pane);
	 activeGroup.edit(wrd);
	 activeGroup.addWord(wrd);
	 // protocol("T: new group "+ activeGroup.descriptor());
      }
      else
      {
	 activeGroup = wrd.agroup;
	 activeGroup.edit(wrd);
      }
   }
   return false;
}

function handleRightClickOnWord(target,x,y)
{
   var wrd = target.word;
   protocol("right click on word "+wrd.id+" ('"+wrd.label+"')");
   if (activeGroup)
   { // we are currently editing the group
      if (activeGroup.pane != wrd.pane)
	 return false;
      if (!activeGroup.contains(wrd))
      {
	 // protocol("T: add " + wrd.id + " to group " 
	 // + activeGroup.descriptor());
	 activeGroup.addWord(wrd);
      }
      activeGroup.closeEdit(wrd);
   }
   else
   { // offer context menu for labeling
      CTM1.show1(target,x,y);
   }
   return false;
}

function removeWordFromGroup(wrd)
{
   var ag = wrd.agroup;
   // protocol("del " + wrd.id + " from group " 
   // + ag.descriptor());
   ag.delWord(wrd);
   ag.unhighlight();
   wrd.unhighlight();
   // overWord = null;
   if (currentCTM) currentCTM.hide();
   // wrd.pane.CTM1.hide();
}

function labelGroup(wrd,label)
{
   if (!wrd.agroup)
      new AGroup(wrd.pane).addWord(wrd);
   protocol("label " + wrd.agroup.descriptor() +" as " + label);
   wrd.agroup.label=label;
   wrd.agroup.highlight();
   recentHighlight = wrd.agroup;
   if (currentCTM) currentCTM.hide();
   changed = true;
   wrd.agroup.pane.bitext.saveButton.enable();
}

function ungroupAll(group)
{
   protocol("dissolve " + group.descriptor());
   for (var w in group.side[0])
   {
      var wrd = group.side[0][w];
      group.delWord(wrd);
      wrd.unhighlight();
   }
   for (var w in group.side[1])
   {
      var wrd = group.side[1][w];
      group.delWord(wrd);
      wrd.unhighlight();
   }
   // overWord = null;
   if (currentCTM) currentCTM.hide();
   // group.pane.CTM1.hide();
}
