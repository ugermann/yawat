#!/usr/bin/perl -w
# -*- mode: cperl; tab-width: 2; cperl-indent-level: 2 -*-

our %CFG;

BEGIN
{
  
  sub readConfigFile
  {
    open CFGFILE, "$_[0]" or die "$_[0]: $!\n";
    while (my $line = <CFGFILE>) {
      next if $line =~ m/^\s*#/;
      chomp $line;
      my ($key,$value) = split(/\s*=\s*/, $line);
      $CFG{$key} = $value;
    }
    close CFGFILE;
  }

  readConfigFile("yawat.cfg");
  my $errorlog = ($CFG{"errorLog"} or "yawat.errors.log");
  
  use File::Basename;
  no strict "subs";
  use CGI::Carp qw(fatalsToBrowser carpout);
  open ERRORS, ">>$errorlog" 
    or open ERRORS, ">>yawat.errors.log" 
    or open ERRORS, ">>../../logs/yawat-stats.errors.log" 
    or die "$!\n";
  carpout(ERRORS); # put error messages in "errors.log"
  use CGI qw(:standard);
}

use strict;

my $q = new CGI;
my $datadir = $CFG{"datadir"};

my (@ANNOTATOR, %EMAIL);
open(ANNOTATORS,"$datadir/yawat.annotators");
head("debug");
while (<ANNOTATORS>)
{
  chomp;
  my ($annotator, $email) = split;
  push @ANNOTATOR,$annotator;
  $EMAIL{$annotator} = $email;
}
close(ANNOTATORS);


my (%DONE,%TIME,%COMPLETE,%FILE_STATS,%ASSIGNED,
    $ALL_DONE, $ALL_TODO, $ALL_TIME, %TODO);

# get statistics from logs
foreach my $annotator (@ANNOTATOR)
{
  foreach my $file (`ls $datadir/$annotator`)
  {
    next unless $file =~ /log$/;
    chomp($file);
    $file =~ s/\.log//;
    &process_segment($file,$annotator);
  }
}

my %AGREEMENT_TIME;
foreach my $annotator_pair (`ls $datadir| grep '+'`)
{
  chop($annotator_pair);
  foreach my $file (`ls $datadir/$annotator_pair`)
  {
    next unless $file =~ /log$/;
    chomp($file);
    $file =~ s/\.log//;
    &process_agreement($file,$annotator_pair);
  }
}

print $q->header({-expires=>'-1d',charset=>'utf8',-'cache-control'=>'no-cache'});
print "<html><title>Statistics</title>
<style type=\"text/css\">
<!--
td,dt,dd,h1 { font-family: georgia; }
td { text-align: center }
dt { font-weight:bold; font-size:110%; margin-top:.8em; }
.email { font-weight:normal; }
-->
</style>
<body><h1>Statistics</h1>\n";

&output_page();

print "</body></html>\n";

sub hmmss
{
  return sprintf("%d:%02d:%02d",$_[0] / 3600, ($_[0]/60) % 60, $_[0] / 60);
}

sub mss
{
  return sprintf("%d:%02d", $_[0] / 60, $_[0] % 60)
}

