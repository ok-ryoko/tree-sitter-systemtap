(preprocessor_macro_definition
  name: (identifier) @define)

(preprocessor_macro_expansion) @function.macro

(preprocessor_constant) @constant.macro

(probe_point_component) @function

(function_definition
  name: (identifier) @function)

(parameter
  name: (identifier) @parameter)

(type) @type.builtin

(member_expression
  member: (identifier) @field)

(
  (call_expression
    function: (identifier) @function.builtin)
  (#match? @function.builtin "^(print|printd|printdln|printf|println|sprint|sprintd|sprintdln|sprintf|sprintln)$")
)

(call_expression
  function: (identifier) @function.call)

(number) @number
(string) @string
(escape_sequence) @string.escape

[
  (script_argument_string)
  (script_argument_number)
] @constant

(identifier) @variable

(shebang_line) @preproc

(comment) @comment

[
  "!"
  "!="
  "!~"
  "$"
  "$$"
  "%"
  "%="
  "&"
  "&&"
  "&="
  "*"
  "*="
  "+"
  "++"
  "+="
  "-"
  "--"
  "-="
  "->"
  "."
  ".="
  "/"
  "/="
  ":"
  "<"
  "<<"
  "<<<"
  "<<="
  "<="
  "="
  "=="
  "=~"
  ">"
  ">="
  ">>"
  ">>="
  "?"
  "^"
  "^="
  "|"
  "|="
  "||"
  "~"
] @operator

[
  (null_statement)
  ","
] @punctuation.delimiter

[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @punctuation.bracket

[
  "break"
  "continue"
  "delete"
  "global"
  "limit"
  "next"
  "private"
  "probe"
] @keyword

"function" @keyword.function
"in" @keyword.operator
"return" @keyword.return

[
  "if"
  "else"
] @conditional

[
  "for"
  "foreach"
  "while"
] @repeat

[
  "try"
  "catch"
] @exception

[
  "%("
  "%)"
  "%:"
  "%?"
  "%{"
  "%}"
  (preprocessor_tokens)
  (embedded_code)
] @preproc

"@define" @define
