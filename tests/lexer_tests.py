from __future__ import unicode_literals, print_function

import unittest
import os

from reactpy.lexer import ReactLexer


class LexerTests(unittest.TestCase):

    TEST_CODE = os.path.join(os.path.dirname(__file__), 'sample.jsx')

    def setUp(self):
        self.lexer = ReactLexer().build()

    def assertTokensEqual(self, data, *args):
        self.lexer.input(data)

        for expected in args:
            token = next(self.lexer)

            if isinstance(expected, (list, tuple)):
                type_, value = expected

                self.assertEqual(token.type, type_)
                self.assertEqual(token.value, value)
            else:
                self.assertEqual(token.type, expected)

        with self.assertRaises(StopIteration):
            next(self.lexer)

    # -------------------------------------------------------------------------
    # Basic tokens
    # -------------------------------------------------------------------------

    def test_integer_const_tokens(self):
        self.assertTokensEqual('1', ('INTEGER_CONST', 1))

    def test_string_literals_tokens(self):
        self.assertTokensEqual('"my string"', 'STRING_LITERAL')

    def test_id_tokens(self):
        self.assertTokensEqual('var myVariable', 'VAR', ('ID', 'myVariable'))
        self.assertTokensEqual('myVariable', ('ID', 'myVariable'))

    def test_keywords_tokens(self):
        self.assertTokensEqual('var myVariable', 'VAR', ('ID', 'myVariable'))
        self.assertTokensEqual('function', 'FUNCTION')
        self.assertTokensEqual('return', 'RETURN')

    def test_operations_tokens(self):
        self.assertTokensEqual('<', 'LT')
        self.assertTokensEqual('>', 'GT')
        self.assertTokensEqual('/', 'DIV')
        self.assertTokensEqual('!', 'NEG')

    def test_delimiters_tokens(self):
        self.assertTokensEqual(';', 'SEMI')
        self.assertTokensEqual(':', 'COLO')
        self.assertTokensEqual(',', 'COMMA')
        self.assertTokensEqual('.', 'DOT')
        self.assertTokensEqual('{', 'LBRACE')
        self.assertTokensEqual('}', 'RBRACE')
        self.assertTokensEqual('(', 'LPAREN')
        self.assertTokensEqual(')', 'RPAREN')

    def test_newline_discard(self):
        self.assertTokensEqual('\n')
        self.assertTokensEqual('\n\r')

    # -------------------------------------------------------------------------
    # Composite tokens
    # -------------------------------------------------------------------------

    def test_assignment(self):
        self.assertTokensEqual(
            'a=1',
            ('ID', 'a'), 'EQUALS', ('INTEGER_CONST', 1)
        )
        self.assertTokensEqual(
            'a="My string"',
            ('ID', 'a'), 'EQUALS', ('STRING_LITERAL', u'"My string"')
        )

    def test_with_full_code(self):
        self.lexer.input(open(self.TEST_CODE).read())

        try:
            [t for t in self.lexer]
        except Exception as e:
            self.fail(e)
