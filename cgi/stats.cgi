#!/usr/bin/perl -w

BEGIN
{
  use File::Basename;
  no strict "subs";
  use CGI::Carp qw(fatalsToBrowser carpout);
  open ERRORS, ">>yawat.errors.log" 
    or open ERRORS, ">>../../logs/yawat-stats.errors.log" 
      or die "$!\n";
  carpout(ERRORS); # put error messages in "errors.log"
  use CGI qw(:standard);
}


use strict;

my $q = new CGI;

my %CFG;
my $cfgfile = "yawat.cfg";
open CFGFILE, "$cfgfile" or die "$cfgfile: $!\n";
while (my $line = <CFGFILE>)
{
    chomp $line;
    my ($key,$value) = split(/\s*=\s*/, $line);
    $CFG{$key} = $value;
}
close CFGFILE;
my $datadir   = $CFG{"datadir"};

my (@ANNOTATOR,%EMAIL);
open(ANNOTATORS,"$datadir/yawat.annotators");
head("debug");
while(<ANNOTATORS>) {
    chomp;
    my ($annotator,$email) = split;
    push @ANNOTATOR,$annotator;
    $EMAIL{$annotator} = $email;
}
close(ANNOTATORS);

my (%TOTAL_LINES,%TOTAL_TIME,%COMPLETE,%FILE_STATS,%ASSIGNED,$ALL_TOTAL_LINES,$ALL_TODO_LINES,$ALL_TOTAL_TIME,%TODO_LINES);
foreach my $annotator (@ANNOTATOR) {
    foreach my $file (`ls $datadir/$annotator`) {
	next unless $file =~ /log$/;
	chomp($file);
	$file =~ s/\.log//;
	&process_segment($file,$annotator);
    }	
}

