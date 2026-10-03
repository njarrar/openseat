// Sample award-availability generator. Deterministic mock data, not live airline data.
export const AIRPORTS=[
{c:'DXB',city:'Dubai',ar:'دبي',country:'UAE',arC:'الإمارات',lat:25.25,lon:55.36,tz:4},
{c:'AUH',city:'Abu Dhabi',ar:'أبوظبي',country:'UAE',arC:'الإمارات',lat:24.43,lon:54.65,tz:4},
{c:'DOH',city:'Doha',ar:'الدوحة',country:'Qatar',arC:'قطر',lat:25.27,lon:51.61,tz:3},
{c:'RUH',city:'Riyadh',ar:'الرياض',country:'Saudi Arabia',arC:'السعودية',lat:24.96,lon:46.7,tz:3},
{c:'JED',city:'Jeddah',ar:'جدة',country:'Saudi Arabia',arC:'السعودية',lat:21.68,lon:39.16,tz:3},
{c:'KWI',city:'Kuwait City',ar:'الكويت',country:'Kuwait',arC:'الكويت',lat:29.24,lon:47.97,tz:3},
{c:'BAH',city:'Manama',ar:'المنامة',country:'Bahrain',arC:'البحرين',lat:26.27,lon:50.63,tz:3},
{c:'MCT',city:'Muscat',ar:'مسقط',country:'Oman',arC:'عُمان',lat:23.59,lon:58.28,tz:4},
{c:'LHR',city:'London',ar:'لندن',country:'United Kingdom',arC:'المملكة المتحدة',lat:51.47,lon:-0.45,tz:1},
{c:'CDG',city:'Paris',ar:'باريس',country:'France',arC:'فرنسا',lat:49.0,lon:2.55,tz:2},
{c:'IST',city:'Istanbul',ar:'إسطنبول',country:'Türkiye',arC:'تركيا',lat:41.26,lon:28.74,tz:3},
{c:'JFK',city:'New York',ar:'نيويورك',country:'United States',arC:'الولايات المتحدة',lat:40.64,lon:-73.78,tz:-4},
{c:'BOM',city:'Mumbai',ar:'مومباي',country:'India',arC:'الهند',lat:19.09,lon:72.87,tz:5.5},
{c:'MLE',city:'Malé',ar:'ماليه',country:'Maldives',arC:'المالديف',lat:4.19,lon:73.53,tz:5},
{c:'BKK',city:'Bangkok',ar:'بانكوك',country:'Thailand',arC:'تايلاند',lat:13.69,lon:100.75,tz:7},
{c:'SIN',city:'Singapore',ar:'سنغافورة',country:'Singapore',arC:'سنغافورة',lat:1.36,lon:103.99,tz:8},
{c:'NRT',city:'Tokyo',ar:'طوكيو',country:'Japan',arC:'اليابان',lat:35.77,lon:140.39,tz:9},
{c:'SYD',city:'Sydney',ar:'سيدني',country:'Australia',arC:'أستراليا',lat:-33.94,lon:151.18,tz:10}];
export const AP=Object.fromEntries(AIRPORTS.map(a=>[a.c,a]));
export const CARRIERS=[
{id:'EK',airline:'Emirates',arAirline:'طيران الإمارات',program:'Skywards',arProgram:'سكاي واردز',unit:'miles',arUnit:'ميل',hub:'DXB',site:'emirates.com',url:'https://www.emirates.com',term:'Classic Rewards',arTerm:'Classic Rewards',fleet:['A380-800','777-300ER','A350-900'],first:['A380-800','777-300ER'],pe:['A380-800','A350-900'],mul:1.08,tax:[60,0.034]},
{id:'EY',airline:'Etihad',arAirline:'الاتحاد للطيران',program:'Etihad Guest',arProgram:'ضيف الاتحاد',unit:'miles',arUnit:'ميل',hub:'AUH',site:'etihad.com',url:'https://www.etihad.com',term:'Book with miles',arTerm:'الحجز بالأميال',fleet:['787-9','A350-1000','777-300ER','A380-800'],first:['A380-800'],pe:[],mul:0.97,tax:[42,0.02]},
{id:'QR',airline:'Qatar Airways',arAirline:'الخطوط القطرية',program:'Privilege Club',arProgram:'نادي الامتياز',unit:'Avios',arUnit:'أفيوس',hub:'DOH',site:'qatarairways.com',url:'https://www.qatarairways.com',term:'Book with Avios',arTerm:'الحجز بنقاط أفيوس',fleet:['A350-1000','777-300ER','787-9','A380-800'],first:['A380-800'],pe:[],mul:1.0,tax:[36,0.016]}];
export const car=id=>CARRIERS.find(c=>c.id===id)||CARRIERS[0];
export const CABINS=[
{id:'economy',en:'Economy',short:'Economy',ar:'الاقتصادية',arShort:'اقتصادية'},
{id:'premium',en:'Premium Economy',short:'Premium',ar:'الاقتصادية الممتازة',arShort:'ممتازة'},
{id:'business',en:'Business',short:'Business',ar:'رجال الأعمال',arShort:'أعمال'},
{id:'first',en:'First',short:'First',ar:'الأولى',arShort:'أولى'}];
export const cabin=id=>CABINS.find(c=>c.id===id)||CABINS[2];
const BANDS=[1200,3000,5500,8000];
const BASE={economy:[9000,16000,26000,36000,47000],premium:[14500,25500,41500,57500,75000],business:[22000,42000,72000,88000,112000],first:[36000,62000,108000,138000,172000]};
const SLOTS=[130,475,540,865,1215,1290];
export const hsh=s=>{let x=2166136261;for(let i=0;i<s.length;i++){x^=s.charCodeAt(i);x=Math.imul(x,16777619);}x^=x>>>13;x=Math.imul(x,0x5bd1e995);x^=x>>>15;return (x>>>0)/4294967296;};
const km=(a,b)=>{const R=6371,t=Math.PI/180,A=AP[a],B=AP[b];const dLa=(B.lat-A.lat)*t,dLo=(B.lon-A.lon)*t;const s=Math.sin(dLa/2)**2+Math.cos(A.lat*t)*Math.cos(B.lat*t)*Math.sin(dLo/2)**2;return 2*R*Math.asin(Math.sqrt(s));};
const hrs=d=>d/810+0.5;
const band=d=>{let i=0;while(i<BANDS.length&&d>BANDS[i])i++;return i;};
export const fmtT=m=>{m=((m%1440)+1440)%1440;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');};
export const fmtD=(h,ar)=>{const m=Math.round(h*12)*5;return ar?Math.floor(m/60)+'س '+String(m%60).padStart(2,'0')+'د':Math.floor(m/60)+'h '+String(m%60).padStart(2,'0')+'m';};
export const keyOf=d=>d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
export const num=n=>n.toLocaleString('en-US');
export const today0=()=>{const d=new Date();d.setHours(0,0,0,0);return d;};

export function schedule(c,O,D){
  const direct=O===c.hub||D===c.hub;
  const legs=direct?[[O,D]]:[[O,c.hub],[c.hub,D]];
  const n=1+Math.floor(hsh(c.id+O+D)*3);
  const start=Math.floor(hsh(D+O+c.id)*SLOTS.length);
  const out=[];
  for(let i=0;i<n;i++){
    const dep=SLOTS[(start+i*2)%SLOTS.length]+Math.floor(hsh(c.id+O+D+i)*4)*5;
    let total=0,dist=0,longest=0,ac='';const nums=[];
    legs.forEach(([a,b])=>{const d=km(a,b);dist+=d;total+=hrs(d);nums.push(c.id+' '+(1+Math.floor(hsh(c.id+a+b)*780)*2+i*2));if(d>longest){longest=d;ac=c.fleet[Math.floor(hsh(c.id+a+b+i)*c.fleet.length)];}});
    const lay=direct?0:1.3+hsh(O+D+i+'l')*2.2;total+=lay;
    const arr=dep+Math.round(total*60)+Math.round((AP[D].tz-AP[O].tz)*60);
    out.push({key:c.id+O+D+i,dep,arr,dayOff:Math.floor(arr/1440),total,dist,nums,ac,direct,lay,hub:c.hub,O,D,
      first:c.first.includes(ac)&&longest>2000,pe:c.pe.includes(ac)&&longest>2000});
  }
  return out.sort((a,b)=>a.dep-b.dep);
}
export function seatsFor(f,dk,cab,daysOut,dow){
  if(cab==='first'&&!f.first)return null;
  if(cab==='premium'&&!f.pe)return null;
  const r=hsh(f.key+dk+cab),r2=hsh(dk+cab+f.key+'q');
  const th={economy:0.22,premium:0.42,business:0.55,first:0.7}[cab]-(daysOut<14?0.18:0)+((dow===4||dow===5)?0.12:0);
  if(r<th)return 0;
  return 1+Math.floor(r2*{economy:9,premium:4,business:4,first:2}[cab]);
}
export const milesFor=(c,cab,d)=>Math.round(BASE[cab][band(d)]*c.mul/500)*500;
export const taxFor=(c,cab,d)=>Math.round((c.tax[0]+d*c.tax[1])*{economy:1,premium:1.2,business:1.45,first:1.7}[cab]);

// Scan n days from today for a route. Returns per-day availability for every cabin.
export function scan({carrier,from,to,pax=1,n=90}){
  const rc=car(carrier),sched=schedule(rc,from,to),t=today0(),days=[];
  for(let i=0;i<n;i++){
    const d=new Date(t);d.setDate(d.getDate()+i);const dk=keyOf(d),dow=(d.getDay()+6)%7;
    const fl=sched.map(f=>({f,seats:Object.fromEntries(CABINS.map(cb=>[cb.id,seatsFor(f,dk,cb.id,i,dow)]))}));
    const by={};
    CABINS.forEach(cb=>{const q=fl.filter(x=>(x.seats[cb.id]||0)>=pax);
      by[cb.id]={count:q.length?Math.max(...q.map(x=>x.seats[cb.id])):0,minMiles:q.length?Math.min(...q.map(x=>milesFor(rc,cb.id,x.f.dist))):0,nq:q.length,offered:fl.some(x=>x.seats[cb.id]!==null)};});
    days.push({date:d,key:dk,i,dow,fl,by});
  }
  const byKey=Object.fromEntries(days.map(d=>[d.key,d]));
  return {rc,sched,days,byKey};
}
