/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/** PEG.js grammar for semantic locators. */

Locator = preOuter:Node* postOuter:OuterAndPostOuter? {
  postOuter = postOuter || [];
  return new SemanticLocator(preOuter, postOuter);
}

OuterAndPostOuter = "outer"? _ postOuter:Node+ {return postOuter;}

Node =  "{" _ role:Word _ name:QuotedString? _ attributes:Attributes _ "}" _ {
  return new SemanticNode(role, name ?? undefined, attributes);
}

Attributes = attributes:Attribute* {
  const map: AttributeMap = {};
  for (const attribute of attributes) {
    map[attribute.name] = attribute.value;
  }
  return map;
}

Attribute = _ name:Word ":" value:Word _ {return {name, value};}

// A string of lower case letters.
Word = chars:[a-z]+ {return chars.join(''); }

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
