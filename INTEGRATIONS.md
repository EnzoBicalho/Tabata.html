# Cards do Sobre Mim

Inicie o site com `node server.cjs` e abra http://127.0.0.1:5173.
O HTML/CSS/JS continua sem build e sem dependências novas. O servidor acrescenta somente as integrações dos cards.

## Spotify

O card usa por padrão a mesma integração já autorizada no README de `bicas777`: [Spotify Recently Played](https://github.com/JeffreyCA/spotify-recently-played-readme). O usuário público configurado é `oy44kgfehl954oiaj5qfmheez`. Não é necessário criar outro aplicativo ou preencher `.env` para esse widget funcionar.

O SVG remoto é exibido como imagem, com três reproduções, fundo transparente e cores compatíveis com o site. `now_playing=1` prioriza a faixa em reprodução quando a integração a disponibiliza; ela conta como uma das três faixas mostradas. Sem reprodução ativa, aparecem as três recentes. O card consulta a integração a cada 5 segundos enquanto estiver visível. O link abre o perfil do Spotify. No desktop, o SVG abre o perfil do Spotify; no celular, a lista compacta usa os mesmos dados públicos e permite abrir as faixas individualmente. O estado “Tocando agora” só é usado quando informado pelo serviço.

O widget também funciona em hospedagem estática. Ele depende da disponibilidade do serviço externo e da autorização já concedida por você. Se deixar de atualizar por uma autorização expirada, reconecte a conta no [serviço original](https://spotify-recently-played.jeffreyca.workers.dev/). O site não acessa nem copia os tokens dessa integração.

### Integração própria opcional

O caminho abaixo permanece disponível no servidor, mas não é usado pelo card atual. O Spotify exige conta Premium do proprietário para aplicativos em development mode: [regras oficiais](https://developer.spotify.com/documentation/web-api/concepts/quota-modes).

Se futuramente optar por uma integração própria, remova o bloco `[data-spotify-widget]` do HTML para ativar a lista nativa e siga estes passos:

1. Crie um aplicativo em https://developer.spotify.com/dashboard e habilite a Web API.
2. Nas configurações, cadastre a Redirect URI exata: `http://127.0.0.1:5173/api/spotify/callback`.
3. Copie `.env.example` para `.env`. Preencha `SPOTIFY_CLIENT_ID` e `SPOTIFY_CLIENT_SECRET` apenas nesse arquivo.
4. Reinicie `node server.cjs` e abra http://127.0.0.1:5173/api/spotify/connect. Autorize sua conta.
5. Volte à seção Sobre Mim. As faixas são atualizadas enquanto o card estiver visível, no máximo uma vez por minuto.

As restrições de acesso e os requisitos da conta no modo de desenvolvimento dependem do aplicativo e das regras atuais do Spotify. Consulte o Dashboard se o acesso for recusado.

A conexão administrativa só funciona no servidor local. O refresh token é guardado em `.local/spotify-token.json` (ignorado pelo Git); o navegador recebe somente título, artista, capa, link e horário de reprodução. Não publique `.env` nem `.local`. Para desconectar, encerre o servidor e apague `.local/spotify-token.json`.

Em hospedagem estática, o card mantém o estado desconectado. Para atualizar as músicas online, execute o mesmo servidor Node na hospedagem, configure as variáveis de ambiente e transfira o token por um mecanismo privado de configuração. Não coloque tokens no frontend. Use armazenamento persistente para `.local` ou implemente o armazenamento privado oferecido pela hospedagem.

Referências: [recently played](https://developer.spotify.com/documentation/web-api/reference/get-recently-played), [Authorization Code](https://developer.spotify.com/documentation/web-api/tutorials/code-flow), [Redirect URIs](https://developer.spotify.com/documentation/web-api/concepts/redirect_uri).

## GitHub

O servidor lê o calendário público de https://github.com/bicas777, com cache de uma hora. O frontend mostra contribuições, dias ativos e o calendário, sem estimativas. O snapshot em `data/github-contributions.json` preserva o último resultado real caso a rede fique indisponível e permite exibi-lo em hospedagem estática com a data da coleta.

O calendário HTML é uma página pública do GitHub, não uma API contratual; o parser pode precisar de atualização se o GitHub mudar a marcação. Falhas mantêm o snapshot com indicação de que é a última consulta salva. O total representa as contribuições visíveis no calendário público, conforme as configurações da conta.

Referência: [contribuições no perfil](https://docs.github.com/en/account-and-profile/concepts/contributions-on-your-profile).

A lista e a imagem do Spotify agora compartilham uma única consulta no servidor, com cache de no máximo 5 segundos. As respostas locais e a imagem têm Cache-Control: no-store e não entram no service worker. Voltar para a aba ou recuperar a rede dispara uma consulta. O serviço externo ainda usa seu próprio cache: no código público atual, 20 segundos para a reprodução atual e 60 segundos para o histórico. Esses limites não podem ser removidos pelo portfólio. A consulta ao SVG usa uma URL renovada e no-cache para evitar atraso adicional do CDN.
