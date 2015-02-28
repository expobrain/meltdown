from __future__ import unicode_literals, print_function

import unittest

from reactpy.lexer import lexer


class LexerTests(unittest.TestCase):

    def setUp(self):
        self.lexer = lexer

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

    def test_integer_const_tokens(self):
        self.assertTokensEqual('1', ('INTEGER_CONST', 1))

    def test_id_tokens(self):
        self.assertTokensEqual('var myVariable', 'VAR', ('ID', 'myVariable'))
        self.assertTokensEqual('myVariable', ('ID', 'myVariable'))

    def test_keywords_tokens(self):
        self.assertTokensEqual('var myVariable', 'VAR', ('ID', 'myVariable'))
        self.assertTokensEqual('function', 'FUNCTION')
        self.assertTokensEqual('return', 'RETURN')

    def test_separators_tokens(self):
        self.assertTokensEqual(';', 'SEMI')
        self.assertTokensEqual(':', 'COLO')
        self.assertTokensEqual(',', 'COMMA')
        self.assertTokensEqual('.', 'DOT')
        self.assertTokensEqual('{', 'LBRACE')
        self.assertTokensEqual('}', 'RBRACE')
        self.assertTokensEqual('(', 'LPAREN')
        self.assertTokensEqual(')', 'RPAREN')
