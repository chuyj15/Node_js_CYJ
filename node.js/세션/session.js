const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const parseCookies = (cookie = '') =>
    cookie
        .split(';')
        .map(v => v.split('='))
        .reduce((acc, [k, v]) => {
            acc[k.trim()] = decodeURIComponent(v);
            return acc;
        }, {});
const session = {};
http.createServer(async (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    if (req.url.startsWith('/login')) {
        const url = new URL(req.url, 'http://localhost:8080');
        const name = url.searchParams.get('name');
        const expires = new Date();
        expires.setMinutes(expires.getMinutes() + 5);
        const uniqueInt = Date.now();
        //로그인할 때마다 세션에 담고있음. 
        session[uniqueInt] = {
            name,
            expires,
        };
        res.writeHead(302, {
            Location: '/',
            'Set-Cookie': `session=${uniqueInt}; Expires=${expires.toGMTString()}; HttpOnly; Path=/`,
        });
        res.end();
        // 세션쿠키가 존재하고, 만료 기간이 지나지 않았다면
    } else if (cookies.session && session[cookies.session].expires > new Date()) {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`${session[cookies.session].name}님 안녕하세요`);
    } else {
        try {
            const data = await fs.readFile(path.join(__dirname, 'session.html'));
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(data);
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end(err.message);
        }
    }
})
    .listen(8080, () => {
        console.log('8080번 포트에서 서버 대기 중입니다!');
    });

    //쿠키를 안지우고 들어오면 예외처리가 나온다고 합니다...
    //동시로그인을 막는 것을 구현해볼 수도 있음
    