# tree-sitter-systemtap

[SystemTap] grammar for [tree-sitter] as interpreted by [Ryoko] from the SystemTap man pages, language reference, tapsets and test suite

## Objectives

- Enable accurate syntax highlighting in a manner consistent with the SystemTap language server
- Strike an intuitive balance between tree-sitter and SystemTap conventions

## Language feature checklist

- [x] Literals
- [x] Comments
- [x] Variable declarations
- [x] Expressions
- [x] Statements
- [x] Function definitions
- [x] Probe point definitions and aliases
- [ ] Preprocessor conditionals
- [x] Preprocessor macro definitions and expansions
- [x] Embedded C

## License

tree-sitter-systemtap is free and open source software licensed under the [MIT license][license].

## Acknowledgements

tree-sitter-systemtap takes after work done by [Max Brunsfeld] for [tree-sitter’s C grammar][tree-sitter-c].

[license]: ./LICENSE.txt
[Max Brunsfeld]: https://github.com/maxbrunsfeld
[Ryoko]: https://github.com/ok-ryoko
[SystemTap]: https://sourceware.org/systemtap/
[tree-sitter-c]: https://github.com/tree-sitter/tree-sitter-c
[tree-sitter]: https://github.com/tree-sitter/tree-sitter
