// This file is part of the YAWAT package.
// (c) 2007 Ulrich Germann. All rights reserved.
// This is NOT free software, but permission is granted to use this 
// software free of charge for academic research purposes.

function Button(label,tooltip,root)
{
   this.div = document.createElement('div');
   with (this.div)
   {
      className = 'navButton';
      if (typeof(label) == 'string')
	 appendChild(document.createTextNode(label));
      else if (typeof(label) == 'number')
	 appendChild(document.createTextNode(String.fromCharCode(label)));
      else
	 appendChild(label);
   }
   this.div.root = root;
   this.div.style.cursor = 'pointer';
}

Button.prototype.enable = function()
{
   this.div.onclick = this.action;
   this.div.className = 'navButton';
   this.show();
}

Button.prototype.disable = function()
{
   this.div.onclick = null;
   this.div.className = 'navButtonDisabled';
   this.hide();
}

Button.prototype.show = function()
{
   this.div.style.visibility = 'visible';
}

Button.prototype.hide = function()
{
   this.div.style.visibility = 'hidden';
}

