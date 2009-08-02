// ==Builder==
// @optional
// @name              UserFunctions
// @package           Core
// ==/Builder==

// Private variable and function for controlling user authentication
var username = false;

function setUsername(_username) {
  username = _username;
}

/*
  Function: SSUserForShift
    Returns the username for a shift.

  Parameters:
    shiftId - a shift id.

  Returns:
    The shift author's username as a string.
*/
function SSUserForShift(id)
{
  return SSGetShift(id).get('userName');
}

/*
  Function: SSUserOwnsShift
    Used to check whether the currently logged in user authored a shift.

  Parameters:
    shiftId - a shift id.

  Returns:
    true or false.
*/
function SSUserOwnsShift(shift)
{
  return (shift.userName == ShiftSpace.User.getUserName());
}

/*
  Function: SSUserCanEditShift
    Used to check whether a user has permission to edit a shift.

  Parameters:
    shiftId - a shift id.

  Returns:
    true or false.
*/
function SSUserCanEditShift(shift)
{
  return (ShiftSpace.User.isLoggedIn() &&
          SSUserOwnsShift(shift));
}