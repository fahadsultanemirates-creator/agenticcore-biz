import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.116.0';
import {validateInterest,allowedOrigin} from './core.ts';
import { CORS_HEADERS } from '../_shared/cors.ts';
Deno.serve(async req=>{
 const origin=req.headers.get('origin')||'';
 if(!allowedOrigin(origin,Deno.env.get('BOT_WAITLIST_ALLOWED_ORIGINS')||''))return new Response('Forbidden',{status:403});
 const headers={...CORS_HEADERS,'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json'};
 const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply({error:'Method not allowed'},405);
 if(Number(req.headers.get('content-length')||0)>10000)return reply({error:'Request too large'},413);
 const salt=Deno.env.get('BOT_WAITLIST_HASH_SALT');const token=Deno.env.get('TELEGRAM_BOT_TOKEN');const owner=Deno.env.get('OWNER_TELEGRAM_ID');
 if(!salt||!token||!owner)return reply({error:'Registration is not configured'},503);
 let input;try{const text=await req.text();if(text.length>10000)return reply({error:'Request too large'},413);input=validateInterest(JSON.parse(text));}catch{return reply({error:'Invalid request'},400);}
 if(!input)return reply({error:'Please check the form fields and consent'},400);
 const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'';
 if(!ip)return reply({error:'Unable to register this request'},400);
 const ip_hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(salt+':'+ip)))).map(x=>x.toString(16).padStart(2,'0')).join('');
 const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
 const {count,error:rateError}=await db.from('bot_waitlist').select('id',{count:'exact',head:true}).eq('ip_hash',ip_hash).gte('created_at',new Date(Date.now()-3600000).toISOString());
 if(rateError)return reply({error:'Registration unavailable'},503);
 if((count||0)>=5)return reply({error:'Please try later'},429);
 const {data,error}=await db.from('bot_waitlist').insert({...input,ip_hash,consent_at:new Date().toISOString()}).select('id').single();
 if(error?.code==='23505')return reply({ok:true});
 if(error||!data)return reply({error:'Registration unavailable'},503);
 let sent=false;
 try{const result=await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:owner,text:`AgenticCore Bot — early-access request\nReference: ${data.id}\nName: ${input.name}\nEmail: ${input.email}\nBusiness: ${input.business}\nNeeds: ${input.needs}`,disable_web_page_preview:true}),signal:AbortSignal.timeout(10000)});const payload=await result.json();sent=result.ok&&payload.ok===true;}catch{/* Keep pending registration for owner follow-up. Never log tokens or personal data. */}
 await db.from('bot_waitlist').update({notification_status:sent?'sent':'failed',notified_at:sent?new Date().toISOString():null}).eq('id',data.id);
 return reply({ok:true});
});
