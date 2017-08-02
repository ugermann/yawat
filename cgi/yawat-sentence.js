// This file is part of the YAWAT package.
// (c) 2007 Ulrich Germann. All rights reserved.
// This is NOT free software, but permission is granted to use this 
// software free of charge for academic research purposes.

function Sentence(L,side,pane,pane_id)
{
   this.words = new Array(L.length);
   this.div = document.createElement('div');
   this.div.style.lineHeight = '160%';
   // this.div.style.whiteSpace = 'normal';
   with (this.div)
   {
      //style.display = 'block';
      for (var i = 0; i < L.length; i++)
      {
	 if (firstChild) 
	    appendChild(document.createTextNode(" "));
	 this.words[i] = new Word(L[i],side,i,pane,pane_id);
	 this.words[i].pane = pane;
	 appendChild(this.words[i].span);
      }
   }
}
