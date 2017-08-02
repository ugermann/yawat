// This file is part of the YAWAT package.
// (c) 2007 Ulrich Germann. All rights reserved.
// This is NOT free software, but permission is granted to use this 
// software free of charge for academic research purposes.

// to be added: mouseOut handling for cascading context menus

function ContextMenu(id)
{
   this.div = document.createElement("div");
   this.div.id = id;
   this.div.className = 'CTM';
   // this.div.onmouseout = onMouseOutContext;
   this.div.parent = this;
}


ContextMenu.prototype.addItem = function(name,item,action,position)
{
   if (typeof item == "string") 
   {
      var foo = document.createTextNode(item);
      item = document.createElement('div');
      item.appendChild(foo);
      item.className = 'ctmItem';
   }
   item.show = function() 
   { 
      if (this.style) with (this.style)
      {
	 visibility = 'visible'; 
	 display = 'block';
      }
   }
   item.hide = function()
   {
      if (this.style) with (this.style)
      {
	 visibility = 'hidden';
	 display = 'none';
      }
   }
   item.label = name;
      
   if (position)
      this.div.insertBefore(item,this.div.childNodes[position])
   else
      this.div.appendChild(item);

   if (name) 
      this[name] = item;

   // if (action)
   // item.onclick = action;

   // yet to be implemented (if ever): hotkey functionality
   // (i.e., let keystrokes trigger menus and actions)

   return item;
}

ContextMenu.prototype.show = function(X,Y)
{
   this.prevCTM = currentCTM;
   currentCTM = this;

   this.div.style.visibility = 'visible';
   this.div.style.display    = 'block';
   this.div.style.zIndex     = 10;
   // Determine the mouse position and place the menu accordingly.
   // We want to open the meny *under* the current mouse position 
   // in such a way that it is completely visible on the current screen.
   this.div.style.top 
      = ((Y + this.div.offsetHeight > window.pageYOffset + window.innerHeight)
	 ? window.innerHeight + window.pageYOffset - this.div.offsetHeight
	 : Math.max(0,Y-10));
   
   this.div.style.left 
      = ((X + this.div.offsetWidth > window.pageXOffset + window.innerWidth)
	 ? window.innerWidth + window.pageXOffset - this.div.offsetWidth
	 : Math.max(0,X-10));

   // log('hello '+this.div.style.left+' '+this.div.style.top);
}	

ContextMenu.prototype.hide = function() 
{
   currentCTM = this.prevnull;
   this.div.style.visibility = 'hidden';
   this.div.style.display = 'none';
   // log ('hidden');
}

function setupCTM1(ctm)
{
}


