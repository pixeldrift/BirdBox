// Team members: the people who help run the aviary (employees, volunteers, family). No logins yet —
// these are records you can assign things to later. Each one is also mirrored as an address-book
// contact of type "Team" (kept in step by the server). See sql/019_users.sql.
var USERS_SAMPLE = [];

// Roles. Each will carry a default set of permissions that can be customised per person (see the
// roadmap) — for now a role is a label that says what someone does.
var USER_ROLES = [
  { id: 'Owner', blurb: 'Runs the aviary. Full access.' },
  { id: 'Manager', blurb: 'Day-to-day running: birds, shipping, records.' },
  { id: 'Employee', blurb: 'Paid staff working with the birds and records.' },
  { id: 'Volunteer', blurb: 'Helps out — care tasks and basic records.' },
];

var usersLoaded = fetch('/api/records?type=users')
  .then(function (res) {
    if (!res.ok) throw new Error('Failed to load team');
    return res.json();
  })
  .then(function (list) {
    USERS_SAMPLE.length = 0;
    Array.prototype.push.apply(USERS_SAMPLE, list);
  })
  .catch(function (err) {
    console.error('Could not load the team from the server:', err);
  });

// "Who am I": until there are logins, this browser remembers which team member you are, so Settings can show and edit
// your own profile. When logins arrive this becomes the signed-in user.
function currentUserId() {
  try { return localStorage.getItem('birdbox-me') || ''; } catch (e) { return ''; }
}
function setCurrentUser(id) {
  try { if (id) localStorage.setItem('birdbox-me', id); else localStorage.removeItem('birdbox-me'); } catch (e) { /* storage blocked: it just won't be remembered */ }
}
function currentUser() {
  var u = currentUserId() ? getUser(currentUserId()) : null;
  return u || null;
}

function getUser(id) {
  return USERS_SAMPLE.filter(function (u) { return u.id === id; })[0] || null;
}

function userFullName(u) {
  return [u.firstName, u.lastName].filter(Boolean).join(' ');
}
