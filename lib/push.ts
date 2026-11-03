// Data-free Web Push: the service worker retrieves the recipient's queued events.
export const allowedEndpoint=(value:string)=>{try{const u=new URL(value);return u.protocol==='https:' && !u.username && !u.password && (!u.port || u.port==='443') && (['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com'].includes(u.hostname)||u.hostname.endsWith('.push.apple.com')||u.hostname.endsWith('.notify.windows.com'));}catch{return false;}};
const b64=(v:Uint8Array)=>btoa(String.fromCharCode(...v)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
export async function wake(subscription:any,environment:any){
 if(!allowedEndpoint(subscription.endpoint)||!environment.PUSH_PRIVATE_JWK||!environment.PUSH_PUBLIC_KEY)return false;
 const header=b64(new TextEncoder().encode(JSON.stringify({typ:'JWT',alg:'ES256'})));
 const body=b64(new TextEncoder().encode(JSON.stringify({aud:new URL(subscription.endpoint).origin,exp:Math.floor(Date.now()/1000)+3600,sub:'https://ppaplan-study-chan-1030.neatsmile32770.chatgpt.site'})));
 const key=await crypto.subtle.importKey('jwk',JSON.parse(environment.PUSH_PRIVATE_JWK),{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
 const signature=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,new TextEncoder().encode(header+'.'+body));
 const response=await fetch(subscription.endpoint,{method:'POST',headers:{Authorization:`vapid t=${header}.${body}.${b64(new Uint8Array(signature))}, k=${environment.PUSH_PUBLIC_KEY}`,TTL:'300','Content-Length':'0'},redirect:'error',signal:AbortSignal.timeout(10000)});
 if(response.status===404||response.status===410)await environment.DB.prepare('DELETE FROM push_devices WHERE id=?').bind(subscription.id).run();
 return response.ok;
}
export async function enqueue(environment:any,owner:string,category:string,eventId:string,title:string,body:string,url='/index.html?screen=friends'){
 const devices:any=await environment.DB.prepare('SELECT * FROM push_devices WHERE owner=?').bind(owner).all();
 for(const device of devices.results){const prefs=JSON.parse(device.preferences);if(!prefs[category])continue;const id=device.id+':'+eventId;
 const result=await environment.DB.prepare('INSERT OR IGNORE INTO push_events(id,device,payload,created) VALUES(?,?,?,?)').bind(id,device.id,JSON.stringify({id:eventId,title,body,tag:category==='timer'?'ppa-timer':eventId,url,category}),Date.now()).run();
 if(result.meta.changes)try{await wake(device,environment);}catch{/* queued event remains retrievable */}
 }
}
export async function dispatchDue(environment:any,owner?:string){
 const all:any=owner?await environment.DB.prepare('SELECT * FROM push_devices WHERE owner=?').bind(owner).all():await environment.DB.prepare('SELECT * FROM push_devices').bind().all();let sent=0;
 for(const device of all.results){const prefs=JSON.parse(device.preferences),snapshot=JSON.parse(device.snapshot||'{}');
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:device.timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).map(p=>[p.type,p.value]));const date=`${parts.year}-${parts.month}-${parts.day}`,time=`${parts.hour}:${parts.minute}`;
 const events=[];
 if(prefs.daily && time>=device.daily_time){const day=snapshot.days?.find((d:any)=>d.date===date);const exam=snapshot.exams?.filter((e:any)=>e.date>=date).sort((a:any,b:any)=>a.date.localeCompare(b.date))[0];const left=exam?Math.round((Date.parse(exam.date)-Date.parse(date))/86400000):null;
 events.push({id:'daily:'+date,title:exam?`오늘의 빠플 · ${left===0?'D-DAY':'D-'+left}`:'오늘의 공부 계획',body:day?.allocations?.length?day.allocations.map((a:any)=>a.name+' '+a.minutes+'분').join(' · ').slice(0,250):'오늘 배정된 시험 공부가 없어요.',tag:'ppa-daily',category:'daily',url:'/index.html?screen=focus'});}
 if(prefs.timer && snapshot.timer?.running && snapshot.timer.deadline && snapshot.timer.deadline<=Date.now())events.push({id:'goal:'+snapshot.timer.session,title:'공부 목표 달성 ✓',body:snapshot.timer.subject+' 목표를 달성했어요. 수고했어요!',tag:'ppa-timer',category:'timer',url:'/index.html?screen=focus'});
 for(const event of events){const r=await environment.DB.prepare('INSERT OR IGNORE INTO push_events(id,device,payload,created) VALUES(?,?,?,?)').bind(device.id+':'+event.id,device.id,JSON.stringify(event),Date.now()).run();if(r.meta.changes){try{if(await wake(device,environment))sent++;}catch{}}}
 }
 await environment.DB.prepare('DELETE FROM push_events WHERE created<?').bind(Date.now()-7*86400000).run();return sent;
}
