// Command line for the spidermonkey version.  Will pobably switch to Node.
load('opcodes.js');
load('lexer.js');
load('parser.js');

function readLines() {
  var line, lines = [];
  while ((line = readline()) !== null) {
    lines.push(line);
  }
  return lines;
}

var tokens = lexFile(readLines());
//*
for (i=0; i<tokens.length; i++) {
  print(tokens[i]);
}
//*/

var asts = parse(tokens);
for (i=0; i<asts.length; i++) {
  print(asts[i]);
}
//*/

