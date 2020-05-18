# YAWAT (Yet Another Word Alignment Tool) 

YAWAT (Yet Another Word Alignment Tool)is a web application for manual
word alignment of parallel corpora.

(c) 2007-2010 Ulrich Germann; all rights reserved.

This software is under the [GNU Affero General Public License v3.0](LICENSE)

# INSTALLATION

1. You need two directories: One .cgi-enabled directory under your web
   server's document root, and a directory for your data.
   (e.g., http://my_server.my_university.edu/cgi-bin/yawat (cgi)
   and    /projects/word-alignment/yawat.data for the data).

2. Put all files in the ./cgi directory (i.e. *.js *.cgi *.css yawat.cfg) 
   into the .cgi-enabled directory under your web-server's root. 

3. Use the script ./admin/yawat.add-user.perl to add user passwords to
   the password file. The password file should have a separate login
   for each annotator. I keep this file in the Yawat data directory,
   but the location does not really matter as long as permissions are
   set so that the web server can find and read the file, and the
   password file is specified in yawat.cfg.

   yawat.add-user.perl takes two command line arguments: user name and
   password. 

   % ./admin/yawat.add-user.perl \<user name> \<password> >> \<password file>

   The password file currently contains a demo account with login
   'demo' and password 'demo'.

4. In the data directory, create a subdirectory for each annotator so that
   the directory name and the annotator's login are identical. Set the
   permissions so that the web server can read, write, and create files
   in these directories (unless it's a read-only account).

5. Edit yawat.cfg to reflect the correct path to the data directory,
   speficy whether alignments can be edited or not, alignment logs are
   to be kept, and which file cgi error messages should go into. Make
   sure that the error log file is writable for the user under whose
   identity the web server is running. 

6. Prepare the annotation corpus. For each parallel file, there will
   be two files in each annotator's data directory (cf. the files in
   the directory sample-data):

   1. A .crp file with three lines per sentence pair:
      ```
      <sentence id>
      <sentence in language 1>
      <sentence in language 2>
      ```
      
   2. A .aln file with alignment data. For each sentence pair, there
      is one line consisting of the sentence id followed by entries defining 
      groups of aligned words:
      <words in sentence A>:<words in sentence B>:<label> 
 
      E.g.:

      ```
      7 0,1,2:3:unspec 3:1:unspec :2:omitted
      ```

      This means that the first three words in language 1 (L1) in
      sentence 7 are aligned with the forth word (index position 3) in
      language 2, and the alignment relation is labeled
      "unspec(ified)". The fourth word in L1 is aligned with the
      second inL2, and the third word in L2 is ommitted in the translation.

   The .crp file is essential, the .aln file will be created once the first
   alignment is saved but can also be seeded with an exisiting alignment 
   (e.g. if Yawat is used to post-edit automatic word alignment).

8. On a marginal note: If the .aln file has its permissions set to
   read-only, alignment editing functionality in Yawat will be disabled, so 
   that Yawat can also be used as a pure visualization tool.

9. Make sure that you allow javascript scripts to run and to disable
   context menus in Firefox.  
   (Edit - Preferences - ("Content" tab) - "Advanced" next to Javascript) 


# CUSTOMIZATION

The tag set for labeling alignment relations is customizable. For
customization, you need to edit the two files yawat-tagset.js and
tagset.css. The format of yawat-tagset.js should be self-explanatory
to any reasonably experienced JavaScript programmer. For each category
(tag), the file tagset.css should specify five styles 

.tag1:          'normal' view (no editing, no highlight)
.tag2:          highlighting in 'view' mode
.tag3:          highlighting in 'edit' mode
div.tagM:       representation in the context menu for labeling
div.tagM:hover: highlighted representation in the context menu  
                (i.e., when the mouse is hovering over it)

Spend some time, thought and experimentation to come up with a good,
subtle coloring scheme. Contrasts that are too strong are distracting.

# NEW FEATURES (2008)

- Alignment diffing: you can specify up to three different alignments
  for comparison. At most one is editable; the other ones are for
  comparison. Put the reference alignments in files named *.aln.1 and
  *.aln.2, respectively.

- Alignment protocols. Yawat can keep a protocol of the alignment
  process (this is of interest primarily for research into human
  aspects of the alignment task). Alignment protocols are stored along
  the *.aln files in corresponding files name *.log. Whether or not
  protocols are kept is specified in yawat.cfg with the parameter
  keepProtocol.

- You can override settings specified in the general yawat.cfg with
  annotator-specific settings in their data directories. For example,
  you can decied to keep protocols only for specific annotators, or
  disallow editing for a 'view-only' user.

- The tool now properly handles subdirectories in annotator directories.

# Acknowledging Yawat

Please cite the following paper
```
@InProceedings{germann:2008:ACLDemos,
  author    = {Germann, Ulrich},
  title     = {{Yawat:} {Yet} {Another} {Word} {Alignment} {Tool}},
  booktitle = {Proceedings of the ACL-08: HLT Demo Session},
  month     = {June},
  year      = {2008},
  address   = {Columbus, Ohio},
  publisher = {Association for Computational Linguistics},
  pages     = {20--23},
  url       = {http://www.aclweb.org/anthology/P/P08/P08-4006}
}
```
