# tree-sitter-mojo

[![Test Tree-sitter Grammar](https://github.com/Aaron-212/tree-sitter-mojo/actions/workflows/test.yml/badge.svg)](https://github.com/Aaron-212/tree-sitter-mojo/actions/workflows/test.yml)

Mojo grammar for [tree-sitter](https://tree-sitter.github.io/).

The current implementation is based on the 1.0.0b1 version of [Mojo language reference](https://mojolang.org/docs/reference/), and may not cover all features of the language. Contributions are welcome!

## Todo

- Closure declaration in nested function definitions (new in nightly)
- Figure out the order of function effects (like `register_passable`) and `raises` clause in function definitions
- Figure out if there's more function effects
- `where` clause in trait of a struct definitions (new in nightly)
- MLIR special attributes. They are currently considered as escaped identifiers becuasse they are wrapped by ``` `` ```.

## References

- tree-sitter-python: <https://github.com/tree-sitter/tree-sitter-python>
- Mojo language reference: <https://mojolang.org/docs/reference/>
