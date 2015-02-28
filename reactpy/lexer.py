from __future__ import unicode_literals, print_function

import ply.lex as lex


t_ignore = r' \t'


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

    # Numeric const
    'INTEGER_CONST'
]

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

# Keywords
def t_INTEGER_CONST(t):
    r'\d+'
    t.value = int(t.value)
    return t

# Identifiers
def t_ID(t):
    r'[a-zA-Z]+'
    t.type = keywords.get(t.value, 'ID')
    return t


lexer = lex.lex()
