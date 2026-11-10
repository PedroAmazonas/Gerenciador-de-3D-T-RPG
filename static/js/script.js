let catalogoVantagens = [];
let catalogoPericias = [];
let catalogoNiveis = [];
let idPersonagemAtivo = null;

function mudarTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('nav button').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    document.getElementById('btn-' + tab).classList.add('active');
    
    if (tab === 'hud') carregarListaHud();
    else if (tab === 'criar') prepararCriacaoPersonagem();
    else if (tab === 'compendio') carregarCompendioCompleto();
}

async function prepararCriacaoPersonagem() {
    const resU = await fetch('/api/usuarios');
    document.getElementById('p-usuario').innerHTML = (await resU.json()).map(u => `<option value="${u.id}">${u.nome} (${u.papel})</option>`).join('');
    
    const resN = await fetch('/api/niveis');
    catalogoNiveis = await resN.json();
    document.getElementById('p-nivel').innerHTML = catalogoNiveis.map(n => `<option value="${n.id}">${n.nome} (${n.pontos_iniciais} pts)</option>`).join('');
    
    const resV = await fetch('/api/vantagens');
    catalogoVantagens = await resV.json();
    const resP = await fetch('/api/pericias');
    catalogoPericias = await resP.json();

    renderizarOpcoesCriacao();
    calcularPontosCriacao();
}

function sortArray(lista, criterio, propNome = 'nome', propCusto = 'custo') {
    return lista.slice().sort((a, b) => {
        if (criterio === 'nome_asc') return a[propNome].localeCompare(b[propNome]);
        if (criterio === 'nome_desc') return b[propNome].localeCompare(a[propNome]);
        if (criterio === 'custo_desc') return b[propCusto] - a[propCusto];
        if (criterio === 'custo_asc') return a[propCusto] - b[propCusto];
        return 0;
    });
}

function ordenarVantagensCriacao(criterio) {
    catalogoVantagens = sortArray(catalogoVantagens, criterio, 'nome', 'custo');
    renderizarOpcoesCriacao();
}

function ordenarPericiasCriacao(criterio) {
    catalogoPericias = sortArray(catalogoPericias, criterio, 'nome', 'custo_inteira');
    renderizarOpcoesCriacao();
}

function renderizarOpcoesCriacao() {
    const marcadosV = {}, obsV = {};
    document.querySelectorAll('.chk-vantagem').forEach(chk => {
        if (chk.checked) {
            marcadosV[chk.value] = true;
            obsV[chk.value] = document.querySelector(`.obs-vantagem-${chk.value}`)?.value || '';
        }
    });

    const marcadosP = {}, obsP = {};
    document.querySelectorAll('.chk-pericia').forEach(chk => {
        if (chk.checked) {
            marcadosP[chk.value] = true;
            obsP[chk.value] = document.querySelector(`.obs-pericia-${chk.value}`)?.value || '';
        }
    });

    document.getElementById('criacao-vantagens-container').innerHTML = catalogoVantagens.map(v => `
        <div class="option-item">
            <label class="option-main-row">
                <input type="checkbox" class="chk-vantagem" value="${v.id}" data-tipo="${v.tipo}" data-custo="${v.custo}" ${marcadosV[v.id] ? 'checked' : ''} onchange="toggleObsInput(this); calcularPontosCriacao()">
                <div class="option-content">
                    <div class="option-header">
                        <span class="option-title">${v.nome}</span>
                        <span class="badge ${v.tipo==='VANTAGEM'?'badge-v':'badge-d'}">${v.custo} pts</span>
                    </div>
                    <p class="option-desc">${v.descricao}</p>
                </div>
            </label>
            <input type="text" class="option-input-obs obs-vantagem-${v.id}" value="${obsV[v.id] || ''}" placeholder="Detalhe / Descrição personalizada (opcional)..." style="display:${marcadosV[v.id] ? 'block' : 'none'};">
        </div>
    `).join('');

    document.getElementById('criacao-pericias-container').innerHTML = catalogoPericias.map(p => `
        <div class="option-item">
            <label class="option-main-row">
                <input type="checkbox" class="chk-pericia" value="${p.id}" data-custo="${p.custo_inteira}" ${marcadosP[p.id] ? 'checked' : ''} onchange="toggleObsInput(this); calcularPontosCriacao()">
                <div class="option-content">
                    <div class="option-header">
                        <span class="option-title">${p.nome}</span>
                        <span class="badge" style="background:var(--3dt-blue-main)">${p.custo_inteira} pts</span>
                    </div>
                    <p class="option-desc">${p.descricao || 'Sem descrição'}</p>
                </div>
            </label>
            <input type="text" class="option-input-obs obs-pericia-${p.id}" value="${obsP[p.id] || ''}" placeholder="Detalhe / Especialização (opcional)..." style="display:${marcadosP[p.id] ? 'block' : 'none'};">
        </div>
    `).join('');
}

