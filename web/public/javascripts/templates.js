templates = {"settings":"<form action=\"/settings\">\n  <div class='row'>\n    <div class=\"span4\">\n      <h4>Students can see confusion</h4>\n      <p>When enabled students are able to see levels of confusion and understanding.</p>\n    </div>\n    <div class=\"span8\">\n      <label class=\"checkbox\">\n        <% if(studentsCanSeeComprehension){ %>\n          <input type=\"checkbox\" name=\"studentsCanSeeComprehension\" checked>\n        <% } else { %>\n          <input type=\"checkbox\" name=\"studentsCanSeeComprehension\">\n        <% } %>\n        Enable\n      </label>\n    </div>\n  </div>\n\n  <div class=\"submit\">\n    <input type=\"submit\" value=\"Save\">\n  </div>\n</form>","parentView":"<div class=\"navbar navbar-fixed-top\">\n  <div class=\"navbar-inner\">\n    <div class=\"container\">\n      <a href=\"/\" class=\"brand\">understoodit</a>\n      <ul id=\"menu\">\n        <li>\n          <a href=\"#\">Menu</a>\n        </li>\n      </ul>\n\n      <div id=\"nav-collapse\" class=\"collapse\">\n        <ul class=\"nav\" id=\"nav-tabs\">\n          <li class=\"active\">\n            <a href=\"#dashboard\">Dashboard</a>\n          </li>\n        </ul>\n\n        <ul class=\"nav pull-right\" id=\"account-nav\">\n\n        </ul>\n      </div>\n\n    </div>\n  </div>\n</div>\n<div class=\"container\">\n  <div id=\"notification-box\">\n    <div id=\"notification-message\"></div>\n  </div\n\n  <div class=\"row\">\n\n    <div class=\"tab-content\">\n\n      <div class=\"tab-page fade active\" id=\"dashboard\">\n        <div class=\"span12\">\n          <div id=\"dashboard-content\">\n          </div>\n        </div>\n      </div>\n\n\n\n\n    </div>\n  </div>\n</div>","comprehension":"<a href=\"\" id=\"confused\">Confused</a>\n<a href=\"\" id=\"understood\">Understood</a>","comprehension-meters":"<div class=\"meter-outer\">\n  <h2>Confusometer</h2>\n  <div id=\"confusometer\" class=\"meters\">\n  </div>\n</div>\n\n<div class=\"meter-outer\">\n  <h2>Understandometer</h2>\n  <div id=\"understandometer\" class=\"meters\">\n  </div>\n</div>\n\n<canvas id=\"real-time-graph\" rel=\"tooltip\" title=\"Confusion is represented by the red line with square points, while understanding is represented by the green line with circles.\"></canvas>\n","class-state":"<div id=\"teacherID\"></div>\n\n<% if(isTeacher){ %>\n<div class=\"num-outer\" rel=\"tooptip\" title=\"Number of connected students.\">\n  <div id=\"numStudents\">0</div>\n</div>\n\n<div class=\"num-outer\" rel=\"tooptip\" title=\"Number of students that are connected <strong>and</strong> currently viewing this page.\">\n  <div id=\"active\">0</div>\n</div>\n<% } %>","account-nav":"\n<% if (loggedIn){ %>\n <li>\n    <a href=\"/#\"><%= email %></a>\n  </li>\n  <li>\n    <a href=\"/logout\">Logout</a>\n  </li>\n<% } else { %>\n  <li>\n    <a href=\"/login\">Login</a>\n  </li>\n<% } %> "}