#!/usr/bin/perl

# Part of YAWAT -- Yet Another Word Aligment Tool
# (c) 2007 Ulrich Germann; all rights reserved

# This is NOT free software, but permission is granted to use this 
# software free of charge for academic research purposes.

# This script handles document delivery or prints an 
# index if no document is requested.

BEGIN
{
  use File::Basename;
  no strict "subs";
  use CGI::Carp qw(fatalsToBrowser carpout);
  open ERRORS, ">>yawat.errors.log" 
    or open ERRORS, ">>../../logs/yawat.errors.log" 
      or die "$!\n";
  carpout(ERRORS); # put error messages in "errors.log"
  use CGI qw(:standard);
}

use strict;
use Fcntl;
use File::Basename;
my $q = new CGI;
# we currently use .htaccess authentication to identify the annotator:
my $annotator = $q->remote_user();

# $recloc is the URL of the .js files; 
# Use the first option if the .js files are installed locally
#my $recloc = "http://".$q->server_name()."/~germann/yawat";
my $recloc = ""; # "http://www.cs.toronto.edu/~germann/yawat";
my %CFG;

open CFGFILE, "yawat.cfg" or die "yawat.cfg: $!\n";
while (my $line = <CFGFILE>)
{
    #print "$line\n";;
    chomp $line;
    my ($key,$value) = split(/\s*=\s*/, $line);
    $CFG{$key} = $value;
}
close CFGFILE;
my $datadir   = $CFG{"datadir"};

my $self = $q->url();
$annotator    = "guest" unless $annotator;
my $text = $q->param('text');
my $datareq = $q->param('getdata');
my $sentid = $q->param('sid');
my $path = dirname($self);
my $totaltime = 0;
if (!$text && !$datareq)
  { # print the index
      opendir(DIR,"$datadir/$annotator");
      my @files = sort(grep /\.crp$/, readdir(DIR));
      for (@files) { s/\.crp//; }
      print $q->header({-expires=>'-1d',charset=>'utf8',-'cache-control'=>'no-cache'});
      print "<html>\n<body><h1>Index</h1><table cellpadding=5>\n";
      #print "datadir = $datadir<br>files=@files";
      foreach my $file (@files)
      {
	  print "<tr><td><a href='$self?text=$file'>$file</a></td>\n";
	  print "<td>";
	  if (-e "$datadir/$annotator/$file.aln")
	  {
	      print "<a href=$self?getdata=$file>alignment data</a>";
	      my $logtime = &scan_time("$datadir/$annotator/".$file.".log");
	      if ($logtime > 0) {
		  $totaltime += $logtime;
 	          printf (" %d:%02d minutes",$logtime/60,$logtime % 60);
              }
	  }
	  print "</td></tr>\n";
      }
      print "</table>\n";
      printf("<p>total time: %d:%02d hours",$totaltime/3600,($totaltime/60) % 60);
      print "</body></html>\n";
  }
elsif ($datareq)
  {
    print $q->header({-expires=>'-1d',charset=>'utf8',-'cache-control'=>'no-cache',-'content-type'=>'text/plain'});
    open DATA, "$datadir/$annotator/$datareq.aln" 
      or die "$datareq.aln: $!\n";
    print (<DATA>);
    close DATA;
  }
else
  {
    my (%E,%F,%A,%X);
    open BITEXT, "$datadir/$annotator/$text.crp";
    while (my $sid = <BITEXT> and my $e = <BITEXT> and my $f = <BITEXT>)
      {
	chomp $sid;
	# print "$sid\n";
	$E{$sid} = $e;
	$F{$sid} = $f;
      }
    close BITEXT;
    open ALN, "$datadir/$annotator/$text.aln";
    my $roMode = !(-W "$datadir/$annotator/$text.aln");
    while (my $a = <ALN>)
      {
	chomp $a;
	my ($sid,$alninfo) = split(/\s+/, $a, 2);
	# print "X: $sid $alninfo\n";
	$A{$sid} = $alninfo;
      }
    
    if (-e "$datadir/$annotator/$text.aln.2")
    {
	open XTRA, "$datadir/$annotator/$text.aln.2";
	while (my $a = <XTRA>)
	{
	    chomp $a;
	    my ($sid,$alninfo) = split(/\s+/, $a, 2);
	    # print "X: $sid $alninfo\n";
	    $X{$sid} = $alninfo;
	}
    }
    
    print $q->header({-expires => '-1d',charset=>'utf-8',-'cache-control'=>'no-cache',-pragma=>'no-cache'});
    print "<html>\n";
    print "<head>\n";
    # print "<meta http-equiv=\"content-type\" content=\"text/html\">\n";
    print "<link rel=\"stylesheet\" type=\"text/css\" href=\"".$recloc."yawat.css\">\n";
    print "<link rel=\"stylesheet\" type=\"text/css\" href=\"".$recloc."tagset.css\">\n";
    print "<title>Yawat - Yet Another Word Alignment Tool</title>\n";
    print "</head>\n";
    print "<body>\n";
    includeScripts("yawat.js", 
		   "yawat-tagset.js",
		   "yawat-ctm.js",
		   "yawat-ctm1.js",
		   "yawat-word.js",
		   "yawat-sentence.js",
		   "yawat-agroup.js",
		   "yawat-matrix.js",
		   "yawat-pane.js",
		   "yawat-application.js",
		   "yawat-button.js");
    print "<script type=\"text/javascript\">\n";
    print "var data = new Array()\n";
    foreach my $k (sort { $a <=> $b } keys(%E))
      {
	my @e = split(/\s+/, $E{$k});
	for (@e) { s/'/\\'/g; }
	my @f = split(/\s+/, $F{$k});
	for (@f) { s/'/\\'/g; }
	my $estring = "['".join("','",@e)."']";
	my $fstring = "['".join("','",@f)."']";
	if ($X{$k})
	{
	    print sprintf("data.push(['%s',%s,%s,'%s','%s']);\n",
			  $k,$estring,$fstring,$A{$k},$X{$k});
	}
	else
	{
	    print sprintf("data.push(['%s',%s,%s,'%s']);\n",
			  $k,$estring,$fstring,$A{$k});
	}
      }
    print "bitext = new BiText('$text','$text',data);\n";
    print "document.body.appendChild(bitext.div);\n";
    print "saveDestination='$path/save.cgi';\n";
    print "readOnlyMode=",($roMode ? "true;\n" : "false;\n");
    print "</script>\n";
    print "<input id='clearButton' type=button onclick=\"document.getElementById('log').value = '';\" value=clear name=clearButton><br>\n";
    print "<textarea id=log cols=80 rows=10></textarea>\n";
    print "</body>\n</html>\n";
  }

sub includeScripts
{
    for (@_)
    { print "<script type=\"text/javascript\" src=\"".$recloc."$_\"></script>\n"; }
}


sub scan_time {
    my ($file) = @_;
    open(LOG,$file);
    my $last_time = 0;
    my $total_time = 0;
    while(<LOG>) {
        next unless /^\[(\d+)\]/;
        if (($1 > $last_time) && # ignore negative
            ($1 - $last_time < 5 * 60 * 1000)) { # don't count breaks > 5min
            $total_time += ($1 - $last_time) / 1000;
        }
        $last_time = $1;
    }
    close(LOG);
    return $total_time;
}

