/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
