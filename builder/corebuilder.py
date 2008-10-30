# Builds a custom ShiftSpace core file from a config file, handles depedencies

#import json # only available in Python >= 2.6 
import os
import sys
import re
import simplejson as json # need to install simplejson from here http://pypi.python.org/pypi/simplejson/
from SSPackageSorter import SSPackageSorter

# Exceptions ==============================

class SSError(Exception): 
  def __init__(self, builder):
    if builder.sorter != None:
      builder.sorter.emptyDependencyStack()

class NoNameError(SSError): pass
class NoSuchFileError(SSError): pass
class NoSuchPackage(SSError): pass

# Utilities ===============================



# SSCoreBuilder ===========================

class SSCoreBuilder():

  def __init__(self):
    self.buildDefinitions = {}
    self.packages = {}
    self.names = {}
    self.metadata = {}
    self.requiredFiles = []
    self.optionalFile = []

    # regex for checking for a build definition
    # TODO: the following should be allow for Unicode characters
    self.builderPattern = re.compile('\/\/\s*==\s*Builder\s*==[\sA-Za-z0-9@.=/,_]*\/\/\s*==\s*/Builder\s*==', re.MULTILINE)
    self.namePattern = re.compile('@name\s*[A-Za-z0-9_.]*')
    self.requiredPattern = re.compile('@required\s*[A-Za-z0-9_.]*')
    self.optionalPattern = re.compile('@optioned\s*[A-Za-z0-9_.]*')
    self.packagePattern = re.compile('@package\s*[A-Za-z0-9_.]*')
    self.dependenciesPattern = re.compile('@dependencies\s*[A-Za-z0-9_.,\s]*')
    self.sorter = SSPackageSorter(self)


  def parseFile(self, path):
    """
    Parse all of the relevant files.
    """
    self.hasBuildDefinition(path)


  def hasBuildDefinition(self, path):
    """
    Check if a file has a build definition.
    """

    # store a description for this file
    fileName = os.path.basename(path)
    fileHandle = open(path)
    contents = fileHandle.read()
    match = self.builderPattern.search(contents)

    if match:
      # grab the build description
      builderDescription = self.substringForMatch(contents, match)
      # parse the description
      self.buildMetadataForFile(path, builderDescription)
    else:
      #print "No description for %s" % fileName
      pass

    fileHandle.close()


  def buildMetadataForFile(self, path, builderDescription):
    # get the name
    name = self.parseNameDirective(builderDescription)

    # if name, parse the directives
    if name:
      # get the actual file name
      #rname = os.path.basename(path)['name']
      # add it to internal array
      self.metadata[name] = {}
      self.metadata[name]['path'] = path

      # get optional directive
      optional = self.parseOptionalDirective(builderDescription)
      if optional != None:
        self.metadata[name]['optional'] = True

      # get the required directive
      required = self.parseRequiredDirective(builderDescription)
      if required != None:
        self.metadata[name]['required'] = True

      if optional == None and required == None:
        self.metadata[name]['optional'] = True

      # get the dependencies
      dependencies = self.parseDependenciesDirective(builderDescription)
      # set it to an empty array for SSPackageSorter
      if dependencies == None:
        dependencies = []
      
      self.metadata[name]['dependencies'] = dependencies

      # get the package directive
      package = self.parsePackageDirective(builderDescription)

      # check if this package already exists
      if not self.packages.has_key(package) or self.packages[package] == None:
        self.packages[package] = []

      # add the name of the file to the package 
      self.packages[package].append(name)

      if package != None:
        self.metadata[name]['package'] = {'name':package, 'files':self.packages[package]}

    else:
      # raise an error if no file name
      print "No name for %s" % path
      raise NoNameError(self)


  def metadataForFile(self, name):
    """
    Returns the metadata for a particular file.
    """
    metadata = None
    
    try:
      metadata = self.metadata[name]
    except:
      print "metadataForFile error: %s" % name
      raise NoSuchFileError(self)

    return metadata


  def packageForFile(self, name):
    """
    Returns the package that a file belongs to.
    """
    metadata = self.metadataForFile(name)

    if metadata['package'] != None:
      return metadata['package']
    else:
      raise NoSuchPackage(self)


  def dependenciesFor(self, file, excludeNonPackageFiles=True):
    deps = self.dependenciesForFile(file)
    if not excludeNonPackageFiles:
      return deps
    packageFiles = (self.packageForFile(file))['files']
    return [f for f in deps if self.listContains(packageFiles, f)]


  def listContains(self, list, obj):
    try:
      idx = list.index(obj)
      return True
    except:
      return False


  def dependenciesForFile(self, name):
    """
    Returns the dependency list for a particular file.
    """
    deps = []
    if (self.metadataForFile(name)).has_key('dependencies'):
      deps = (self.metadataForFile(name))['dependencies']
    return deps


  def isDirectoryOrJsFile(self, path):
    """
    Returns True or False is a path is a directory or a Javascript file.
    """
    return (os.path.isdir(path) or 
            (os.path.isfile(path) and
             os.path.splitext(path)[1] == '.js'))


  def substringForMatch(self, string, match):
    """
    Utility method takes a regex match result and a string and returns the matching 
    portion.
    """
    if match:
      span = match.span()
      return string[span[0]:span[1]]
    return None

  
  def substringForPattern(self, string, pattern):
    """
    Utility method that tages a compiled regex pattern and returns the first match
    in the string.
    """
    return self.substringForMatch(string, pattern.search(string))


  def parseRequiredDirective(self, builderDescription):
    """
    Parse the required directive in a builder description.
    Returns None or a match.
    """
    return self.requiredPattern.search(builderDescription)


  def parseOptionalDirective(self, builderDescription):
    """
    Parse the optional directive in a builder description.
    Returns None or a match.
    """
    return self.optionalPattern.search(builderDescription)


  def parseNameDirective(self, builderDescription):
    """
    Parse the name directive in a builder description.
    Returns None or a match.
    """
    nameString = self.substringForPattern(builderDescription,
                                          self.namePattern)
    if nameString:
      return nameString[len("@name"):len(nameString)].strip()

    return None


  def parsePackageDirective(self, builderDescription):
    """
    Parses a package directive from a builder description.
    """
    packageString = self.substringForPattern(builderDescription,
                                             self.packagePattern)

    if packageString:
      return packageString[len("@package"):len(packageString)].strip()

    return None

  
  def parseDependenciesDirective(self, builderDescription):
    """
    Parse a dependency description from a builder description.
    """
    depsString = self.substringForPattern(builderDescription, 
                                         self.dependenciesPattern)

    if depsString:
      # get the dependency names and strip each of white space
      dependencies = [name.strip() 
                      for name in depsString[len("@dependencies"):len(depsString)].split(',')]
      return dependencies
    
    return None
    

  def parseDirectory(self, dir):
    """
    Parse a directory for javascript files.
    """
    files = [f for f in os.listdir(dir) 
             if(f != ".svn" and self.isDirectoryOrJsFile(os.path.join(dir, f)))]

    for file in files:
      path = os.path.join(dir, file)
      # check each file for the presence of a build directive
      if os.path.isdir(path):
        self.parseDirectory(path)
      else:
        self.parseFile(path)

  
  def sortPackages(self):
    for packageName, package in self.packages.items():
      self.packages[packageName] = self.sorter.sortPackage(package)


  def writePackagesJSON(self):
    """
    Write a package json description.
    """
    print json.dumps(self.packages, sort_keys=True, indent=4)


  def filesWithDependency(self, name):
    """
    Returns a list of files that have particular dependency
    """
    filesWithDependency = []
    for fileName, metadata in self.metadata.items():
      if self.sorter.isInDependencyTree(fileName, name):
        filesWithDependency.append(fileName)
    return filesWithDependency


  def build(self, path):
    # build all the internal data structures
    self.parseDirectory(path)
    # sort the internal package data structure
    self.sortPackages()


  def buildTarget(self, packageJSON):
    """
    Build a target based on the package description.
    """
    pass


# testing function
b = None
def test():
  global b
  b = SSCoreBuilder()
  b.build("/Users/davidnolen/Sites/shiftspace-0.5/")

#if __name__ == "__main__":
#  print ("corebuilder.py running " + sys.argv[1])
#  builder = SSCoreBuilder()
#  builder.writePackageJSON([])