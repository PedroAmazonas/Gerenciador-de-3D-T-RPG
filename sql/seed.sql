INSERT INTO nivel_poder (nome, pontos_iniciais, max_atributo, limite_desvantagens) VALUES 
            ('Novato', 5, 3, 2),
            ('Lutador', 7, 5, 3),
            ('Campeão', 10, 7, 5),
            ('Lenda', 12, 10,100);
        


INSERT INTO usuario (nome, email, senha_hash, papel) VALUES 
            ('Mestre', 'mestre@email.com', '123456', 'ADMIN'),
            ('Jogador','jogador@email.com','123456','JOGADOR');

INSERT OR IGNORE INTO vantagem (nome, tipo, custo, descricao) VALUES 
('Genialidade', 'VANTAGEM', 1, 'Você é um gênio. Recebe H+2 ao utilizar qualquer perícia que possua, ou em qualquer teste de Habilidade envolvendo uma perícia que não possua. Com os recursos necessários, a critério do mestre, esta vantagem também permite feitos acima do nível técnico de seu mundo. Em Arton, por exemplo, é necessário ter esta vantagem para lidar com armas de fogo, canhões e balões de ar quente.'),

('Aceleração', 'VANTAGEM', 1, 'Você corre mais rápido. Esta vantagem acrescenta 1 ponto à Habilidade apenas para situações de perseguição, fuga e esquiva (não cumulativo com Teleporte). Você também recebe um movimento extra por turno. Usar esta vantagem em situações de combate gasta 1 Ponto de Magia. Os efeitos duram até o fim do combate.'),

('Aparência Inofensiva', 'VANTAGEM', 1, 'Por algum motivo você não parece perigoso. Talvez pareça pequeno, fraco ou covarde. Talvez seja um bichinho fofo, um vovô barrigudo, uma menininha segurando pirulito... você escolhe o motivo.'),

('Boa Fama', 'VANTAGEM', 1, 'Você é respeitado entre outros heróis e aventureiros, e também entre boa parte das pessoas comuns. Pode ser conhecido por lutar bem, ter um estilo diferente, uma aparência especial, ou até por uma única luta marcante. Será mais difícil passar despercebido ou agir disfarçado. Se você tem um Ponto Fraco, ele será conhecido por todos.'),

('Invisibilidade', 'VANTAGEM', 2, 'Você pode ficar invisível. Fora de combate, reduz a dificuldade em testes de perícias que envolvem furtividade. Em combate, seu oponente sofre H–1 para acertar ataques corporais contra você, e H–3 para ataques à distância ou esquivar. Ativar e manter a Invisibilidade custa 1 PM por turno.'),

('Membros Elásticos', 'VANTAGEM', 1, 'Seus braços, pernas ou tentáculos podem ir muito mais longe que o normal. Você pode esticá-los para levar seus braços a longas distâncias (o mesmo alcance de sua Força, se ela fosse Poder de Fogo). Um ataque realizado com Membros Elásticos é sempre considerado um ataque corpo-a-corpo, baseado em Força.'),

('Insano', 'DESVANTAGEM', -1, 'Você é louco. Após dois minutos de conversa, ninguém acredita ou confia em você. Há muitas formas de insanidade (como Cleptomaníaco, Demente, Megalomaníaco, entre outras). Todas as formas podem ser vencidas temporariamente com um teste de R–3 em situações extremas.'),

('Código de Honra', 'DESVANTAGEM', -1, 'Você segue um código rígido que o impede de fazer (ou deixar de fazer) alguma coisa, como Código de Arena, Código do Caçador, Código do Cavalheiro, Código do Combate, entre outros.');

