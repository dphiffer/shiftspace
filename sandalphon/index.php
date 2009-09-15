<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
  "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">

  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <script src="../externals/mootools-1.2.3-core.js" type="text/javascript" charset="utf-8"></script>
    <script src="../externals/mootools-1.2.3.1-more.js" type="text/javascript" charset="utf-8"></script>
    <script src="../builds/shiftspace.sandalphon.js" charset="utf-8"></script>
    <script type="text/javascript" charset="utf-8">
      window.addEvent('domready', function() {
        waitForConsole();
      });

      function waitForConsole()
      {
        if(!window.console || !window.console.log)
        {
          setTimeout(waitForConsole, 1000);
        }
        else
        {
          // load the local store
          SandalphonTool = new SandalphonToolClass(new Persist.Store('Sandalphon'));
        }
      }
    </script>
    <script src="persist.js" type="text/javascript" charset="utf-8"></script>
    <title>Sandalphon Interface Tool</title>
    <link rel="stylesheet" href="../styles/ShiftSpace.css" type="text/css" media="screen" title="no title" charset="utf-8" />
    <link rel="stylesheet" href="styles.css" type="text/css" media="screen" title="no title" charset="utf-8" />
  </head>
  
  <body class="InSandalphon">
    
    <div id="SSSandalphonControls">
      <div style="float: left;">
        <form action="">
          <table>
            <tr>
              <th>Load Interface File:</th>
              <td>
                <input id="loadFileInput" type="text" value="/client/views/SSConsole/SSConsole"></input>
                <input id="compileFile" type="button" name="Compile" value="Compile"></input>
                <select id="localizedStrings">
                  <option value="en">English</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="sv">Swedish</option>
                  <option value="ko">Korean</option>
                </select>
                <label for="env">Environment:</label>
                <select id="env">
                  <?php
                  $envs = scandir('../config/env');

                  foreach ($envs as $envfile) {
                    if (substr($envfile, -5) == '.json') {
                      $env = substr($envfile, 0, strlen($envfile) - 5);
                      echo "<option value=$env>$env</option>\n";
                    }
                  }
                  ?>
                </select>
              </td>
            </tr>
          </table>
        </form>
      </div>
      <span id='title'>Sandalphon v0.1</span>
    </div>
    
    <div id="SSSandalphonDisplay">
      <div id="SSSandalphonContainer">
      </div>
    </div>
    
  </body>  
  
</html>