// This file is part of the YAWAT package.
// (c) 2007 Ulrich Germann. All rights reserved.
// This is NOT free software, but permission is granted to use this 
// software free of charge for academic research purposes.

// the main YAWAT application
var yawat = document.createElement("div");
var changed = false;
var bitext =false;
var saveDestination;
var encoding;

var pleaseWaitBox = document.createElement('div');
pleaseWaitBox.id = 'pleaseWaitBox';
pleaseWaitBox.appendChild(document.createTextNode("Please wait. This may take a moment ..."));
pleaseWaitBox.show = function()
{
   show(this);
   this.style.top  = (window.innerHeight - this.offsetHeight)/2;
   this.style.left = (window.innerWidth  - this.offsetWidth)/2;
}

document.body.appendChild(pleaseWaitBox);

function BiText(id,title,data,prevSid,curSid,nextSid)
{
   this.id      = id;
   this.div     = document.createElement("div");
    // this.div.acceptCharset = encoding;
   this.toolbar = document.createElement("form");
   this.toolbar.method='POST';
   this.toolbar.action=url_index;

   this.body    = document.createElement("div");
   this.body.width = '300';
   this.panes = new Object();
   this.div.bitext = this;
   this.div.id = 'yawat';
   this.div.onWindowResize = function() { this.bitext.onWindowResize(); }
   // set up the toolbar:
   var T = document.createElement('table');
   var tr = T.insertRow(0);
   T.width = '100%';
   T.style.color='yellow';
   this.toolbar.left   = tr.insertCell(0);
   this.toolbar.center = tr.insertCell(1);
   this.toolbar.right  = tr.insertCell(2);
   this.toolbar.left.align   = 'left';
   this.toolbar.left.width   = '35%';
   this.toolbar.center.align = 'center';
   this.toolbar.center.width = '30%';
   this.toolbar.right.align  = 'right';
   this.toolbar.appendChild(T);

   // set up the footer
   this.footer = this.toolbar.cloneNode(true);
   this.toolbar.className = 'yawatHeader';
   this.footer.className = 'yawatFooter';
   this.footer.left   = this.footer.firstChild.rows[0].cells[0];
   this.footer.center = this.footer.firstChild.rows[0].cells[1];
   this.footer.right  = this.footer.firstChild.rows[0].cells[2];

//    this.footer.left.align   = 'left';
//    this.footer.left.width   = '35%';
//    this.footer.center.align = 'center';
//    this.footer.center.width = '30%';
//    this.footer.right.align  = 'right';
//    this.footer.width

   if (url_prev)
   {
      this.prevButton = new Button(9664);//'[prev]');
      this.prevButton.div.bitext = this;
      // this.prevButton.div.action = function () { this.bitext.save(); this.bitext.jump(nextSid); }
      this.prevButton.div.action = function () { window.location=url_prev; }
      this.toolbar.center.appendChild(this.prevButton.div);
   }
   this.idxButton = new Button('[index]');
   this.idxButton.div.bitext = this;
   // this.nextButton.div.action = function () { this.bitext.save(); this.bitext.jump(nextSid); }
   this.idxButton.div.action = function () { window.location=url_index; }
   this.toolbar.center.appendChild(this.idxButton.div);

   if (url_next)
   {
      this.nextButton = new Button(9654);//'[next]');
      this.nextButton.div.bitext = this;
      this.nextButton.div.action = function () { window.location=url_next; }
      this.toolbar.center.appendChild(this.nextButton.div);
   }



   // this.toolbar.left.appendChild(document.createTextNode("Yawat"));
   var annoInfo = document.createTextNode(" Annotator: "+annotatorName);
   this.toolbar.left.appendChild(annoInfo);
   

   this.saveButton = new Button('[save]');
   this.saveButton.div.bitext = this;
   this.saveButton.div.action = function () { this.bitext.save(); }
   this.saveButton.disable();
   // this.toolbar.center.appendChild(this.setVerticalLayoutButton.div);
   this.toolbar.right.appendChild(this.saveButton.div);

   // add a 'log out' button
   var myfield = document.createElement('input');
   myfield.type='hidden';
   myfield.name='logout';
   myfield.value='1';
   this.toolbar.appendChild(myfield);
   this.logoutButton = new Button('[log out]');
   this.logoutButton.div.logoutForm = this.toolbar;
   this.logoutButton.div.action = function () { this.logoutForm.submit(); }
   this.toolbar.right.appendChild(this.logoutButton.div);


   this.setVerticalLayoutButton = new Button(9707);
   this.setVerticalLayoutButton.div.bitext = this;
   this.setVerticalLayoutButton.div.action 
      = function () { this.bitext.toggleLayout(); }
   this.toolbar.right.appendChild(this.setVerticalLayoutButton.div);

   // add the Yawat copyright notice to the footer
   // document.createTextNode(String.fromCharCode(169)+" 2007 Ulrich Germann")
   var copyRightNotice="&copy; 2007-2009 Ulrich Germann";
   this.footer.right.appendChild(document.createTextNode(copyRightNotice));
   this.footer.right.style.fontSize = '8pt';

    // set up the bitext body
    this.body.style.display = 'block';
    // this.body.style.position = 'fixed';
    // this.body.style.overflow = "scroll";
    this.body.style.paddingTop = "50px"; //this.toolbar.offsetHeight;
    // this.body.style.marginBottom = "-35px"; //this.toolbar.offsetHeight;

   var h1 = document.createElement('h1');
   h1.align='center';
   h1.appendChild(document.createTextNode(title));
   this.body.appendChild(h1);

   // Now add the sentences. /data/ is an array of arrays,
   // which in turn are 
   // - sentence id, (string or number)
   // - sentence 1,  
   // - sentence 2, and 
   // - alignment info
   // - alignment info for diff purposes
   
   var keepProtocolTemp = keepProtocol;
   keepProtocol=false;
    var firstUnFinished = 0;
   for (var i in data)
   {
      var item = data[i];
      if (item.length == 5)
	  var p = new Pane(item[2],item[3],item[4],item[0],item[1]);
      else
	  var p = new Pane(item[2],item[3],item[4],item[0],item[1],item[5],item[6]);
      this.panes[item[0]] = p;
      p.bitext = this;

       // this.body.appendChild(anchor);

       var a = document.createElement("anchor");
       a.name = "atpane"+item[0];
       a.id   = "atpane"+item[0];
       a.style.display = 'block';
       a.style.position.relative;
       // a.style.marginBottom = "35px";
       this.body.append(a);

       this.body.appendChild(p.div);
       if (firstUnFinished == 0 && !item[1])
	   firstUnFinished = item[0];
   }

    this.done = new Array(data.length,false);

   this.div.appendChild(this.toolbar);
   this.div.appendChild(this.body);
   // this.div.appendChild(this.footer);
   changed = false;
   this.saveButton.disable();
   keepProtocol=keepProtocolTemp;
   protocol("NEW SESSION");
    if (firstUnFinished) 
	window.location.hash = "atpane"+firstUnFinished;
}