INSERT INTO pericia (nome, descricao, custo_inteira) VALUES
            ('Arte', 'Você tem sensibilidade e talento para artes. Sabe can tar, dançar, desenhar, pintar, fazer esculturas, tocar instru mentos musicais... Atuação: você é um ator. Pode simular emoções que não está sentindo. Falsificação: você sabe criar cópias de cartas, docu mentos, obras de arte e outros objetos, e também reconhecer peças falsificadas. Fotografia: você sabe tirar fotos profissionais e, se tiver acesso a um laboratório, revelar fotos. Instrumentos Musicais: você sabe tocar instrumentos musicais de vários tipos. Prestidigitação: você pode fazer truques com pequenos objetos, fazendo sumir moedas, lenços e cartas de baralho como se fosse mágica. Redação: você sabe produzir textos profissionais: rela tórios, poesias, romances, reportagens, cartas de amor... Outras Especializações: Canto, Culinária, Dança, Dese nho, Escultura, Pintura, Joalheria...', 2),
            
            ('Esportes', 'Você sabe praticar vários tipos de esportes, e conhece suas regras. Esta perícia não afeta seu desempenho em com bate, mesmo quando se trata de esportes como artes marci ais, boxe, arquearia... Acrobacia: você pode equilibrar-se em pequenas super fícies, andar sobre cordas, fazer malabarismo, etc. Alpinismo: você sabe escalar montanhas, subir em muros altos, árvores e até edifícios. Arquearia: você sabe usar arco e flecha. Corrida: você é um corredor de curta e longa distância. Jogos: você conhece muitos jogos, como cartas, jogos de tabuleiro, videogames, RPGs... Mergulho: você sabe usar equipamento de mergulho. Natação: você sabe... bem, nadar. Pilotagem: você sabe pilotar aviões, helicópteros, bar cos e navios, além de veículos de competição, como carros de corrida. Outras Especializações: Arremesso, Artes Marciais, Boxe, Caça, Parkour, Pesca, Paraquedismo, Salto...', 2),

            ('Medicina', 'Você sabe dizer que tipo de doença um paciente tem, como curá-la, e também pode fazer cirurgias. Quando alguém precisa de cuidados médicos, você pode providenciar. Cirurgia: você sabe tratar de doenças e ferimentos in ternos. Restaurar 1 PV é uma tarefa Média, mas é permitido apenas um teste por dia para cada paciente. Diagnose: você sabe dizer se uma pessoa está doente, reconhecer a doença e determinar a maneira de curá-la. Primeiros Socorros: você sabe fazer curativos, redu zir fraturas, deter sangramentos e outras coisas que se deve fazer — ou não fazer — em caso de acidentes com vítimas. Primeiros Socorros pode ajudar na recuperação de persona gens que estejam com 0 PVs, dependendo da gravidade de seus ferimentos. Veja em “Testes de Morte”. Psiquiatria: você sabe lidar com traumas e doenças mentais. Quando um personagem Insano falha em seu teste para resistir à loucura, você pode tentar ajudá-lo a superar a crise como uma tarefa Difícil (mas não poderá curá-lo total mente de sua insanidade). Veterinária: você pode fazer diagnósticos, prestar pri meiros socorros e fazer cirurgias em animais.', 2),

            ('Sobrevivência', 'Você consegue sobreviver em lugares selvagens. Sabe caçar, pescar, seguir pistas e encontrar comida e abrigo para você e seus amigos. Cada tipo de região conta como uma especialização. Alpinismo: você sabe escalar em montanhas, subir em muros altos, árvores e até edifícios. Armadilhas: você sabe construir, armas e desarmar armadilhas, explosivos e aparelhos de detecção. Arquearia: você sabe usar arco e flecha. Furtividade: você sabe se esconder e também mo ver-se em silêncio e sem ser visto. Meteorologia: você sabe prever o clima nos dias ou horas seguintes. Navegação: você sabe dizer onde está e em que dire ção deve seguir. Pesca: você sabe pegar peixes e outros animais aquá ticos com linha e anzol, rede ou arpão. Rastreio: você sabe seguir pistas e pegadas. Outras Especializações: mesmas da vantagem Arena.', 2);

