#!/usr/bin/perl

# Part of YAWAT -- Yet Another Word Aligment Tool
# (c) 2007-2013 Ulrich Germann; all rights reserved

# This is NOT free software, but permission is granted to use this 
# software free of charge for academic research purposes.

# This script handles document delivery or prints an 
# index if no document is requested.

# TO DO:
# - set a cookie when logging in
#   done, but firefox won't forget cookies without an expiry date
#   (apparently by design)
# - add logout button to yawat tool bar
# - add password verification when logging in

use strict;
use Fcntl;
use File::Basename;
use Date::Format;

our %CFG;

BEGIN
{
  use File::Basename;
  no strict "subs";
  use CGI::Carp qw(fatalsToBrowser carpout);

  sub readConfigFile
  {
    open CFGFILE, "$_[0]" or die "$_[0]: $!\n";
    while (my $line = <CFGFILE>)
    {
      next if $line =~ m/^\s*#/;
      chomp $line;
      my ($key,$value) = split(/\s*=\s*/, $line);
      $CFG{$key} = $value;
    }
    close CFGFILE;
  }

  # read config file yawat.cfg to get error log file name
  readConfigFile("yawat.cfg");

  # open error log
  my $errorlog = ($CFG{"errorLog"} or "yawat.errors.log");
  if (-e $errorlog and !-w $errorlog)
  {
    die "File '$errorlog' exists but is not writable\n";
  }
  elsif (!-e $errorlog and !-w dirname($errorlog))
  {
    die sprintf("Can't create file '%s' in '%s/'\n",
	      $errorlog,dirname($errorlog));
  }
  open ERRORS, ">>$errorlog" 
    or die ("Could not open error log file '$errorlog': $!\n");
  carpout(ERRORS); # put error messages in "errors.log"
  use CGI qw(:standard);
}

my $q         = new CGI;
my %done;
# $recloc can be used to obtain the js file from a different location,
# e.g., 
#my $recloc = "http://".$q->server_name()."/~germann/demo/yawat/";
# my $recloc = "http://data.statmt.org/yawat";
my $recloc = ($CFG{"URL"} or dirname($q->url()));
$recloc .= "/" unless $recloc =~ /\/$/;
my $annotator = $q->cookie('yawat-login');
my $login     = $q->param('login');

if ($q->param('logout')
    #or (-r ".htaccess" and not $q->remote_user())
    or !($annotator or $login))
{
  &print_login_screen;
  exit(0);
}
# Note on the .htaccess part: If .htaccess is used (optional), 
# force new login after browser closure.
# Firefox does not forget cookies without an expiry date when it 
# closes (apparently by design to be able to restore tabs)

my $cookie    = undef;
if (!$annotator)
{
  $annotator = $login;
  die "Can't read password file '$CFG{passwd}'!" unless -r $CFG{"passwd"};
  open PASSWD, $CFG{"passwd"} or die "$CFG{passwd}: $!\n";
  foreach my $line (<PASSWD>)
  {
    chomp $line;
    my ($who,$pw) = split / /, $line;
    next if ($who ne $login || crypt($q->param('passwd'),$pw) ne $pw);
    $cookie = $q->cookie(-name=>"yawat-login", -value=>"$login");
    last;
  }
  close PASSWD;
  if (!$cookie)
  {
    &print_login_screen(1);
    exit(0);
  }
}


my $datadir   = $CFG{"datadir"};

# local setting override global settings
my $localcfgfile = "$datadir/$annotator/yawat.cfg";
readConfigFile($localcfgfile) if -e $localcfgfile;

my $diffMode      = $CFG{"diffMode"};
my $keepProtocol  = $CFG{"keepProtocol"};
$diffMode     = "false" unless $diffMode;
$keepProtocol = "true"  unless $keepProtocol;


my $this_script = $recloc; # $q->url();
$this_script .= "yawat.cgi" 
    unless $this_script =~ /(yawat|index)\.cgi$/;

my $text    = $q->param('text');
my $datareq = $q->param('getdata');
my $path    = dirname($this_script);
my $subdir  = $q->param('subdir');
my (@files,@sdirs);

&process_annotator_directory;

