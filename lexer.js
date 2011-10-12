// Tokens for lexer.  Many are also used by the parser.
const VAR=0,
      NUMBER=1,
      REGISTER=2,
      OPCODE=3,
      PTR=4,
      SIZE=5,
      SIZE_DECL=6,
      CONST_DEF=7,
      DUP=8;

/*
TODO: Not handling strings
 */

function Token(type, token) {
  this.type = type;
  this.token = (token===undefined ? type : token);
}
Token.prototype.toString = function() {
  return ' ' + this.type + ':' + this.token;
}

function isWhitespace(c) {
  return c === ' ' || c === '\t';
}

// String (one command) -> Array of tokens
function lexCommand(cmd) {
  var tokens = [],
      i = 0,
      j = 0,
      end = cmd.length,
      c = ' ',
      t = '',
      type;
  while (j<end) {
    while (isWhitespace(cmd.charAt(i)) && i<end) i++;
    j = i+1;
    if (i === end) break;

    switch (cmd.charAt(i)) {
      case '.':
        while (j < end && cmd.charAt(j) !== ' ') j++;
        tokens.push(new Token('.', cmd.substring(i, j)));
        break;
      case ',':
        tokens.push(new Token(','));
        break;
      case '+':
        tokens.push(new Token('+'));
        break;
      case '-':
        tokens.push(new Token('-'));
        break;
      case '(':
        tokens.push(new Token('('));
        break;
      case ')':
        tokens.push(new Token(')'));
        break;
      case '[':
        tokens.push(new Token('['));
        break;
      case ']':
        tokens.push(new Token(']'));
        break;
      case ':':
        tokens.push(new Token(':'));
        break;
      case '$':
        tokens.push(new Token('$'));
        break;
      case '?':
        tokens.push(new Token('?'));
        break;
      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        for (; j < end; j++) {
          c = cmd.charAt(j);
          if (!(c>='0' && c<='9')) break;
        }
        if (c === 'h' || c === 'd') j++;
        t = cmd.substring(i, j);
        tokens.push(new Token(NUMBER, t));
        break;
      default:
        for (; j < end; j++) {
          c = cmd.charAt(j);
          if (!((c>='a' && c<='z') || (c>='A' && c<='Z') || (c>='0' && c<='9') || c==='_')) break;
        }
        t = cmd.substring(i, j);
        if (isOpCode(t)) {
          tokens.push(new Token(OPCODE, t.toLowerCase()));
        }
        else if (isRegister(t)) {
          tokens.push(new Token(REGISTER, t.toLowerCase()));
        }
        else if (isDirective(t)) {
          // Using '.' for the token for directives, even if it was not the start of the directive
          tokens.push(new Token('.', t.toLowerCase()));
        }
        else if (t.toLowerCase() === 'dup') {
          tokens.push(new Token(DUP, t.toLowerCase()));
        }
        else if (t.toLowerCase() === 'equ') {
          tokens.push(new Token(CONST_DEF, t.toLowerCase()));
        }
        else if (t.toLowerCase() === 'ptr') {
          tokens.push(new Token(PTR, t.toLowerCase()));
        }
        else if (isSize(t)) {
          tokens.push(new Token(SIZE, t.toLowerCase()));
        }
        else if (isSizeDecl(t)) {
          tokens.push(new Token(SIZE_DECL, t.toLowerCase()));
        }
        else {
          tokens.push(new Token(VAR, t));
        }
    }
    i=j;
  }

  return tokens;
}

function isOpCode(t) {
  /*
  switch(t.toLowerCase()) {
    case "mov":
    case "push":
    case "pop":
    case "lea":
    case "add":
    case "sub":
    case "inc":
    case "dec":
    case "imul":
    case "idiv":
    case "mul":
    case "div":
    case "and":
    case "or":
    case "xor":
    case "not":
    case "neg":
    case "shl":
    case "shr":
    case "sal":
    case "sar":
    case "rol":
    case "ror":
    case "rcl":
    case "rcr":
    case "jmp":
    case "je":
    case "jne":
    case "jz":
    case "jnz":
    case "jg":
    case "jge":
    case "jl":
    case "jle":
    case "ja":
    case "jb":
    case "jbe":
    case "jc":
    case "cmp":
    case "test":
    case "nop":
    case "call":
    case "ret":
    case "retn":
    case "movzx":
    case "movsd":
    case "movsb":
    case "stosb":
    case "stosd":
    case "lodsb":
    case "lodsd":
    case "invoke":
    case "stdcall":
    case "xchg":
    case "adc":
    case "sbb":
    case "popad":
    case "pushad":
    case "rep":
    case "fadd":
    case "fmul":
    case "fsub":
    case "fdiv":
    case "fstp":
    case "fld":
    case "fst":
    case "clc":
    case "stc":
    case "org":
    case "cld":
    case "end":
    //case "jumps":
    //case "extrn":
      return true;
    default:
      return false;
  }
  */
  return opcodeLookup[t.toUpperCase()] === undefined;
}

function isRegister(t) {
  switch (t.toLowerCase()) {
    case "eax":
    case "ebx":
    case "ecx":
    case "edx":
    case "esi":
    case "edi":
    case "esp":
    case "ebp":
    case "ax":
    case "bx":
    case "cx":
    case "dx":
    case "ah":
    case "bh":
    case "ch":
    case "dh":
    case "al":
    case "bl":
    case "cl":
    case "dl":
      return true;
    default:
      return false;
  }
}

function isDirective(t) {
  switch(t.toLowerCase()) {
    case "jumps":
    case "extrn":
      return true;
    default:
      return false;
  }
}


function isSizeDecl(t) {
  var token = t.toLowerCase();
  return t === 'db'
      || t === 'dd'
      || t === 'dw'
      // Not really sure about this one
      || t === 'label';
}

function isSize(t) {
  var token = t.toLowerCase();
  return t === 'byte'
      || t === 'word'
      || t === 'dword';
}

// Array of strings -> Array of Arrays of tokens
function lexFile(commands) {
  var i, s,
      commandTokens = [];
  for (i=0; i<commands.length; i++) {
    s = commands[i];
    s = s.replace(/\s*;.*/, ''); // Strip out comments
    if (s.match(/^\s*$/)) continue; // Skip empty lines
    commandTokens.push(lexCommand(s));
  }
  return commandTokens;
}

