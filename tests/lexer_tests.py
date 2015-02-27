from __future__ import unicode_literals, print_function

import unittest

from reactpy.lexer import lexer


class LexerTests(unittest.TestCase):

    def setUp(self):
        self.lexer = lexer

    def assertTokensEqual(self, data, *expected):
        print('========')
        print(data)
        print('--------')
        self.lexer.input(data)

        for type_, value in expected:
            token = next(self.lexer)
            print(token)

            self.assertEqual(token.type, type_)
            self.assertEqual(token.value, value)

        with self.assertRaises(StopIteration):
            print('Token left in the lexer:', next(self.lexer))

        print('========')

    def test_id_tokens(self):
        """
        var <identifier>;
        """
        self.assertTokensEqual(
            'var myVariable',
            ('VAR', 'var'), ('ID', 'myVariable')
        )
        self.assertTokensEqual(
            'var myVariable = 1',
            ('VAR', 'var'), ('ID', 'myVariable'),
            ('EQUALS', '='),
            ('INTEGER', 1)
        )
