<?php
function method_form($httpmethod, $method, $args, $comment = '') {
  echo "<form method=$httpmethod action=index.php>\n";
  echo "<h2>$method</h2>";
  
  if ($comment)
    echo "<p><span style='border: 1px solid red; padding: 3px 3px 3px 3px; margin-left: 5px;'>$comment</span></p>";
    
  echo "<table>\n";
  echo "<input type=hidden name=method value=$method>\n";
  
  foreach ($args as $arg) {
    $textarea = false;
    
    if (substr($arg, -1) == '_') {
      $arg = substr($arg, 0, -1);
      $textarea = true;
    }

    echo "<tr><td><label for=$arg>$arg</label></td>\n";

    if ($textarea) {
      echo "<td><textarea name=$arg cols=50 rows=10></textarea></td></tr>\n";
    }
    else {
      echo "<td><input type=text name=$arg></td></tr>\n";
    }
  }
  
  echo "<tr><td><input type=submit value='Call'></td></tr>";
  echo "</table></form><hr>\n\n";
}
?>

<html>
<body>
<h1>Method calls</h1>
<hr>
<?php method_form('get', "version", array()); ?>
<?php method_form('get', "query", array("href")); ?>
<?php method_form('get', "sandbox.getvalue", array("key")); ?>
<?php method_form('get', "sandbox.setvalue", array("key", "value")); ?>
<?php method_form('post', "shift.get", array("shiftIds")); ?>
<?php method_form('post', "shift.create", array("href", "summary", "space", "content_", "version")); ?>
<?php method_form('post', "shift.update", array("id", "summary", "content_")); ?>
<?php method_form('post', "shift.delete", array("id")); ?>
<?php method_form('post', "shift.select_all", array()); ?>

<?php method_form('get', "shift.query", array("href")); ?>
<?php method_form('get', "sandbox.proxy", array("url", "parameters")); ?>
<?php method_form('post', "collections", array("desc_")); ?>
<?php method_form('post', 'email.send', array('email_addresses', 'subject', 'body', 'send_email_to_current_user')); ?>
<?php method_form('post', 'sms.send', array('phone', 'msg', 'toself')); ?>
<?php method_form('post', 'sms.receive', array('phone', 'msg')); ?>
<?php method_form('post', 'user.login', array('username', 'password')); ?>
<?php method_form('post', 'user.logout', array()); ?>
<?php method_form('post', 'user.validate_phone', array()); ?>
<?php method_form('post', 'user.validate_phone_complete', array('key')); ?>
<?php method_form('post', 'user.join', array('username', 'password', 'password_again', 'email', 'phone', 'membership_id', 'first_name', 'last_name', 'perspective')); ?>
<?php method_form('post', 'user.update', array('password', 'password_again', 'email', 'phone', 'perspective', 'preview')); ?>
<?php method_form('post', 'user.query', array()); ?>
<?php method_form('post', 'user.renew_password', array('username')); ?>
<?php method_form('post', 'artwork.store', array('jsonObject_')); ?>
<?php method_form('get', 'user.bookmarks_by_phone', array('phone')); ?>
<?php method_form('get', 'user.getname', array('userid')); ?>

<?php method_form('post', 'event.subscriptions', array()); ?>
<?php method_form('post', 'event.subscribe', array('stream_id')); ?>
<?php method_form('post', 'event.unsubscribe', array('stream_id')); ?>
<?php method_form('post', 'event.post', array('stream_id', 'display_string', 'object_ref', 'has_read_status', 'unique_name', 'datetime_ref', 'content_')); ?>
<?php method_form('post', 'event.feed', array()); ?>
<?php method_form('post', 'event.onefeed', array('stream_id')); ?>
<?php method_form('post', 'event.readtreestructure', array('stream_id', 'with_leaves')); ?>
<?php method_form('post', 'event.createstream', array('private', 'stream_name', 'object_ref', 'unique_name', 'meta', 'superstream')); ?>
<?php method_form('post', 'event.updatestream', array('id', 'private', 'stream_name', 'object_ref', 'unique_name', 'meta', 'superstream')); ?>
<?php method_form('post', 'event.findstreambyuniquename', array('unique_name')); ?>
<?php method_form('post', 'event.findeventbyuniquename', array('stream_id', 'unique_name')); ?>
<?php method_form('post', 'event.streamsetpermission', array('stream_id', 'user_id', 'level'), 'level: 0=none, 1=read, 2=write, 3=administrator (can give permissions)'); ?>
<?php method_form('post', 'event.findstreams', array('object_ref', 'meta')); ?>
<?php method_form('post', 'event.findevents', array('object_ref')); ?>
<?php method_form('post', 'event.findstreamswithevent', array('object_ref', 'stream_meta')); ?>
<?php method_form('post', 'event.deleteevent', array('id')); ?>
<?php method_form('post', 'event.deleteeventbyuniquename', array('stream_id', 'unique_name')); ?>
<?php method_form('post', 'event.markread', array('event_id')); ?>
<?php method_form('post', 'event.markunread', array('event_id')); ?>

</body>
</html>

