import json,urllib.request,urllib.error,uuid
record_id=str(uuid.uuid4())
url='http://127.0.0.1:8787/api/community'
def api(action,token=None,**kw):
 req=urllib.request.Request(url,json.dumps(dict(action=action,token=token,**kw)).encode(),{'Content-Type':'application/json'})
 try:
  with urllib.request.urlopen(req) as r:return r.status,json.load(r)
 except urllib.error.HTTPError as e:return e.code,json.load(e)
a=api('create',name='테스트 A')[1];b=api('create',name='테스트 B')[1]
assert api('send',a['token'],to=b['id'],body='거부되어야 함')[0]==403
x=api('invite',a['token'],code=b['id'])[1]
pending=api('get',b['token'])[1]['friends'][0]
assert pending['incoming']
assert api('accept',b['token'],id=pending['link'])[0]==200
assert api('send',a['token'],to=b['id'],body='테스트 메시지')[0]==200
assert api('get',b['token'])[1]['messages'][-1]['body']=='테스트 메시지'
assert api('get','invalid')[0]==401
assert api('session',a['token'],id=record_id,subject='수학',seconds=-1)[0]==400
assert api('session',a['token'],id=record_id,subject='수학',seconds=60)[0]==200
assert api('session',a['token'],id=record_id,subject='수학',seconds=60)[0]==200
assert api('get',b['token'])[1]['friends'][0]['total']==60
assert api('daily',a['token'],date='2026-10-30',goal=240,actual=10560)[0]==200
r=api('get',b['token'],date='2026-10-30')[1]['friends'][0]
assert r['dailyGoal']==240 and r['dailyActual']==10560
assert api('get',b['token'],date='2026-10-31')[1]['friends'][0]['dailyActual']==0
assert api('daily',a['token'],date='2026-10-30',goal=1441,actual=0)[0]==400
assert api('remove',b['token'],id=pending['link'])[0]==200
assert api('send',a['token'],to=b['id'],body='거부')[0]==403
print('PASS: guest, request, accept, message, auth, record validation, deduplication, removal')