if (!$text && !$datareq)
{
  &print_index;
}
elsif ($datareq)
{
  &print_alignment_data;
}
else
{
  &print_task;
}

sub includeScripts
{
  for (@_)
  {
    print "<script type=\"text/javascript\" src=\"".$recloc."$_\"></script>\n";
  }
}

sub print_login_screen()
{
  my $loginerror = shift @_;
  my $clearcookie = $q->cookie(-name=>'yawat-login', -value=>'');
  print $q->header(-title=>'Yawat login', -cookie=>$clearcookie);
  print "<html>\n";
  print "<head>\n";
  print "<style type=\"text/css\">\n";
  print "<!--\n";
  print ".logo { font-size: 30pt; font-weight: bold; padding: 0pt; margin: 0pt }\n";
  print ".marked { position:relative; color: red;\n";
  print "          text-align: center; display:inline-block; }\n";
  print ".nomark { position: relative; color: black; text-align: left;\n";
  print "          width: 0pt; overflow: visible; display:inline-block; }\n";
  print "-->\n";
  print "</style>\n";
  print "</head>\n";
  print "<body>\n";
  print "<div align=center>\n";
  print "<form method=POST action='$this_script'>\n";
  foreach my $field ('text','subdir')
  {
    if ($q->param($field))
    {
      print "<input type=hidden name=$field value='",$q->param($field),"'>\n";
    }
  }
  print "<table class=logo>\n";

  my $authorship=("<div class=nomark style=\"font-size: 8pt; ".
		  "color: gray; width: 150pt;\">".
		  "Version 1.2<br>&copy; 2006-2013<br>Ulrich Germann.</div>");
  
  print "<tr><td></td>";
  print "<td align=left style=\"text-align:left;\">";
  print "<div class=marked>\n";
  print "Y<div class=nomark>et</div><br>\n";
  print "A<div class=nomark>nother</div><br>\n";
  print "W<div class=nomark>ord</div><br>\n";
  print "A<div class=nomark>lignment</div><br>\n";
  print "T<div class=nomark><div style=\"width: 300pt;\">ool. ";
  print "$authorship</div></div>\n";
  print "</div></td></tr>\n";

  
  my $padding = "padding-top: 20pt; ";
  if ($loginerror)
  {
    print "<tr style=\"font-size: 12pt; color: red;\">\n";
    print "<td></td><td style=\"$padding\">";
    print "Login failed. Please try again.</td></tr>";
    $padding = "";
  }

  print "<tr style=\"font-size: 12pt;\">\n";
  print "<td style=\"text-align: right; $padding\">\n";
  print "Login:";
  print "</td>";
  print "<td style=\"$padding\">\n";
  print "<input type=text name='login' size=30></td></tr>\n";
  
  
  print "<tr style=\"font-size: 12pt;\">\n";
  print "<td style=\"text-align: right;\">\n";
  print "Password:";
  print "</td>";
  print "<td>\n";
  print "<input type=password name=passwd size=30></td></tr>\n";

  print "<tr><td></td><td><input type=submit value=\"log in\"\></td></tr>";

  print "</table>\n";
  print "</form>\n";
  print "</div>\n";
  print "</table>\n";

  print "<p style='position:fixed; bottom:1ex;'></p>\n";

  print "</body>\n";
  print "</html>\n";
}

