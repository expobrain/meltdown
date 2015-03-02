from __future__ import unicode_literals, print_function

import ply.lex as lex


class ReactLexer(object):

    # -------------------------------------------------------------------------
    # Lexer
    # -------------------------------------------------------------------------

    states = (
        # ('jsx', 'inclusive'),
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
        'begin_html', 'end_html',

        # HTML
        'HTML_ELEMENT',
    ]

    # Ignored characters
    t_ANY_ignore = ' \t\n\r'

    # Operations
    t_GT    = r'>'
    t_LT    = r'<'
    t_DIV   = r'/'
    t_NEG   = r"\!"

    # Assignment
    t_EQUALS    = r'='

    # Delimiters
    t_SEMI      = r';'
    t_COLO      = r':'
    t_COMMA     = r','
    t_DOT       = r'\.'
    t_LPAREN    = r'\('
    t_RPAREN    = r'\)'
    t_LBRACE    = r'\{'
    t_RBRACE    = r'\}'

    # Error handling rule
    def t_ANY_error(self, t):
        raise RuntimeError("Illegal character {}".format(repr(t.value[0])))
        t.lexer.skip(1)

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

    # HTML content
    def t_html_HTML_ELEMENT(self, t):
        r'\<[a-z]+\>'
        t.value = unicode(t.value)
        return t

    # -------------------------------------------------------------------------
    # Class methods
    # -------------------------------------------------------------------------

    def build(self, **kwds):
        self.lexer = lex.lex(object=self, **kwds)

        return self.lexer
