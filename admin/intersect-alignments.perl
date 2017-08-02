#!/usr/bin/perl

# Part of YAWAT -- Yet Another Word Aligment Tool
# (c) 2007-2009 Ulrich Germann; all rights reserved

# This is NOT free software, but permission is granted to use this 
# software free of charge for academic research purposes.

# This is a script to create the intersection of two alignments
# in Yawat alignment format.

# Usage: intersect-alignments.pl [file1] [file2] > [output file]

use strict;

sub intersect1($$)
{
  my @x;
  my @a = sort(split(/,/,$_[0]));
  my @b = sort(split(/,/,$_[1]));
  my %z;
  foreach my $a (@a) 
  {
    $z{$a} = 1;
  }
  foreach my $b (@b) 
  {
    push @x, $b if defined $z{$b};
  }
  return join(",",@x);
}

sub intersect_group($$)
{
  my @a = split(/:/,$_[0]);
  my @b = split(/:/,$_[1]);
  if (length($a[0]) && !length($b[0])) 
  {
    return "";
  }
  if (length($b[0]) && !length($a[0])) 
  {
    return "";
  }
  if (length($a[1]) && !length($b[1])) 
  {
    return "";
  }
  if (length($b[1]) && !length($a[1])) 
  {
    return "";
  }
  my $x = intersect1($a[0],$b[0]);
  my $y = intersect1($a[1],$b[1]);
  if (!length($x) && !length($y)) 
  {
    return "";
  }
  my $label = ($a[2] eq $b[2] ? $a[2] : "unspec");
  return "$x:$y:$label";
}

sub intersect_line($$)
{
  my @x;
  my @a = split(" ",$_[0]);
  my @b = split(" ",$_[1]);
  foreach my $a (@a) 
  {
    foreach my $b (@b) 
    {
      my $x = intersect_group($a,$b);
      push @x,$x if $x;
    }
  }  
  return join(" ",@x);
}


sub readFile($)
{
  open ALN, $_[0];
  my %A;
  while (my $a = <ALN>) 
  {
    chomp $a;
    my ($sid,$alninfo) = split(/\s+/, $a, 2);
    $A{$sid} = $alninfo;
  }
  return %A;
}

my %A = readFile($ARGV[0]);
my %B = readFile($ARGV[1]);

my %I;

while (my ($k,$v) = each %A)
{
  $I{$k} = (defined $B{$k} ? intersect_line($v,$B{$k}) : $v);
}

while (my ($k,$v) = each %B)
{
  $I{$k} = $v unless defined $A{$k};
}

foreach my $k (sort {$a <=> $b } (keys(%I)))
{
  next if $k eq "";
  print "$k $I{$k}\n";
}
