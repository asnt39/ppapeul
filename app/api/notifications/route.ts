import {env} from 'cloudflare:workers';
import {allowedEndpoint,dispatchDue,enqueue} from '../../../lib/push';
export const dynamic='force-dynamic';
const hash=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),x=>x.toString(16).padStart(2,'0')).join('');
const json=(x:any,s=200)=>Response.json(x,{status:s,headers:{'Cache-Control':'no-store'}});
export async function GET(){return json({publicKey:(env as any).PUSH_PUBLIC_KEY||null,scheduler:false});}
export async function POST(req:Request){try{
 if(req.headers.get('origin') && new URL(req.headers.get('origin')!).origin!==new URL(req.url).origin)return json({error:'허용되지 않은 요청'},403);
 const raw=await req.text();if(raw.length>100000)return json({error:'요청이 너무 커요'},413);const b=JSON.parse(raw),db=env.DB!;
 if(b.action==='events') {const device:any=await db.prepare('SELECT id FROM push_devices WHERE secret=?').bind(await hash(String(b.deviceToken||''))).first();if(!device)return json({error:'기기 인증이 필요해요'},401);const result:any=await db.prepare('SELECT id,payload FROM push_events WHERE device=? AND delivered=0 ORDER BY created LIMIT 20').bind(device.id).all();return json({events:result.results.map((x:any)=>({...JSON.parse(x.payload),queueId:x.id}))});}
 if(b.action==='ack'){const device:any=await db.prepare('SELECT id FROM push_devices WHERE secret=?').bind(await hash(String(b.deviceToken||''))).first();if(!device)return json({},401);if(!Array.isArray(b.ids)||b.ids.length>20)return json({},400);for(const id of b.ids)await db.prepare('UPDATE push_events SET delivered=1 WHERE id=? AND device=?').bind(String(id),device.id).run();return json({ok:true});}
 const me:any=await db.prepare('SELECT id FROM profiles WHERE token=?').bind(await hash(String(b.token||''))).first();if(!me)return json({error:'프로필을 먼저 만들어 주세요.'},401);
 if(b.action==='register'){
 if(!allowedEndpoint(b.subscription?.endpoint)||String(b.subscription.endpoint).length>2000)return json({error:'지원하지 않는 푸시 주소예요.'},400);
 const endpoint=b.subscription.endpoint;const existing:any=await db.prepare('SELECT id,owner FROM push_devices WHERE endpoint=?').bind(endpoint).first();if(existing&&existing.owner!==me.id)return json({error:'다른 프로필에 등록된 기기예요. 기존 알림을 해제해 주세요.'},409);
 const id=existing?.id||crypto.randomUUID(),deviceToken=crypto.randomUUID()+crypto.randomUUID();
 await db.prepare('INSERT INTO push_devices(id,owner,endpoint,secret,preferences,timezone,daily_time,snapshot) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET secret=excluded.secret').bind(id,me.id,endpoint,await hash(deviceToken),'{}','Asia/Seoul','09:00','{}').run();return json({id,deviceToken});}
 const device:any=await db.prepare('SELECT * FROM push_devices WHERE id=? AND owner=?').bind(String(b.deviceId||''),me.id).first();if(!device)return json({error:'이 기기에서 알림 켜기를 먼저 눌러 주세요.'},404);
 if(b.action==='remove'){await db.batch([db.prepare('DELETE FROM push_events WHERE device=?').bind(device.id),db.prepare('DELETE FROM push_devices WHERE id=? AND owner=?').bind(device.id,me.id)]);return json({ok:true});}
 if(b.action==='sync'){
 const p=b.preferences;if(!p||!['timer','friend','message','daily'].every(k=>typeof p[k]==='boolean')||!/^([01]\d|2[0-3]):[0-5]\d$/.test(b.dailyTime))return json({error:'알림 설정을 확인해 주세요.'},400);
 try{new Intl.DateTimeFormat('en',{timeZone:b.timezone});}catch{return json({error:'시간대를 확인해 주세요.'},400);}
 const snapshot=b.snapshot;if(!snapshot||!Array.isArray(snapshot.days)||snapshot.days.length>90||!Array.isArray(snapshot.exams)||snapshot.exams.length>50)return json({error:'알림 계획을 확인해 주세요.'},400);
 if(snapshot.days.some((d:any)=>!/^\d{4}-\d{2}-\d{2}$/.test(d.date)||!Array.isArray(d.allocations)||d.allocations.length>50||d.allocations.some((a:any)=>typeof a.name!=='string'||a.name.length>80||!Number.isInteger(a.minutes)||a.minutes<0||a.minutes>1440)))return json({},400);
 if(snapshot.timer && (typeof snapshot.timer.subject!=='string'||snapshot.timer.subject.length>80||snapshot.timer.deadline!=null&&(!Number.isFinite(snapshot.timer.deadline)||snapshot.timer.deadline>Date.now()+86400000)))return json({},400);
 await db.prepare('UPDATE push_devices SET preferences=?,timezone=?,daily_time=?,snapshot=? WHERE id=? AND owner=?').bind(JSON.stringify(p),b.timezone,b.dailyTime,JSON.stringify(snapshot),device.id,me.id).run();return json({ok:true});}
 if(b.action==='test'){await enqueue(env,me.id,'timer','test:'+Date.now(),'빠플 알림 연결 완료','이 기기에서 공부 알림을 받을 수 있어요.','/index.html?screen=settings');return json({ok:true});}
 // Checking while the app is open is a fallback, not an unattended scheduler.
 if(b.action==='check'){await dispatchDue(env,me.id);return json({ok:true});}
 return json({error:'알 수 없는 작업'},400);
 }catch{return json({error:'알림을 저장하지 못했어요. 연결을 확인해 주세요.'},500);}}
