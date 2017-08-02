#!/usr/bin/perl

# Part of YAWAT -- Yet Another Word Aligment Tool
# (c) 2007 Ulrich Germann; all rights reserved
#!/usr/bin/perl

# This is NOT free software, but permission is granted to use this 
# software free of charge for academic research purposes.

# This script saves the alignment info submitted by the
# Yawat application running in the annotator's web browser

BEGIN
{
  our %CFG;
  
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
  my $errorlog = ($CFG{"errorLog"} or "yawat.errors.log");
  
  use File::Basename;
  no strict "subs";
  use CGI::Carp qw(fatalsToBrowser carpout);
  open ERRORS, ">>$errorlog"
    or open ERRORS, ">>yawat.errors.log"
    or open ERRORS, ">>../../logs/yawat.errors.log"
    or die "$!\n";
  carpout(ERRORS); # put error messages in "errors.log"
  use CGI qw(:standard);
}

use strict;
use Fcntl;
use File::Copy;

my $q         = new CGI;
my $annotator = $q->cookie('yawat-login');
my $corpus    = $q->param('corpus');
my $text      = $q->param('text');
my $sid       = $q->param('sid');
my $alignment = $q->param('alignment');

my %CFG;
open CFGFILE, "yawat.cfg" or die "yawat.cfg: $!\n";
while (my $line = <CFGFILE>)
{
  next if $line =~ /^\s*#/;
  chomp $line;
  my ($key,$value) = split(/\s*=\s*/, $line);
  $CFG{$key} = $value;
}
close CFGFILE;
my $datadir   = $CFG{"datadir"};

# make a backup copy if possible
if (-e "$datadir/$annotator/$text.aln")
  {
    my $timestamp = localtime();
    $timestamp =~ s/ /-/g;
    my $from = "$datadir/$annotator/$text.aln";
    my $to   = "$datadir/$annotator/backups/$text.aln.$timestamp";
    copy($from,$to); # do nothing if this fails
  }
my $ofile = "$datadir/$annotator/$text.aln";
open DATA, ">$ofile" or die "$ofile: $!";
print DATA $q->param('data');
close DATA;

if ($q->param('protocol'))
  {
    open  PROTOCOL, ">>$datadir/$annotator/$text.log" or die "$!";
    print PROTOCOL $q->param('protocol');
    close PROTOCOL;
    # utime(undef, undef, "$datadir/$annotator/$text.log");
  }

if ($q->param('done'))
  {
    open STATUS, ">$datadir/$annotator/$text.done";
    print STATUS $q->param('done'), "\n";
  }

print $q->header;
print "OK"
