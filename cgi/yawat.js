// -*- mode: javascript; indent-tabs-mode: nil; tab-width: 2 -*-
// This file is part of the YAWAT package.
// (c) 2007 Ulrich Germann. All rights reserved.
// This is NOT free software, but permission is granted to use this 
// software free of charge for academic research purposes.

// global variables
var activeGroup  = null; // alignment group currently being edited
var currentCTM   = false;
var overCell     = null;
var recentHighlight=null;
var readOnlyMode = false;
var keepProtocol = true;
var diffMode = false;
var theProtocol  = '';
var url_index = '';
var url_next ='';
var url_prev =''
var annotatorName='';
// Browser-specific stuff
var Netscape = navigator.appName=="Netscape";
var leftMouseButton  = Netscape ? 1 : 1;
var rightMouseButton = Netscape ? 3 : 2;
// Opera codes to be added 

var SHIFT_key = "Shift";
var CTRL_key  = "Control";
var ESC_key   = "Escape";
// var CAPS_LOCK = ";
var DEL_key   = "Delete";

var AlignmentProtocol;

if(!Netscape)
{ 
  alert("Oops, I cannot handle your browser type!"); 
}

window.onclick = handleClick;
window.oncontextmenu = function() { return false; }
window.onresize = onWindowResize;
window.onmousemove = function()
{
    if (recentHighlight)
    {
        recentHighlight.unhighlight();
        recentHighlight = null;
    }
}

var isDown = new Object();
window.onkeydown = function(e)
{
    if (!e) e = windown.event;
    // alert(e.key);
    if (e.key in isDown) ++isDown[e.key];
    else isDown[e.key] = 1;
    if (e.key == "Delete")
    {
        var x = document.getElementById('log');
        if (x) x.value='';

    }
    if (e.key == "Escape")
    {
        if (currentCTM)
            cancelOpenContextMenus(null);
        else if (activeLayer.seln.length)
            activeLayer.popSeln();
        return false;
    }
    else 
    {
        log('key down event:' + e.key);
    }
}

window.onkeyup = function(e)
{
    if (!e) e = windown.event;
    --isDown[e.key];
}

// Important note about event handling: I do it top-down, with a 
// central event handler passing the event to the appropriate 
// handler

function getMouseX(evt)
{  // how the mouse position is reported differs from Browser to Browser
   // this function returns the offset relative to the top left corner 
   // of the document
   return evt.pageX; // Mozilla,Netscape, etc.
}

function getMouseY(evt)
{  // how the mouse position is reported differs from Browser to Browser
   // this function returns the offset relative to the top left corner 
   // of the document
   return evt.pageY; // Mozilla,Netscape, etc.
}

function cancelOpenContextMenus(stop)
{
   for (var ctm = currentCTM; ctm && ctm != stop; ctm = currentCTM)
      ctm.hide();
}

function handleClick(evt)
{
   if (!evt) evt = window.event; // IE 
   var target    = evt.target ? evt.target : evt.srcElement; // Netscape vs. IE
   var button    = evt.which  ? evt.which  : evt.button;     // Netscape vs. IE
    
   if (activeGroup && !(target.word && target.word.pane == activeGroup.pane))
   {
      protocol("cancel edit");
      activeGroup.cancelEdit();
      if (target.word) target.word.highlight();
   }
   else if (target.action) // click on menu item or button
   {
      target.action();
      cancelOpenContextMenus(null);
   }
   else if (currentCTM)
   {
      cancelOpenContextMenus(null);
   }
   else if (target.word)
   {
       // alert(isDown[SHIFT_key]);
       if (readOnlyMode)
           return false; // do nothing
       if (button == rightMouseButton || isDown[SHIFT_key])
	         handleRightClickOnWord(target,getMouseX(evt),getMouseY(evt));
       else 
	         handleLeftClickOnWord(target.word);
      evt.stopPropagation();
   }
   else if ('col' in target && 'row' in target)
   {
       if (readOnlyMode)
	         return false; // do nothing
       if (button == rightMouseButton || isDown[SHIFT_key]) 
       {
	         handleRightClickOnCell(target,getMouseX(evt),getMouseY(evt));
       }
       else
       {
           window.status = 'left click on cell';
	         handleLeftClickOnCell(target);
       }
       evt.stopPropagation();
   }
   return false;
}
window.onmousedown=function(){ return false;}



function log(text)
{
    var log = document.getElementById('log');
    if (log) log.value += text+"\n";
}

function protocol(text)
{
   if (!keepProtocol) return;
   var t = new Date().getTime();
   theProtocol += "["+t+"] "+text+'\n';
}



function hide(div)
{
   if (div.style)
   {
      div.style.visibility = 'hidden';
      if (div.style.display == 'block');
	 div.style.display = 'none';
   }
}

function show(div)
{
   if (div.style)
   {
      div.style.visibility = 'visible';
      if (div.style.display == 'none');
	 div.style.display = 'block';
   }
}

function visible(div)
{
   return div.style.visibility = 'visible';
}

function clear(div)
{
   while (div.firstChild)
      div.removeChild(div.firstChild);
}

function onWindowResize(evt)
{
   document.getElementById('yawat').onWindowResize();
}

window.onbeforeunload = function()
{
   if (changed)
   {
      return "\n----------\nThere are unsaved changes!\n----------\n";
   }
   window.location.reload(true);
}
