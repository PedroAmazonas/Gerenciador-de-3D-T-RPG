# -*- coding: utf-8 -*-
import sqlite3
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)
DB_NAME = 'dtalpha.db'

def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    


    conn.commit()
    conn.close()

init_db()
@app.route('/')
def index():
    return render_template('index.html')

@app.get('/api/niveis')
def listar_niveis():
    conn = get_db()
    rows = [dict(r) for r in conn.execute('SELECT * FROM nivel_poder').fetchall()]
    conn.close()
    return jsonify(rows)

@app.get('/api/usuarios')
def listar_usuarios():
    conn = get_db()
    rows = [dict(r) for r in conn.execute('SELECT id, nome, email, papel FROM usuario ORDER BY nome').fetchall()]
    conn.close()
    return jsonify(rows)

@app.post('/api/usuarios')
def criar_usuario():
    d = request.get_json()
    conn = get_db()
    try:
        conn.execute('INSERT INTO usuario (nome, email, senha_hash, papel) VALUES (?, ?, ?, ?)',
                     (d.get('nome'), d.get('email'), d.get('senha', '123456'), d.get('papel', 'JOGADOR')))
        conn.commit()
        return jsonify({'mensagem': 'Utilizador criado com sucesso!'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'erro': 'Já existe um utilizador registado com este e-mail.'}), 400
    except Exception as e:
        return jsonify({'erro': str(e)}), 400
    finally:
        conn.close()

@app.get('/api/vantagens')
def listar_vantagens():
    conn = get_db()
    rows = [dict(r) for r in conn.execute('SELECT * FROM vantagem ORDER BY nome').fetchall()]
    conn.close()
    return jsonify(rows)

@app.post('/api/vantagens')
def criar_vantagem():
    d = request.get_json()
    conn = get_db()
    try:
        conn.execute('INSERT INTO vantagem (nome, tipo, custo, descricao) VALUES (?, ?, ?, ?)',
                     (d.get('nome'), d.get('tipo'), d.get('custo'), d.get('descricao')))
        conn.commit()
        return jsonify({'mensagem': 'Vantagem criada!'}), 201
    except Exception as e:
        return jsonify({'erro': str(e)}), 400
    finally:
        conn.close()

@app.get('/api/pericias')
def listar_pericias():
    conn = get_db()
    rows = [dict(r) for r in conn.execute('SELECT * FROM pericia ORDER BY nome').fetchall()]
    conn.close()
    return jsonify(rows)

@app.post('/api/pericias')
def criar_pericia():
    d = request.get_json()
    conn = get_db()
    try:
        conn.execute('INSERT INTO pericia (nome, descricao, custo_inteira) VALUES (?, ?, ?)',
                     (d.get('nome'), d.get('descricao'), d.get('custo_inteira', 2)))
        conn.commit()
        return jsonify({'mensagem': 'Perícia criada!'}), 201
    except Exception as e:
        return jsonify({'erro': str(e)}), 400
    finally:
        conn.close()

@app.get('/api/personagens')
def listar_personagens():
    conn = get_db()
    query = '''
        SELECT p.*, u.nome as usuario_nome, n.nome as nivel_nome, n.pontos_iniciais 
        FROM personagem p 
        JOIN usuario u ON p.usuario_id = u.id 
        JOIN nivel_poder n ON p.nivel_id = n.id 
        ORDER BY p.id DESC
    '''
    rows = [dict(r) for r in conn.execute(query).fetchall()]
    conn.close()
    return jsonify(rows)

@app.post('/api/personagens')
def criar_personagem():
    d = request.get_json()
    conn = get_db()
    try:
        nivel = conn.execute('SELECT * FROM nivel_poder WHERE id = ?', (d.get('nivel_id'),)).fetchone()
        if not nivel:
            return jsonify({'erro': 'Nível de poder inválido.'}), 400

        f = int(d.get('forca', 0))
        h = int(d.get('habilidade', 0))
        r = int(d.get('resistencia', 0))
        a = int(d.get('armadura', 0))
        pdf = int(d.get('poder_fogo', 0))
        
        max_attr = nivel['max_atributo']
        if any(attr > max_attr for attr in [f, h, r, a, pdf]):
            return jsonify({'erro': f'Um atributo excede o limite do nível ({max_attr}).'}), 400

        attr_cost = f + h + r + a + pdf

        vantagens_input = d.get('vantagens', [])
        v_cost = 0
        d_credit = 0

        for item in vantagens_input:
            v_db = conn.execute('SELECT * FROM vantagem WHERE id = ?', (item['vantagem_id'],)).fetchone()
            if v_db:
                custo = int(item['custo_pago'])
                if v_db['tipo'] == 'VANTAGEM':
                    v_cost += custo
                else:
                    d_credit += abs(custo)

        if nivel['limite_desvantagens'] is not None and d_credit > nivel['limite_desvantagens']:
            return jsonify({'erro': f'Limite de desvantagens excedido ({nivel["limite_desvantagens"]} pts máx).'}), 400

        pericias_input = d.get('pericias', [])
        p_cost = 0
        for per in pericias_input:
            p_cost += int(per.get('custo_pago', 2))

        total_gasto = attr_cost + v_cost + p_cost - d_credit
        total_disponivel = nivel['pontos_iniciais']

        if total_gasto > total_disponivel:
            return jsonify({'erro': f'Distribuição excedida! Gastou {total_gasto} de {total_disponivel} pts.'}), 400

        pv_pm = r * 5

        cursor = conn.execute('''
            INSERT INTO personagem (usuario_id, nivel_id, nome, conceito, pontos_totais, forca, habilidade, resistencia, armadura, poder_fogo, pv_atual, pm_atual, itens)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            d.get('usuario_id'), d.get('nivel_id'), d.get('nome'), d.get('conceito'), total_disponivel,
            f, h, r, a, pdf, pv_pm, pv_pm, d.get('itens', '')
        ))
        personagem_id = cursor.lastrowid

        for item in vantagens_input:
            conn.execute('''
                INSERT INTO personagem_vantagem (personagem_id, vantagem_id, custo_pago, observacao)
                VALUES (?, ?, ?, ?)
            ''', (personagem_id, item['vantagem_id'], item['custo_pago'], item.get('observacao', '')))

        for per in pericias_input:
            conn.execute('''
                INSERT INTO personagem_pericia (personagem_id, pericia_id, tipo, nome_especializacao, custo_pago, observacao)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (personagem_id, per['pericia_id'], per.get('tipo', 'INTEIRA'), per.get('nome_especializacao'), per.get('custo_pago', 2), per.get('observacao', '')))

        conn.commit()
        return jsonify({'id': personagem_id, 'mensagem': 'Personagem criado com sucesso!'}), 201

    except Exception as e:
        conn.rollback()
        return jsonify({'erro': str(e)}), 400
    finally:
        conn.close()

