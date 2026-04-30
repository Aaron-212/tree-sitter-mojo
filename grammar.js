/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  walrus: 8,
  ternary: 9,
  or: 10,
  and: 11,
  not: 12,
  compare: 13,
  bitwise_or: 14,
  bitwise_and: 15,
  xor: 16,
  shift: 17,
  plus: 18,
  times: 19,
  unary: 20,
  power: 21,
  call: 22,
};

const SEMICOLON = ";";

module.exports = grammar({
  name: "mojo",

  extras: ($) => [$.comment, /[\s\f\uFEFF\u2060\u200B]|\r?\n/],

  conflicts: ($) => [
    [$.dict_expression, $.set_expression],
    [$.comparison_expression, $._raw_tuple_expression],
    [$._parenthesized_expression, $._parenthesized_tuple_expression],
  ],

  word: ($) => $.regular_identifier,

  externals: ($) => [
    $._newline,
    $._indent,
    $._dedent,
    $.string_start,
    $._string_content,
    $.escape_interpolation,
    $.string_end,

    // Mark comments as external tokens so that the external scanner is always
    // invoked, even if no external token is expected. This allows for better
    // error recovery, because the external scanner can maintain the overall
    // structure by returning dedent tokens whenever a dedent occurs, even
    // if no dedent is expected.
    $.comment,

    // Allow the external scanner to check for the validity of closing brackets
    // so that it can avoid returning dedent tokens between brackets.
    "]",
    ")",
    "}",
    "except",
  ],

  rules: {
    source_file: ($) => repeat($._definition),

    _definition: ($) =>
      choice(
        $.function_definition
        // TODO: other kinds of definitions
      ),

    // DECORATORS
    decorator: ($) =>
      seq(
        "@",
        field("name", $.identifier),
        optional(field("argument_list", $.argument_list)),
        $._newline
      ),
    decorated_definition: ($) =>
      seq(
        repeat1($.decorator),
        field("definition", choice($.function_definition))
      ),

    // FUNCTIONS
    function_definition: ($) =>
      seq(
        "def",
        field("name", $.identifier),
        field("parameter_list", optional($.parameter_list)),
        field("argument_list", $.argument_list),
        optional($.raise_signature),
        optional($.return_signature),
        ":",
        field("body", $._suite)
      ),

    // Parameters are compile time known
    parameter_list: ($) => seq("[", optional($._parameters), "]"),
    _parameters: ($) => seq(commaSep1($.parameter), optional(",")),
    parameter: ($) =>
      choice(
        seq(
          optional("*"), // Variadic
          field("parameter_name", $.identifier),
          ":",
          field("type_restrictions", $.type_restrictions),
          optional(seq("where", field("type_constraint", $.type_constraint)))
        ),
        "//" // Inferred
      ),
    type_restrictions: ($) => seq($._type, repeat(seq("&", $._type))),

    // Arguments are evaluated at runtime
    argument_list: ($) => seq("(", optional($._arguments), ")"),
    _arguments: ($) => seq(commaSep1($.argument), optional(",")),
    argument: ($) =>
      choice(
        seq(
          optional(choice("mut", "var", "out", "deinit", "ref")),
          optional("*"), // Variadic
          field("argument_name", $.identifier),
          optional(seq(":", field("type_name", $._type))),
          optional(
            seq("=", field("default_value", choice($.literal, $.identifier)))
          )
        ),
        "/", // Positional
        "*" // Keyword
      ),

    raise_signature: ($) =>
      seq("raises", optional(field("exception_type", $._type))),

    return_signature: ($) =>
      seq(
        "->",
        field("return_type", $._type),
        optional(seq("where", field("type_constraint", $.type_constraint)))
      ),

    type_constraint: ($) => choice(), // TODO: where constraints

    // STATEMENTS
    _suite: ($) =>
      choice(
        alias($._statements, $.block),
        seq($._indent, $.block),
        alias($._newline, $.block)
      ),
    block: ($) => seq(repeat($._statement), $._dedent),
    _statements: ($) =>
      seq(sep1($._statement, SEMICOLON), optional(SEMICOLON), $._newline),
    _statement: ($) =>
      choice(
        $.assignment_statement,
        $.import_statement,
        $.return_statement,
        $.expression_statement,
        "pass"
      ),

    import_statement: ($) => choice($._simple_import, $._from_import),
    _simple_import: ($) =>
      seq(
        "import",
        field("module", $.identifier),
        optional(seq("as", field("alias", $.identifier)))
      ),
    _from_import: ($) =>
      seq(
        "from",
        field("module", $.identifier),
        "import",
        choice(
          commaSep1(field("name", $.identifier)),
          seq(field("name", $.identifier), "as", field("alias", $.identifier)),
          "*"
        )
      ),

    expression_statement: ($) => prec(1, field("expression", $.expression)),

    assignment_statement: ($) =>
      choice($.regular_assignment, $.tuple_assignment, $.augmented_assignment),
    regular_assignment: ($) =>
      prec.right(
        1,
        seq(
          optional(choice("var", "comptime")),
          field("name", $.identifier),
          choice($._initializer, seq(":", $._type, optional($._initializer)))
        )
      ),
    tuple_assignment: ($) =>
      prec.right(
        1,
        seq($.identifier, repeat1(seq(", ", $.identifier)), $._initializer)
      ),
    augmented_assignment: ($) =>
      seq(
        field("name", $.identifier),
        $.augmented_assignment_operator,
        field("value", $.expression)
      ),
    _initializer: ($) => seq("=", field("value", $.expression)),

    return_statement: ($) => seq("return", field("value", $.expression)),

    // EXPRESSIONS
    expression: ($) =>
      choice(
        $._parenthesized_expression,
        $.binary_expression,
        $.comparison_expression,
        $.prefix_expression,
        $.postfix_expression,
        $.attribute_expression,
        $.list_expression,
        $.set_expression,
        $.dict_expression,
        $.tuple_expression,
        $.call_expression,
        $.subscript_expression,
        $.ternary_expression,
        $.walrus_expression,
        $.comptime_expression,
        $.identifier,
        $.literal
      ),
    assignable_expression: ($) =>
      choice(
        $.identifier,
        $._parenthesized_expression,
        $.tuple_expression,
        $.subscript_expression
      ),

    _parenthesized_expression: ($) =>
      seq("(", field("value", $.expression), ")"),

    binary_expression: ($) => {
      const table = [
        [prec.left, "+", PREC.plus],
        [prec.left, "-", PREC.plus],
        [prec.left, "*", PREC.times],
        [prec.left, "@", PREC.times],
        [prec.left, "/", PREC.times],
        [prec.left, "%", PREC.times],
        [prec.left, "//", PREC.times],
        [prec.right, "**", PREC.power],
        [prec.left, "|", PREC.bitwise_or],
        [prec.left, "&", PREC.bitwise_and],
        [prec.left, "^", PREC.xor],
        [prec.left, "<<", PREC.shift],
        [prec.left, ">>", PREC.shift],
      ];

      // @ts-ignore
      return choice(
        ...table.map(([fn, operator, precedence]) =>
          fn(
            precedence,
            seq(
              field("lhs", $.expression),
              // @ts-ignore
              field("operator", operator),
              field("rhs", $.expression)
            )
          )
        )
      );
    },

    _not_in: (_) => seq("not", "in"),
    _is_not: (_) => seq("is", "not"),

    comparison_expression: ($) =>
      prec.left(
        PREC.compare,
        seq(
          $.expression,
          repeat1(
            seq(
              field(
                "operators",
                choice(
                  "<",
                  "<=",
                  "==",
                  "!=",
                  ">=",
                  ">",
                  "<>",
                  "in",
                  alias($._not_in, "not in"),
                  "is",
                  alias($._is_not, "is not")
                )
              ),
              $.expression
            )
          )
        )
      ),
    prefix_expression: ($) =>
      prec(
        PREC.unary,
        seq(
          field("operator", choice("+", "-", "~")),
          field("argument", $.expression)
        )
      ),
    postfix_expression: ($) =>
      prec(
        PREC.unary,
        seq(field("value", $.identifier), field("operator", "^"))
      ),

    attribute_expression: ($) =>
      prec(
        PREC.call,
        seq(field("value", $.expression), ".", field("attribute", $.identifier))
      ),

    _collection_elements: ($) => seq(commaSep1($.expression), optional(",")),
    tuple_expression: ($) =>
      choice($._parenthesized_tuple_expression, $._raw_tuple_expression),
    _parenthesized_tuple_expression: ($) =>
      seq(
        "(",
        optional(
          seq($.expression, choice(",", commaSep1($.expression), optional(",")))
        ),
        ")"
      ),
    _raw_tuple_expression: ($) =>
      prec.left(seq($.expression, ",", commaSep1($.expression))),
    list_expression: ($) =>
      seq("[", field("value", optional($._collection_elements)), "]"),
    set_expression: ($) =>
      seq("{", field("value", optional($._collection_elements)), "}"),

    _dict_entry: ($) => seq($.expression, ":", $.expression),
    _dict: ($) => seq(commaSep1($._dict_entry), optional(",")),
    dict_expression: ($) => seq("{", field("value", optional($._dict)), "}"),

    call_expression: ($) =>
      prec(
        PREC.call,
        seq(
          field("expression", $.identifier),
          "(",
          field("value", $.literal),
          ")"
        )
      ),

    slice_expression: ($) =>
      seq(
        field("start", optional($.expression)),
        ":",
        field("stop", optional($.expression)),
        optional(seq(":", field("step", $.expression)))
      ),
    subscript_expression: ($) =>
      prec.left(
        PREC.call,
        seq(
          field("expression", $.expression),
          "[",
          field("index", choice($.slice_expression, $._collection_elements)),
          "]"
        )
      ),

    ternary_expression: ($) =>
      prec.left(
        PREC.ternary,
        seq(
          field("true_branch", $.expression),
          "if",
          field("condition", $.expression),
          "else",
          field("false_branch", $.expression)
        )
      ),

    walrus_expression: ($) =>
      prec.left(
        PREC.walrus,
        seq(field("lhs", $.identifier), ":=", field("rhs", $.expression))
      ),

    comptime_expression: ($) =>
      prec(PREC.call, seq("comptime", "(", $.expression, ")")),

    // TYPES
    _type: ($) => choice($.generic_type, $.identifier, $.integer_literal),
    generic_type: ($) =>
      prec(
        1,
        seq(field("name", $.identifier), "[", field("arguments", $._type), "]")
      ),

    // OPERATORS
    augmented_assignment_operator: (_) =>
      choice(
        "+=",
        "-=",
        "*=",
        "/=",
        "//=",
        "%=",
        "**=",
        "@=",
        "&=",
        "|=",
        "^=",
        ">>=",
        "<<="
      ),

    // LITERALS

    literal: ($) =>
      choice(
        $.string_literal,
        $.float_literal,
        $.integer_literal,
        $.boolean_literal,
        $.none_literal,
        $.self_literal,
        $.discard_literal,
        $.ellipsis_literal
      ),

    string_literal: ($) =>
      seq(
        $.string_start,
        repeat(
          choice(
            $._string_content,
            $.escape_sequence,
            $.escape_interpolation,
            $._string_interpolation
          )
        ),
        $.string_end
      ),
    _string_interpolation: ($) =>
      seq("{", field("expression", $.expression), "}"),
    escape_sequence: (_) => token.immediate(seq("\\", /./)),

    float_literal: (_) =>
      token(
        choice(
          seq(
            /[0-9][0-9_]*/,
            ".",
            optional(/[0-9][0-9_]*/),
            optional(seq(/[eE][+-]?/, /[0-9][0-9_]*/))
          ),
          seq(".", /[0-9][0-9_]*/, optional(seq(/[eE][+-]?/, /[0-9][0-9_]*/))),
          seq(/[0-9][0-9_]*/, /[eE][+-]?/, /[0-9][0-9_]*/)
        )
      ),

    integer_literal: ($) =>
      choice(
        choice($._decinteger, $._bininteger, $._octinteger, $._hexinteger)
      ),
    _decinteger: (_) => choice(/[1-9][_\d]*/, /0+[_0]*/),
    _bininteger: (_) => /0[bB][_01]*/,
    _octinteger: (_) => /0[oO][_0-7]*/,
    _hexinteger: (_) => /0[xX][_0-9a-fA-F]*/,

    boolean_literal: (_) => choice("True", "False"),
    none_literal: (_) => "None",
    self_literal: (_) => "Self",
    discard_literal: (_) => "_",
    ellipsis_literal: (_) => "...",

    // IDENTIFIERS

    regular_identifier: (_) => /[a-zA-Z_][a-zA-Z0-9_]*/,
    escaped_identifier: (_) => /`[^`\n]+`/,
    identifier: ($) => choice($.regular_identifier, $.escaped_identifier),

    comment: (_) => token(seq("#", /.*/)),
  },
});

/**
 * Creates a rule to match one or more of the rules separated by a comma
 *
 * @param {RuleOrLiteral} rule
 *
 * @returns {SeqRule}
 */
function commaSep1(rule) {
  return sep1(rule, ",");
}

/**
 * Creates a rule to match one or more occurrences of `rule` separated by `sep`
 *
 * @param {RuleOrLiteral} rule
 *
 * @param {RuleOrLiteral} separator
 *
 * @returns {SeqRule}
 */
function sep1(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}