sub print_index
{ # print the index
  print $q->header({ -cookie=>$cookie,
		     -'cache-control'=>'no-cache'});

  my $logoutbutton = "<form action=$this_script method=POST>";
  my $logoutbutton = "<input type=submit name=logout value='log out'>";
  
  print "<html>\n<body>";
  print "<form action=$this_script method=POST>";
  print "<h1>Index (for $annotator) $logoutbutton</h1>\n";
  print "</form>\n";

  print "<p>";
  if ($subdir)
  {
    my $updir = dirname($subdir);
    if ($updir ne ".")
    {
      print "<a href=$this_script?subdir=$updir>..<br>\n";
    }
    else
    {
      print "<a href=$this_script>..<br>\n";
    }
  }
  foreach my $d (@sdirs)
  {
      print "<a href=$this_script?subdir=$d>$d<br>\n";
  }
  print "</p>";

  print "<table cellpadding=5 border=1>\n";

  print "<tr>";
  print "<th>file</th>";
  print "<th>completed</th>";
  print "<th>last edit</th>";
  print "</tr>\n";
  foreach my $file (@files)
  {
    my $xsd = $subdir;
    if ($xsd) { $xsd .= "/" unless $xsd =~ /\/$/; }
    my ($d,$t) = completion_rate("$datadir/$annotator/$xsd$file.done");
    print "<tr>";
    print "<td><a href='$this_script?text=$xsd$file'>$file</a></td>\n";
    print "<td>$d", $t ? "/$t" : "", "</td>\n";
    print "<td>";
    if (-e "$datadir/$annotator/$xsd$file.log")
    {
	my $t = (stat "$datadir/$annotator/$xsd$file.log")[9];
	print time2str("%a, %e %b %Y, %R %Z (%z)", $t), "\n";
    }
    elsif (-e "$datadir/$annotator/$xsd$file.aln")
    {
	my $t = (stat "$datadir/$annotator/$xsd$file.aln")[9];
	print time2str("%a, %e %b %Y, %R %Z (%z)", $t), "\n";
    }
    print "</td>\n";
    #print "<td>";
    #if (-e "$datadir/$annotator/$xsd$file.aln")
    #{ print "<a href=$this_script?getdata=$xsd$file>alignment data</a>"; }
    #print "</td>\n";
    print "</tr>\n";
  }
  print "</table></body></html>\n";
}

sub print_alignment_data
{
  print $q->header({ -charset=>"$CFG{'encoding'}", 
		     -'cache-control'=>'no-cache',
		     -'content-type'=>'text/plain'});
  open DATA, "$datadir/$annotator/$datareq.aln" 
    or die "$datareq.aln: $!\n";
  print (<DATA>);
  close DATA;
}

sub include_css
{
  my $rloc = ($recloc ? $recloc : dirname($this_script));
  $rloc =~ s/\/$//;
  my $ret;
  foreach my $css (@_)
  {
    $ret .= "<link rel='stylesheet' type='text/css' href='$rloc/$css'>\n";
  }
  return $ret;
}

sub pkgsnt # "package sentence"
{
  $_[0] =~ s/'/\\'/g;
  my @x = split(/\s+/, $_[0]);
  return "['".join("','",@x)."']";
}

sub completion_rate
{
    my $src = $_[0];
    if (!-e $src) { return (0,0); }
    open IN, $src or die "$src: $!\n";
    my $line = (<IN>); chomp $line;
    my @s = grep !/^$/, split(/ +/, $line);
    my $total = scalar(@s);
    my $done  = 0;
    for (@s) { $done++ if m/true$/; }
    return ($done,$total);
}

sub read_status_info
{
    my ($S, $src) = @_;
    return unless -e $src;
    open IN, $src or die "$src: $!\n";
    my $line = (<IN>);
    chomp $line;
    my @s = grep !/^$/, split(/ +/, $line);
   foreach my $token (@s)
    {
	my ($k,$v) = split /:/, $token;
	$$S{$k} = $v;
    }
}