BiText.prototype.toggleLayout = function()
{
   var layout = null;
   for (var x in this.panes)
   {
      var p = this.panes[x];
      if (!layout) 
	 layout  = p.layout;
      if (layout == 'vertical')
	 p.setLayout('horizontal');
      else
	 p.setLayout('vertical');
   }
}

BiText.prototype.onWindowResize = function()
{
   for (var p in this.panes)
      if (this.panes[p].matrix)
	 this.panes[p].matrix.updateRulerOffsets();
}

BiText.prototype.save = function()
{
   // pack the data
   var self = this;
   var dstring = ''; //this.id+'';
   for (var p in this.panes)
      dstring += '\n'+this.panes[p].pack();

   // build an http request submitting it
   this.saveReq = new XMLHttpRequest();
   this.saveReq.open('POST',saveDestination,true);
   this.saveReq.setRequestHeader('Content-Type', 
				 'application/x-www-form-urlencoded');
   this.saveReq.onreadystatechange = function() 
   { 
     if (self.saveReq.readyState == 4)
      {
	 if (bitext.timeout)
	    window.clearTimeout(bitext.timeout);
	 // alert(self.saveReq.responseText);
	 if (self.saveReq.responseText == "OK")
	 {
	    window.status = 'Save sucessful';
	    changed = false;
	    bitext.saveButton.disable();
	     theProtocol = '';
	     var log = document.getElementById('log');
	     if (log) log.value = '';
	     // alert("Data saved.");
	 }
	  else
	  {
	    alert("Data could not be saved!");
	     alert(self.saveReq.responseText);
	 }
      }
   }
 
    var done = '';
    for (var p in this.panes)
	done += this.panes[p].id+':'+this.panes[p].done.checked+'+';
    
   // and send the data:
   this.saveReq.send('text='+escape(this.id)+'&data='+dstring
		     +'&protocol='+escape(theProtocol)
		     +'&done='+done);
   this.timeout = window.setTimeout("saveFailed()", 10000);
}

function saveFailed()
{
   alert("Saving failed! "+bitext.timeout);
   delete bitext.timeout;
}