my %AGREEMENT_TIME;
foreach my $annotator_pair (`ls $datadir| grep '+'`) {
    chop($annotator_pair);
    foreach my $file (`ls $datadir/$annotator_pair`) {
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
<body><h1>Statistics</h1>";

&output_page();

print "</body></html>\n";

sub output_page {
    
    print "<TABLE CELLPADDING=1 CELLSPACING=2 WIDTH=600><TR BGCOLOR=#aaaaff><TD><B>Annotator</B></TD><TD><B>Lines done</B></TD><TD><B>Time</B></TD><TD><B>Time/Sent.</B></TD></TR>\n";
    foreach my $annotator (sort @ANNOTATOR) {
	my $total_lines = $TOTAL_LINES{$annotator};
	$total_lines = 1e10 unless $total_lines;
	printf "<TR BGCOLOR=#ffddbb><TD><A HREF=#%s>%s</A></TD><TD>%d/%d</TD><TD>%d:%02d:%02d h</TD><TD>%d:%02d min</TD></TR>\n", 
	$annotator,ucfirst($annotator),$TOTAL_LINES{$annotator},$TODO_LINES{$annotator}, 
	$TOTAL_TIME{$annotator}/3600,($TOTAL_TIME{$annotator}/60)%60,$TOTAL_TIME{$annotator}%60,
	$TOTAL_TIME{$annotator}/$total_lines/60,($TOTAL_TIME{$annotator}/$total_lines)%60;
	
    }
    printf "<TR  BGCOLOR=#aaaaff><TD>All</TD><TD>%d/%d</TD><TD>%d:%02d:%02d h</TD><TD>%d:%02d min</TD></TR>\n", 
      $ALL_TOTAL_LINES, $ALL_TODO_LINES, 
      $ALL_TOTAL_TIME/3600, ($ALL_TOTAL_TIME/60)%60, $ALL_TOTAL_TIME%60,
      $ALL_TOTAL_TIME/$ALL_TOTAL_LINES/60,($ALL_TOTAL_TIME/$ALL_TOTAL_LINES)%60;
    print "</TABLE>\n\n";

    print "<DL>";
    foreach my $annotator (sort @ANNOTATOR) {
	print "<DT><A NAME=\"$annotator\">".ucfirst($annotator)." <span class=email>($EMAIL{$annotator})</span></A></DT>\n<DD>";

	if (! defined($TOTAL_LINES{$annotator})) {
	    print "nothing anotated yet.";
	}
	else {
	    print "<TABLE CELLPADDING=1 CELLSPACING=2 width=500><TR BGCOLOR=#aaaaff><TD><B>File</B></TD><TD><B>Lines done</B></TD><TD><B>Time</B></TD><TD><B>Time/Sent.</B></TD><TD><B>Agreement</B></TD></TR>\n";
	    foreach (@{$FILE_STATS{$annotator}}) {
		my ($file,$lines_done,$lines_total,$time_spent) = split;
		my $agreement_time = 0;
		$agreement_time = $AGREEMENT_TIME{$file}{$annotator}
		    if (defined($AGREEMENT_TIME{$file}) &&
			defined($AGREEMENT_TIME{$file}{$annotator}));
		printf("<TR BGCOLOR=#%s><TD>%s</TD><TD>%d/%d</TD><TD>%d:%02d:%02d h</TD><TD>%d:%02d min</TD><TD>%d:%02d:%02d h</TD></TR>\n",
		       ($lines_done == $lines_total) ? ($agreement_time>0 ? "ccccff" : "ccffcc") : "ffffcc",
		       $file,$lines_done,$lines_total,
		       $time_spent/3600,($time_spent/60)%60,$time_spent%60,
		       ($time_spent/$lines_done/60)%60,($time_spent/$lines_done)%60,
		       $agreement_time/3600,($agreement_time/60)%60,$agreement_time%60);
	    }
	    print "</TABLE>\n";
	    printf "Total done: %d lines in %d:%02d:%02d hours.", $TOTAL_LINES{$annotator}, $TOTAL_TIME{$annotator}/3600,($TOTAL_TIME{$annotator}/60)%60,$TOTAL_TIME{$annotator}%60;
	}
	my %WITH;
	foreach my $file (keys %ASSIGNED) {
	    next unless defined($ASSIGNED{$file}{$annotator});
	    foreach my $a (keys %{$ASSIGNED{$file}}) {
		$WITH{$a}{$file}++;
	    }
	}
	print "<BR>";
	foreach my $a (sort keys %WITH) {
	    next unless $a ne $annotator;
	    my $message;
	    print "<FONT SIZE=-1 COLOR=#404040>with ".ucfirst($a).": ";
	    foreach my $file (sort keys %{$WITH{$a}}) {
		if (defined($AGREEMENT_TIME{$file})) {
		    if ($AGREEMENT_TIME{$file}{$a} > 0) {
			# agreed or stared agreement
			print "<FONT COLOR=#4040c0><B>$file</B></FONT> ";
		    }
		    else {
			# agreement set up
			print "<FONT COLOR=#000080><B>$file</B></FONT> ";
			$message .= "; start agreement on $file";
		    }
		}
		elsif ( defined($COMPLETE{$file}{$annotator}) &&
			defined($COMPLETE{$file}{$a}) ) {
		    # both finished, but no agreement
		    print "<FONT COLOR=#008000><B>$file</B></FONT> ";
		    $message .= "; set up agreement on $file";
		}
		elsif ( defined($COMPLETE{$file}{$annotator}) &&
			!defined($COMPLETE{$file}{$a}) ) {
		    print "<FONT COLOR=#004000><B>$file</B></FONT> ";
		    # to be finished by partner
		}
		elsif ( !defined($COMPLETE{$file}{$annotator}) &&
			defined($COMPLETE{$file}{$a}) ) {
		    print "<FONT COLOR=#808000><B>$file</B></FONT> ";
		    # to be finished by self
		    $message .= "; partner alredy finished $file";
		}
		else {
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

sub process_segment {
    my ($file,$annotator,$annotator_pair) = @_;
    my $filestem = "$datadir/$annotator/$file";

    my ($lines_done,$lines_total) = &find_complete_lines($filestem.".aln");
    $ASSIGNED{$file}{$annotator}++;
    $ALL_TODO_LINES += $lines_total;
    $TODO_LINES{$annotator} += $lines_total;
    return unless $lines_done;
    my $time_spent = &scan_time($filestem.".log");

    #print "processing $filestem / $annotator: $lines_done/$lines_total ";
    #printf "%d:%02d:%02d\n",$time_spent/3600,($time_spent/60)%60,$time_spent%60;
    push @{$FILE_STATS{$annotator}},"$file $lines_done $lines_total $time_spent";
    $TOTAL_LINES{$annotator} += $lines_done;
    $TOTAL_TIME{$annotator} += $time_spent;
    $ALL_TOTAL_LINES += $lines_done;
    $ALL_TOTAL_TIME += $time_spent;
    $COMPLETE{$file}{$annotator}++ if $lines_done == $lines_total;
}

sub process_agreement {
    my ($file,$annotator_pair) = @_;
    my $filestem = "$datadir/$annotator_pair/$file";
    return unless -e $filestem.".aln";

    my $time_spent = &scan_time($filestem.".log");

    my ($a1,$a2) = split(/\+/,$annotator_pair);
    foreach my $annotator (($a1,$a2)) {
	$AGREEMENT_TIME{$file}{$annotator} = $time_spent;
	$TOTAL_TIME{$annotator} += $time_spent;
    }
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

sub find_complete_lines {
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
