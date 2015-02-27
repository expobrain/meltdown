from __future__ import unicode_literals, print_function

import ply.lex as lex


reserved = {
    'var': 'VAR',
}


tokens = reserved.values() + [
    'ID',
    'INTEGER',
    'EQUALS',
]


t_ignore = r' \t'


t_EQUALS = r'='


def t_INTEGER(t):
    r'\d+'
    t.value = int(t.value)
    return t


def t_ID(t):
    r'[a-zA-Z]+'
    t.type = reserved.get(t.value, 'ID')
    return t


lexer = lex.lex()
