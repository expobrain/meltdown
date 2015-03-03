from __future__ import unicode_literals, print_function

import pprint

import ply.lex as lex


class ReactLexer(object):

    # -------------------------------------------------------------------------
    # Lexer
    # -------------------------------------------------------------------------

    states = (
        ('html', 'exclusive'),
    )

    keywords = {
        'var': 'VAR',
        'function': 'FUNCTION',
        'return': 'RETURN',
    }

    tokens = keywords.values() + [
        # Identifiers
        'ID',

        # Assignment
        'EQUALS',

        # Delimiters
        'SEMI', 'COLO', 'COMMA', 'DOT', 'LPAREN', 'RPAREN', 'LBRACE', 'RBRACE',

        # Numeric consts
        'INTEGER_CONST',

        # String literals
        'STRING_LITERAL',

        # Operations
        'GT', 'LT', 'DIV', 'NEG',

        # States
        'begin_html', 'end_html', 'begin_tag', 'end_tag',

        # HTML
        'CLOSING_TAG', 'NAME', 'ATTRIBUTE', 'VALUE', 'TEXT_NODE', 'START_TAG',
        'END_TAG', 'SELF_CLOSING_TAG', 'SPACE'
    ]

    # Ignored characters
    t_ignore = ' \t\n\r\f\v'
    # t_ANY_ignore = ' \t\n\r\f\v'

    # Operations
    t_GT    = r'>'
    t_LT    = r'<'
    t_DIV   = r'/'
    t_NEG   = r"\!"

    # Assignment
    t_ANY_EQUALS = r'='

    # Delimiters
    t_SEMI      = r';'
    t_COLO      = r':'
    t_COMMA     = r','
    t_DOT       = r'\.'
    t_LPAREN    = r'\('
    t_RPAREN    = r'\)'
    t_LBRACE    = r'\{'
    t_RBRACE    = r'\}'

    # HTML content
    t_html_SPACE            = r'\s+'
    t_html_START_TAG        = r'\<'
    t_html_END_TAG          = r'\>'
    t_html_CLOSING_TAG      = r'(?<=\<)/'
    t_html_SELF_CLOSING_TAG = r'/(?=\>)'
    t_html_NAME             = r'(?<=[</\/])[a-zA-Z]+'
    t_html_VALUE            = r'(?<=\=)".*"(?=[ />])'

    def t_html_TEXT_NODE(self, t):
        r'(?<=\>)\s*.+\s*(?=\<)'
        t.value = t.value.strip()
        return t

    def t_html_ATTRIBUTE(self, t):
        r'(?<=[a-zA-Z])\s*[a-zA-Z][a-zA-Z\-]*(?=[\s\=\>])'
        t.value = t.value.strip()
        return t

    # Error handling rule
    def t_ANY_error(self, t):
        pprint.pprint(t.lexer.__dict__)

        start = max(t.lexpos - 10, 0)
        end = start + 20 + 1
        fragment = repr(t.lexer.lexdata[start:end])

        print(fragment)
        print('^'.center(len(fragment), '~'))

        raise ValueError("Illegal character {}".format(repr(t.value[0])))

    # States
    def t_begin_html(self, t):
        r'(?<=return\s)\('
        t.lexer.push_state('html')
        return t

    def t_html_end_html(self, t):
        r'\);'
        t.lexer.pop_state()
        return t

    # Numeric consts
    def t_INTEGER_CONST(self, t):
        r'\d+'
        t.value = int(t.value)
        return t

    # String consts
    def t_STRING_LITERAL(self, t):
        r'".*"'
        t.value = unicode(t.value)
        return t

    # Keywords & identifiers
    def t_ID(self, t):
        r'[a-zA-Z][\w0-9\-]*'
        t.type = self.keywords.get(t.value, 'ID')
        return t

    # -------------------------------------------------------------------------
    # Class methods
    # -------------------------------------------------------------------------

    def build(self, **kwds):
        self.lexer = lex.lex(object=self, **kwds)

        return self.lexer