function toggleObsInput(chk) {
    const container = chk.closest('.option-item');
    const inputObs = container.querySelector('.option-input-obs');
    if (inputObs) {
        inputObs.style.display = chk.checked ? 'block' : 'none';
    }
}

function calcularPontosCriacao() {
    const nivelId = parseInt(document.getElementById('p-nivel').value);
    const nivel = catalogoNiveis.find(n => n.id === nivelId);
    if(!nivel) return;

    document.getElementById('lbl-nivel-nome').innerText = nivel.nome;
    document.getElementById('lbl-pontos-iniciais').innerText = nivel.pontos_iniciais;
    document.getElementById('lbl-limite-desv').innerText = nivel.limite_desvantagens !== null ? nivel.limite_desvantagens + ' pts' : 'Sem limite';

    const f = parseInt(document.getElementById('p-forca').value) || 0;
    const h = parseInt(document.getElementById('p-habilidade').value) || 0;
    const r = parseInt(document.getElementById('p-resistencia').value) || 0;
    const a = parseInt(document.getElementById('p-armadura').value) || 0;
    const pdf = parseInt(document.getElementById('p-podertipo').value) || 0;

    const attrCost = f + h + r + a + pdf;

    let vCost = 0, dCredit = 0;
    document.querySelectorAll('.chk-vantagem:checked').forEach(chk => {
        const tipo = chk.getAttribute('data-tipo');
        const custo = parseInt(chk.getAttribute('data-custo'));
        if(tipo === 'VANTAGEM') vCost += custo;
        else dCredit += Math.abs(custo);
    });

    if(nivel.limite_desvantagens !== null && dCredit > nivel.limite_desvantagens) {
        dCredit = nivel.limite_desvantagens;
    }

    let pCost = 0;
    document.querySelectorAll('.chk-pericia:checked').forEach(chk => {
        pCost += parseInt(chk.getAttribute('data-custo'));
    });

    const totalGasto = attrCost + vCost + pCost - dCredit;
    const statusLbl = document.getElementById('lbl-status-pontos');
    const submitBtn = document.getElementById('btn-submit-heroi');

    statusLbl.innerText = `${totalGasto} / ${nivel.pontos_iniciais} pts`;

    if(totalGasto > nivel.pontos_iniciais) {
        statusLbl.style.color = '#e74c3c';
        statusLbl.innerText += ' (Excede o limite!)';
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
    } else {
        statusLbl.style.color = '#2ecc71';
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
    }
}

document.getElementById('form-personagem').addEventListener('submit', async (e) => {
    e.preventDefault();
    const vantagens = [];
    document.querySelectorAll('.chk-vantagem:checked').forEach(chk => {
        const id = parseInt(chk.value);
        const obs = document.querySelector(`.obs-vantagem-${id}`).value;
        vantagens.push({ vantagem_id: id, custo_pago: parseInt(chk.getAttribute('data-custo')), observacao: obs });
    });

    const pericias = [];
    document.querySelectorAll('.chk-pericia:checked').forEach(chk => {
        const id = parseInt(chk.value);
        const obs = document.querySelector(`.obs-pericia-${id}`).value;
        pericias.push({ pericia_id: id, tipo: 'INTEIRA', custo_pago: parseInt(chk.getAttribute('data-custo')), observacao: obs });
    });

    const dados = {
        nome: document.getElementById('p-nome').value,
        conceito: document.getElementById('p-conceito').value,
        usuario_id: document.getElementById('p-usuario').value,
        nivel_id: document.getElementById('p-nivel').value,
        forca: document.getElementById('p-forca').value,
        habilidade: document.getElementById('p-habilidade').value,
        resistencia: document.getElementById('p-resistencia').value,
        armadura: document.getElementById('p-armadura').value,
        poder_fogo: document.getElementById('p-podertipo').value,
        vantagens: vantagens,
        pericias: pericias
    };

    const res = await fetch('/api/personagens', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(dados) });
    const respJson = await res.json();
    if(res.ok) { 
        document.getElementById('form-personagem').reset(); 
        mudarTab('hud');
    } else {
        alert('Erro: ' + respJson.erro);
    }
});

