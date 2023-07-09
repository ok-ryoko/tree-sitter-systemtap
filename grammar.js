/* global choice, field, grammar, optional, prec, repeat, repeat1, seq, token */
/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "^[$_]$" }] */

/**
 * @file SystemTap grammar for tree-sitter
 * @copyright Copyright 2023 OK Ryoko
 * @license MIT
 * @author OK Ryoko <ryoko@kyomu.jp.net>
 */

/**
 * Enumeration of operator precedences.
 *
 * @readonly
 * @enum {number}
 */
const PREC = {
  TERNARY: -3,
  ASSIGNMENT: -2,
  ARRAY_IN: -1,
  DEFAULT: 0,
  LOGICAL_OR: 1,
  LOGICAL_AND: 2,
  INCLUSIVE_OR: 3,
  EXCLUSIVE_OR: 4,
  BITWISE_AND: 5,
  EQUAL: 6,
  RELATIONAL: 7,
  BITWISE_SHIFT: 8,
  ADDITION: 9,
  MULTIPLICATION: 10,
  UNARY: 11,
  EXPANSION: 12,
  CALL: 13,
  SUBSCRIPT: 14,
  MEMBER: 15,
};

module.exports.PREC = PREC;

module.exports = grammar({
  name: "systemtap",

  extras: ($) => [/\s|\r?\n/, $.comment],

  word: ($) => $.identifier,

  precedences: ($) => [[$.concatenated_string, $.literal]],

  inline: ($) => [
    $._assignment_expression_lhs,
    $._component,
    $._expression,
    $._expression_or_macro,
    $._if_clause,
    $._probe_point_seq,
    $._statement,
    $._sorting_order,
    $._sufficiency_mark,
    $._variable_declarator,
  ],

  supertypes: ($) => [
    $._expression,
    $._statement,
    $._variable_declarator,
  ],

  rules: {
    program: ($) =>
      seq(optional($.shebang_line), repeat($._component)),

    _component: ($) =>
      choice(
        $.preprocessor_macro_definition,
        $.preprocessor_macro_expansion,
        $.probe_point_definition,
        $.probe_point_alias_prologue,
        $.probe_point_alias_epilogue,
        $.function_definition,
        $.variable_declaration
      ),

    preprocessor_macro_definition: ($) =>
      seq(
        "@define",
        field("name", $.identifier),
        optional(
          seq(
            "(",
            field("parameter", seqdel(",", $.identifier)),
            ")"
          )
        ),
        token(prec(2, "%(")),
        field("body", optional($.preprocessor_tokens)),
        token(prec(2, "%)"))
      ),

    preprocessor_tokens: (_) =>
      repeat1(
        choice(
          token(prec(2, /[^%)]|[^%][)]/)),
          token(prec(2, /[%)]/))
        )
      ),

    preprocessor_macro_expansion: ($) =>
      prec.right(
        seq(
          "@",
          field(
            "name",
            token.immediate(/[$A-Z_a-z][$0-9A-Z_a-z]*/)
          ),
          optional(
            seq(
              "(",
              field("argument", seqdel(",", $._expression)),
              ")"
            )
          )
        )
      ),

    probe_point_definition: ($) =>
      seq(
        "probe",
        field("probe_point", $._probe_point_seq),
        field("body", $.statement_block)
      ),

    _probe_point_seq: ($) =>
      choice(
        $.preprocessor_macro_expansion,
        seqdel(",", $.probe_point)
      ),

    probe_point: ($) =>
      prec.right(
        seq(
          field(
            "component",
            seqdel(
              ".",
              choice(
                $.probe_point_component,
                $.probe_point_expansion
              )
            )
          ),
          optional(
            field("sufficiency_mark", $._sufficiency_mark)
          ),
          optional(field("arming_condition", $._if_clause))
        )
      ),

    probe_point_component: ($) =>
      seq(
        field("pattern", /[*A-Z_a-z][*0-9A-Z_a-z]*/),
        optional(
          seq(
            "(",
            field("parameter", $._expression_or_macro),
            ")"
          )
        )
      ),

    probe_point_expansion: ($) =>
      prec.right(
        seq(
          "{",
          seqdel(
            ",",
            choice(
              $.probe_point_component,
              $.probe_point_expansion
            )
          ),
          "}"
        )
      ),

    _sufficiency_mark: (_) => choice("!", "?"),

    probe_point_alias_prologue: ($) =>
      seq(
        "probe",
        field(
          "alias",
          choice($.preprocessor_macro_expansion, $.probe_point)
        ),
        "=",
        field("probe_point", $._probe_point_seq),
        field("body", $.statement_block),
        optional(seq(",", field("epilogue", $.statement_block)))
      ),

    probe_point_alias_epilogue: ($) =>
      seq(
        "probe",
        field(
          "alias",
          choice($.preprocessor_macro_expansion, $.probe_point)
        ),
        "+=",
        field("probe_point", $._probe_point_seq),
        field("body", $.statement_block)
      ),

    function_definition: ($) =>
      seq(
        optional("private"),
        "function",
        choice(
          $.preprocessor_macro_expansion,
          seq(
            field("name", $.identifier),
            optional(seq(":", field("return_type", $.type))),
            "(",
            optional(
              field("parameter", seqdel(",", $.parameter))
            ),
            ")",
            optional(seq(":", field("priority", $.literal)))
          )
        ),
        field("body", $.statement_block)
      ),

    parameter: ($) =>
      seq(
        field("name", $.identifier),
        optional(seq(":", field("type", $.type)))
      ),

    type: (_) => token(choice("long", "string")),

    variable_declaration: ($) =>
      prec.right(
        seq(
          choice("private", "global", seq("private", "global")),
          choice(
            $.preprocessor_macro_expansion,
            seqdel(",", $._variable_declarator)
          ),
          optional(";")
        )
      ),

    _variable_declarator: ($) =>
      choice(
        $.preprocessor_macro_expansion,
        $.identifier,
        $.init_declarator,
        $.array_declarator
      ),

    init_declarator: ($) =>
      seq(
        field("name", $.identifier),
        seq(
          "=",
          field(
            "value",
            choice($.preprocessor_macro_expansion, $.literal)
          )
        )
      ),

    array_declarator: ($) =>
      seq(
        field("name", $.identifier),
        optional(field("wrapping_indicator", "%")),
        seq(
          "[",
          field(
            "size",
            choice(
              $.preprocessor_macro_expansion,
              $.script_argument_number,
              $.number
            )
          ),
          "]"
        )
      ),

    _statement: ($) =>
      choice(
        $.expression_statement,
        $.statement_block,
        $.null_statement,
        $.if_statement,
        $.while_statement,
        $.for_statement,
        $.foreach_statement,
        $.break_statement,
        $.continue_statement,
        $.return_statement,
        $.next_statement,
        $.try_statement,
        $.delete_statement
      ),

    expression_statement: ($) => $._expression_or_macro,

    statement_block: ($) =>
      prec.right(seq("{", repeat($._statement), "}")),

    null_statement: (_) => ";",

    if_statement: ($) =>
      prec.right(
        seq(
          $._if_clause,
          field("consequence", $._statement),
          optional(
            seq("else", field("alternative", $._statement))
          )
        )
      ),

    _if_clause: ($) =>
      seq(
        "if",
        "(",
        field("condition", $._expression_or_macro),
        ")"
      ),

    while_statement: ($) =>
      seq(
        "while",
        seq(
          "(",
          field("condition", $._expression_or_macro),
          ")"
        ),
        field("body", $._statement)
      ),

    for_statement: ($) =>
      seq(
        "for",
        "(",
        field(
          "initialization",
          optional($.expression_statement)
        ),
        ";",
        field("condition", optional($.expression_statement)),
        ";",
        field("iteration", optional($.expression_statement)),
        ")",
        field("body", $._statement)
      ),

    foreach_statement: ($) =>
      seq(
        "foreach",
        "(",
        field(
          "left",
          choice(
            seq(
              $.identifier,
              optional(field("sorting_order", $._sorting_order)),
              optional(
                seq("=", choice($.identifier, $.tuple_index))
              )
            ),
            $.tuple_index
          )
        ),
        "in",
        field(
          "right",
          seq(
            $.identifier,
            optional($.tuple_index),
            optional(
              field(
                "aggregation_operator",
                seq("@", $.identifier)
              )
            ),
            optional(field("sorting_order", $._sorting_order))
          )
        ),
        optional(seq("limit", field("limit", $._expression))),
        ")",
        field("body", $._statement)
      ),

    _sorting_order: (_) => choice("+", "-"),

    break_statement: (_) => prec.left("break"),

    continue_statement: (_) => prec.left("continue"),

    return_statement: ($) =>
      prec.right(
        seq(
          "return",
          field("value", optional($._expression_or_macro))
        )
      ),

    next_statement: (_) => prec.left("next"),

    try_statement: ($) =>
      seq(
        "try",
        field("body", $.statement_block),
        optional(field("handler", $.catch_clause))
      ),

    catch_clause: ($) =>
      seq(
        "catch",
        optional(
          seq("(", field("parameter", $.identifier), ")")
        ),
        field("body", $.statement_block)
      ),

    delete_statement: ($) =>
      prec.right(seq("delete", $._expression_or_macro)),

    _expression_or_macro: ($) =>
      choice($.preprocessor_macro_expansion, $._expression),

    _expression: ($) =>
      choice(
        $.member_expression,
        $.subscript_expression,
        $.call_expression,
        $.context_variable_expansion,
        $.unary_expression,
        $.update_expression,
        $.binary_expression,
        $.array_in_expression,
        $.assignment_expression,
        $.ternary_expression,
        $.grouping_expression,
        $.literal,
        $.identifier
      ),

    member_expression: ($) =>
      prec.right(
        PREC.MEMBER,
        seq(
          field("argument", $._expression_or_macro),
          field("operator", "->"),
          field("member", $._expression_or_macro)
        )
      ),

    subscript_expression: ($) =>
      prec(
        PREC.SUBSCRIPT,
        seq(
          field("argument", $._expression_or_macro),
          $.tuple_index
        )
      ),

    call_expression: ($) =>
      prec(
        PREC.CALL,
        seq(
          field("function", $._expression),
          seq(
            "(",
            optional(
              seqdel(
                ",",
                field("argument", $._expression_or_macro)
              )
            ),
            ")"
          )
        )
      ),

    context_variable_expansion: ($) =>
      prec(
        PREC.EXPANSION,
        seq(
          field("argument", $._expression_or_macro),
          field("operator", choice("$", "$$"))
        )
      ),

    unary_expression: ($) =>
      prec.left(
        PREC.UNARY,
        seq(
          field("operator", choice("!", "&", "+", "-", "~")),
          field("argument", $._expression_or_macro)
        )
      ),

    update_expression: ($) => {
      const argument = field("argument", $._expression_or_macro);
      const operator = field("operator", choice("++", "--"));
      return prec.right(
        PREC.UNARY,
        choice(seq(operator, argument), seq(argument, operator))
      );
    },

    binary_expression: ($) => {
      const table = [
        ["!=", PREC.EQUAL],
        ["!~", PREC.EQUAL],
        ["%", PREC.MULTIPLICATION],
        ["&", PREC.BITWISE_AND],
        ["&&", PREC.LOGICAL_AND],
        ["*", PREC.MULTIPLICATION],
        ["+", PREC.ADDITION],
        ["-", PREC.ADDITION],
        [".", PREC.ADDITION],
        ["/", PREC.MULTIPLICATION],
        ["<", PREC.RELATIONAL],
        ["<<", PREC.BITWISE_SHIFT],
        ["<=", PREC.RELATIONAL],
        ["==", PREC.EQUAL],
        ["=~", PREC.EQUAL],
        [">", PREC.RELATIONAL],
        [">=", PREC.RELATIONAL],
        [">>", PREC.BITWISE_SHIFT],
        ["^", PREC.EXCLUSIVE_OR],
        ["|", PREC.INCLUSIVE_OR],
        ["||", PREC.LOGICAL_OR],
      ];

      return choice(
        ...table.map(([operator, precedence]) => {
          return prec.left(
            precedence,
            seq(
              field("left", $._expression_or_macro),
              field("operator", operator),
              field("right", $._expression_or_macro)
            )
          );
        })
      );
    },

    array_in_expression: ($) =>
      prec.left(
        PREC.ARRAY_IN,
        seq(
          field(
            "left",
            choice($._expression_or_macro, $.tuple_index)
          ),
          field("operator", "in"),
          field("right", $._expression_or_macro)
        )
      ),

    assignment_expression: ($) =>
      prec.right(
        PREC.ASSIGNMENT,
        seq(
          field("left", $._assignment_expression_lhs),
          field(
            "operator",
            choice(
              "%=",
              "&=",
              "*=",
              "+=",
              "-=",
              ".=",
              "/=",
              "<<=",
              "<<<",
              "=",
              ">>=",
              "^=",
              "|="
            )
          ),
          field("right", $._expression_or_macro)
        )
      ),

    _assignment_expression_lhs: ($) =>
      choice(
        $.preprocessor_macro_expansion,
        $.identifier,
        $.subscript_expression,
        $.member_expression
      ),

    ternary_expression: ($) =>
      prec.right(
        PREC.TERNARY,
        seq(
          field("condition", $._expression_or_macro),
          "?",
          field("consequence", optional($._expression_or_macro)),
          ":",
          field("alternative", $._expression_or_macro)
        )
      ),

    grouping_expression: ($) =>
      seq("(", $._expression_or_macro, ")"),

    tuple_index: ($) =>
      seq(
        "[",
        field(
          "index",
          seqdel(
            ",",
            choice(
              "*",
              seq(
                $._expression_or_macro,
                optional($._sorting_order)
              )
            )
          )
        ),
        "]"
      ),

    literal: ($) =>
      choice(
        $.concatenated_string,
        $.string,
        $.script_argument_string,
        $.script_argument_number,
        $.number
      ),

    concatenated_string: ($) =>
      prec.right(seq($.string, repeat1($.string))),

    string: ($) =>
      seq(
        '"',
        repeat(
          choice(
            token.immediate(prec(1, "/*")),
            token.immediate(prec(1, /[^\\"\n]+/)),
            $.escape_sequence
          )
        ),
        '"'
      ),

    escape_sequence: (_) =>
      token(
        seq(
          "\\",
          choice(
            "a",
            "b",
            "f",
            "n",
            "r",
            "t",
            "v",
            '"',
            "\\",
            /[0-7]{1,3}/,
            /x[0-9A-Fa-f]{2,}/
          )
        )
      ),

    script_argument_string: (_) => token(seq(/[@][1-9][0-9]*/)),

    script_argument_number: (_) => token(seq(/[$][1-9][0-9]*/)),

    number: (_) => {
      const oct_literal = seq("0", repeat(/[0-7]/));
      const dec_literal = seq(/[1-9]/, repeat(/[0-9]/));
      const hex_literal = seq(
        choice("0X", "0x"),
        repeat1(/[0-9A-Fa-f]/)
      );
      return token(
        choice(oct_literal, dec_literal, hex_literal)
      );
    },

    identifier: (_) => /[$A-Z_a-z][$0-9A-Z_a-z]*/,

    shebang_line: (_) => /#!.*/,

    comment: ($) =>
      choice(
        seq(
          token(prec(1, "/*")),
          repeat(
            choice(
              token(prec(1, /[^*/]|[^*][/]/)),
              token(prec(1, /[*/]/))
            )
          ),
          token(prec(1, seq(repeat1("*"), "/")))
        ),
        token(seq(choice("#", "//"), /.*/))
      ),
  },
});

/**
 * Return a delimited sequence of zero or more instances of a rule.
 *
 * @function
 * @param {string} del
 * @param {Rule} rule
 * @returns {SeqRule}
 */
function seqdel(del, rule) {
  return seq(rule, repeat(seq(del, rule)));
}
