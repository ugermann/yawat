#!/usr/bin/perl -w
#
# adds a user to the yawat password file (Note: This is not the same
# as the file used for server-side authentication via .htaccess!)
# usage: 
# yawat.add-user.perl <user name> <password> >> /some/path/annotators.passwd
#
# This file is part of YAWAT -- Yet Another Word Aligment Tool
# (c) 2007-2009 Ulrich Germann; all rights reserved
#
# This is NOT free software, but permission is granted to use this 
# software free of charge for academic research purposes.
#


use strict;
print "$ARGV[0] ",crypt($ARGV[1],$ARGV[0]), "\n";
