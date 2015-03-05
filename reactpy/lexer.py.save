from __future__ import unicode_literals, print_function

import functools

import ply.lex as lex


class ReactLexer(object):

    # =========================================================================
    # Configuration
    # =========================================================================

    def update_lineno(fn):

        @functools.wraps(fn)
        def _wrapper(self, t):
            t.lexer.lineno += t.value.count('\n')
            return fn(self, t)

        return _wrapper

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
    t_ignore = ' \t\r\f\v'

    # =========================================================================
    # Handlers
    # =========================================================================

    # Error handling rule
    def t_ANY_error(self, t):
        # Print data fragment
        start = max(t.lexpos - 10, 0)
        end = start + 20 + 1
        fragment = repr(t.lexer.lexdata[start:end])

        print(fragment)
        print('^'.center(len(fragment), '~'))

        # Find column
        last_cr = max(t.lexer.lexdata.rfind('\n', 0, t.lexpos), 0)
        column = (t.lexpos - last_cr) + 1

        # Raise exception
        raise ValueError(
            "Illegal character {} at line {} column {}"
            .format(repr(t.value[0]), t.lexer.lineno, column)
        )

    # States
    def t_begin_html(self, t):
        r'(?<=return\s)\('
        t.lexer.push_state('html')
        return t

    def t_html_end_html(self, t):
        r'\);'
        t.lexer.pop_state()
        return t

    # =========================================================================
    # Token definitions
    # =========================================================================

    # -------------------------------------------------------------------------
    # INITIAL state - React JSX
    # -------------------------------------------------------------------------

    # New line tracking
    @update_lineno
    def t_newline(self, t):
        r'\n+'

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
    # HTML state
    # -------------------------------------------------------------------------

    # HTML content
    t_html_SPACE            = r'\s+'
    t_html_START_TAG        = r'\<'
    t_html_END_TAG          = r'\>'
    t_html_CLOSING_TAG      = r'(?<=\<)/'
    t_html_SELF_CLOSING_TAG = r'/(?=\>)'
    t_html_NAME             = r'(?<=[</\/])[a-zA-Z]+'
    t_html_VALUE            = r'(?<=\=)".*"(?=[ />])'

    @update_lineno
    def t_html_TEXT_NODE(self, t):
        r'(?<=\>)\s*.+\s*(?=\<)'
        t.value = t.value.strip()
        return t

    @update_lineno
    def t_html_ATTRIBUTE(self, t):
        r'(?<=[a-zA-Z])\s*[a-zA-Z][a-zA-Z\-]*(?=[\s\=\>])'
        t.value = t.value.strip()
        return t

    # =========================================================================
    # Class methods
    # =========================================================================

    def build(self, **kwds):
        self.lexer = lex.lex(object=self, **kwds)

        return self.lexer
