import Server from 'bare-server-node';
import http from 'http';
import nodeStatic from 'node-static';

const bare = new Server('/bare/', '');
const serve = new nodeStatic.Server('static/');

const server = http.createServer();

server.on('request', (request, response) => {
    // パスワード認証（ベーシック認証）の処理
    const auth = request.headers['authorization'];
    
    // 設定したパスワード（Renderの環境変数で指定。なければデフォルト 'password123'）
    const requiredPassword = process.env.SITE_PASSWORD || 'password123';
    // 「ユーザー名: admin」と「パスワード」を組み合わせたBase64文字列を作成
    const expectedAuth = 'Basic ' + Buffer.from('admin:' + requiredPassword).toString('base64');

    if (!auth || auth !== expectedAuth) {
        response.writeHead(401, {
            'WWW-Authenticate': 'Basic realm="Secure Area"',
            'Content-Type': 'text/plain; charset=utf-8'
        });
        response.end('アクセス拒否: パスワードが違います。');
        return;
    }

    // 認証が成功した場合のみ、通常のプロキシ処理を行う
    if (bare.route_request(request, response)) return true;
    serve.serve(request, response);
});

server.on('upgrade', (req, socket, head) => {
    if (bare.route_upgrade(req, socket, head)) return;
    socket.end();
});

server.listen(process.env.PORT || 8080);
