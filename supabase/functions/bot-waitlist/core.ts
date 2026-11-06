export function validateInterest(input: unknown) {
 const b = input as Record<string,unknown>;
 if(!b || typeof b!=='object' || b.consent!==true) return null;
 const limits:Record<string,[number,number]>={name:[1,120],email:[3,254],business:[1,180],needs:[10,2000]};
 const out:Record<string,string>={};
 for(const [key,[min,max]] of Object.entries(limits)){if(typeof b[key]!=='string')return null;const value=(b[key] as string).trim();if(value.length<min||value.length>max)return null;out[key]=value;}
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email))return null;
 out.email=out.email.toLowerCase();return out;
}
export function allowedOrigin(origin:string,extras:string=''){
 return ['https://agenticcore.biz',...extras.split(',').map(x=>x.trim()).filter(Boolean)].includes(origin);
}
