from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
import sys, json, urllib.request, urllib.error
from pixai_transport import fetch_public
root = Path(__file__).resolve().parent
port = int(sys.argv[1]) if len(sys.argv)>1 else 8765
files = {'/library-detail.js':'library-detail.js','/library-detail.css':'library-detail.css','/preset-management.js':'preset-management.js','/preset-management.css':'preset-management.css','/nai-presets.js':'nai-presets.js','/editor-workflow.js':'editor-workflow.js','/nai-workflow.css':'nai-workflow.css','/nai-metadata.js':'nai-metadata.js','/nai-editor.js':'nai-editor.js','/library-ui.js':'library-ui.js','/library-ui.css':'library-ui.css','/':'index.html','/index.html':'index.html','/modal-layout.css':'modal-layout.css','/clipboard.js':'clipboard.js','/nai.js':'nai.js','/palette.css':'palette.css','/ui.js':'ui.js','/ui.css':'ui.css','/compare.js':'compare.js','/enhancements.js':'enhancements.js','/enhancements.css':'enhancements.css','/warehouse.js':'warehouse.js','/warehouse.css':'warehouse.css','/pixai-parser.js':'pixai-parser.js'}
class Handler(BaseHTTPRequestHandler):
    def send_json(self, code, value):
        data=json.dumps(value, ensure_ascii=False).encode('utf-8')
        self.send_response(code); self.send_header('Content-Type','application/json; charset=utf-8'); self.send_header('Content-Length',str(len(data))); self.send_header('Cache-Control','no-store'); self.end_headers(); self.wfile.write(data)
    def valid_host(self): return self.headers.get('Host') in [f'127.0.0.1:{port}',f'localhost:{port}']
    def do_GET(self):
        if not self.valid_host(): return self.send_json(403,{'error':'接続元が不正です'})
        if self.path=='/api/health': return self.send_json(200,{'app':'prompt-palette','version':'0.12.2','capabilities':['pixai-public'],'runtime':'python','port':port})
        name=files.get(self.path.split('?')[0])
        if not name: return self.send_json(404,{'error':'Not found'})
        data=(root/name).read_bytes()
        self.send_response(200); self.send_header('Content-Type', ('text/javascript' if name.endswith('.js') else 'text/css' if name.endswith('.css') else 'text/html')+'; charset=utf-8'); self.send_header('Content-Length',str(len(data))); self.send_header('Cache-Control','no-store'); self.send_header('X-Content-Type-Options','nosniff'); self.end_headers(); self.wfile.write(data)
    def do_POST(self):
        if not self.valid_host() or self.headers.get('Origin') not in [None,'http://'+self.headers.get('Host','')]: return self.send_json(403,{'error':'同じアプリから操作してください'})
        if self.path not in ['/api/pixai','/api/image']: return self.send_json(404,{'error':'Not found'})
        if not self.headers.get('Content-Type','').startswith('application/json'): return self.send_json(415,{'error':'JSONを指定してください'})
        try:
            length=int(self.headers.get('Content-Length',0))
            if length<1 or length>8192: return self.send_json(413,{'error':'入力が長すぎます'})
            value=json.loads(self.rfile.read(length)); print(json.dumps({'event':'pixai-request','path':self.path}),flush=True); result=fetch_public(value.get('url',''),self.path=='/api/image'); print(json.dumps({'event':'pixai-response','path':self.path,'status':200}),flush=True); self.send_json(200,result)
        except urllib.error.HTTPError as e:
            print(json.dumps({'event':'pixai-error','path':self.path,'errorType':'http','upstreamStatus':e.code}),flush=True)
            self.send_json(404 if e.code==404 else 502,{'error':f'公開情報を取得できません（HTTP {e.code}）。手動登録できます。','errorType':'http','stage':'upstream','upstreamStatus':e.code})
        except Exception as e:
            print(json.dumps({'event':'pixai-error','path':self.path,'errorType':'communication','message':str(e)}),flush=True)
            self.send_json(502,{'error':'取得できませんでした：'+str(e),'errorType':'communication','stage':'upstream'})
server=ThreadingHTTPServer(('127.0.0.1',port),Handler)
print(f'PROMPT PALETTE v0.12.2: http://127.0.0.1:{port}',flush=True)
server.serve_forever()
