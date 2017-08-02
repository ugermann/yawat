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
  open ERRORS, ">>report.errors.log" 
    or open ERRORS, ">>../../logs/report.errors.log" 
      or die "$!\n";
  carpout(ERRORS); # put error messages in "errors.log"
  use CGI qw(:standard);
}

use strict;
use Fcntl;
use File::Basename;

sub max { return $_[0] > $_[1] ? $_[0] : $_[1]; }
sub min { return $_[0] > $_[1] ? $_[1] : $_[0]; }

my $q = new CGI;
my %fullpath;
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

my @crp = `find $datadir -name '*.crp'`;
my @aln = `find $datadir -maxdepth 2 -name '*.aln'`;
for (@crp) 
{ 
    (my $key = $_) =~ s/.*?\/([^\/]+)\.crp\s*$/$1/; 
    $fullpath{$key} = $_;
}

print $q->header({-expires=>'-1d',charset=>'utf8',-'cache-control'=>'no-cache'});
print "<html>\n";
print "<body>\n";
print "<h1>Project Status Report</h1>\n";
print "<p>Numbers in parentheses are word alignment rates (aligned words / total number of words in the text pair) first, then (if present) the ratio of sentences marked as done by the annotator.</p>";
print "<table padding=5 border=1>\n";
print "<tr><th>File</th><th>Primary annotations</th><th width=40%>Consensus annotations</th><th>Sparse alignment</th></tr>\n";
my $missing = 0;
foreach my $t (sort keys %fullpath)
{
    my ($L1,$L2) = read_crp($fullpath{$t});
    my @a = grep /$t\.aln\s*$/, @aln;
    for (@a) { $_ = basename(dirname($_)); }
    @a = grep !/^(test|uli)$/, @a;
    print "<tr><td>$t:</td>\n";
    my (@primary,@consensus,@unclear,@sparse);
    foreach my $anno (@a)
    {
	next unless -e "$datadir/$anno/$t.log";
	if ($anno eq "petra2")
	{
	    push @sparse, $anno;
	}
	elsif (-e "$datadir/$anno/$t.aln.1" && -e "$datadir/$anno/$t.aln.2")
	{ 
	    push @consensus, $anno; 
	}
	else 
	{ 
	    push @primary, $anno; 
	}
    }
    print "<td>"; print_stats($t, $L1, $L2, @primary); print "</td>\n";
    print "<td>"; print_stats($t, $L1, $L2, @consensus); print "</td>\n";
    print "<td>"; print_stats($t, $L1, $L2, @sparse); print "</td></tr>\n";
    $missing += 4 - min(2,scalar(@primary)) - min(1,scalar(@consensus)) - min(1,scalar(@sparse));
}
print "</table>\n";
print "<p>There are $missing unfinished work units</p></body>\n</html>\n";

sub aln_stats
{
    my ($alnfile, $L1,$L2) = @_;
    open ALN, $alnfile or die "Could not open $alnfile!\n";
    my ($total,$aligned) = (0,0);
    while (my $a = <ALN>)
    {
	my ($sid,@c) = split /\s+/, $a;
	#print $sid, $$L1{$sid}, "\n";

	next unless defined $sid;
	my (%A,%B);
	foreach my $c (@c)
	{
	    my ($a,$b) = split /:/, $c;
	    next if $b eq "" or $b eq "";
	    $A{$_} = 1 for split /,/, $a;
	    $B{$_} = 1 for split /,/, $b;
	}
	$total   += scalar(split /\s+/, $$L1{$sid}) + scalar(split /\s+/, $$L2{$sid});
	$aligned += scalar(keys %A) + scalar(keys %B);
    }
    $total = 1 unless $total;
    return $aligned/$total;
}

sub read_crp($)
{
    my ($crp) = @_;
    open CRP, "$crp";
    my (%L1,%L2);
    while (my $sid = <CRP>)
    {
	$sid =~ s/\s//g;
	last unless my $s1 = <CRP>;
	last unless my $s2 = <CRP>;
	s/^\s+|\s+$//g for ($s1,$s2); 
	$L1{$sid} = $s1;
	$L2{$sid} = $s2;
    }
    return \%L1, \%L2;
}

sub completion
{
    my $file = shift @_;
    return (0,0) unless -e $file;
    open IN, $file;
    my @data = grep !/^$/, split /\s+/, <IN>;
    my $d = 0;
    my $t = scalar(@data);
    for (@data) { $d++ if /:true$/; }
    return ($d,$t);
}

sub print_stats
{
    my $t  = shift @_;
    my $L1 = shift @_;
    my $L2 = shift @_;
    foreach my $anno (@_)
    {
	my $rate = aln_stats("$datadir/$anno/$t.aln",$L1,$L2);
	print " ";
	next if $rate == 0;
	my ($d,$t) = completion("$datadir/$anno/$t.done");
	if ($t)
	{
	    printf(" $anno (%.0f%%; %d/%d)", 100*$rate, $d, $t);
	}
	else
	{
	    printf(" $anno (%.0f%%)", 100*$rate);
	}
    }
}