@app.get('/api/personagens/<int:id>/ficha')
def ficha_personagem(id):
    conn = get_db()
    p = conn.execute('''
        SELECT p.*, u.nome as usuario_nome, n.nome as nivel_nome, n.pontos_iniciais 
        FROM personagem p 
        JOIN usuario u ON p.usuario_id = u.id 
        JOIN nivel_poder n ON p.nivel_id = n.id 
        WHERE p.id = ?
    ''', (id,)).fetchone()
    
    if not p:
        conn.close()
        return jsonify({'erro': 'Personagem não encontrado'}), 404

    vantagens = [dict(r) for r in conn.execute('''
        SELECT pv.*, v.nome, v.tipo, v.descricao 
        FROM personagem_vantagem pv 
        JOIN vantagem v ON pv.vantagem_id = v.id 
        WHERE pv.personagem_id = ?
    ''', (id,)).fetchall()]

    pericias = [dict(r) for r in conn.execute('''
        SELECT pp.*, per.nome as pericia_nome 
        FROM personagem_pericia pp 
        JOIN pericia per ON pp.pericia_id = per.id 
        WHERE pp.personagem_id = ?
    ''', (id,)).fetchall()]

    conn.close()
    
    ficha = dict(p)
    ficha['vantagens'] = vantagens
    ficha['pericias'] = pericias
    return jsonify(ficha)

@app.put('/api/personagens/<int:id>/status')
def atualizar_status(id):
    d = request.get_json()
    conn = get_db()
    try:
        conn.execute('''
            UPDATE personagem SET 
                pv_atual = ?, 
                pm_atual = ?, 
                pontos_totais = ?, 
                itens = ?, 
                conceito = ? 
            WHERE id = ?
        ''', (
            d.get('pv_atual'), 
            d.get('pm_atual'), 
            d.get('pontos_totais'), 
            d.get('itens', ''), 
            d.get('conceito', ''), 
            id
        ))
        conn.commit()
        return jsonify({'mensagem': 'Ficha atualizada com sucesso!'})
    except Exception as e:
        return jsonify({'erro': str(e)}), 400
    finally:
        conn.close()

@app.put('/api/personagens/<int:id>/evoluir')
def evoluir_personagem(id):
    d = request.get_json()
    conn = get_db()
    try:
        f = int(d.get('forca', 0))
        h = int(d.get('habilidade', 0))
        r = int(d.get('resistencia', 0))
        a = int(d.get('armadura', 0))
        pdf = int(d.get('poder_fogo', 0))
        pontos_totais = int(d.get('pontos_totais', 0))

        conn.execute('''
            UPDATE personagem SET 
                forca = ?, 
                habilidade = ?, 
                resistencia = ?, 
                armadura = ?, 
                poder_fogo = ?,
                pontos_totais = ?
            WHERE id = ?
        ''', (f, h, r, a, pdf, pontos_totais, id))

        conn.execute('DELETE FROM personagem_vantagem WHERE personagem_id = ?', (id,))
        for item in d.get('vantagens', []):
            conn.execute('''
                INSERT INTO personagem_vantagem (personagem_id, vantagem_id, custo_pago, observacao)
                VALUES (?, ?, ?, ?)
            ''', (id, item['vantagem_id'], item['custo_pago'], item.get('observacao', '')))

        conn.execute('DELETE FROM personagem_pericia WHERE personagem_id = ?', (id,))
        for per in d.get('pericias', []):
            conn.execute('''
                INSERT INTO personagem_pericia (personagem_id, pericia_id, tipo, custo_pago, observacao)
                VALUES (?, ?, 'INTEIRA', ?, ?)
            ''', (id, per['pericia_id'], per.get('custo_pago', 2), per.get('observacao', '')))

        conn.commit()
        return jsonify({'mensagem': 'Personagem evoluído com sucesso!'})
    except Exception as e:
        conn.rollback()
        return jsonify({'erro': str(e)}), 400
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(debug=True)