sub print_task
{
  my $localcfgfile = dirname("$datadir/$annotator/$text.aln")."/yawat.cfg";
  readConfigFile($localcfgfile) if -e $localcfgfile;

  my ($prevFile,$nextFile);
  for (my $i=0; $i <= $#files; $i++)
  {
    if ($files[$i] eq basename($text))
    {
      $prevFile = $files[$i-1] if $i;
      $nextFile = $files[$i+1] if $i < $#files;
    }
  }
  my (%E,%F,%A,%X1,%X2, %S);
  my $alnfile = "$datadir/$annotator/$text.aln";
  my $roMode = !(-W "$alnfile") || $CFG{"allowEdit"} eq "false";
  &get_bitext(\%E,\%F,"$datadir/$annotator/$text.crp");
  read_alninfo(\%A,$alnfile);
  read_alninfo(\%X1,"$alnfile.1") if -e "$alnfile.1";
  read_alninfo(\%X2,"$alnfile.2") if -e "$alnfile.2";
  read_status_info(\%S,"$datadir/$annotator/$text.done");
  print $q->header({'-charset'      => "$CFG{'encoding'}",
		    '-cache-control'=> 'no-cache',
		    '-pragma'       => 'no-cache'});
  print "<html>\n";
  print "<head>\n";
  print include_css("yawat.css","tagset.css");
  print "<title>Yawat - Yet Another Word Alignment Tool</title>\n";
  print "</head>\n";
  print "<body>\n";
  includeScripts("yawat.js", "yawat-tagset.js", "yawat-ctm.js", "yawat-ctm1.js",
		 "yawat-word.js", "yawat-sentence.js", "yawat-agroup.js",
		 "yawat-matrix.js", "yawat-pane.js", "yawat-application.js",
		 "yawat-button.js");
  print "<script type=\"text/javascript\">\n";
  print "var data = new Array()\n";
  my $target = undef;
  foreach my $k (sort { $a <=> $b } keys(%E))
  {
    if ($S{$k} ne "true" && not defined $target) { $target = $k; }
    if ($X1{$k} || $X2{$k})
    {
      print sprintf("data.push(['%s',%s,%s,%s,'%s','%s','%s']);\n",
		    $k,$S{$k},pkgsnt($E{$k}),pkgsnt($F{$k}),
		    $A{$k},$X1{$k},$X2{$k});
    } 
    else
    {
      print sprintf("data.push(['%s',%s,%s,%s,'%s']);\n",
		    $k,$S{$k},pkgsnt($E{$k}),pkgsnt($F{$k}),$A{$k});
    }
  }
  my $sdir = dirname($text);
  $sdir = "" if $sdir eq "./";
  print "url_index = '",$this_script,($sdir ? "?subdir=$sdir" : ""), "';\n";
  if ($prevFile)
  {
    print "url_prev='$this_script?text=$prevFile';\n";
  }
  if ($nextFile)
  {
    print "url_next='$this_script?text=$nextFile';\n";
  }
  print "diffMode=$diffMode;\n";
  print "keepProtocol=$keepProtocol;\n";
  print "annotatorName=\"$annotator\";\n";

  print "encoding = \"$CFG{'encoding'}\";\n";
  print "bitext = new BiText('$text','$text',data);\n";
  print "document.body.appendChild(bitext.div);\n";
  print "saveDestination='$path/save.cgi';\n";
  print "readOnlyMode=",($roMode ? "true;\n" : "false;\n");
  print "window.location.hash=\"atpane$target\";\n";
  print "</script>\n";

  print "</body>\n</html>\n";
}

sub tasksort
  {
    if ($done{$a} == $done{$b}) { return $a cmp $b; }
    if ($done{$a} == 1)         { return  1; }
    if ($done{$b} == 1)         { return -1; }
    return $done{$b} <=> $done{$a};
  }

sub process_annotator_directory
{
  my $xdir = "$datadir/$annotator";
  $xdir .= "/$subdir" if $subdir;
  opendir(DIR,$xdir);
  my @cands = readdir(DIR);
  foreach my $c (@cands)
  { 
    if (-d "$xdir/$c" && $c ne "backups" and $c !~ /^\./)
    {
      push @sdirs, ($subdir ? "$subdir/$c" : "$c"); 
    }
  }
  
  @files = grep /\.crp$/, @cands;
  for (@files)
  {
    s/\.crp//;
    my ($d,$t) = completion_rate("$xdir/$_.done");
    $done{$_} = $t ? $d/$t : 0;
  }
  @files = sort tasksort @files;
}

sub get_bitext
{
  my ($E,$F,$text) = @_;
  open BITEXT, $text;
  while (my $sid = <BITEXT> and my $e = <BITEXT> and my $f = <BITEXT>)
  {
    chomp $sid;
    # print "$sid\n";
    $$E{$sid} = $e;
    $$F{$sid} = $f;
  }
  close BITEXT;
}

sub read_alninfo
{
  my ($H,$src) = @_;
  open ALN, "$src";
  while (my $a = <ALN>)
  {
    chomp $a;
    my ($sid,$alninfo) = split(/\s+/, $a, 2);
    $$H{$sid} = $alninfo;
  }
  close ALN;
}
