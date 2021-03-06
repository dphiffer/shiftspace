<?php

if (empty($user) || empty($user->id)) 
{
  echo "{status: 0, message:'User not logged in'}";
  exit;
}

if (!empty($_REQUEST['shiftId'])) 
{
  $shiftId = $db->escape($_REQUEST['shiftId']);
} 
else if (!empty($_SERVER['HTTP_REFERER'])) 
{
  $href = $db->escape($_SERVER['HTTP_REFERER']);
}
if (!empty($_REQUEST['content']))
{
  $content = $db->escape($_REQUEST['content']);
}

// grab the real shift id
$shift = $db->row("
  SELECT *
  FROM shift
  WHERE url_slug='$shiftId'
");

//echo "Grabbed shift.";

if(!$shift)
{
  echo "{status: 0, message:'The shift that you're trying to comment on does not exist.'}";
  exit;
}

$created = date('Y-m-d H:i:s');

// insert it
// Record a general accounting of shift
$db->query("
  INSERT INTO comment
  (user_id, content, shift_id, created, modified)
  VALUES ($user->id, '$content', $shift->id, '$created', '$created')
  ");

//echo "Added comment.";
  
$owner = $db->row("
  SELECT *
  FROM user
  WHERE id = $shift->user_id
");

//echo "grabbed owner.";
  
// email the owner
if($owner->email && 
   $owner->email_comments == 1 &&
   $owner->id != $user->id)
{
  $subject = "$user->username has commented on your shift!";
  $body = wordwrap("Hello $owner->username,

  $user->username has just commented on your shift. Go check the original link or the proxy link below:

  Original link: $shift->href
  Proxy link: http://www.shiftspace.org/api/sandbox/?id=$shift->url_slug
  
  If you do not wish to receive emails when your shifts are commented on, you can change this default setting in the Settings tab in the ShiftSpace plugin.

  Kisses,
  The ShiftSpace email robot
  ");
  //echo "sending email";
  mail($owner->email, $subject, $body, "From: ShiftSpace <info@shiftspace.org>\n");
}

// return success
echo "{status: 1, message:'Success. Comment added.'}";
?>