sub output_page
{
  print "<TABLE CELLPADDING=1 CELLSPACING=2 WIDTH=600>\n";
  print "<TR BGCOLOR=#aaaaff>\n";
  print "  <TD><B>Annotator</B></TD>\n";
  print "  <TD><B>Lines done</B></TD>\n";
  print "  <TD><B>Time</B></TD>\n";
  print "  <TD><B>Time/Sent.</B></TD></TR>\n";
  foreach my $who (sort @ANNOTATOR)
  {
    my $done = $DONE{$who};
    my $todo = $TODO{$who};
    my $time = $TIME{$who};
    printf "<TR BGCOLOR=#ffddbb>\n";
    printf "  <TD><A HREF=#$who>%s</A></TD>\n", ucfirst($who);
    printf "  <TD>%d/%d</TD>\n", $done, $todo;
    printf "  <TD>%s h</TD>\n",hmmss($time);
    printf "  <TD>%s min</TD>\n", mss($done ? $time/$done : 0);
    printf "</TR>\n",
  }
  printf "<TR  BGCOLOR=#aaaaff>\n";
  printf "  <TD>All</TD><TD>%d/%d</TD>\n", $ALL_DONE, $ALL_TODO;
  printf "  <TD>%s h</TD>\n", hmmss($ALL_TIME);
  # $ALL_DONE = 1 unless $ALL_DONE;
  
  printf "  <TD>%s min</TD>\n", mss($ALL_TIME/($ALL_DONE ? $ALL_DONE : 1));
  printf "</TR>\n</TABLE>\n\n";
  print "<DL>";
  foreach my $annotator (sort @ANNOTATOR)
  {
    print "<DT><A NAME=\"$annotator\">".ucfirst($annotator);
    print " <span class=email>($EMAIL{$annotator})</span></A></DT>\n<DD>";

    if (! defined($DONE{$annotator}))
    { print "nothing anotated yet."; }
    else
    {
      print "<TABLE CELLPADDING=1 CELLSPACING=2 width=500>\n";
      print "<TR BGCOLOR=#aaaaff>\n";
      print "<TD><B>File</B></TD>\n";
      print "<TD><B>Lines done</B></TD>\n";
      print "<TD><B>Time</B></TD><TD><B>Time/Sent.</B></TD>";
      print "<TD><B>Agreement</B></TD></TR>\n";
      foreach (@{$FILE_STATS{$annotator}})
      {
        my ($file,$lines_done,$lines_total,$time_spent) = split;
        my $agreement_time = 0;
        $agreement_time = $AGREEMENT_TIME{$file}{$annotator}
          if (defined($AGREEMENT_TIME{$file}) &&
              defined($AGREEMENT_TIME{$file}{$annotator}));
        printf("<TR BGCOLOR=#%s>", ($lines_done == $lines_total)
               ? ($agreement_time>0 ? "ccccff" : "ccffcc") : "ffffcc");
        print "<TD>$file</TD><TD>$lines_done/$lines_total</TD>";
        printf("<TD>%s h</TD><TD>%s</TD>",hmmss($time_spent),
               mss($time_spent/$lines_done));
        printf("<TD>%s h</TD></TR>\n",hmmss($agreement_time));
      }
      print "</TABLE>\n";
      printf "Total done: %d lines in %s hours.",hmmss($DONE{$annotator});
    }

    my %WITH;
    foreach my $file (keys %ASSIGNED)
    {
      next unless defined($ASSIGNED{$file}{$annotator});
      foreach my $a (keys %{$ASSIGNED{$file}})
      { $WITH{$a}{$file}++; }
    }
    print "<BR>";
    foreach my $a (sort keys %WITH)
    {
      next unless $a ne $annotator;
      my $message;
      print "<FONT SIZE=-1 COLOR=#404040>with ".ucfirst($a).": ";
      foreach my $file (sort keys %{$WITH{$a}}) {
        if (defined($AGREEMENT_TIME{$file})) {
          if ($AGREEMENT_TIME{$file}{$a} > 0) {
            # agreed or stared agreement
            print "<FONT COLOR=#4040c0><B>$file</B></FONT> ";
          } else {
            # agreement set up
            print "<FONT COLOR=#000080><B>$file</B></FONT> ";
            $message .= "; start agreement on $file";
          }
        } elsif ( defined($COMPLETE{$file}{$annotator}) &&
                  defined($COMPLETE{$file}{$a}) ) {
          # both finished, but no agreement
          print "<FONT COLOR=#008000><B>$file</B></FONT> ";
          $message .= "; set up agreement on $file";
        } elsif ( defined($COMPLETE{$file}{$annotator}) &&
                  !defined($COMPLETE{$file}{$a}) ) {
          print "<FONT COLOR=#004000><B>$file</B></FONT> ";
          # to be finished by partner
        } elsif ( !defined($COMPLETE{$file}{$annotator}) &&
                  defined($COMPLETE{$file}{$a}) ) {
          print "<FONT COLOR=#808000><B>$file</B></FONT> ";
          # to be finished by self
          $message .= "; partner alredy finished $file";
        } else {
          # to be finished by both
          print "$file ";
        }
      }
      print "$message</FONT><BR>\n";
    }
    print "</DD>\n\n";
  }
  print "</DL>";
}

sub process_segment
{
  my ($file,$annotator,$annotator_pair) = @_;
  my $filestem = "$datadir/$annotator/$file";
  
  my ($lines_done,$lines_total) = &find_complete_lines($filestem.".aln");
  $ASSIGNED{$file}{$annotator}++;
                      $ALL_TODO += $lines_total;
  $TODO{$annotator} += $lines_total;
  return unless $lines_done;
  my $time_spent = &scan_time($filestem.".log");
  
  #print "processing $filestem / $annotator: $lines_done/$lines_total ";
  #printf "%d:%02d:%02d\n",$time_spent/3600,($time_spent/60)%60,$time_spent%60;
  push @{$FILE_STATS{$annotator}}, "$file $lines_done $lines_total $time_spent";
  $DONE{$annotator} += $lines_done;
  $TIME{$annotator} += $time_spent;
  $ALL_DONE += $lines_done;
  $ALL_TIME += $time_spent;
  $COMPLETE{$file}{$annotator}++ if $lines_done == $lines_total;
}

sub process_agreement
{
  my ($file,$annotator_pair) = @_;
  my $filestem = "$datadir/$annotator_pair/$file";
  return unless -e $filestem.".aln";

  my $time_spent = &scan_time($filestem.".log");

  my ($a1,$a2) = split(/\+/,$annotator_pair);
  foreach my $annotator (($a1,$a2)) {
    $AGREEMENT_TIME{$file}{$annotator} = $time_spent;
    $TIME{$annotator} += $time_spent;
  }
}

sub scan_time
{
  my ($file) = @_;
  open(LOG,$file);
  my $last_time = 0;
  my $total_time = 0;
  while (<LOG>) {
    next unless /^\[(\d+)\]/;
    if (($1 > $last_time) && ($1 - $last_time < 5 * 60 * 1000)) { # ignore negative; don't count breaks > 5min
      $total_time += ($1 - $last_time) / 1000;
    }
    $last_time = $1;
  }
  close(LOG);
  return $total_time;
}

sub find_complete_lines
{
  my ($file) = @_;
  my ($complete,$total) = (0,0);
  foreach (`cat $file`) {
    next unless /^\d/;
    $complete++ if /([\d,]+:[\d,]+:)/;
    $total++;
  }
  if ($total == 0) {
    $file =~ s/aln$/crp/;
    $total = `cat $file | wc -l`/3;
  }
  return ($complete,$total);
}

