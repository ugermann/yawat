// This file is part of the YAWAT package.
// (c) 2007 Ulrich Germann. All rights reserved.
// This is NOT free software, but permission is granted to use this 
// software free of charge for academic research purposes.

// set up the context menu
var CTM1 = new ContextMenu('ctm1');
CTM1.addItem('removeWord1',"");
CTM1.addItem('removeWord2',"");
CTM1.addItem('ungroupAll',"dissolve this group");
CTM1.addItem('sep1',document.createElement('hr'));

with(CTM1.addItem('text1',"label group as ..."))
{
   className = null;
   style.fontSize = '8pt';
   style.fontWeight = 'bold';
}

for (var foo in biLabels)
   CTM1.addItem(foo,biLabels[foo]).className = foo+'M';

for (var bar in moLabels)
   CTM1.addItem(bar,moLabels[bar]).className = bar+'M';

document.body.appendChild(CTM1.div);

CTM1.show1 = function(target,x,y)
{
   if (target.word)
   {
      var w1 = target.word;
      var w2 = null;
   }
   else
   {
      var w1 = target.matrix.E.words[target.row];
      var w2 = target.matrix.F.words[target.col];;
   }

   if (w1.agroup && w1.agroup.bi())
   {
      for (var foo in biLabels)
      {
	 CTM1[foo].label = foo;
	 CTM1[foo].action = function () { labelGroup(w1,this.label); }
	 CTM1[foo].show();
      }
      // alert(CTM1['literal'].action);
      for (var bar in moLabels)
	 CTM1[bar].hide();
   }
   else
   {
      for (var foo in biLabels)
	 CTM1[foo].hide()
      for (var bar in moLabels)
      {
	 var label = new String(bar);
	 CTM1[bar].label = bar;
	 CTM1[bar].action = function () { labelGroup(w1,this.label); }
	 CTM1[bar].show();
      }
   }
   if (w1.agroup && (!w2 || w1.agroup == w2.agroup))
   {
      CTM1.sep1.show();
      CTM1.ungroupAll.action = function () { ungroupAll(w1.agroup); }
      CTM1.ungroupAll.show();
      CTM1.removeWord1.firstChild.nodeValue = "remove '"+w1.label+"' from this group";
      CTM1.removeWord1.action = function() { w1.agroup.delWord(w1); }
      CTM1.removeWord1.show();
      if (w2)
      {
	 CTM1.removeWord1.firstChild.nodeValue  
	    = 'clear row: '+CTM1.removeWord1.firstChild.nodeValue;
	 CTM1.removeWord2.firstChild.nodeValue = "clear column: remove '"+w2.label+"' from this group";
	 CTM1.removeWord2.action = function() { w2.agroup.delWord(w2); }
	 CTM1.removeWord2.show();
      }
   }
   else
   {
      CTM1.sep1.hide();
      CTM1.ungroupAll.hide();
      CTM1.removeWord1.hide();
      CTM1.removeWord2.hide();
   }
   this.show(x,y);
}
