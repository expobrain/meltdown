from __future__ import unicode_literals, print_function

from ply.lex import TOKEN
import ply.lex as lex


identifier = r'[a-zA-Z][\w0-9\-]*'


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
    'STRING_LITERAL', 'HTML_TEXT_NODE',

    # Operations
    'GT', 'LT', 'DIV', 'NEG'
]


t_ignore = ' \t'


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
t_COMMA      = r','
t_DOT       = r'\.'
t_LPAREN    = r'\('
t_RPAREN    = r'\)'
t_LBRACE    = r'\{'
t_RBRACE    = r'\}'


# Error handling rule
def t_error(t):
    raise RuntimeError("Illegal character {}".format(repr(t.value[0])))
    t.lexer.skip(1)


# New lines
def t_NEWLINE(t):
    r'[\n\r]+'
    t.lexer.lineno += t.value.count("\n")


# Numeric consts
def t_INTEGER_CONST(t):
    r'\d+'
    t.value = int(t.value)
    return t


# String consts
def t_STRING_LITERAL(t):
    r'".*"'
    t.value = unicode(t.value)
    return t


# Keyworda & identifiers
@TOKEN(identifier)
def t_ID(t):
    t.type = keywords.get(t.value, 'ID')
    return t


lexer = lex.lex()
