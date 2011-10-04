function Ast(type, head, args) {
  this.type = type;
  this.head = head;
  this.args = args || [];
}
Ast.prototype.toString = function() {
  var s = this.type + '|' + this.head;
  if (this.args.length > 0)
    s += '<' + this.args + '>';
  return s;
}

// Tokens[][] -> AST[]
function parse(tokens) {
  var i, cmd,
      commandAsts = [];
  for (i=0; i<tokens.length; i++) {
    cmd = tokens[i];
    // Directive
    if (cmd[0].type === '.') {
      commandAsts.push(parseDirective(cmd));
    }
    // Op Code
    else if (cmd[0].type === OPCODE) {
      commandAsts.push(parseOp(cmd));
    }
    // Decl, with name
    else if (cmd[0].type === SIZE_DECL) {
      commandAsts.push(parseDeclNoName(cmd));
    }
    // Decl, no name
    else if (cmd.length>1 && cmd[1].type === SIZE_DECL) {
      commandAsts.push(parseDecl(cmd));
    }
    // Constant
    else if (cmd.length>2 && cmd[1].type === CONST_DEF) {
      commandAsts.push(parseConstant(cmd));
    }
    // Label
    else if (cmd.length>1 && cmd[1].type===':') {
      commandAsts.push(new Ast(':', cmd[0].token));
    }
    else {
      //print('***UNHANDLED: ' + cmd);
    }
  }
  return commandAsts;
}

function parseDirective(tokens) {
  var dir, i, ast,
      args = [];
  dir = tokens[0].token;
  for (i=1; i<tokens.length; i+=2) {
    [j,ast] = parseArg(tokens,i);
    args.push(ast);
    i=j;
  }
  return new Ast(tokens[0].type, dir, args);
}

function parseOp(tokens) {
  var op, i, ast,
      args = [];
  op = tokens[0].token;
  // FIXME: Assuming every other token is a comma
  for (i=1; i<tokens.length; i+=2) {
    [j,ast] = parseArg(tokens,i);
    args.push(ast);
    i=j;
  }
  return new Ast(tokens[0].type, op, args);
}

function parseArg(tokens, i) {
  var j = i,
      ast,
      argAst;
  switch (tokens[i].type) {
    case '-':
      [j,argAst] = parseArg(tokens,i+1);
      ast = new Ast('-', argAst);
      break;
    case '[':
      [j,ast] = parseMem(tokens,i);
      break;
    /* FIXME: Need to fixe parseMem first, but need this as well.
    case '(':
      [j,ast] = parseParens(tokens,i);
      break;
      */
    case SIZE:
      // Ignoring 'ptr'
      [j,argAst] = parseArg(tokens,i+2);
      ast = new Ast(tokens[i].type, tokens[i].token, [argAst]);
      break;
    case ',':
      throw new Error('Comma passed to parseArg');
    default:
      ast = new Ast(tokens[i].type, tokens[i].token);
  }
  return [j,ast];
}

function parseMem(tokens, i) {
  var j, ast, lhs, rhs;
  // FIXME: Need to handle more complex cases
  if (tokens[i+2].type === ']') {
    [j,ast] = parseArg(tokens, i+1);
  }
  else {
    [j,lhs] = parseArg(tokens, i+1);
    [j,rhs] = parseArg(tokens, i+3);
    ast = new Ast(tokens[i+2].type, lhs, [rhs]);
    j++;
  }
  return [j, new Ast('[', ast)];
}

function parseDecl(tokens) {
  //FIXME: Need to handle 'dup'
  var [j,ast] = parseArg(tokens, 2);
  return new Ast(tokens[1].type, tokens[1].token, [tokens[0].token, ast]);
}

function parseDeclNoName(tokens) {
  //FIXME: Need to handle 'dup'
  var [j,ast] = parseArg(tokens, 1);
  return new Ast(tokens[0].type, tokens[0].token, [ast]);
}

function parseConstant(tokens) {
  var [j,argAst] = parseArg(tokens, 2);
  return new Ast(tokens[1].type, tokens[0].token, [argAst]);
}

