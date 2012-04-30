var fs = require('fs'),
    jsp = require('uglify-js').parser,
    pro = require('uglify-js').uglify,
    zlib = require('zlib');


var webRoot = 'web/public/javascripts',
    jsFiles = require('./' + webRoot + '/app.json'),
    jsFilesArray = [],
    path = ''
    output = '';

for (var i = 0; i < jsFiles['libraries'].length; i++) {
  path = webRoot + '/lib/' + jsFiles['libraries'][i] + '.js';
  jsFilesArray.push( path );
};

jsFilesArray.push( webRoot + '/templates.js');
jsFilesArray.push( webRoot + '/main.js');

for (var i = 0; i < jsFiles['modules'].length; i++) {
  path = webRoot + '/modules/' + jsFiles['modules'][i] + '.js';
  jsFilesArray.push( path );
};


jsFilesArray.push( webRoot + '/start.js');



/* Concat files */
for (var i = 0; i < jsFilesArray.length ;i++) {
  output += "\n" + fs.readFileSync( jsFilesArray[i], 'utf8' );
};

fs.writeFileSync( 'web/public/javascripts/app.js', output)

/* Min files */

var frontJS = fs.readFileSync( 'web/public/javascripts/drawbridge/signup.js', 'utf8' ),
    frontCSS = fs.readFileSync( 'web/public/stylesheets/style.css', 'utf8' );


function min( input ){

  var ast = jsp.parse( input);
  
  ast = pro.ast_mangle( ast );
  ast = pro.ast_squeeze( ast );

  return pro.gen_code( ast );
}

fs.writeFileSync( 'web/public/javascripts/app.min.js', min(output) );
fs.writeFileSync( 'web/public/javascripts/drawbridge/signup.min.js', min(frontJS) );


/* compress */


function zip( file ){
  var gzip = zlib.createGzip(),
      inp = fs.createReadStream( file ),
      out = fs.createWriteStream( file + '.gz');
  inp.pipe(gzip).pipe(out);
}

zip( 'web/public/javascripts/app.min.js' );
zip( 'web/public/stylesheets/app.css' );
zip( 'web/public/javascripts/drawbridge/signup.min.js' );
zip( 'web/public/stylesheets/style.css' );



// new compressor.minify({
//   type : 'gcc',
//   fileIn: 'web/public/javascripts/app.js',
//   fileOut: 'web/public/javascripts/app.min.js',
//   callback : function(err){
//     console.log(err);
//   }
//})