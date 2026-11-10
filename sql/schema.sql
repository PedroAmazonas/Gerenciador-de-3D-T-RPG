
CREATE TABLE IF NOT EXISTS usuario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    papel TEXT NOT NULL DEFAULT 'JOGADOR' CHECK (papel IN ('JOGADOR','MESTRE','ADMIN'))
)



CREATE TABLE IF NOT EXISTS nivel_poder (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    pontos_iniciais INTEGER NOT NULL CHECK (pontos_iniciais > 0),
    max_atributo INTEGER NOT NULL CHECK (max_atributo > 0),
    limite_desvantagens INTEGER CHECK  (limite_desvantagens >= 0)
)



CREATE TABLE IF NOT EXISTS personagem (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    nivel_id INTEGER NOT NULL REFERENCES nivel_poder(id),
    nome TEXT NOT NULL,
    conceito TEXT,
    pontos_totais INTEGER DEFAULT 0,
    forca INTEGER NOT NULL DEFAULT 0 CHECK (forca >= 0),
    habilidade INTEGER NOT NULL DEFAULT 0 CHECK (habilidade >= 0),
    resistencia INTEGER NOT NULL DEFAULT 0 CHECK (resistencia >= 0),
    armadura INTEGER NOT NULL DEFAULT 0 CHECK (armadura >= 0),
    poder_fogo INTEGER NOT NULL DEFAULT 0 CHECK (poder_fogo >= 0),
    pv_atual INTEGER,
    pm_atual INTEGER,
    itens TEXT,
    criado_em TEXT NOT NULL DEFAULT (datetime('now'))
)



CREATE TABLE IF NOT EXISTS vantagem (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    tipo TEXT NOT NULL CHECK (tipo IN ('VANTAGEM','DESVANTAGEM')),
    custo INTEGER NOT NULL,
    descricao TEXT NOT NULL
    
)



CREATE TABLE IF NOT EXISTS pericia (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL UNIQUE,
    descricao TEXT,
    custo_inteira INTEGER NOT NULL DEFAULT 2 CHECK (custo_inteira >= 0)
)



CREATE TABLE IF NOT EXISTS personagem_vantagem (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    personagem_id INTEGER NOT NULL REFERENCES personagem(id) ON DELETE CASCADE,
    vantagem_id INTEGER NOT NULL REFERENCES vantagem(id) ON DELETE CASCADE,
    custo_pago INTEGER NOT NULL,
    observacao TEXT
)


CREATE TABLE IF NOT EXISTS personagem_pericia (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    personagem_id INTEGER NOT NULL REFERENCES personagem(id) ON DELETE CASCADE,
    pericia_id INTEGER NOT NULL REFERENCES pericia(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL DEFAULT 'INTEIRA' CHECK (tipo IN ('INTEIRA','ESPECIALIZACAO')),
    nome_especializacao TEXT,
    custo_pago INTEGER NOT NULL
)