async function carregarListaHud() {
    const res = await fetch('/api/personagens');
    const pers = await res.json();
    const div = document.getElementById('hud-lista-personagens');
    
    if(pers.length === 0) { 
        div.innerHTML = '<p style="color:var(--text-muted)">Nenhum personagem registado.</p>'; 
        return; 
    }

    div.innerHTML = pers.map(p => `
        <div class="char-select-item ${idPersonagemAtivo === p.id ? 'selected' : ''}" onclick="carregarHudPersonagem(${p.id})">
            <strong>${p.nome}</strong><br><small>${p.nivel_nome} | ${p.usuario_nome}</small>
        </div>
    `).join('');

    if(idPersonagemAtivo) carregarHudPersonagem(idPersonagemAtivo);
}

async function carregarHudPersonagem(id) {
    idPersonagemAtivo = id;
    document.querySelectorAll('.char-select-item').forEach(el => el.classList.remove('selected'));
    
    const res = await fetch(`/api/personagens/${id}/ficha`);
    const p = await res.json();
    let maxPvPm = p.resistencia * 5;

    const listaVantagens = p.vantagens.filter(v => v.tipo === 'VANTAGEM');
    const listaDesvantagens = p.vantagens.filter(v => v.tipo === 'DESVANTAGEM');

    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <div class="sheet-header-banner" style="margin:0; flex:1;">FICHA DE PERSONAGEM</div>
            <button class="btn btn-sm btn-cyan" style="margin-left:15px;" onclick="abrirPainelEvolucao(${p.id})">⚙️ Evoluir Personagem</button>
        </div>
        
        <div id="painel-exibicao-ficha">
            <div style="display: flex; gap: 15px; margin-bottom: 20px; align-items: center;">
                <div style="flex: 2; background: #f1f2f6; padding: 8px 12px; border-radius: 6px; border: 1px solid #dcdde1;">
                    <span style="font-size: 11px; font-weight: 900; color: var(--3dt-blue-main); text-transform: uppercase;">Nome:</span>
                    <div style="font-size: 18px; font-weight: 900; color: var(--3dt-blue-dark);">${p.nome}</div>
                </div>
                <div style="flex: 1; background: #f1f2f6; padding: 8px 12px; border-radius: 6px; border: 1px solid #dcdde1;">
                    <span style="font-size: 11px; font-weight: 900; color: var(--3dt-blue-main); text-transform: uppercase;">Total Pontos:</span>
                    <input type="number" id="sheet-pontos" value="${p.pontos_totais || p.pontos_iniciais}" style="margin:2px 0 0 0; padding:4px 8px; font-size:16px; font-weight:900; color:var(--3dt-orange);">
                </div>
            </div>

            <div class="sheet-two-columns">
                <div>
                    <div class="sheet-section-title">Características</div>
                    <div class="attr-vertical-list">
                        <div class="attr-vertical-row"><span class="attr-vertical-label">Força</span><span class="attr-vertical-value">${p.forca}</span></div>
                        <div class="attr-vertical-row"><span class="attr-vertical-label">Habilidade</span><span class="attr-vertical-value">${p.habilidade}</span></div>
                        <div class="attr-vertical-row"><span class="attr-vertical-label">Resistência</span><span class="attr-vertical-value">${p.resistencia}</span></div>
                        <div class="attr-vertical-row"><span class="attr-vertical-label">Armadura</span><span class="attr-vertical-value">${p.armadura}</span></div>
                        <div class="attr-vertical-row"><span class="attr-vertical-label">Poder de Fogo</span><span class="attr-vertical-value">${p.poder_fogo}</span></div>
                    </div>

                    <div class="status-box-row">
                        <div class="status-box-header">
                            <span style="color: #e74c3c;">Pontos de Vida</span>
                            <span>${p.pv_atual} / ${maxPvPm}</span>
                        </div>
                        <div style="margin-top: 4px; display: flex; gap: 4px;">
                            <button class="btn btn-sm btn-danger" onclick="alterarStatusCompleto(${p.id}, -1, 0)">-1</button>
                            <button class="btn btn-sm btn-danger" onclick="alterarStatusCompleto(${p.id}, -5, 0)">-5</button>
                            <button class="btn btn-sm btn-green" onclick="alterarStatusCompleto(${p.id}, 1, 0)">+1</button>
                            <button class="btn btn-sm btn-green" onclick="alterarStatusCompleto(${p.id}, 5, 0)">+5</button>
                        </div>
                    </div>

                    <div class="status-box-row">
                        <div class="status-box-header">
                            <span style="color: var(--3dt-blue-main);">Pontos de Magia</span>
                            <span>${p.pm_atual} / ${maxPvPm}</span>
                        </div>
                        <div style="margin-top: 4px; display: flex; gap: 4px;">
                            <button class="btn btn-sm btn-danger" onclick="alterarStatusCompleto(${p.id}, 0, -1)">-1</button>
                            <button class="btn btn-sm btn-danger" onclick="alterarStatusCompleto(${p.id}, 0, -5)">-5</button>
                            <button class="btn btn-sm btn-green" onclick="alterarStatusCompleto(${p.id}, 0, 1)">+1</button>
                            <button class="btn btn-sm btn-green" onclick="alterarStatusCompleto(${p.id}, 0, 5)">+5</button>
                        </div>
                    </div>

                    <div class="sheet-section-title">Vantagens</div>
                    <ul style="padding-left: 20px; margin: 0; font-size: 13px;">
                        ` + (listaVantagens.length === 0 ? '<li>Nenhuma</li>' : listaVantagens.map(v => `
                            <li style="margin-bottom: 4px;">
                                <b>${v.nome}</b>
                                ${v.observacao ? `<span class="item-obs">"${v.observacao}"</span>` : ''}
                            </li>
                        `).join('')) + `
                    </ul>

                    <div class="sheet-section-title">Desvantagens</div>
                    <ul style="padding-left: 20px; margin: 0; font-size: 13px;">
                        ` + (listaDesvantagens.length === 0 ? '<li>Nenhuma</li>' : listaDesvantagens.map(v => `
                            <li style="margin-bottom: 4px;">
                                <b>${v.nome}</b>
                                ${v.observacao ? `<span class="item-obs">"${v.observacao}"</span>` : ''}
                            </li>
                        `).join('')) + `
                    </ul>

                    <div class="sheet-section-title">Perícias</div>
                    <ul style="padding-left: 20px; margin: 0; font-size: 13px;">
                        ` + (p.pericias.length === 0 ? '<li>Nenhuma</li>' : p.pericias.map(per => `
                            <li style="margin-bottom: 4px;">
                                <b>${per.pericia_nome}</b>
                                ${per.observacao ? `<span class="item-obs">"${per.observacao}"</span>` : ''}
                            </li>
                        `).join('')) + `
                    </ul>
                </div>

                <div>
                    <div class="sheet-section-title">Dinheiro e Itens</div>
                    <textarea id="sheet-itens" rows="4" placeholder="Equipamentos, poções, tibares..." style="font-size: 13px;">${p.itens || ''}</textarea>

                    <div class="sheet-section-title">História</div>
                    <textarea id="sheet-historia" rows="5" placeholder="Origem e detalhes do personagem..." style="font-size: 13px;">${p.conceito || ''}</textarea>

                    <button class="btn btn-sm" style="width: 100%; margin-bottom: 15px;" onclick="salvarDetalhesTexto(${p.id})">Guardar Ficha</button>

                    <div class="dice-box">
                        <div style="font-weight: 900; color: var(--3dt-blue-main); margin-bottom: 8px; text-transform: uppercase; font-size: 12px;">🎲 Rolagem de Dados</div>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <select id="qtd-dados" style="margin:0; flex:1;">
                                <option value="1">1 Dado (1d6)</option>
                                <option value="2">2 Dados (2d6)</option>
                                <option value="3">3 Dados (3d6)</option>
                                <option value="4">4 Dados (4d6)</option>
                                <option value="5">5 Dados (5d6)</option>
                            </select>
                            <button class="btn btn-cyan btn-sm" style="padding: 10px 16px;" onclick="rolarDadosPersonalizados()">Rolar</button>
                        </div>
                        <div class="dice-result" id="dice-output">Escolha a quantidade e role os dados...</div>
                    </div>
                </div>
            </div>
        </div>

        <div id="painel-evoluir-ficha" style="display:none;"></div>
    `;

    document.getElementById('hud-detalhes').innerHTML = html;
}

let mapVantagensEvolucao = {};
let mapPericiasEvolucao = {};

async function abrirPainelEvolucao(id) {
    const res = await fetch(`/api/personagens/${id}/ficha`);
    const p = await res.json();

    const resV = await fetch('/api/vantagens');
    catalogoVantagens = await resV.json();
    const resP = await fetch('/api/pericias');
    catalogoPericias = await resP.json();

    document.getElementById('painel-exibicao-ficha').style.display = 'none';
    const painelEvolucao = document.getElementById('painel-evoluir-ficha');
    painelEvolucao.style.display = 'block';

    mapVantagensEvolucao = {};
    p.vantagens.forEach(v => { mapVantagensEvolucao[v.vantagem_id] = v.observacao || ''; });

    mapPericiasEvolucao = {};
    p.pericias.forEach(per => { mapPericiasEvolucao[per.pericia_id] = per.observacao || ''; });

    let html = `
        <div class="card" style="border-color: var(--3dt-orange);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3 style="margin:0;">Evolução de Personagem: ${p.nome}</h3>
                <div style="text-align:right;">
                    <span style="font-size:12px;">Pontos Gastos:</span><br>
                    <strong id="lbl-evoluir-pontos" style="font-size:18px; color:var(--3dt-orange);">0 / ${p.pontos_totais} pts</strong>
                </div>
            </div>

            <div style="display:flex; gap:15px; margin-bottom:15px;">
                <div style="flex:1;">
                    <label>Pontos Totais Concedidos pelo Mestre:</label>
                    <input type="number" id="e-pontos-totais" value="${p.pontos_totais}" oninput="calcularPontosEvolucao()">
                </div>
            </div>

            <h4>Características</h4>
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; text-align: center; margin-bottom: 15px;">
                <div style="background: #f1f2f6; padding: 8px; border-radius: 6px;"><label style="font-size: 11px; font-weight:900;">FORÇA</label><input type="number" id="e-forca" value="${p.forca}" min="0" oninput="calcularPontosEvolucao()"></div>
                <div style="background: #f1f2f6; padding: 8px; border-radius: 6px;"><label style="font-size: 11px; font-weight:900;">HABILIDADE</label><input type="number" id="e-habilidade" value="${p.habilidade}" min="0" oninput="calcularPontosEvolucao()"></div>
                <div style="background: #f1f2f6; padding: 8px; border-radius: 6px;"><label style="font-size: 11px; font-weight:900;">RESISTÊNCIA</label><input type="number" id="e-resistencia" value="${p.resistencia}" min="0" oninput="calcularPontosEvolucao()"></div>
                <div style="background: #f1f2f6; padding: 8px; border-radius: 6px;"><label style="font-size: 11px; font-weight:900;">ARMADURA</label><input type="number" id="e-armadura" value="${p.armadura}" min="0" oninput="calcularPontosEvolucao()"></div>
                <div style="background: #f1f2f6; padding: 8px; border-radius: 6px;"><label style="font-size: 11px; font-weight:900;">PODER DE FOGO</label><input type="number" id="e-podertipo" value="${p.poder_fogo}" min="0" oninput="calcularPontosEvolucao()"></div>
            </div>

            <h4>Vantagens & Desvantagens</h4>
            <div class="filter-bar">
                <label>Vantagens / Desvantagens</label>
                <div>
                    <label>Ordenar por: </label>
                    <select onchange="ordenarVantagensEvolucao(this.value)">
                        <option value="nome_asc">Nome (A - Z)</option>
                        <option value="nome_desc">Nome (Z - A)</option>
                        <option value="custo_desc">Maior Custo</option>
                        <option value="custo_asc">Menor Custo</option>
                    </select>
                </div>
            </div>
            <div id="evoluir-vantagens-container" class="select-list-box"></div>

            <h4>Perícias</h4>
            <div class="filter-bar">
                <label>Perícias</label>
                <div>
                    <label>Ordenar por: </label>
                    <select onchange="ordenarPericiasEvolucao(this.value)">
                        <option value="nome_asc">Nome (A - Z)</option>
                        <option value="nome_desc">Nome (Z - A)</option>
                        <option value="custo_desc">Maior Custo</option>
                        <option value="custo_asc">Menor Custo</option>
                    </select>
                </div>
            </div>
            <div id="evoluir-pericias-container" class="select-list-box"></div>

            <div style="display:flex; gap:10px; margin-top:15px;">
                <button class="btn btn-green" id="btn-salvar-evoluir" onclick="salvarEvolucao(${p.id})">Guardar Evolução</button>
                <button class="btn btn-danger" onclick="carregarHudPersonagem(${p.id})">Cancelar</button>
            </div>
        </div>
    `;

    painelEvolucao.innerHTML = html;
    renderizarOpcoesEvolucao();
    calcularPontosEvolucao();
}

function ordenarVantagensEvolucao(criterio) {
    catalogoVantagens = sortArray(catalogoVantagens, criterio, 'nome', 'custo');
    renderizarOpcoesEvolucao();
}

function ordenarPericiasEvolucao(criterio) {
    catalogoPericias = sortArray(catalogoPericias, criterio, 'nome', 'custo_inteira');
    renderizarOpcoesEvolucao();
}

function renderizarOpcoesEvolucao() {
    document.querySelectorAll('.chk-ev-vantagem').forEach(chk => {
        if (chk.checked) {
            mapVantagensEvolucao[chk.value] = document.querySelector(`.obs-ev-vantagem-${chk.value}`)?.value || '';
        } else {
            delete mapVantagensEvolucao[chk.value];
        }
    });

    document.querySelectorAll('.chk-ev-pericia').forEach(chk => {
        if (chk.checked) {
            mapPericiasEvolucao[chk.value] = document.querySelector(`.obs-ev-pericia-${chk.value}`)?.value || '';
        } else {
            delete mapPericiasEvolucao[chk.value];
        }
    });

    document.getElementById('evoluir-vantagens-container').innerHTML = catalogoVantagens.map(v => {
        const estaAtiva = mapVantagensEvolucao.hasOwnProperty(v.id);
        const obsVal = mapVantagensEvolucao[v.id] || '';
        return `
            <div class="option-item">
                <label class="option-main-row">
                    <input type="checkbox" class="chk-ev-vantagem" value="${v.id}" data-tipo="${v.tipo}" data-custo="${v.custo}" ${estaAtiva ? 'checked' : ''} onchange="toggleObsInput(this); calcularPontosEvolucao()">
                    <div class="option-content">
                        <div class="option-header">
                            <span class="option-title">${v.nome}</span>
                            <span class="badge ${v.tipo==='VANTAGEM'?'badge-v':'badge-d'}">${v.custo} pts</span>
                        </div>
                        <p class="option-desc">${v.descricao}</p>
                    </div>
                </label>
                <input type="text" class="option-input-obs obs-ev-vantagem-${v.id}" value="${obsVal}" placeholder="Detalhe / Descrição personalizada..." style="display:${estaAtiva ? 'block' : 'none'};">
            </div>
        `;
    }).join('');

    document.getElementById('evoluir-pericias-container').innerHTML = catalogoPericias.map(per => {
        const estaAtiva = mapPericiasEvolucao.hasOwnProperty(per.id);
        const obsVal = mapPericiasEvolucao[per.id] || '';
        return `
            <div class="option-item">
                <label class="option-main-row">
                    <input type="checkbox" class="chk-ev-pericia" value="${per.id}" data-custo="${per.custo_inteira}" ${estaAtiva ? 'checked' : ''} onchange="toggleObsInput(this); calcularPontosEvolucao()">
                    <div class="option-content">
                        <div class="option-header">
                            <span class="option-title">${per.nome}</span>
                            <span class="badge" style="background:var(--3dt-blue-main)">${per.custo_inteira} pts</span>
                        </div>
                        <p class="option-desc">${per.descricao || 'Sem descrição'}</p>
                    </div>
                </label>
                <input type="text" class="option-input-obs obs-ev-pericia-${per.id}" value="${obsVal}" placeholder="Detalhe / Especialização..." style="display:${estaAtiva ? 'block' : 'none'};">
            </div>
        `;
    }).join('');
}

function calcularPontosEvolucao() {
    const ptsTotais = parseInt(document.getElementById('e-pontos-totais').value) || 0;
    const f = parseInt(document.getElementById('e-forca').value) || 0;
    const h = parseInt(document.getElementById('e-habilidade').value) || 0;
    const r = parseInt(document.getElementById('e-resistencia').value) || 0;
    const a = parseInt(document.getElementById('e-armadura').value) || 0;
    const pdf = parseInt(document.getElementById('e-podertipo').value) || 0;

    const attrCost = f + h + r + a + pdf;

    let vCost = 0, dCredit = 0;
    document.querySelectorAll('.chk-ev-vantagem:checked').forEach(chk => {
        const tipo = chk.getAttribute('data-tipo');
        const custo = parseInt(chk.getAttribute('data-custo'));
        if(tipo === 'VANTAGEM') vCost += custo;
        else dCredit += Math.abs(custo);
    });

    let pCost = 0;
    document.querySelectorAll('.chk-ev-pericia:checked').forEach(chk => {
        pCost += parseInt(chk.getAttribute('data-custo'));
    });

    const totalGasto = attrCost + vCost + pCost - dCredit;
    const lbl = document.getElementById('lbl-evoluir-pontos');
    const btn = document.getElementById('btn-salvar-evoluir');

    lbl.innerText = `${totalGasto} / ${ptsTotais} pts`;

    if (totalGasto > ptsTotais) {
        lbl.style.color = '#e74c3c';
        lbl.innerText += ' (Excede o total!)';
        btn.disabled = true;
        btn.style.opacity = '0.5';
    } else {
        lbl.style.color = '#2ecc71';
        btn.disabled = false;
        btn.style.opacity = '1';
    }
}

async function salvarEvolucao(id) {
    const vantagens = [];
    document.querySelectorAll('.chk-ev-vantagem:checked').forEach(chk => {
        const vid = parseInt(chk.value);
        const obs = document.querySelector(`.obs-ev-vantagem-${vid}`).value;
        vantagens.push({ vantagem_id: vid, custo_pago: parseInt(chk.getAttribute('data-custo')), observacao: obs });
    });

    const pericias = [];
    document.querySelectorAll('.chk-ev-pericia:checked').forEach(chk => {
        const pid = parseInt(chk.value);
        const obs = document.querySelector(`.obs-ev-pericia-${pid}`).value;
        pericias.push({ pericia_id: pid, custo_pago: parseInt(chk.getAttribute('data-custo')), observacao: obs });
    });

    const dados = {
        pontos_totais: parseInt(document.getElementById('e-pontos-totais').value) || 0,
        forca: parseInt(document.getElementById('e-forca').value) || 0,
        habilidade: parseInt(document.getElementById('e-habilidade').value) || 0,
        resistencia: parseInt(document.getElementById('e-resistencia').value) || 0,
        armadura: parseInt(document.getElementById('e-armadura').value) || 0,
        poder_fogo: parseInt(document.getElementById('e-podertipo').value) || 0,
        vantagens: vantagens,
        pericias: pericias
    };

    const res = await fetch(`/api/personagens/${id}/evoluir`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(dados)
    });

    const json = await res.json();
    if(res.ok) {
        alert('Personagem evoluído com sucesso!');
        carregarHudPersonagem(id);
    } else {
        alert('Erro ao evoluir: ' + json.erro);
    }
}

async function alterarStatusCompleto(id, deltaPv, deltaPm) {
    const res = await fetch(`/api/personagens/${id}/ficha`);
    const p = await res.json();
    let maxVal = p.resistencia * 5;

    let novoPv = Math.max(0, Math.min(maxVal, p.pv_atual + deltaPv));
    let novoPm = Math.max(0, Math.min(maxVal, p.pm_atual + deltaPm));
    let ptsTotais = parseInt(document.getElementById('sheet-pontos').value) || p.pontos_totais;

    await fetch(`/api/personagens/${id}/status`, {
        method: 'PUT', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ 
            pv_atual: novoPv, 
            pm_atual: novoPm, 
            pontos_totais: ptsTotais,
            itens: p.itens, 
            conceito: p.conceito 
        })
    });
    carregarHudPersonagem(id);
}

async function salvarDetalhesTexto(id) {
    const res = await fetch(`/api/personagens/${id}/ficha`);
    const p = await res.json();

    const novosItens = document.getElementById('sheet-itens').value;
    const novaHistoria = document.getElementById('sheet-historia').value;
    const novosPontos = parseInt(document.getElementById('sheet-pontos').value) || p.pontos_totais;

    await fetch(`/api/personagens/${id}/status`, {
        method: 'PUT', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ 
            pv_atual: p.pv_atual, 
            pm_atual: p.pm_atual, 
            pontos_totais: novosPontos,
            itens: novosItens, 
            conceito: novaHistoria 
        })
    });
    alert('Ficha atualizada com sucesso!');
    carregarHudPersonagem(id);
}

function rolarDadosPersonalizados() {
    const qtd = parseInt(document.getElementById('qtd-dados').value) || 1;
    let dados = [];
    let soma = 0;

    for (let i = 0; i < qtd; i++) {
        let d = Math.floor(Math.random() * 6) + 1;
        dados.push(d);
        soma += d;
    }

    document.getElementById('dice-output').innerHTML = `🎲 <b>${qtd}d6</b> → Dados: [${dados.join(', ')}] | <b>Total: ${soma}</b>`;
}

async function carregarCompendioCompleto() {
    const resU = await fetch('/api/usuarios');
    const users = await resU.json();
    document.getElementById('lista-usuarios').innerHTML = `<table><tr><th>Nome</th><th>E-mail</th><th>Papel</th></tr>` +
        users.map(u => `<tr><td><b>${u.nome}</b></td><td>${u.email}</td><td><span class="badge" style="background:var(--3dt-blue-main)">${u.papel}</span></td></tr>`).join('') + `</table>`;

    const resV = await fetch('/api/vantagens');
    const vants = await resV.json();
    document.getElementById('lista-vantagens').innerHTML = `<table><tr><th>Nome</th><th>Tipo</th><th>Custo</th><th>Descrição</th></tr>` +
        vants.map(v => `<tr><td><b>${v.nome}</b></td><td><span class="badge ${v.tipo==='VANTAGEM'?'badge-v':'badge-d'}">${v.tipo}</span></td><td>${v.custo}</td><td>${v.descricao}</td></tr>`).join('') + `</table>`;

    const resP = await fetch('/api/pericias');
    const pers = await resP.json();
    document.getElementById('lista-pericias').innerHTML = `<table><tr><th>Nome</th><th>Custo</th><th>Descrição</th></tr>` +
        pers.map(p => `<tr><td><b>${p.nome}</b></td><td>${p.custo_inteira} pts</td><td>${p.descricao || 'Sem descrição'}</td></tr>`).join('') + `</table>`;
}

document.getElementById('form-usuario').addEventListener('submit', async (e) => {
    e.preventDefault();
    const dados = {
        nome: document.getElementById('u-nome').value,
        email: document.getElementById('u-email').value,
        papel: document.getElementById('u-papel').value
    };
    const res = await fetch('/api/usuarios', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(dados) });
    const json = await res.json();
    if(res.ok) {
        document.getElementById('form-usuario').reset();
        carregarCompendioCompleto();
    } else {
        alert('Erro: ' + json.erro);
    }
});

document.getElementById('form-vantagem').addEventListener('submit', async (e) => {
    e.preventDefault();
    const dados = { nome: document.getElementById('v-nome').value, tipo: document.getElementById('v-tipo').value, custo: parseInt(document.getElementById('v-custo').value), descricao: document.getElementById('v-descricao').value };
    const res = await fetch('/api/vantagens', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(dados) });
    if(res.ok) { document.getElementById('form-vantagem').reset(); carregarCompendioCompleto(); }
});

document.getElementById('form-pericia').addEventListener('submit', async (e) => {
    e.preventDefault();
    const dados = { nome: document.getElementById('per-nome').value, custo_inteira: parseInt(document.getElementById('per-custo').value), descricao: document.getElementById('per-descricao').value };
    const res = await fetch('/api/pericias', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(dados) });
    if(res.ok) { document.getElementById('form-pericia').reset(); carregarCompendioCompleto(); }
});

mudarTab('hud');