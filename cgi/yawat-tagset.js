// This file is part of the YAWAT package.
// (c) 2007 Ulrich Germann. All rights reserved.
// This is NOT free software, but permission is granted to use this 
// software free of charge for academic research purposes.

var isBilingualLabel = new Object();
var biLabels = new Object(); // tags and descriptions for bilingual groups
var moLabels = new Object(); // tags and descriptions for monolingual groups

biLabels['unspec']      = 'unspecified correspondence';
biLabels['literal']     = 'literal translation';
biLabels['duplicate']   = 'literal translation with duplication';
biLabels['nonliteral']  = 'free translation';
biLabels['coreference'] = 'coreferential expressions';
biLabels['funcEquiv']   = 'functional equivalence';
defaultBiLabel = 'unspec';

moLabels['extra']       = 'untranslated';
moLabels['synsugar']    = 'syntactic sugar';
moLabels['unaligned']   = 'unaligned';
defaultMoLabel = 'unaligned';
