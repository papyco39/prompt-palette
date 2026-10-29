"""Allowlisted public-page transport; never forwards cookies or follows redirects."""
import urllib.request, urllib.parse, re, base64
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl): return None
def checked(value, image=False):
    u=urllib.parse.urlsplit(value)
    if u.scheme!='https' or u.username or u.password or u.port: raise ValueError('HTTPSのPixAI URLを指定してください')
    if image:
        if u.hostname not in ['images-ng.pixai.art','images.pixai.art']: raise ValueError('対応していない画像URLです')
        return value
    if u.hostname!='pixai.art': raise ValueError('pixai.artのURLを指定してください')
    p=[x for x in u.path.split('/') if x]
    if p and re.fullmatch(r'[a-z]{2}(?:-[A-Za-z]{2})?',p[0]): p=p[1:]
    if len(p) not in [2,3] or p[0] not in ['model','artwork'] or not re.fullmatch(r'\d+(?:-[\w-]+)?',p[1]) or p[0]=='artwork' and len(p)!=2: raise ValueError('対応していないPixAI URLです')
    q=urllib.parse.parse_qs(u.query); version=p[2] if len(p)==3 else q.get('versionId',q.get('modelVersionId',['']))[0]
    if version and not re.fullmatch(r'\d+',version): raise ValueError('バージョンIDが不正です')
    return value
def fetch_public(value,image=False,redirects=0):
    url=checked(value,image); request=urllib.request.Request(url,headers={'User-Agent':'PROMPT-PALETTE/0.4.7 PublicMetadata','Accept':'image/*' if image else 'text/html'})
    try:
        r=urllib.request.build_opener(NoRedirect).open(request,timeout=15)
    except urllib.error.HTTPError as e:
        if e.code in [301,302,303,307,308] and e.headers.get('Location') and redirects<3:
            next_url=checked(urllib.parse.urljoin(url,e.headers['Location']),image)
            if not image:
                original=re.search(r'/(model|artwork)/(\d+)',url); target=re.search(r'/(model|artwork)/(\d+)',next_url)
                if not original or not target or original.groups()!=target.groups(): raise ValueError('別ページへの転送は取得しません')
            return fetch_public(next_url,image,redirects+1)
        raise
    with r:
        kind=r.headers.get_content_type(); maximum=(20 if image else 4)*1024*1024
        if kind not in (['image/png','image/jpeg','image/webp'] if image else ['text/html']): raise ValueError('対応していない応答形式です')
        data=r.read(maximum+1)
        if len(data)>maximum: raise ValueError('取得データが大きすぎます')
        return {'src':'data:'+kind+';base64,'+base64.b64encode(data).decode('ascii')} if image else {'url':url,'html':data.decode('utf-8')}
