var fs = require('fs');


var path = "./views/templates"
var compliledTemplatePath = "./public/javascripts/templates.js"
var templates = fs.readdirSync(path);


var compileTemplates = function(){
  var templateObj = {};
  var p = '', content = '', name;
  for (var i = templates.length - 1; i >= 0; i--) {
    p = path + "/" + templates[i];
    content = fs.readFileSync(p).toString('utf8');
    name = templates[i].split('.')[0];
    templateObj[name] = content;
  };
  var output = "templates = " + JSON.stringify(templateObj);
  fs.writeFileSync(compliledTemplatePath, output);
}


var handleChange = function(event, filename){
  console.log("Compiling template...");
  compileTemplates()
}


for (var i = templates.length - 1; i >= 0; i--) {
  fs.watch(path + "/" +templates[i], handleChange);
};

