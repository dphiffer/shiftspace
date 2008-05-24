<?php
/*

"If all of this works it will be like del.icio.us on crack!"
-- David

*/

$dir = dirname(__FILE__) . '/..';
require_once '../server/database/database.php';
require_once '../server/config.php';
$db = new Database($db_path);
$id = $db->escape($_GET['id']);

// If more than one id was passed, parse them out
$shift_ids = array ();
if(preg_match("/,/",$id)){
  $shift_ids = split(',', $id);
  $id = $shift_ids[0];
}

$shift = $db->row("
  SELECT *
  FROM shift
  WHERE url_slug = '$id'
");

$myurl = $shift->href;

$curl = curl_init();
curl_setopt($curl,CURLOPT_URL,$myurl);
curl_setopt($curl, CURLOPT_FOLLOWLOCATION, 1);
curl_setopt($curl,CURLOPT_RETURNTRANSFER, 1);
curl_setopt($curl,CURLOPT_COOKIE, 1);
$result = curl_exec($curl);
curl_close($curl);
if(!$result){
  $result = "Page not found.";
  echo "<p style=\"color:#DD6666;font-size:1em;font-family:Verdana,Helvetica,sans-serif;\">" .
    $result . "</p>";
  exit;
}
//test if url begins with http:// if not add it
if(!preg_match("/^http:\/\//",$myurl)){
  $myurl = "http://" . $myurl;
}
//test wether url ends with a / if not add one
if(!preg_match("/[a-zA-Z]+\/$/",$myurl)){
  $myurl = $myurl . "/";
}
//get the base url
preg_match("/^(http:\/\/)?([^\/]+)/i",$myurl, $matches);
$baseurl = $matches[2];
//replace relative links with absolute links
//if beings with src="/
$result = preg_replace("/src=\"\//i","src=\"$myurl" ,$result);
//if begins with src="../
$result = preg_replace("/src=\"\.\./i","src=\"$myurl.." ,$result);
//if begins with src="word/ && word != http or www
$result = preg_replace("/src=\"(?!http|www)/","src=\"$myurl",$result);
//for href
$result = preg_replace("/href=\"\//i","href=\"$myurl" ,$result);
$result = preg_replace("/href=\"\.\./i","href=\"$myurl.." ,$result);
//proxy links
$result = preg_replace("/a href=\"/i","a href=\"simple_proxy.php?url=", $result);
//fix css imports
$result = preg_replace("/@import\s+\"\//","@import \"http://$baseurl/", $result);
//fix css for for href=\"/css/essay.css
$result = preg_replace("/href=\\\"\//","href=\\\"$myurl", $result);
//remove 'most' javascript
$result = preg_replace("/\<script.+\<\/script>/im","<!--removedjavascript-->",$result);
//insert ShiftSpace
/*
$ShiftSpace = '<script type="text/javascript" charset="utf-8">
    var ShiftSpaceSandBoxMode = true;
  </script>
  <script src="greasemonkey-api.js" type="text/javascript"></script>
  <script src="../shiftspace.php?method=shiftspace.user.js&sandbox=1" type="text/javascript" charset="utf-8"></script>';
*/

// load styles
$ShiftSpace = '<link type="text/css" rel="stylesheet"" href="../styles/ShiftSpace.css"></link>';

// Bootstrap
$server = $_SERVER['HTTP_HOST'];
$ssdir = dirname($_SERVER['PHP_SELF']);

// prevent console.logs from breaking proxy
$ShiftSpace .= '<script type="text/javascript">
  if(!window.console)
  {
    window.console = {
      log: function() {},
      error: function() {}
    };
  }
</script>';

$ShiftSpace .= '<script type="text/javascript">
  var __ssdir__ = "'.$ssdir.'".split("/");
  var __server__ = "http://'.$server.'"+__ssdir__.slice(0, __ssdir__.length-1).join("/")+"/";
</script>';

$ShiftSpace .= '<script type="text/javascript" src="../client/Mootools.js"></script>';
$ShiftSpace .= '<script type="text/javascript" src="greasemonkey-api.js"></script>';

$ShiftSpace .= '<script type="text/javascript">var ShiftSpace = {
  info: function()
  {
    return {
      server: __server__
    };
  },
  xmlhttpRequest: GM_xmlhttpRequest
};</script>';

$ShiftSpace .= '<script type="text/javascript" src="bootstrap.js"></script>';
$ShiftSpace .= '<script type="text/javascript" src="../client/Pin.js"></script>';
$ShiftSpace .= '<script type="text/javascript" src="../client/RangeCoder.js"></script>';
$ShiftSpace .= '<script type="text/javascript" src="../client/Element.js"></script>';
$ShiftSpace .= '<script type="text/javascript" src="../client/Space.js" charset="utf-8"></script>';
$ShiftSpace .= '<script type="text/javascript" src="../client/Shift.js" charset="utf-8"></script>';

// Build shift_ids array if it wasn't already parsed from id param
if (!count($shift_ids)) {
    $all = $db->escape($_GET['all_shifts']);
    if ($all) {
	$shifts = $db->rows("
	    SELECT url_slug
	    FROM shift
	    WHERE status = 1
	    AND href = '$shift->href'
	");
	foreach ($shifts as $n => $ashift) {
	foreach ($ashift as $key => $val) {
	    $shift_ids[] = $val;
	}}
    } else {
      $shift_ids[] = $id;
    }
}

// Load each requested shift
foreach ($shift_ids as $an_id)
{
    $shift = $db->row("
      SELECT *
      FROM shift
      WHERE url_slug = '$an_id'
    ");

    $spaceName = $shift->space;
    $legacy = true;
    if($spaceName == 'notes') 
    {
      $spaceName = 'Notes';
    }
    else if($spaceName == 'highlight') 
    {
      $spaceName = 'Highlights';
    }
    else if($spaceName == 'imageswap')
    {
      $spaceName = 'ImageSwap';
    }
    else if($spaceName == 'sourceshift')
    {
      $spaceName = 'SourceShift';
    }
    else
    {
      $legacy = false;
    }

    $shiftContent = $shift->content;
    $shiftId = $shift->url_slug;

    // TODO: this should be replaced by versioning - David
    if($legacy)
    {
      // remove the curly braces
      $shiftContent = substr($shiftContent, 1, strlen($shiftContent)-2);
    }

    $legacyValue = ($legacy) ? 'true' : 'false';

    // check the database for the shift's space load
    $ShiftSpace .= '<script type="text/javascript" src="../spaces/'.$spaceName.'/'.$spaceName.'.js" charset="utf-8"></script>';

    // get the shift out of the database
    $ShiftSpace .= "<script type='text/javascript' charset='utf-8'>
      window.addEvent('domready', function() {
	var theShift = $shiftContent;
	
	if($legacyValue)
	{
	  theShift = \$merge(theShift, {legacy:true});
	}
	theShift = \$merge(theShift, {id:'$shiftId'});

	$spaceName.showShift(theShift);
	$spaceName.orderFront('$shiftId');
      });
    </script>";
}

echo preg_replace("/<\/head>/",$ShiftSpace . "</head>", $result);

?>
