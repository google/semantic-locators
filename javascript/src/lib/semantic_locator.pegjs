/**
 * @license
 * Copyright 2021 The Semantic Locators Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/** PEG.js grammar for semantic locators. */

Locator = preOuter:Node* postOuter:OuterAndPostOuter? {
  postOuter = postOuter || [];
  return new SemanticLocator(preOuter, postOuter);
}

OuterAndPostOuter = "outer"? _ postOuter:Node+ {return postOuter;}

Node =  "{" _ role:Word _ name:QuotedString? _ attributes:Attribute* _ "}" _ {
  if (name) {
   return new SemanticNode(role, attributes, name);
  }
  return new SemanticNode(role, attributes);
}

Attribute = _ name:Word ":" value:AlphaNum _ {return {name, value};}

// A string of lower case letters.
Word = chars:[a-z]+ {return chars.join(''); }

AlphaNum = chars:[a-z0-9_]+ {return chars.join(''); }

/* String matching support with escapes */
QuotedString
  = '"' chars:DoubleStringCharacter* '"' { return chars.join(''); }
  / "'" chars:SingleStringCharacter* "'" { return chars.join(''); }

DoubleStringCharacter
  = !('"' / "\\") char:. { return char; }
  / "\\" sequence:EscapeSequence { return sequence; }

SingleStringCharacter
  = !("'" / "\\") char:. { return char; }
  / "\\" sequence:EscapeSequence { return sequence; }

EscapeSequence
  = "'"
  / '"'
  / "\\"

_ "space"
  = [ \t]*
