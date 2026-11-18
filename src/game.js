import { createFlightEngine } from './flight-engine.js';
import { createTutorial } from './tutorial.js';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const rng=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)],limit=(n,a,b)=>Math.max(a,Math.min(b,n));
const money=n=>Math.floor(n).toLocaleString('ko-KR')+'원',metre=n=>Math.max(0,n).toFixed(0)+'m',safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SAVE='fly_post_office_save_v4_map_streak',GAME_VERSION=11;
const planeDefs=[
{id:'basic',name:'연습용 종이비행기',price:100,dur:5,speed:1,glide:1,stable:1,lift:1,color:'#fffdf3',accent:'#eacb9b',desc:'가장 기본적인 비행기'},
{id:'light',name:'가벼운 편지비행기',price:250,dur:6,speed:1.08,glide:1.12,stable:.82,lift:1.13,color:'#fefbf5',accent:'#73c3da',desc:'장거리 유리 · 바람에 약함'},
{id:'stable',name:'안정형 우편비행기',price:500,dur:8,speed:.94,glide:1,stable:1.36,lift:1.01,color:'#fff6dc',accent:'#eaa24b',desc:'정밀 착륙에 유리'},
{id:'biplane',name:'쌍날개 종이비행기',price:1500,dur:10,speed:1.12,glide:1.28,stable:1.1,lift:1.25,color:'#e3faff',accent:'#6db9e4',desc:'상승기류 활용에 강함'},
{id:'balance',name:'무게중심 조절기',price:3500,dur:12,speed:1.08,glide:1.1,stable:1.65,lift:1.05,color:'#eaffec',accent:'#67c390',desc:'바람 영향이 작음'},
{id:'waterproof',name:'방수 코팅 비행기',price:8000,dur:15,speed:1.18,glide:1.2,stable:1.23,lift:1.1,color:'#d3f2ff',accent:'#489bd5',water:true,desc:'비에도 내구도가 잘 유지됨'},
{id:'carbon',name:'탄소섬유 종이비행기',price:25000,dur:20,speed:1.33,glide:1.38,stable:1.43,lift:1.27,color:'#d3e2e7',accent:'#4f6a7c',desc:'빠르고 튼튼함'},
{id:'gold',name:'황금 우편비행기',price:80000,dur:25,speed:1.45,glide:1.42,stable:1.52,lift:1.33,color:'#ffe790',accent:'#d9a344',bonus:.05,desc:'보수 5% 추가'},
{id:'star',name:'별빛 장거리 비행기',price:250000,dur:30,speed:1.62,glide:1.68,stable:1.2,lift:1.75,color:'#e2dcff',accent:'#8d80e5',upBoost:2,desc:'상승기류 효과 2배'},
{id:'royal',name:'왕실 특급 우편기',price:1000000,dur:40,speed:1.88,glide:1.84,stable:1.92,lift:1.7,color:'#f2dcff',accent:'#c092de',bonus:.12,desc:'최고급 장거리·정밀 성능'}];
const planeUnlockLevels={basic:1,light:2,stable:3,biplane:4,balance:5,waterproof:7,carbon:10,gold:13,star:17,royal:22};
const epicPlaneWeights=[18,16,14,12,11,10,8,6,3,2];
function planeUnlockLevel(def){return planeUnlockLevels[def.id]||1;}
function planeUnlocked(def){return rankLevel()>=planeUnlockLevel(def);}
function planePrice(def){return Math.ceil(def.price*((state.planeCoupons?.[def.id]||0)>0 ? .5 : 1));}
function markPlaneSeen(id){state.newPlaneIds=(state.newPlaneIds||[]).filter(x=>x!==id);renderAll();autosave();}
const weatherDefs=[
{id:'clear',name:'맑음',icon:'☀️',wind:.75,drag:1,lift:1,wear:0,desc:'대체로 안정'},
{id:'breeze',name:'산들바람',icon:'🍃',wind:1.15,drag:1,lift:1.04,wear:0,desc:'약한 바람'},
{id:'gale',name:'강풍',icon:'💨',wind:2.15,drag:1.09,lift:1.08,wear:.5,desc:'강한 바람 가능'},
{id:'rain',name:'비',icon:'🌧️',wind:1.35,drag:1.12,lift:.92,wear:1.2,desc:'비가 올 수 있음'},
{id:'snow',name:'눈',icon:'❄️',wind:.92,drag:1.23,lift:.86,wear:.2,desc:'눈이 내릴 가능성'},
{id:'fog',name:'안개',icon:'🌫️',wind:1.08,drag:1.06,lift:.98,wear:0,desc:'시야 흐림'},
{id:'thermal',name:'상승기류',icon:'🌀',wind:1.15,drag:.93,lift:1.18,wear:0,desc:'따뜻한 기류'},
{id:'storm',name:'난기류',icon:'🌪️',wind:1.75,drag:1.1,lift:1.06,wear:.8,desc:'변덕스러운 기류'}];
const packages=[
{id:'regular',name:'일반 편지',weight:1,pay:1,description:'표준 우편'},
{id:'urgent',name:'급행 편지',weight:1.006,pay:1.24,description:'급한 배달'},
{id:'fragile',name:'파손주의',weight:1.008,pay:1.4,fragile:true,description:'충돌에 민감'},
{id:'heavy',name:'두꺼운 소포',weight:1.012,pay:1.45,description:'무겁지만 보수 많음'},
{id:'vip',name:'VIP 특별우편',weight:1.009,pay:1.75,strict:true,description:'평가가 까다로움'},
{id:'priority',name:'축제 초대장',weight:.94,pay:1.18,description:'가벼운 우편'},
{id:'sealed',name:'봉인된 편지',weight:1.004,pay:1.30,description:'안전한 배달 요구'},
{id:'festival',name:'축제 특별 초대장',weight:.93,pay:1.33,description:'축제 당일만 받는 보너스'},
{id:'secret',name:'수수께끼 편지',weight:1.008,pay:1.51,description:'어떤 일이 벌어질지 모름'},
{id:'museum',name:'박물관 소장품',weight:1.012,pay:1.68,fragile:true,description:'충격에 아주 약한 화물'}];
const regions=[{name:'햇살 마을',sky:['#a8e4fa','#e3f7f2'],hill:'#a3dba6',ground:'#6bc79e'},
{name:'호숫가',sky:['#a9e2f0','#e1f8fc'],hill:'#9edbd6',ground:'#66bfc0'},
{name:'노을 골목',sky:['#ffcfaf','#fff3d7'],hill:'#ddc09d',ground:'#b3cd8b'},
{name:'꽃길 언덕',sky:['#c6d9fa','#f8eaf9'],hill:'#c6d7a7',ground:'#8cc7a7'},
{name:'높은 산길',sky:['#b8d6ec','#eef5f9'],hill:'#a6c1d1',ground:'#79b69d'}];
const newState=()=>({reputationBonus:0,reputationBuys:0,delivery:null,gameMode:'random',stageSelected:1,stageUnlocked:1,stageStars:{},stageWins:0,version:GAME_VERSION,money:1200,day:1,month:1,round:0,playsToday:0,forcedCustomers:0,forecastTickets:1,adFixUsedToday:0,goodRaw:0,crates:1,cratePity:0,boosts:{shield:0,tailwind:0},daily:null,riskMode:false,insuranceOn:false,sound:true,finance:{earned:0,spent:0,borrowed:0,winEvents:0,lossEvents:0,last:null,ledger:[]},stars:[],monthStars:[],records:[],logs:[],owned:{basic:[{dur:5,maxDur:5}]},selectedPlaneKey:'basic:0',debts:[],current:null,flightState:'ready',lastResult:null,gameOver:false,gameOverReason:'',ai:{enabled:false,player:0,bot:0,draw:0,history:[]}});
let state=newState(),started=false,flight=null,cameraX=0,nextTimer=null,saveDelay=0;
let cameraAim=0,manualCamera=false,sceneDrag=null,zoomNow=1,zoomInitialized=false,groundLift=0;
const world=$('#world'),map=$('#forecastMap'),mctx=map.getContext('2d');
let W=1,H=1,mapW=1,mapH=1,mapDpr=1,mapEnd=0,mapView=0,mapRAF=0,mapDrag=null,modalTask=null,toastTimer=0;
function aStars(values=state.stars){const ar=values.slice(-20),raw=ar.length?ar.reduce((a,b)=>a+b,0)/ar.length:3;return limit(raw+(state.reputationBonus||0),1,5)}
const debtSum=()=>state.debts.reduce((sum,d)=>sum+d.amount,0);
const overdue=()=>Math.max(0,...state.debts.map(d=>state.day-d.due));
function repLabel(){const n=aStars();return n>=4.5?'매우 좋음':n>=4?'좋음':n>=3?'보통':n>=2.5?'저조':n>=2?'나쁨':'위험'}
function level(){return Math.min(13,Math.floor(4.2*Math.log2(1+state.round/24)))}
function accRules(){const t=limit((state.gameMode==='stage'?state.stageSelected:state.round)/160,0,1),blend=(x,y)=>x+(y-x)*t;return {five:blend(12,3.5),four:blend(30,8),three:blend(60,17),two:blend(105,34)}}
function distanceGoal(){const n=state.gameMode==='stage'?Math.max(0,state.stageSelected-1):Math.max(0,state.round);return Math.round((500+Math.min(1550,n*19+45*Math.sqrt(n)))/10)*10}
function distanceRules(g){return {two:g*.46,three:g,four:g*1.23,five:g*1.55}}
function getAccStar(error,r=accRules()){return error<=r.five?5:error<=r.four?4:error<=r.three?3:error<=r.two?2:1}
function getDistStar(distance,g){const r=distanceRules(g);return distance>=r.five?5:distance>=r.four?4:distance>=r.three?3:distance>=r.two?2:1}
const stars=n=>'★★★★★'.slice(0,n)+'☆☆☆☆☆'.slice(0,5-n);
const comboCount=()=>Math.max(0,state.goodRaw-1),comboLevel=()=>comboCount()>0?Math.min(10,Math.ceil(comboCount()/2)):0;
// Daily quests rotate across four modes; reward is claimed manually in the office.
const dailyDefs=[
 {type:'stars',name:'칭찬 도장',desc:'4★ 이상 배달 2회',target:2},
 {type:'clean',name:'무사고 우편',desc:'장애물 충돌 없이 2회',target:2},
 {type:'long',name:'멀리멀리',desc:'장거리 희망 거리 달성 1회',target:1},
 {type:'winds',name:'하늘의 길',desc:'상승기류에 진입 1회',target:1}
];
function dailyQuest(){const d=dailyDefs[(state.day-1)%dailyDefs.length];if(!state.daily||state.daily.day!==state.day||!dailyDefs.some(q=>q.type===state.daily.type))state.daily={day:state.day,type:d.type,progress:0,claimed:false};return {def:dailyDefs.find(q=>q.type===state.daily.type)||d,prog:state.daily}}
function progressQuest(star,f,c){const q=dailyQuest(),s=state.daily;if(s.claimed||s.progress>=q.def.target)return;
 let ok=q.def.type==='stars'?star>=4:q.def.type==='clean'?f.collisions===0:q.def.type==='long'?c.type==='distance'&&f.x>=c.goal:!!f.touchedUp;
 if(ok){s.progress=Math.min(q.def.target,s.progress+1);if(s.progress>=q.def.target){banner('🎯 오늘의 미션 달성! 우체국에서 보상을 받으세요');sfx('quest')}}}
function claimDaily(){const q=dailyQuest();if(q.prog.claimed)return notify('오늘 보상은 이미 받았습니다');if(q.prog.progress<q.def.target)return notify('오늘의 미션을 더 진행하세요');q.prog.claimed=true;const cash=420+state.day*28;state.money+=cash;state.crates++;addLog('오늘의 미션 달성 · '+money(cash)+' / 상자 1개');sparkles('🌟',19);banner('🎯 미션 보상 '+money(cash)+' · 상자 1개');sfx('win');renderAll();autosave()}
function refreshChest(){const c=$('#chestCount');if(c)c.textContent=String(state.crates);const b=$('#chestBtn');if(b)b.disabled=state.crates<=0;const o=$('#lootOpenBtn');if(o)o.disabled=state.crates<=0}
let audioCtx=null;
let audioBus=null,lastSoftSound=0;
function sfx(type){
 if(!state.sound||document.hidden)return;
 const soft=['tap','event','coin','correct'].includes(type),now=performance.now();
 if(soft&&now-lastSoftSound<110)return;if(soft)lastSoftSound=now;
 try{
  audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();
  if(audioCtx.state==='suspended')audioCtx.resume();
  if(!audioBus){audioBus=audioCtx.createGain();audioBus.gain.value=.38;const limiter=audioCtx.createDynamicsCompressor();limiter.threshold.value=-20;limiter.ratio.value=8;audioBus.connect(limiter).connect(audioCtx.destination);}
  const patterns={launch:[[360,.09],[580,.19]],hit:[[165,.12]],win:[[523,.13],[659,.16],[784,.36]],clear:[[523,.20],[659,.20],[784,.24],[1047,.62]],perfect:[[523,.17],[659,.17],[784,.20],[1047,.35],[1319,.65]],level:[[392,.17],[523,.20],[659,.22],[784,.27],[1047,.65]],rare:[[600,.14],[820,.20],[1100,.48]],quest:[[500,.14],[740,.32]],brake:[[260,.12]],event:[[460,.09]],tap:[[740,.045]],coin:[[1080,.06],[1440,.13]],stamp:[[210,.06],[420,.15]],correct:[[480,.07]],streak:[[523,.14],[698,.20],[880,.34]],extinguish:[[330,.19],[247,.24],[165,.38]]};
  const start=audioCtx.currentTime;let pos=0;
  for(const [freq,dur] of patterns[type]||patterns.event){
   const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();osc.type=type==='hit'?'triangle':'sine';osc.frequency.setValueAtTime(freq,start+pos);
   gain.gain.setValueAtTime(.0001,start+pos);gain.gain.exponentialRampToValueAtTime(soft?.055:.115,start+pos+.012);gain.gain.exponentialRampToValueAtTime(.0001,start+pos+dur);
   osc.connect(gain).connect(audioBus);osc.start(start+pos);osc.stop(start+pos+dur+.025);pos+=dur*.83;
  }
 }catch(e){}
}
let bannerTimer=null;
function banner(text){if(document.body.classList.contains('playing')&&(/행운 상자 획득|미션 달성|레벨 .*달성|업적 달성/.test(text)))return;const e=$('#arcadeToast');e.textContent=text;e.classList.remove('live');void e.offsetWidth;e.classList.add('live');clearTimeout(bannerTimer);bannerTimer=setTimeout(()=>e.classList.remove('live'),2300)}
function sparkles(token='✨',count=18){const wrap=$('#fxLayer');if(!wrap)return;for(let i=0;i<count;i++){const sp=document.createElement('span');sp.className='fx-bit';sp.textContent=token==='mix'?pick(['✨','⭐','✦','💛','🌟']):token;const th=Math.PI*2*i/count,dist=rng(62,Math.min(205,Math.max(85,W*.26)));sp.style.setProperty('--dx',Math.cos(th)*dist+'px');sp.style.setProperty('--dy',Math.sin(th)*dist+'px');sp.style.setProperty('--rot',rng(-190,190)+'deg');sp.style.setProperty('--duration',rng(.76,1.45)+'s');wrap.append(sp);setTimeout(()=>sp.remove(),1600)}}
function maybeChest(star,f){state.cratePity=(state.cratePity||0)+1;const odds=.18+(star===5?.12:0)+(f.luckyCollected?.12:0)+(star>=4?.06:0);if(Math.random()<odds||state.cratePity>=5){state.crates=Math.min(30,(state.crates||0)+1);state.cratePity=0;banner('🎁 행운 상자 획득! 상점이나 비행 화면에서 열 수 있습니다');return true}return false}
function grantPlane(id){const def=planeDefs.find(d=>d.id===id)||planeDefs[1];state.owned[def.id] ||= [];state.owned[def.id].push({dur:def.dur,maxDur:def.dur});return def.name}
function rollLoot(mult=1,positiveOnly=false){
 // Risk is part of the in-game draw: 16% loss, 84% positive prize.
 if(!positiveOnly&&Math.random()<.16){
  const lv=level(),major=Math.random()<.34;
  const cost=Math.floor((major?rng(960,2100):rng(290,800))+lv*(major?100:46));
  const title=major?'운송 사고 청구서':'깜짝 우편 수수료';
  const icon=major?'🚨':'📨';
  pay(cost,title); state.finance.lossEvents++; flashLoss();
  banner('⚠️ 뽑기에서 손실 발생 · '+money(cost));
  return{icon,title,text:`-${money(cost)} · 현금 부족 시 자동으로 대출이 발생합니다.`,tier:'loss',loss:cost}
 }
 const roll=Math.random(),tier=roll<.56?'common':roll<.84?'rare':roll<.96?'epic':'legendary',lv=level();let reward;
 if(tier==='common'){
  const k=Math.random();if(k<.48){const amount=Math.floor(rng(320,700)+lv*35)*mult;credit(amount,'뽑기 · 작은 황금 봉투');reward={icon:'💰',title:'작은 황금 봉투',text:money(amount)+'을 받았습니다!'}}
  else if(k<.77){const s=selectedPlane(),old=s?.p.dur||0;if(s)s.p.dur=Math.min(s.p.maxDur,s.p.dur+3*mult);if(mult>1&&(s?.p.dur||0)>old){const overflow=3*mult-((s?.p.dur||0)-old);if(overflow>0)state.boosts.shield+=overflow;return {icon:'🛠️',title:'긴급 수리 키트',text:'내구도 '+((s?.p.dur||0)-old)+' 회복'+(overflow?' · 보호막 '+overflow+'개':''),tier}}reward=(s?.p.dur||0)>old?{icon:'🛠️',title:'긴급 수리 키트',text:'내구도 '+((s?.p.dur||0)-old)+' 회복'}:(state.boosts.shield+=mult,{icon:'🛡️',title:'수리 쿠폰 교환',text:'방어막 '+mult+'개 획득'})}
  else{state.boosts.shield+=mult;reward={icon:'🛡️',title:'충돌 방어막',text:'방어막 '+mult+'개 획득'}}
 }else if(tier==='rare'){
  const k=Math.random();if(k<.48){const amount=Math.floor(rng(1000,2100)+lv*85)*mult;credit(amount,'뽑기 · 희귀 코인');reward={icon:'💎',title:'빛나는 코인 뭉치',text:money(amount)+'을 받았습니다!'}}
  else if(k<.78){state.boosts.tailwind+=2*mult;reward={icon:'🍀',title:'행운의 순풍',text:'순풍 '+2*mult+'회 · 발사 속도 +10%'}}
  else{state.boosts.shield+=2*mult;reward={icon:'🛡️',title:'강화 보호막',text:'방어막 '+2*mult+'개 획득'}}
 }else if(tier==='epic'){
  if(Math.random()<.68){const amount=Math.floor(rng(3100,5500)+lv*140)*mult;credit(amount,'뽑기 · 영웅 보너스');reward={icon:'🌈',title:'프리미엄 우편 보너스',text:money(amount)+' 획득!'}}
  else{state.planeCoupons.stable=(state.planeCoupons.stable||0)+mult;reward={icon:'🎟️',title:'영웅 비행기 할인권',text:'안정형 우편비행기 50% 할인권 '+mult+'개 · Lv.'+planeUnlockLevels.stable+'부터 구매'}}
 }else{
  if(Math.random()<.6){const amount=Math.floor(rng(9200,14500)+lv*360)*mult;credit(amount,'뽑기 · 전설 계약');reward={icon:'👑',title:'전설의 황금 계약',text:money(amount)+' 획득!'}}
  else{state.planeCoupons.carbon=(state.planeCoupons.carbon||0)+mult;reward={icon:'👑',title:'전설 비행기 할인권',text:'탄소섬유 종이비행기 50% 할인권 '+mult+'개 · Lv.'+planeUnlockLevels.carbon+'부터 구매'}}
 }
 return {...reward,tier}
}

let openingLoot=false,lootPending=false;
function openChestUI(){if(state.gameOver)return notify('게임 오버 상태입니다');if(state.flightState==='flying'||$('#mapOverlay').classList.contains('show'))return notify('비행 중에는 열 수 없습니다');if($('#lootOverlay').classList.contains('show'))return; if(state.crates<=0)return notify('상자를 먼저 획득하세요. 4~5★ 배달에 도전!');if(state.flightState==='result'){clearTimeout(nextTimer);lootPending=true}openingLoot=false;$('#lootChest').textContent='🎁';$('#lootChest').classList.remove('opened');$('#lootTitle').textContent='행운 상자';$('#lootRarity').className='loot-rarity';$('#lootRarity').textContent='확률 보상';$('#lootMessage').textContent='등급에 따라 보상이 달라집니다.';$('#lootOpenBtn').textContent='상자 열기';$('#lootOpenBtn').disabled=false;$('#lootCloseBtn').disabled=false;$('#lootOverlay').classList.add('show');refreshChest()}
function revealLoot(){if(openingLoot||state.crates<=0)return;openingLoot=true;$('#lootOpenBtn').disabled=true;$('#lootCloseBtn').disabled=true;$('#lootTitle').textContent='두근두근…';$('#lootMessage').textContent='상자 속 선물을 확인하는 중!';$('#lootChest').classList.remove('opened');$('#lootChest').textContent='🎁';sfx('event');setTimeout(()=>{state.crates--;const r=rollLoot();$('#lootChest').textContent=r.icon;$('#lootChest').classList.add('opened');$('#lootRarity').className='loot-rarity '+(r.tier==='common'?'':r.tier);$('#lootRarity').textContent={common:'일반',rare:'희귀',epic:'영웅',legendary:'전설'}[r.tier];$('#lootTitle').textContent=r.title;$('#lootMessage').textContent=r.text;$('#lootOpenBtn').textContent='다음 상자';$('#lootCloseBtn').disabled=false;openingLoot=false;refreshChest();$('#lootOpenBtn').disabled=state.crates<=0;sfx(r.tier==='loss'?'hit':r.tier==='common'?'win':'rare');if(r.tier==='epic'||r.tier==='legendary')sparkles('mix',30);addLog('상자 '+$('#lootRarity').textContent+' 보상 · '+r.title+' / '+r.text);renderAll();autosave()},1100)}
function closeChestUI(){if(openingLoot)return;$('#lootOverlay').classList.remove('show');if(lootPending){lootPending=false;if(state.flightState==='result'&&!state.gameOver&&started)scheduleNext()}}
function addLog(text){state.logs.unshift({day:state.day,text});state.logs=state.logs.slice(0,60);renderRecords()}
function notify(text){const el=$('#toast');el.textContent=text;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),1700)}
function autosave(){saveDelay=.45}
function save(){saveDelay=0;try{localStorage.setItem(SAVE,JSON.stringify({...state,current:null,lastResult:null,flightState:state.gameOver?'gameover':'ready'}))}catch(e){console.warn('Save failed',e)}}
function load(){try{let raw=localStorage.getItem(SAVE);if(!raw)return;let data=JSON.parse(raw);state={...newState(),...data};state.ai={...newState().ai,...(data.ai||{})};state.stars=Array.isArray(data.stars)?data.stars:[];state.monthStars=Array.isArray(data.monthStars)?data.monthStars:[];state.logs=Array.isArray(data.logs)?data.logs:[];state.records=Array.isArray(data.records)?data.records:[];state.debts=Array.isArray(data.debts)?data.debts:[];state.owned=data.owned&&typeof data.owned==='object'?data.owned:{basic:[{dur:5,maxDur:5}]};state.current=null;state.lastResult=null;state.flightState=state.gameOver?'gameover':'ready';state.forecastTickets=Number.isFinite(state.forecastTickets)?state.forecastTickets:1;state.goodRaw=Number.isFinite(state.goodRaw)?state.goodRaw:0;state.money=Math.max(0,Number(state.money)||0);state.crates=Number.isFinite(state.crates)?Math.max(0,state.crates):(state.round===0?1:0);state.cratePity=Number.isFinite(state.cratePity)?state.cratePity:0;state.boosts={shield:0,tailwind:0,...(state.boosts||{})};state.riskMode=!!state.riskMode;state.sound=state.sound!==false;state.insuranceOn=!!state.insuranceOn;state.finance={earned:0,spent:0,borrowed:0,winEvents:0,lossEvents:0,last:null,ledger:[],...(data.finance||{})};state.finance.ledger=Array.isArray(state.finance.ledger)?state.finance.ledger:[];if(!state.owned.basic)state.owned.basic=[{dur:5,maxDur:5}];}catch(e){console.warn('Invalid save',e);state=newState()}}
function ownedFlat(){let out=[];for(const def of planeDefs)(state.owned[def.id]||[]).forEach((plane,i)=>out.push({def,p:plane,key:def.id+':'+i,index:i}));return out}
function selectedPlane(){return ownedFlat().find(x=>x.key===state.selectedPlaneKey)||ownedFlat().find(x=>x.p.dur>0)||ownedFlat()[0]}
function ensurePlane(){let s=selectedPlane();if(s?.p.dur>0)return s;let usable=ownedFlat().find(x=>x.p.dur>0);if(usable){state.selectedPlaneKey=usable.key;return usable}const def=planeDefs[0];pay(def.price,'필수 비행기 구매');state.owned.basic=state.owned.basic||[];state.owned.basic.push({dur:def.dur,maxDur:def.dur});state.selectedPlaneKey='basic:'+(state.owned.basic.length-1);addLog('기본 비행기 자동 재구매');checkGameOver();return selectedPlane()}
function ledger(amount,reason,type='expense'){
 state.finance ||= {earned:0,spent:0,borrowed:0,winEvents:0,lossEvents:0,last:null,ledger:[]};
 const f=state.finance; f.ledger ||= [];
 f.ledger.unshift({day:state.day,amount:Math.round(amount),reason,type});f.ledger=f.ledger.slice(0,28);
 f.last={amount:Math.round(amount),reason,type};
 if(type==='income')f.earned+=Math.max(0,amount);
 else if(type==='expense')f.spent+=Math.max(0,-amount);
 else if(type==='loan')f.borrowed+=Math.max(0,amount);
}
function credit(amount,reason){const a=Math.max(0,Math.floor(amount));if(a>0){state.money+=a;ledger(a,reason,'income')}return a}
function debtCreate(cost,reason){const missing=Math.max(1,cost-state.money),newDebt=Math.ceil((missing*1.25+100)/10)*10;
 state.money=0;state.debts.push({amount:newDebt,reason,created:state.day,due:state.day+12,last:state.day});
 ledger(newDebt,reason,'loan');addLog('⚠ 대출 발생 · '+reason+' '+money(newDebt));notify('현금 부족 · 빚 '+money(newDebt));checkGameOver();return newDebt
}
function pay(cost,reason){cost=Math.max(0,Math.ceil(cost));if(!cost)return true;ledger(-cost,reason,'expense');
 if(state.money>=cost){state.money-=cost;return true}debtCreate(cost,reason);return false
}
function insurancePrice(){return Math.ceil((125+level()*24)/10)*10}
function rollSettlement(c,f,star){
 // Transparent, weighted events. Collisions and fragile cargo increase loss risk.
 const lossChance=limit(.35+(f.collisions||0)*.065+(c.pack.fragile?.045:0)+(c.pack.strict?.025:0),.35,.65);
 const p=Math.random(),lv=level();let event;
 if(p<lossChance){
  const k=Math.random();
  if(k<.48)event={icon:'📦',title:'추가 포장비',amount:-Math.floor(rng(190,460)+lv*37),detail:'거래처가 포장비를 추가로 청구했습니다.'};
  else if(k<.80)event={icon:'📋',title:'고객 클레임',amount:-Math.floor(rng(320,780)+lv*58+f.collisions*70),detail:'고객 불만 처리비가 발생했습니다.'};
  else event={icon:'🚨',title:'분실·파손 보상',amount:-Math.floor(rng(770,1620)+lv*96+f.collisions*110),detail:'큰 손실입니다. 배송보험이 있다면 보전됩니다.'};
 }else if(p<lossChance+.27){
  event=Math.random()<.55?{icon:'💌',title:'고객 감사 팁',amount:Math.floor(rng(180,510)+lv*28),detail:'고객이 추가 사례금을 보냈습니다.'}:{icon:'🎉',title:'지역 배송 지원금',amount:Math.floor(rng(380,930)+lv*52),detail:'지역 우편 지원금을 받았습니다.'};
 }else event={icon:'🧾',title:'정상 정산',amount:0,detail:'추가 수익이나 손실 없이 계약이 마무리됐습니다.'};
 return event
}
function flashLoss(){const v=$('#damagePulse');if(!v)return;v.classList.remove('hit');void v.offsetWidth;v.classList.add('hit');setTimeout(()=>v.classList.remove('hit'),950)}

function promoCost(){const a=aStars();let base=a>=4.5?80:a>=4?180:a>=3.5?450:a>=3?950:a>=2.5?2400:a>=2?6500:14000;return Math.floor(base*(1+level()*.13))}
function visitorChance(){if(state.forcedCustomers>0)return 1;let a=aStars();return a>=4.5?.96:a>=4?.88:a>=3?.68:a>=2.5?.45:a>=2?.28:.12}
function ensureVisitor(){if(state.round===0)return;if(state.forcedCustomers>0){state.forcedCustomers--;return}if(Math.random()<=visitorChance())return;const cost=promoCost();pay(cost,'자동 전단지 홍보');state.forcedCustomers=2;addLog('손님 부족 · 홍보 '+money(cost)+' / 총 3명 보장');notify('손님이 없어 전단지 홍보를 했습니다')}
function zoneList(maxX,weather){let list=[],up=weather.id==='thermal'?5:3,down=weather.id==='storm'?5:3;for(let i=0;i<up;i++)list.push({kind:'up',x:rng(70,maxX),w:rng(70,145),strength:rng(13,28)});for(let i=0;i<down;i++)list.push({kind:'down',x:rng(110,maxX),w:rng(60,120),strength:rng(12,25)});return list.sort((a,b)=>a.x-b.x)}
function obstacles(maxX){const kinds=['tree','pole','cat','line','bird','kite','balloon','window','carwind','alleywind'];let out=[];for(let i=0;i<8;i++)out.push({kind:pick(kinds),x:rng(55,maxX),alt:rng(22,74),height:rng(20,47),width:rng(7,17),used:false});return out.sort((a,b)=>a.x-b.x)}
function chooseType(){let n=Math.random();return n<.53?'accuracy':'distance'}
// Maximum extra weight is 1.2 percentage points (1.012 times standard weight).
function cargoWeight(pack,scenario){
 const heavy=pack.id==='heavy'||pack.id==='museum'||scenario?.id==='rush';
 const chance=heavy ? .14 : .07;
 return Math.random()<chance?Math.min(1.012,rng(1.001,1.012)):rng(.92,1);
}
function spawnCustomer(){if(state.gameOver||!started)return;clearTimeout(nextTimer);nextTimer=null;document.body.classList.remove('in-flight');$('#result').classList.remove('show');$('#stage').classList.remove('stage-result');ensureVisitor();if(state.gameOver)return;const type=chooseType(),weather=pick(weatherDefs),pack=pick(packages),roundDifficulty=level(),target=type==='accuracy'?Math.round(rng(68+roundDifficulty*9,185+roundDifficulty*20)):null,goal=type==='distance'?Math.round(distanceGoal()*rng(.92,1.12)/10)*10:null;const end=Math.max(1500,Math.max(target||0,goal||0)*1.9);let current={type,weather,pack,weight:cargoWeight(pack),wind:rng(-5.3,5.3)*weather.wind,target,goal,region:regions[Math.floor((state.round/5)%regions.length)],zones:zoneList(end,weather),obstacles:obstacles(end),mapSeen:false,mapUsed:false,luckyRing:{x:rng(95,Math.max(125,Math.min(end*.45,(target||goal||220)*.85))),y:rng(19,85),taken:false},customerName:pick(['민들레','푸른 지붕의 손님','꼬마 우체부','우산 가게 주인','호숫가 여행자','바람 연구원','꽃집 주인','골목길 이웃','별 구경 손님','초대장 보내는 친구'])};
state.current=current;state.flightState='ready';flight=null;cameraX=0;cameraAim=0;manualCamera=false;sceneDrag=null;updateMission();renderAll();autosave()}
function updateMission(){let c=state.current;if(!c)return;$('#missionName').textContent=c.type==='accuracy'?'정확 배달 의뢰':'장거리 배달 의뢰';$('#missionType').textContent=c.type==='accuracy'?'정확':'장거리';$('#missionType').classList.toggle('distance',c.type==='distance');$('#missionDesc').textContent=`${c.customerName} · ${c.pack.name} · 무게 ${(c.weight*100).toFixed(1)}% · ${c.type==='accuracy'?'목표 '+c.target+'m':'희망 '+c.goal+'m'}`;const r=c.type==='accuracy'?accRules():distanceRules(c.goal);$('#missionCriteria').innerHTML=c.type==='accuracy'?`<b>별점 기준 (오차)</b> 5★ ${r.five.toFixed(1)}m · 4★ ${r.four.toFixed(1)}m · 3★ ${r.three.toFixed(1)}m · 2★ ${r.two.toFixed(1)}m 이내`:`<b>별점 기준 (거리)</b> 5★ ${metre(r.five)} · 4★ ${metre(r.four)} · 3★ ${metre(r.three)} · 2★ ${metre(r.two)} 이상`;
$('#windHint').innerHTML=c.mapSeen?`${c.weather.icon} ${c.weather.name}<br>바람 ${c.wind>=0?'→':'←'} ${Math.abs(c.wind).toFixed(1)}`:`${c.weather.icon} 예보: ${c.weather.desc}`;$('#briefBtn').classList.toggle('riskOn',state.riskMode);$('#briefBtn').textContent=state.riskMode?'⚡ 도전 ON':'⚡ 특급 ±'}
function launch(){if(state.gameOver)return notify('게임 오버 상태입니다');if(state.flightState!=='ready'||!state.current)return notify('새 손님을 기다려주세요');const p=ensurePlane();if(!p||state.gameOver)return;const angle=Number($('#angle').value)*Math.PI/180,power=Number($('#power').value)/100,c=state.current;
const insured=!!state.insuranceOn;if(insured){const premium=insurancePrice();pay(premium,'이번 배송 보험료');if(state.gameOver)return;banner('🛡 배송 보험 가입 · '+money(premium));}const tailwind=state.boosts.tailwind>0;if(tailwind)state.boosts.tailwind--;const speed=(55+power*80)*effectivePlaneStats(p).speed/(c.weight)*(tailwind?1.1:1);flight={x:0,y:2.7,vx:speed*Math.cos(angle),vy:speed*Math.sin(angle)*.89,angle:-angle,t:0,corrections:5,collisions:0,trail:[],warnings:0,risk:state.riskMode,braked:false,eventRolled:false,touchedUp:false,extraCoins:0,luckyCollected:false,insured,premium:insured?insurancePrice():0};sfx('launch');if(tailwind)banner('🍀 행운의 순풍! 속도 +10%');state.flightState='flying';document.body.classList.add('in-flight');$('#flightInfo').textContent='비행 시작 · 보정 5회';addLog('발사 · '+p.def.name+' / '+$('#angle').value+'° / 힘 '+$('#power').value+'%');renderStatus();autosave()}
function airBrake(){const f=flight;if(state.flightState!=='flying'||!f||f.braked)return;f.braked=true;f.vx*=.67;f.vy-=11;banner('⤓ 에어 브레이크! 속도 감소');sparkles('✨',7);sfx('brake')}
function correction(x,y){if(state.flightState!=='flying'||!flight||flight.corrections<=0)return;let stability=effectivePlaneStats(selectedPlane()).stable;flight.vx+=x*8*stability;flight.vy+=y*8*stability;flight.corrections--;sfx('correct');$('#flightInfo').textContent=`거리 ${metre(flight.x)} · 남은 보정 ${flight.corrections}회`;if(flight.corrections===0)notify('보정 횟수를 모두 사용했습니다')}
function handleObstacles(dt){let c=state.current;if(!flight||!c)return;for(const ob of c.obstacles){if(ob.used||Math.abs(flight.x-ob.x)>ob.width)continue;let contact=false,y=flight.y;switch(ob.kind){case 'tree':case 'pole': contact=y<ob.height;break;case 'cat':contact=y<8;break;case 'line': contact=Math.abs(y-ob.height*.8)<5;break;case 'window':contact=y>15&&y<ob.height;break;case 'bird':case 'kite':case 'balloon':contact=Math.abs(y-ob.alt)<11;break;case 'carwind':case 'alleywind':contact=y<48;break}if(!contact)continue;
if(ob.kind==='carwind'){flight.vx+=16*dt;flight.vy+=26*dt;continue}if(ob.kind==='alleywind'){flight.vx+=21*dt;continue}if(ob.kind==='window'){ob.used=true;flight.vy+=10;flight.vx+=7;notify('창문 반사 바람을 탔습니다!');continue}
if(state.boosts.shield>0){state.boosts.shield--;ob.used=true;banner('🛡️ 보호막이 충돌을 막았습니다!');sparkles('🛡️',8);sfx('event');return}ob.used=true;flight.collisions++;sfx('hit');sparkles('💥',8);flight.vx*=ob.kind==='line'?.82:.55;flight.vy=Math.max(1,Math.abs(flight.vy)*.23);notify('장애물 충돌 · '+ob.kind)} }
function updateFlight(dt){if(state.flightState!=='flying'||!flight||$('#mapOverlay').classList.contains('show'))return;let f=flight,c=state.current,p=effectivePlaneStats(selectedPlane());f.t+=dt;let speed=Math.hypot(f.vx,f.vy),wind=c.wind+(c.weather.id==='storm'?Math.sin(f.t*3+f.x*.017)*7:Math.sin(f.t*.8+f.x*.009)*1.25),drag=.012*c.weather.drag/p.glide;
f.vx+=(wind*.32/p.stable-f.vx*drag)*dt;f.vy+=(-20.7+(speed/110)*2.4*p.lift*c.weather.lift-f.vy*drag*.38)*dt;
for(const z of c.zones){if(f.x>=z.x&&f.x<=z.x+z.w&&f.y<140){f.vy+=(z.kind==='up'?1:-1)*z.strength*(z.kind==='up'?(p.upBoost||1):1)*dt*1.7;if(z.kind==='up'){f.vx+=1.2*dt;f.touchedUp=true}}}
if(!f.eventRolled&&f.t>1.9){f.eventRolled=true;if(Math.random()<.52){const event=Math.random();if(event<.29){f.vx*=1.10;banner('💨 찬스! 갑작스런 순풍');}else if(event<.53){f.vy+=9;banner('🌀 상승 바람이 비행기를 띄웁니다');}else if(event<.78){f.vy-=13;banner('🌪️ 강한 하강 돌풍! 긴급 보정이 필요합니다');}else{f.extraCoins+=150+level()*30;banner('✉️ 공중 보너스 획득!');sparkles('✨',8)}sfx('event')}}
 f.x+=f.vx*dt;f.y+=f.vy*dt;
 if(c.luckyRing&&!c.luckyRing.taken&&Math.abs(f.x-c.luckyRing.x)<17&&Math.abs(f.y-c.luckyRing.y)<19){c.luckyRing.taken=true;f.luckyCollected=true;f.extraCoins+=260+level()*35;banner('🍀 행운의 봉투! 추가 코인 획득');sparkles('mix',15);sfx('rare')}
f.angle=limit(Math.atan2(-f.vy,Math.max(2,f.vx))*.42,-.7,.7);f.trail.push([f.x,f.y]);if(f.trail.length>150)f.trail.shift();handleObstacles(dt);
$('#flightInfo').textContent=`${metre(f.x)} · 보정 ${f.corrections} · ${f.braked?'제동 사용':'제동 가능'} · ${c.type==='distance'?'희망 '+c.goal+'m':'목표 '+c.target+'m'}`;
if(f.y<=0||f.x<-25||f.x>10000||f.t>32){f.y=Math.max(0,f.y);completeFlight()}}
function calculateReward(star,dist,c,p,oldAvg,rawBefore){let base=Math.floor((135+level()*15+(c.type==='distance'?55:25))*c.pack.pay*(1+star*.20)*(1+oldAvg*.12)*(1+(p.def.bonus||0))),extra=0;
if(c.type==='distance'&&dist>c.goal){const above=dist-c.goal;extra=Math.floor(above*1.05+base*Math.min(3.2,above/c.goal*2.05))}
const streakLength=star>=4?rawBefore+1:0,streakDisplayed=Math.max(0,streakLength-1),bonusLv=streakDisplayed>0?Math.min(10,Math.ceil(streakDisplayed/2)):0,combo=bonusLv?Math.floor((base+extra)*(.06*bonusLv)+streakDisplayed*25):0;
return{base,extra,combo,total:base+extra+combo,bonusLv,streakLength,streakDisplayed}}
function completeFlight(){if(state.flightState!=='flying'||!flight)return;document.body.classList.remove('in-flight');state.flightState='result';const c=state.current,p=selectedPlane(),dist=Math.max(0,flight.x);let error=null,star;
if(c.type==='accuracy'){error=Math.abs(dist-c.target);star=getAccStar(error)}else star=getDistStar(dist,c.goal);
if(c.pack.fragile&&flight.collisions)star--;if(c.pack.strict&&star>1&&Math.random()<.35)star--;star=limit(star,1,5);
const rawBefore=state.goodRaw,oldAvg=aStars(),reward=calculateReward(star,dist,c,p,oldAvg,rawBefore);
reward.lucky=flight.extraCoins||0;
reward.risk=flight.risk&&star>=4&&flight.t<=14?Math.floor(reward.total*.35):0;
reward.riskFail=flight.risk&&!reward.risk?Math.min(1600,280+level()*42):0;
const settlement=rollSettlement(c,flight,star);
reward.event=settlement;
reward.eventBonus=Math.max(0,settlement.amount);
reward.eventCost=Math.max(0,-settlement.amount);
reward.insuranceCovered=flight.insured?Math.round(reward.eventCost*.70):0;
reward.paidCost=Math.max(0,reward.eventCost-reward.insuranceCovered)+reward.riskFail;
const gross=reward.total+reward.lucky+reward.risk+reward.eventBonus;
reward.total=gross-reward.paidCost;
state.goodRaw=reward.streakLength;
credit(gross,'배달 '+state.round+'회 정산 수입');
if(reward.paidCost)pay(reward.paidCost,(reward.riskFail?'특급 실패 · ':'')+settlement.title);
if(settlement.amount<0){state.finance.lossEvents++;flashLoss();banner(settlement.icon+' '+settlement.title+(reward.insuranceCovered?' · 보험 적용':''));sfx('hit');}
else if(settlement.amount>0){state.finance.winEvents++;banner(settlement.icon+' '+settlement.title);sparkles('✨',9);}
else if(reward.risk)banner('⚡ 특급 도전 성공! +35%');
else if(reward.riskFail){banner('⏰ 특급 도전 실패');flashLoss();}
let wear=Math.max(1,Math.ceil(1+flight.collisions+c.weather.wear-((c.weather.id==='rain'&&p.def.water)?0.85:0))-Math.floor(partLevel(p,'armor')/3)); p.p.dur=Math.max(0,p.p.dur-wear);
state.stars.push(star);state.monthStars.push(star);state.stars=state.stars.slice(-300);state.round++;state.playsToday++;
progressQuest(star,flight,c);const gotChest=maybeChest(star,flight);if(star>=4){sparkles(star===5?'mix':'⭐',star===5?27:16);sfx(star===5?'rare':'win')}else{sfx('brake')}
let trophy=false;if(reward.streakDisplayed>0&&reward.streakDisplayed%5===0){state.forecastTickets++;trophy=true;notify('연속 성공 보너스 · 일기예보권 +1')}
let aiResult=null;if(state.ai.enabled)aiResult=simulateAI(c,star);
state.lastResult={dist,error,star,c,wear,rawBefore,reward,aiResult,bonusTicket:trophy,gotChest,planeDef:p.def,oldAvg,settlement};state.records.unshift({round:state.round,type:c.type,star,dist,goal:c.goal,target:c.target,pay:reward.total,streak:reward.streakDisplayed});state.records=state.records.slice(0,80);
addLog(`${state.round}번째 배달 · ${star}★ · ${metre(dist)} · 순손익 ${money(reward.total)} · ${settlement.title} ${settlement.amount<0?'-':''}${money(Math.abs(settlement.amount))}`);
if(state.playsToday>=5)advanceDay();
ensurePlane();checkGameOver();renderAll();showResult();autosave();if(!state.gameOver)scheduleNext()}
function simulateAI(c,playerStar){const skill=limit(.72+state.round*.0025,.72,1.2);let botDist,botStar;if(c.type==='accuracy'){let e=rng(0,accRules().two*1.35)/skill;botDist=c.target+(Math.random()<.5?-e:e);botStar=getAccStar(e)}else{botDist=c.goal*rng(.55,1.75)*skill;botStar=getDistStar(botDist,c.goal)}let label=playerStar>botStar?'승리':playerStar===botStar?'무승부':'패배';if(label==='승리'){state.ai.player++;credit(150,'AI 대결 승리')}else if(label==='패배'){state.ai.bot++}else state.ai.draw++;
state.ai.history.unshift({playerStar,botStar,label,botDist,type:c.type,round:state.round});state.ai.history=state.ai.history.slice(0,15);return{label,botStar,botDist}}
function showResult(){const r=state.lastResult;if(!r)return;
 $('#resultTitle').textContent=r.reward.total<0?'📉 손실이 발생했습니다':r.star>=4?'훌륭한 배달!':r.star>=3?'성공적인 배달':'조금 아쉬운 배달';
 $('#resultStars').textContent=stars(r.star);
 $('#resultDesc').textContent=r.c.type==='accuracy'?`목표 ${r.c.target}m · 오차 ${metre(r.error)}`:`희망 ${r.c.goal}m · 실제 ${metre(r.dist)}`;
 $('#resultDistance').textContent=metre(r.dist);$('#resultTarget').textContent=r.c.type==='accuracy'?metre(r.error)+' 오차':metre(r.c.goal);
 $('#resultBase').textContent=money(r.reward.base);$('#resultExcess').textContent=money(r.reward.extra);
 $('#resultCombo').textContent=money(r.reward.combo);
 $('#resultTotal').textContent=money(r.reward.total)+' / -'+r.wear;
 $('#resultTotal').classList.toggle('loss-text',r.reward.total<0);
 const s=r.settlement||r.reward.event||{icon:'🧾',title:'정상 정산',amount:0,detail:''};
 const inc=$('#resultIncident');inc.className='result-incident '+(r.reward.paidCost>0?'loss':s.amount>0?'gain':'neutral');
 const fee=r.reward.paidCost||0,cover=r.reward.insuranceCovered||0;
 inc.innerHTML=`<b>${safe(s.icon)} ${safe(s.title)}</b><strong>${s.amount>0?'+':''}${money(s.amount)}</strong><small>${safe(s.detail)}${cover?' · 보험 보전 +'+money(cover):''}${r.reward.riskFail?' · 특급 위약금 -'+money(r.reward.riskFail):''}</small>`;
 $('#resultNext').textContent=(r.reward.risk?'⚡ 특급 성공 · ':'')+(r.aiResult?'AI '+r.aiResult.botStar+'★ · '+r.aiResult.label:'다음 손님 자동 방문');
 $('#starAdBtn').disabled=r.star>=5||state.adFixUsedToday>=3||state.gameOver;$('#result').classList.add('show');$('#stage').classList.add('stage-result')
}

function applyStarReward(){const r=state.lastResult;if(!r||r.star>=5||state.adFixUsedToday>=3)return;clearTimeout(nextTimer);requestRewardAd('별점 +1 보정',()=>{if(state.lastResult!==r)return;state.adFixUsedToday++;r.star++;const prevReward=r.reward;r.reward=calculateReward(r.star,r.dist,r.c,{def:r.planeDef},r.oldAvg,r.rawBefore);r.reward.lucky=prevReward.lucky||0;r.reward.risk=prevReward.risk||0;r.reward.riskFail=prevReward.riskFail||0;r.reward.eventBonus=prevReward.eventBonus||0;r.reward.eventCost=prevReward.eventCost||0;r.reward.insuranceCovered=prevReward.insuranceCovered||0;r.reward.paidCost=prevReward.paidCost||0;r.reward.event=prevReward.event;r.reward.total+=r.reward.lucky+r.reward.risk+r.reward.eventBonus-r.reward.paidCost;let additional=r.reward.total-prevReward.total;const delivery=state.delivery;if(delivery?.active&&delivery.entries?.length){const entry=delivery.entries[delivery.entries.length-1];entry.star=r.star;entry.pay=r.reward.total;delivery.net+=additional;}if(additional>0)credit(additional,'별점 보정 추가금');else if(additional<0)pay(-additional,'별점 조정 반영');state.goodRaw=r.reward.streakLength;state.stars[state.stars.length-1]=r.star;if(state.monthStars.length)state.monthStars[state.monthStars.length-1]=r.star;if(state.records.length){state.records[0].star=r.star;state.records[0].pay=r.reward.total;state.records[0].streak=r.reward.streakDisplayed}if(r.reward.streakDisplayed>0&&r.reward.streakDisplayed%5===0&&!r.bonusTicket){state.forecastTickets++;r.bonusTicket=true}addLog('별점 보정 +1 · 추가 보수 '+money(Math.max(0,additional)));showResult();renderAll();autosave();scheduleNext()},()=>scheduleNext())}
function debtInterestRate(amount,late){
 const base=amount<=1000?.005:amount<=5000?.007:amount<=10000?.009:amount<=30000?.012:.018;
 return base+(late>=14?.004:late>=7?.002:0);
}
function percent(rate){return (rate*100).toFixed(1)+'%'}
function advanceDay(){state.day++;state.playsToday=0;state.adFixUsedToday=0;
 for(const d of state.debts){if(state.day<=d.due||d.last===state.day)continue;const late=state.day-d.due;const rate=debtInterestRate(d.amount,late);const fee=Math.ceil(d.amount*rate/10)*10;d.amount+=fee;d.last=state.day;ledger(-fee,'연체 이자','expense');addLog('📉 연체 이자 '+money(fee))}
 if(state.day%4===0){const cost=490+level()*100+Math.floor(debtSum()/6000)*55;pay(cost,'정기 우체국 운영비');addLog('🏠 정기 우체국 운영비 '+money(cost))}
 // Daily operating event: bad 32%, good 14%, no change 54%.
 const roll=Math.random();
 if(roll<.32){const cost=Math.floor(rng(220,770)+level()*42);const title=pick(['우편 차량 정비','포장재 단가 인상','창고 관리비','특별 검수 비용']);pay(cost,title);state.finance.lossEvents++;addLog('📉 '+title+' · -'+money(cost));banner('📉 오늘의 운영 사건: '+title+' -'+money(cost));flashLoss()}
 else if(roll<.46){const extra=Math.floor(rng(170,580)+level()*35);credit(extra,'마을 지원금');state.finance.winEvents++;addLog('💰 오늘의 지원금 +'+money(extra));banner('💰 마을 지원금 +'+money(extra))}
 if((state.day-1)%30===0){let a=aStars(state.monthStars.length?state.monthStars:state.stars),bonus=a>=5?.7:a>=4.5?.42:a>=4?.2:a>=3?0:a>=2?-.35:-.55,penalty=Math.floor(debtSum()/5000)*.04+overdue()*.06;let salary=Math.max(500,Math.floor(19000*(1+bonus)*Math.max(0,1-penalty)));credit(salary,'월말 급여');state.month++;state.monthStars=[];addLog('💰 월말 급여 '+money(salary));notify('월말 급여 '+money(salary)+' 입금')}
 checkGameOver()
}

function checkGameOver(){if(state.gameOver)return true;let reason=debtSum()>=120000?'빚이 120,000원을 넘어 우체국이 압류되었습니다.':overdue()>=16?'16일 이상 빚을 연체해 영업이 중단되었습니다.':'';if(!reason)return false;state.gameOver=true;state.flightState='gameover';state.gameOverReason=reason;clearTimeout(nextTimer);document.body.classList.remove('in-flight');save();openModal({mark:'📪',title:'우체국 영업 종료',message:reason,tip:'기록과 빚은 저장됩니다. 우체국 메뉴에서 상황을 확인할 수 있습니다.',primary:'우체국 확인',secondary:'새 인생',cancel:offerNewLife,action:()=>{showLobby();selectTab('office')}});return true}
function buyPlane(def){if(state.gameOver)return notify('게임 오버입니다');if(!planeUnlocked(def))return notify('Lv.'+planeUnlockLevel(def)+'에 구매 가능');const price=planePrice(def);pay(price,def.name+' 구매');if(state.gameOver)return;if((state.planeCoupons?.[def.id]||0)>0)state.planeCoupons[def.id]--;state.owned[def.id]=state.owned[def.id]||[];state.owned[def.id].push({dur:def.dur,maxDur:def.dur});state.selectedPlaneKey=def.id+':'+(state.owned[def.id].length-1);state.newPlaneIds=(state.newPlaneIds||[]).filter(x=>x!==def.id);addLog(def.name+' 구매');renderAll();autosave();rewardBurst('✈️',def.name+' 구매 완료',0,'item')}
function repairPlane(key){if(state.gameOver)return notify('게임 오버입니다');const x=ownedFlat().find(x=>x.key===key);if(!x)return;const missing=x.p.maxDur-x.p.dur;if(!missing)return notify('내구도가 이미 가득 찼습니다');const cost=Math.ceil(x.def.price*.1*missing/x.def.dur+missing*28);pay(cost,'비행기 수리');if(state.gameOver)return;x.p.dur=x.p.maxDur;addLog(x.def.name+' 수리 '+money(cost));renderAll();autosave()}
function buyForecast(){if(state.gameOver)return notify('게임 오버입니다');pay(900,'일기예보권 구매');if(state.gameOver)return;state.forecastTickets++;addLog('일기예보권 구매');renderAll();autosave()}
function repay(){if(!state.debts.length)return notify('갚을 빚이 없습니다');if(state.money<=0)return notify('보유금이 없습니다');state.debts.sort((a,b)=>a.due-b.due);let sum=0;for(const d of state.debts){const v=Math.min(state.money-sum,d.amount);if(v<=0)break;d.amount-=v;sum+=v}state.money-=sum;ledger(-sum,'대출 원금 상환','repayment');state.debts=state.debts.filter(d=>d.amount>0);addLog('빚 상환 '+money(sum));renderAll();autosave();notify(money(sum)+' 상환 완료')}
function offerNewLife(){
 const debt=debtSum();
 const legacy=state.legacy||{};
 openModal({mark:'🌱',title:'새 인생 시작',
  message:debt?`남은 빚 ${money(debt)}을 포기하고 새 인생을 시작하시겠습니까?`:'새 우체국으로 처음부터 다시 시작하시겠습니까?',
  tip:debt?'기존 비행기·기록은 초기화됩니다. 신용 이력은 남고 시작 자금은 500원입니다.':'비행기·기록이 초기화됩니다. 첫 자금은 1,200원입니다.',
  primary:'새 인생 시작',secondary:'돌아가기',action:()=>{
   const abandoned=debtSum(),was=state.legacy||{lives:1,abandonedDebt:0,history:[]};
   const newData=newState();
   newData.money=abandoned>0?500:1200;
   newData.legacy={lives:(Number(was.lives)||1)+1,abandonedDebt:(Number(was.abandonedDebt)||0)+abandoned,history:[{day:state.day,debt:abandoned,rounds:state.round},...(was.history||[])].slice(0,12)};
   newData.logs=[{day:1,text:abandoned?`새 인생 시작 · 이전 빚 ${money(abandoned)} 포기`:'새 인생 시작'}];
   try{
    // 기존 페이지 종료(pagehide)에서 save()가 실행돼도 예전 빚이 복구되지 않도록
    // 저장 성공 직후 현재 실행 상태도 새 인생 데이터로 교체합니다.
    localStorage.setItem(SAVE,JSON.stringify(newData));
    clearTimeout(nextTimer);
    nextTimer=null;
    state=newData;
    flight=null;
    saveDelay=0;
    document.body.classList.remove('in-flight');
    location.reload();
   }catch(e){notify('저장에 실패해 새 인생을 시작하지 못했습니다')}
  }
 });
}
function attemptReset(){if(debtSum()>0)return openModal({mark:'🔒',title:'초기화할 수 없습니다',message:'빚을 전부 상환해야 초기화할 수 있습니다. 앱을 삭제하는 것은 게임 진행 기록을 보장하지 않습니다.',tip:'단일 HTML에서는 앱 삭제 후에도 경고를 보장하는 영구 저장 기능을 제공할 수 없습니다.',primary:'확인'});if(state.money<5000000)return notify('초기화에는 현금 5,000,000원이 필요합니다');openModal({mark:'🧾',title:'초기화 확인',message:'5,000,000원을 지불하고 우체국 기록을 새로 시작하시겠습니까? 대출은 불가능합니다.',tip:'초기화하면 기존 돈, 비행기, 기록이 모두 사라집니다.',primary:'초기화 실행',action:()=>{try{localStorage.setItem(SAVE,JSON.stringify(newState()));state=newState();clearTimeout(nextTimer);flight=null;saveDelay=0;location.reload()}catch(e){notify('초기화 저장 실패')}},secondary:'취소'})}
function renderStatus(){let a=aStars();$('#money').textContent=money(state.money);$('#average').textContent=a.toFixed(2)+'★';$('#reputation').textContent=repLabel();$('#day').textContent=state.month+'월 '+(1+(state.day-1)%30)+'일';$('#debt').textContent=money(debtSum());$('#debt').classList.toggle('bad',debtSum()>0);$('#streak').textContent=comboCount()?comboCount()+'회 Lv.'+comboLevel():'-';$('#streak').classList.toggle('good',comboCount()>0);$('#angleValue').textContent=$('#angle').value+'°';$('#powerValue').textContent=$('#power').value+'%';$('#launchBtn').disabled=state.flightState!=='ready'||state.gameOver;$('#briefBtn').classList.toggle('riskOn',state.riskMode);$('#briefBtn').textContent=state.riskMode?'⚡ 도전 ON':'⚡ 특급 ±';refreshChest()}
function renderPlaneSelect(){const select=$('#planeSelect'),arr=ownedFlat();const selected=selectedPlane();select.replaceChildren();for(const x of arr){const opt=document.createElement('option');opt.value=x.key;opt.disabled=x.p.dur<=0;opt.textContent=x.def.name+' · '+x.p.dur+'/'+x.p.maxDur;select.add(opt)}if(selected){select.value=selected.key;const pct=limit(selected.p.dur/selected.p.maxDur*100,0,100);$('#durCount').textContent=selected.p.dur+'/'+selected.p.maxDur;$('#durFill').style.width=pct+'%';$('#durMeter').classList.toggle('low',pct<=30);$('#planeLevel').textContent=selected.def.price>=250000?'최고급':selected.def.price>=25000?'고급':selected.def.price>=1500?'중급':'초급'}}
function renderShop(){const g=$('#shopList');g.replaceChildren();let first=document.createElement('div');first.className='item';first.innerHTML='<div><strong>🗺️ 무료 전체 항로 지도</strong><p>언제든 다시 열 수 있습니다 · 시작/끝 기류 구간 확인</p><span class="price">무료 · 횟수 무제한</span></div>';let btn=document.createElement('button');btn.className='action';btn.textContent='지도 보기';btn.onclick=mapOpen;first.append(btn);g.append(first);
const chestCard=document.createElement('div');chestCard.className='item lucky-chest-card';chestCard.innerHTML=`<div><strong>🎁 행운 상자</strong><p>상자 보상 · 손실 16% · 희귀 23.52% · 전설 3.36%</p><span class="price">보유 ${state.crates}개 · 방어막 ${state.boosts.shield} · 순풍 ${state.boosts.tailwind}</span></div>`;const chestOpen=document.createElement('button');chestOpen.className='action buy';chestOpen.textContent='뽑기';chestOpen.disabled=state.crates<1;chestOpen.onclick=openChestUI;chestCard.append(chestOpen);g.append(chestCard);
for(const def of planeDefs){
 const card=document.createElement('div'),owned=(state.owned[def.id]||[]).length,unlocked=planeUnlocked(def),isNew=unlocked&&(state.newPlaneIds||[]).includes(def.id),coupon=state.planeCoupons?.[def.id]||0;
 card.className='item plane-shop-card'+(unlocked?'':' plane-locked')+(isNew?' plane-fresh':'');card.dataset.plane=def.id;
 card.innerHTML=`<div><strong>${unlocked?'✈':'🔒'} ${safe(def.name)} ${isNew?'<span class="plane-new-inline">NEW</span>':''}</strong><p>${safe(def.desc)} · 내구도 ${def.dur} · 보유 ${owned}대</p><span class="price">${coupon?'<s>'+money(def.price)+'</s> ':''}${money(planePrice(def))}${coupon?' · 50% 할인권 '+coupon+'개':''}${unlocked?'':' · Lv.'+planeUnlockLevel(def)+' 해금'}</span></div>`;
 const buy=document.createElement('button');buy.className='action buy';buy.textContent=unlocked?'구매':'🔒 Lv.'+planeUnlockLevel(def);buy.disabled=!unlocked||state.gameOver;buy.onclick=()=>buyPlane(def);card.append(buy);
 if(isNew){const badge=card.querySelector('.plane-new-inline');badge.setAttribute('role','button');badge.setAttribute('tabindex','0');badge.title='새 비행기 알림 확인';badge.onclick=()=>markPlaneSeen(def.id);badge.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();markPlaneSeen(def.id)}};}
 g.append(card);
}
let repairs=ownedFlat().filter(x=>x.p.dur<x.p.maxDur);for(const x of repairs){let missing=x.p.maxDur-x.p.dur,price=Math.ceil(x.def.price*.1*missing/x.def.dur+missing*28);let card=document.createElement('div');card.className='item';card.innerHTML=`<div><strong>🔧 ${safe(x.def.name)} 수리</strong><p>내구도 ${x.p.dur}/${x.p.maxDur}</p><span class="price">${money(price)}</span></div>`;let b=document.createElement('button');b.className='action';b.textContent='수리';b.onclick=()=>repairPlane(x.key);card.append(b);g.append(card)}}
function renderOffice(){
 const g=$('#officeList');g.replaceChildren();
 const make=(title,description,value,actionName,fn,cls='action')=>{
  const e=document.createElement('div');e.className='item';
  e.innerHTML=`<div><strong>${title}</strong><p>${description}</p><span class="price">${value}</span></div>`;
  if(actionName){const b=document.createElement('button');b.className=cls;b.textContent=actionName;b.onclick=fn;e.append(b)}
  g.append(e);return e
 };
 const quest=dailyQuest();
 make('🎯 '+quest.def.name,quest.def.desc+' · '+quest.prog.progress+'/'+quest.def.target,quest.prog.claimed?'완료':'완료 후 보상 수령',null,null);

 make('📮 평판','최근 배달 20회',aStars().toFixed(2)+'★ / '+repLabel());
 make('📣 자동 홍보','손님 부족 시 자동 실행',money(promoCost()));
 const debts=state.debts||[];
 const overdueItems=debts.filter(d=>state.day>d.due);
 const rateMax=overdueItems.length?Math.max(...overdueItems.map(d=>debtInterestRate(d.amount,state.day-d.due))):0;
 const debtCard=make('🏦 대출 · '+money(debtSum()),debtSum()?`연체 ${overdue()}일 · ${overdueItems.length?'현재 일 이자 최대 '+percent(rateMax):'연체 전 이자 없음'}`:'현재 빚 없음',debtSum()?`${Math.min(...debts.map(d=>d.due-state.day))<0?'연체 '+Math.abs(Math.min(...debts.map(d=>d.due-state.day)))+'일':'상환까지 '+Math.min(...debts.map(d=>d.due-state.day))+'일'} · 이자율 아래 표시`:'연체 시 일 0.5~1.8%','상환',repay);
 const debtCards=[];for(const d of debts){
  const late=Math.max(0,state.day-d.due),rate=debtInterestRate(d.amount,late);
  debtCards.push(make(late?'🔴 '+late+'일 연체':'⏳ '+(d.due-state.day)+'일 남음',safe(d.reason),`${money(d.amount)} · ${late?'현재':'연체 시 기본'} 일 ${percent(rate)}`));
 }
 const rates=document.createElement('div');rates.className='rate-card';
 rates.innerHTML='<b>연체 이자율 (매일)</b><div class="rate-bands"><span>~1천원 <b>0.5%</b></span><span>~5천원 <b>0.7%</b></span><span>~1만원 <b>0.9%</b></span><span>~3만원 <b>1.2%</b></span><span>초과 <b>1.8%</b></span></div><small>12일 후부터 연체 이자 · 연체 7일째 +0.2%p · 14일째 +0.4%p</small>';
 g.append(rates);
 make('📅 월급 · 운영비','5판 = 1일 · 4일마다 운영비',state.month+'개월차');
 make('🔥 연속 성공','4★ 이상을 연속으로 달성',comboCount()+'연속 · Lv.'+comboLevel());

 // Put important finance actions near the top without moving the daily quest.
 const questCard=g.firstElementChild;
 g.insertBefore(debtCard,questCard.nextSibling);
 g.insertBefore(rates,debtCard.nextSibling);
 let previous=rates;
 for(const debtCardItem of debtCards){g.insertBefore(debtCardItem,previous.nextSibling);previous=debtCardItem}

}
function renderAI(){const g=$('#aiList');g.replaceChildren();const card=document.createElement('div');card.className='item';card.innerHTML=`<div><strong>🤖 AI 우체부 대결</strong><p>같은 조건에서 AI가 별점 경쟁 · 승리 시 150원 추가</p><span class="price">${state.ai.enabled?'진행 중':'꺼짐'} · 나 ${state.ai.player}승 / AI ${state.ai.bot}승 / 무승부 ${state.ai.draw}회</span></div>`;let toggle=document.createElement('button');toggle.className='action';toggle.textContent=state.ai.enabled?'끄기':'대결';toggle.onclick=()=>{if(state.gameOver)return notify('게임 오버 상태입니다');state.ai.enabled=!state.ai.enabled;renderAI();autosave()};card.append(toggle);g.append(card);
for(const h of state.ai.history.slice(0,6)){const e=document.createElement('div');e.className='item';e.innerHTML=`<div><strong>${safe(h.label)} · ${h.type==='accuracy'?'정확 배달':'장거리'}</strong><p>나 ${h.playerStar}★ / AI ${h.botStar}★ · ${h.round}번째 배달</p></div>`;g.append(e)}}
function renderRecords(){ /* Records are retained in save data; no records tab. */ }
function toggleRisk(){if(state.flightState!=='ready')return notify('발사 전에만 선택할 수 있습니다');state.riskMode=!state.riskMode;$('#briefBtn').classList.toggle('riskOn',state.riskMode);$('#briefBtn').textContent=state.riskMode?'⚡ 도전 ON':'⚡ 특급 ±';sfx('event');autosave();renderOffice()}
function renderAll(){renderStatus();renderPlaneSelect();renderShop();renderOffice();renderAI();renderRecords();updateMission()}
function selectTab(name){for(let b of $$('.nav button'))b.classList.toggle('active',b.dataset.tab===name);for(let t of $$('.tab'))t.classList.toggle('active',t.dataset.panel===name);$('.dock-body').scrollTop=0;renderAll()}
function openModal({mark='✈️',title='안내',message='',tip='',primary='확인',secondary=null,action=null,cancel=null}={}){$('#modalMark').textContent=mark;$('#modalTitle').textContent=title;$('#modalMessage').textContent=message;$('#modalTip').textContent=tip;$('#modalTip').hidden=!tip;$('#modalPrimary').textContent=primary;$('#modalSecondary').hidden=!secondary;$('#modalSecondary').textContent=secondary||'';modalTask={action,cancel};$('#modalCover').classList.add('show')}
function dismissModal(doAction){$('#modalCover').classList.remove('show');const task=modalTask;modalTask=null;const fn=doAction?task?.action:task?.cancel;if(typeof fn==='function')fn()}
function requestRewardAd(label,callback,onCancel){openModal({mark:'▶',title:'보상형 광고 테스트',message:`${label} 보상은 현재 실제 광고가 아니라 테스트 기능입니다. Android 앱에 AdMob을 연결한 뒤 실제 광고 시청 완료 여부로 보상을 지급할 수 있습니다.`,tip:'광고 SDK는 아직 연결되지 않았습니다.',primary:'테스트 보상 받기',secondary:'취소',action:callback,cancel:onCancel})}
function mapOpen(){
 const c=state.current;
 if(!c){notify('손님이 도착하면 지도를 확인할 수 있습니다');return}
 if($('#mapOverlay').classList.contains('show'))return;
 if(state.flightState==='result'){clearTimeout(nextTimer);nextTimer=null}
 c.mapSeen=true;updateMission();autosave();
 $('#mapOverlay').classList.add('show');mapEnd=performance.now()+15000;mapView=0;
 sizeMap();if(mapRAF)cancelAnimationFrame(mapRAF);mapRAF=requestAnimationFrame(drawMap)
}
function mapClose(){
 if(!$('#mapOverlay').classList.contains('show'))return;
 $('#mapOverlay').classList.remove('show');if(mapRAF)cancelAnimationFrame(mapRAF);mapRAF=0;
 renderAll();
 if(state.flightState==='result'&&!state.gameOver&&started)scheduleNext()
}
function useForecast(){mapOpen()}
function sizeMap(){const rect=map.getBoundingClientRect();if(!rect.width||!rect.height)return;let ratio=Math.min(devicePixelRatio||1,2),w=Math.round(rect.width),h=Math.round(rect.height);if(mapW===w&&mapH===h&&mapDpr===ratio)return;mapW=w;mapH=h;mapDpr=ratio;map.width=Math.max(1,Math.round(w*ratio));map.height=Math.max(1,Math.round(h*ratio));mctx.setTransform(ratio,0,0,ratio,0,0)}
function drawMap(){if(!$('#mapOverlay').classList.contains('show')){mapRAF=0;return}sizeMap();let remain=Math.max(0,(mapEnd-performance.now())/1000);$('#mapTime').textContent=remain.toFixed(1)+'초';$('#mapTimeFill').style.width=remain/15*100+'%';const c=state.current;if(!c){mapClose();return}const g=mctx,w=mapW,h=mapH,gY=h-78,mapTop=h<530?135:160,scale=limit(w/590,.53,1.6),sx=x=>33+(x-mapView)*scale;
g.clearRect(0,0,w,h);const bg=g.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#b2ebf7');bg.addColorStop(.7,'#e5f9f7');bg.addColorStop(1,'#d5eed3');g.fillStyle=bg;g.fillRect(0,0,w,h);g.fillStyle='#7bcb9e';g.fillRect(0,gY,w,h-gY);
for(let x=Math.floor(mapView/100)*100;x<=mapView+w/scale+100;x+=100){let xx=sx(x);g.strokeStyle='rgba(72,139,153,.21)';g.lineWidth=1;g.beginPath();g.moveTo(xx,mapTop);g.lineTo(xx,gY);g.stroke();g.fillStyle='#38687a';g.font='10px system-ui';g.fillText(metre(x),xx+3,gY+20)}
for(const z of c.zones){let x=sx(z.x),end=sx(z.x+z.w);if(end<0||x>w)continue;g.fillStyle=z.kind==='up'?'rgba(48,168,209,.22)':'rgba(153,97,218,.23)';g.fillRect(x,mapTop,end-x,Math.max(0,gY-mapTop));g.strokeStyle=z.kind==='up'?'#2d98bd':'#9865d3';g.lineWidth=2;g.setLineDash([5,4]);g.beginPath();g.moveTo(x,mapTop);g.lineTo(x,gY);g.moveTo(end,mapTop);g.lineTo(end,gY);g.stroke();g.setLineDash([]);g.fillStyle=z.kind==='up'?'#2383a8':'#8650c4';g.font='bold 11px system-ui';g.fillText(z.kind==='up'?'↑ 상승':'↓ 하강',x+5,Math.min(gY-12,mapTop+22));g.font='9px system-ui';g.fillText('시작',x+2,gY-6);g.fillText('끝',end-13,gY-6)}
for(const o of c.obstacles){let x=sx(o.x);if(x<-40||x>w+40)continue;const y=gY-limit(o.alt,12,70)*1.35;g.font='17px system-ui';g.fillText(({tree:'🌳',pole:'🔌',cat:'🐈',line:'〰️',bird:'🐦',kite:'🪁',balloon:'🎈',window:'🏠',carwind:'🚗',alleywind:'💨'})[o.kind]||'•',x-7,y)}
const goalX=sx(c.type==='distance'?c.goal:c.target);g.strokeStyle='#f57761';g.lineWidth=3;g.beginPath();g.moveTo(goalX,mapTop);g.lineTo(goalX,gY);g.stroke();g.fillStyle='#d85546';g.font='bold 13px system-ui';g.textAlign='center';g.fillText(c.type==='distance'?'희망 거리':'착륙 목표',goalX,mapTop-12);g.fillText(metre(c.type==='distance'?c.goal:c.target),goalX,gY+38);g.textAlign='start';g.fillStyle='#33677e';g.font='bold 11px system-ui';g.fillText(`현재 구간 ${metre(mapView)} ~ ${metre(mapView+w/scale)}`,12,h-13);
if(remain<=0){mapClose();return}mapRAF=requestAnimationFrame(drawMap)}
function panMap(delta){const c=state.current;if(!c)return;let maxX=Math.max(c.goal||0,c.target||0,...c.zones.map(z=>z.x+z.w),...c.obstacles.map(o=>o.x),1250)+500;mapView=limit(mapView+delta,0,Math.max(0,maxX))}
function sizeWorld() {
 const rect = world.getBoundingClientRect();
 W = Math.max(1, Math.round(rect.width));
 H = Math.max(1, Math.round(rect.height));
}
function baseWorldScale(){return Math.max(.9,Math.min(W/190,Math.max(1,(H-36)/120)))}
function wantedWorldScale(){
 const base=baseWorldScale(),c=state.current;
 // On exact-delivery requests keep the launching spot and target in frame.
 if(c&&c.type==='accuracy'&&state.flightState!=='flying')return Math.min(base,Math.max(.08,(W-112)/Math.max(10,c.target+14)));
 return base;
}
function worldScale(){return zoomNow}
function sceneEnd(){
 const c=state.current;
 return Math.max(1600,c?.target||0,c?.goal||0,flight?.x||0,...(c?.zones||[]).map(z=>z.x+z.w),...(c?.obstacles||[]).map(o=>o.x))+450;
}
function panScene(by){
 if(!state.current)return;
 manualCamera=true;
 const visible=W/Math.max(.08,zoomNow),step=by*visible*.68;
 cameraAim=limit(cameraAim+step,0,Math.max(0,sceneEnd()-visible*.5));
 // Camera responds immediately to tap, animation keeps transitions smooth.
 cameraX+=(cameraAim-cameraX)*.64;
}
function recenterScene(){manualCamera=false;sceneDrag=null;
 cameraAim=state.flightState==='flying'&&flight?Math.max(0,flight.x-Math.min(65,W/Math.max(.08,zoomNow)*.35)):0;
}
function updateCamera(dt){
 const prep = $('#readyFlight');
 const lift = state.flightState === 'ready' && prep.classList.contains('show')
  ? Math.min(prep.offsetHeight + 16, H * .47) : 0;
 groundLift += (lift - groundLift) * Math.min(1, dt * 11);
 const wanted=wantedWorldScale();
 if(!zoomInitialized){zoomNow=baseWorldScale();zoomInitialized=true}
 zoomNow+=(wanted-zoomNow)*Math.min(1,dt*4.5);
 if(!manualCamera){
  if(state.flightState==='flying'&&flight)cameraAim=Math.max(0,flight.x-Math.min(65,W/zoomNow*.36));
  else cameraAim=0;
 }
 const cap=Math.max(0,sceneEnd()-W/Math.max(.08,zoomNow)*.4);
 cameraAim=limit(cameraAim,0,cap);
 cameraX+=(cameraAim-cameraX)*Math.min(1,dt*12);
}

function cameraAltitude(){return flight&&state.flightState==='flying'?Math.max(0,flight.y-85):0}
function worldXY(x,y){let s=worldScale(),alt=cameraAltitude();return{x:(x-cameraX)*s+60,y:H-36-groundLift-(y-alt)*s}}
function stepGame(delta) {
 const dt = limit(delta / 1000, 0, .033);
 updateFlight(dt);
 if (started) updateCamera(dt);
 if (saveDelay > 0) {
  saveDelay -= dt;
  if (saveDelay <= 0) save();
 }
 tutorial.sync();
}
function bind(){
$$('.nav button').forEach(button=>button.addEventListener('click',()=>selectTab(button.dataset.tab)));
$('#angle').addEventListener('input',()=>{$('#angleValue').textContent=$('#angle').value+'°'});$('#power').addEventListener('input',()=>{$('#powerValue').textContent=$('#power').value+'%'});
$('#planeSelect').addEventListener('change',e=>{state.selectedPlaneKey=e.target.value;renderPlaneSelect();autosave()});$('#launchBtn').onclick=launch;$('#briefBtn').onclick=toggleRisk;
$('#forecastTicketBtn').onclick=mapOpen;$('#quickMap').onclick=mapOpen;$('#viewLeft').onclick=()=>panScene(-1);$('#viewRight').onclick=()=>panScene(1);$('#viewHome').onclick=recenterScene;
$('#brakeBtn').onclick=airBrake;$('#chestBtn').onclick=openChestUI;$('#lootOpenBtn').onclick=revealLoot;$('#lootCloseBtn').onclick=closeChestUI;$('#leftBtn').onclick=()=>correction(-1,0);$('#rightBtn').onclick=()=>correction(1,0);$('#upBtn').onclick=()=>correction(0,1);$('#downBtn').onclick=()=>correction(0,-1);
$('#starAdBtn').onclick=applyStarReward;$('#modalPrimary').onclick=()=>dismissModal(true);$('#modalSecondary').onclick=()=>dismissModal(false);
$('#mapLeft').onclick=()=>panMap(-240);$('#mapRight').onclick=()=>panMap(240);$('#mapClose').onclick=mapClose;
world.addEventListener('pointerdown',e=>{
 if($('#mapOverlay').classList.contains('show')||$('#modalCover').classList.contains('show'))return;
 sceneDrag={x:e.clientX,aim:cameraAim,moving:false};try{world.setPointerCapture(e.pointerId)}catch(_){}
});
world.addEventListener('pointermove',e=>{
 if(!sceneDrag)return;
 const dx=e.clientX-sceneDrag.x;
 if(Math.abs(dx)>7)sceneDrag.moving=true;
 if(!sceneDrag.moving)return;
 manualCamera=true;
 cameraAim=limit(sceneDrag.aim-dx/Math.max(.08,zoomNow),0,Math.max(0,sceneEnd()-W/Math.max(.08,zoomNow)*.4));
 cameraX=cameraAim;
});
world.addEventListener('pointerup',()=>sceneDrag=null);
world.addEventListener('pointercancel',()=>sceneDrag=null);
map.addEventListener('pointerdown',e=>{mapDrag={x:e.clientX,from:mapView};try{map.setPointerCapture(e.pointerId)}catch(err){}});
map.addEventListener('pointermove',e=>{if(!mapDrag)return;const scale=limit(mapW/590,.53,1.6);panMap((mapDrag.x-e.clientX)/scale+(mapDrag.from-mapView))});
map.addEventListener('pointerup',()=>mapDrag=null);map.addEventListener('pointercancel',()=>mapDrag=null);
window.addEventListener('resize',()=>{sizeWorld();sizeMap()});if(typeof ResizeObserver!=='undefined')new ResizeObserver(sizeWorld).observe($('#stage'));
window.addEventListener('pagehide',save);
}

/* Enhanced daily claim affordances, plane controls and expandable bottom sheet */
const dockEl=$('#dock'),appEl=$('#app');
let dragDock=null,customDockHeight=null,presetName='balanced',lootInterval=null;
const badgeDefs=[
{id:'first',icon:'📨',name:'첫 배달',desc:'첫 번째 배달 완료',test:()=>state.round>=1,reward:120},
{id:'ace',icon:'🌟',name:'완벽한 착륙',desc:'5★를 한 번 받기',test:()=>state.stars.some(n=>n===5),reward:240},
{id:'air',icon:'🗺️',name:'하늘의 탐험가',desc:'지도 3번 보기',test:()=>state.mapVisits>=3,reward:150},
{id:'ten',icon:'🎖️',name:'숙련 우체부',desc:'배달 10회 완료',test:()=>state.round>=10,reward:650},
{id:'combo',icon:'🔥',name:'연속 달인',desc:'4★ 이상 5회 연속',test:()=>state.bestRaw>=5,reward:480},
{id:'treasure',icon:'💎',name:'보물 사냥꾼',desc:'상자 5개 열기',test:()=>state.openedCrates>=5,reward:370}
];
function ensureNewFields(){state.gameMode=['random','stage'].includes(state.gameMode)?state.gameMode:'random';state.stageUnlocked=Math.max(1,Math.floor(state.stageUnlocked||1));state.stageSelected=limit(Math.floor(state.stageSelected||1),1,state.stageUnlocked);state.stageStars ||= {};state.stageWins ||= 0;state.achievements ||= {};state.pendingDaily ||= [];state.mapVisits ||= 0;state.bestRaw=Math.max(state.bestRaw||0,state.goodRaw||0);state.openedCrates ||= 0;state.xp=Number.isFinite(state.xp)?Math.max(0,state.xp):0;state.newPlaneIds=Array.isArray(state.newPlaneIds)?state.newPlaneIds:[];state.planeCoupons=state.planeCoupons&&typeof state.planeCoupons==='object'?state.planeCoupons:{};state.launchAngle=Number.isFinite(state.launchAngle)?state.launchAngle:38;state.launchPower=Number.isFinite(state.launchPower)?state.launchPower:72;
 if(state.daily && !state.daily.claimed){const def=dailyDefs.find(d=>d.type===state.daily.type);if(def&&state.daily.progress>=def.target&&!state.pendingDaily.some(p=>p.day===state.daily.day))state.pendingDaily.push({day:state.daily.day,name:def.name,cash:420+state.daily.day*28});}
}
function rankLevel(){return 1+Math.floor(state.xp/180)}
function ensureEpic(){
 if(!state.epicUnlockMigration){const oldLevels={basic:1,light:2,stable:3,biplane:5,balance:7,waterproof:10,carbon:14,gold:19,star:25,royal:33};state.newPlaneIds=Array.isArray(state.newPlaneIds)?state.newPlaneIds:[];for(const d of planeDefs)if(rankLevel()>=planeUnlockLevel(d)&&rankLevel()<oldLevels[d.id]&&!state.newPlaneIds.includes(d.id))state.newPlaneIds.push(d.id);state.epicUnlockMigration=true;}
 state.epicCrates=Math.max(0,Math.floor(Number(state.epicCrates)||0));
 state.epicPending=Math.max(0,Math.floor(Number(state.epicPending)||0));
 const earned=Math.floor((rankLevel()-1)/5);
 const old=Number.isFinite(state.epicMilestones)?Math.max(0,Math.floor(state.epicMilestones)):0;
 if(earned>old){const count=earned-old;state.epicCrates+=count;state.epicPending+=count;state.epicMilestones=earned;}
 else state.epicMilestones=old;
}
function rollEpicLoot(){
 if(Math.random()>=0.30)return rollLoot(5,true);
 let r=Math.random()*100,idx=0;
 while(idx<epicPlaneWeights.length-1&&r>=epicPlaneWeights[idx]){r-=epicPlaneWeights[idx];idx++;}
 const def=planeDefs[idx],locked=!planeUnlocked(def);grantPlane(def.id);
 return {icon:'✈️',title:def.name,text:'비행기 1대 획득 · 바로 사용 가능'+(locked?' · 구매 잠금 Lv.'+planeUnlockLevel(def)+' 유지':''),tier:idx>=7?'legendary':idx>=4?'epic':idx>=2?'rare':'common',plane:def.id};
}
function awardXp(star){
 ensureNewFields();const before=rankLevel();state.xp+=12+star*13+(star>=4?12:0);const now=rankLevel();ensureEpic();
 for(let lv=before+1;lv<=now;lv++){
  const unlocked=planeDefs.filter(def=>planeUnlockLevel(def)===lv);
  for(const def of unlocked)if(!state.newPlaneIds.includes(def.id))state.newPlaneIds.push(def.id);
  const extra=140+lv*85;rewardBurst('🏅','LEVEL UP · Lv.'+lv,lv,'level');
  credit(extra,'Lv.'+lv+' 달성 보상');
  if(lv%3===0){state.crates++;rewardBurst('🎁','행운 상자 +1',1,'item');}
  for(const def of unlocked)rewardBurst('🔓',def.name+' 해금',0,'unlock');
  addLog('우체부 Lv.'+lv+' 달성 · '+money(extra)+(unlocked.length?' · '+unlocked.map(x=>x.name).join(', ')+' 해금':''));
  banner('🎖️ 레벨 '+lv+' 달성!');
 }
}
function checkAchievements(){ensureNewFields();for(const ach of badgeDefs){if(state.achievements[ach.id]||!ach.test())continue;state.achievements[ach.id]=true;credit(ach.reward,'업적 '+ach.name);banner(ach.icon+' 업적 달성! '+ach.name+' +'+money(ach.reward));sparkles('mix',15);sfx('rare');addLog('업적 보상: '+ach.name+' · '+money(ach.reward))}}
function questNotify(){
 const q=dailyQuest(),pending=state.pendingDaily||[],current=pending.find(p=>p.day===state.day);
 const ready=!!current;$('#questDot').hidden=pending.length===0;
 const g=$('#officeList'),card=g.querySelector(':scope > .item:first-child');if(!card)return;
 card.classList.add('quest-card');card.classList.toggle('ready',ready);
 const prize=card.querySelector('.price');if(prize)prize.textContent=q.prog.claimed?'✓ 수령 완료':ready?'🎉 받을 보상: '+money(current.cash)+' + 상자 1개':'목표를 달성하면 보상 지급';
 let button=card.querySelector('button');if(!ready){button?.remove()}else{if(!button){button=document.createElement('button');card.append(button)}button.className='action quest-ready-btn';button.textContent='보상 받기';button.onclick=claimDaily;}
 const detail=card.querySelector('div');if(detail&&!detail.querySelector('.quest-progress')){const track=document.createElement('div');track.className='quest-progress';track.innerHTML='<span></span>';detail.append(track)}
 const fill=card.querySelector('.quest-progress span');if(fill)fill.style.width=(q.prog.progress/q.def.target*100)+'%';
 if(ready&&!card.querySelector('.quest-reddot')){const dot=document.createElement('span');dot.className='quest-reddot';card.append(dot)}if(!ready)card.querySelector('.quest-reddot')?.remove();
 for(const old of pending.filter(r=>r.day!==state.day)){
  const el=document.createElement('div');el.className='item quest-card ready';el.innerHTML=`<div><strong>🎁 ${old.day}일차 미수령 보상 · ${safe(old.name)}</strong><p>받지 않은 미션 보상이 보관되어 있습니다.</p><span class="price">${money(old.cash)} + 상자 1개</span></div><span class="quest-reddot"></span>`;
  const b=document.createElement('button');b.className='action quest-ready-btn';b.textContent='보상 받기';b.onclick=()=>claimQueuedQuest(old.day);el.append(b);g.insertBefore(el,card.nextSibling);
 }
}
function claimQueuedQuest(day){
 ensureNewFields();const idx=state.pendingDaily.findIndex(q=>q.day===day);if(idx<0)return notify('받을 미션 보상이 없습니다');const q=state.pendingDaily.splice(idx,1)[0];
 if(state.daily?.day===q.day)state.daily.claimed=true;
 credit(q.cash,'일일 미션 수령');state.crates=Math.min(30,state.crates+1);addLog('일일 미션 수령 · '+money(q.cash)+' + 상자 1개');sparkles('mix',20);banner('🎯 미션 보상 '+money(q.cash)+' · 상자 1개');sfx('win');renderAll();autosave();
}
const previousProgressQuest=progressQuest;
progressQuest=function(star,f,c){previousProgressQuest(star,f,c);const q=dailyQuest();ensureNewFields();if(!q.prog.claimed&&q.prog.progress>=q.def.target&&!state.pendingDaily.some(r=>r.day===q.prog.day)){state.pendingDaily.push({day:q.prog.day,name:q.def.name,cash:420+q.prog.day*28});autosave();}};
claimDaily=function(){ensureNewFields();const q=state.pendingDaily.find(p=>p.day===state.day)||state.pendingDaily[0];if(!q)return notify('아직 달성한 미션이 없습니다');claimQueuedQuest(q.day)};
function updateChestBadges(){const n=state.crates||0;$('#chestCount').textContent=String(n);$('#chestBtn').disabled=false;$('#chestBtn').classList.toggle('empty',n===0);$('#lootBalance').textContent=String(n);for(const el of $$('#lobbyShop,#chestBtn,.lucky-chest-card,.lucky-chest-card .action,#lootOpenBtn'))el.classList.toggle('lucky-ready',n>0)}
function updatePlaneVisual(){const p=selectedPlane();if(!p)return;$('#planeSmallName').textContent=p.def.name;$('#planeWing').setAttribute('fill',p.def.color||'#fff');const eff=effectivePlaneStats(p);const stats=`속도 ${Math.round(eff.speed*100)} · 활공 ${Math.round(eff.glide*100)} · 안정 ${Math.round(eff.stable*100)}`;$('#planeStatsPreview').textContent=stats;const x=state.xp%180,lv=rankLevel();$('#rankLabel').textContent=`🎖️ Lv.${lv} 우체부`;$('#rankXp').textContent=`${x} / 180 XP`;$('#rankXpFill').style.width=(x/180*100)+'%';$('#loadoutNote').textContent=`장비 효과 · 충돌 방어막 ${state.boosts.shield}개 · 순풍 강화 ${state.boosts.tailwind}회`;$('#fineAngle').textContent=$('#angle').value+'°';$('#finePower').textContent=$('#power').value+'%';}
function cyclePlane(by){const options=ownedFlat().filter(p=>p.p.dur>0);if(!options.length)return;const key=selectedPlane()?.key;const at=options.findIndex(p=>p.key===key);const nx=options[(at+by+options.length)%options.length];state.selectedPlaneKey=nx.key;renderPlaneSelect();updatePlaneVisual();autosave();sfx('event');}
function setTuning(a,p){$('#angle').value=limit(Math.round(a),6,78);$('#power').value=limit(Math.round(p),20,100);state.launchAngle=Number($('#angle').value);state.launchPower=Number($('#power').value);$('#angleValue').textContent=state.launchAngle+'°';$('#powerValue').textContent=state.launchPower+'%';updatePlaneVisual();autosave()}
function applySavedTuning(){ensureNewFields();$('#angle').value=state.launchAngle;$('#power').value=state.launchPower;$('#angleValue').textContent=state.launchAngle+'°';$('#powerValue').textContent=state.launchPower+'%';}
function baseDockHeight(){const h=innerHeight;return h<391&&innerWidth>h?190:h<531&&innerWidth>h?194:innerWidth<innerHeight?262:216}
function limitDockHeight(v){const hud=innerHeight<531&&innerWidth>innerHeight?45:53;return limit(v,Math.min(baseDockHeight(),innerHeight-hud-65),Math.max(100,innerHeight-hud-75))}
function setDockHeight(v,store=false){const h=limitDockHeight(v);customDockHeight=h;appEl.style.setProperty('--dock-h',h+'px');dockEl.classList.toggle('expanded',h>baseDockHeight()+28);document.body.classList.toggle('sheet-open',h>baseDockHeight()+28);$('#grabText').textContent=h>baseDockHeight()+28?'아래로 밀어 화면 확장':'위로 밀어 메뉴 확장';if(store){state.uiDockHeight=h;autosave()}return h;}
function toggleDock(){const b=baseDockHeight(),h=customDockHeight||b;setDockHeight(h>b+28?b:Math.min(innerHeight*.73,innerHeight-102),true)}
function appendAchievements(){const g=$('#recordsList');if(!g)return;const wrap=document.createElement('section');wrap.className='achievements';wrap.innerHTML='<h3 class="achievement-heading">🏅 업적 컬렉션 · 처음 달성 시 코인 보상</h3>';for(const d of badgeDefs){const el=document.createElement('article');const done=!!state.achievements?.[d.id];el.className='achievement'+(done?' unlocked':'');el.innerHTML=`<b>${done?d.icon:'🔒'} ${d.name}</b><p>${d.desc} · ${money(d.reward)}${done?' ✓':''}</p>`;wrap.append(el)}g.prepend(wrap)}
function lootParticles(count,tier){const host=$('#lootConfetti');host.replaceChildren();const parts=tier==='loss'?['⚠️','📉','🧾']:tier==='legendary'?['👑','✨','🌟','💎']:tier==='epic'?['✨','💜','⭐']:['✨','⭐','🎉'];for(let i=0;i<count;i++){let el=document.createElement('span');el.className='loot-bit';el.textContent=pick(parts);const th=2*Math.PI*i/count,d=rng(90,190);el.style.setProperty('--x',Math.cos(th)*d+'px');el.style.setProperty('--y',Math.sin(th)*d+'px');el.style.setProperty('--r',rng(-300,300)+'deg');el.style.setProperty('--t',rng(.9,1.55)+'s');host.append(el)}setTimeout(()=>host.replaceChildren(),1650)}
// Preserve the existing underlying game engine while upgrading the relevant UI.
const oldRenderOffice=renderOffice;
renderOffice=function(){oldRenderOffice();questNotify()};
const oldRenderAll=renderAll;
renderAll=function(){oldRenderAll();updatePlaneVisual();updateChestBadges()};
const oldRenderRecords=renderRecords;
renderRecords=function(){oldRenderRecords();appendAchievements()};
const oldOpenChestUI=openChestUI;
openChestUI=function(){
 if(state.crates<=0){if(state.flightState==='flying'||$('#mapOverlay').classList.contains('show'))return notify('비행 중에는 열 수 없습니다');$('#lootOverlay').classList.add('show');openingLoot=false;lootPending=state.flightState==='result';if(lootPending)clearTimeout(nextTimer);
  $('#lootChest').textContent='🎁';$('#lootRarity').className='loot-rarity';$('#lootRarity').textContent='확률 보상';$('#lootTitle').textContent='행운 상자';$('#lootMessage').textContent='상자가 없습니다 · 배달/미션으로 획득';
  $('#lootCloseBtn').disabled=false;$('#lootOpenBtn').disabled=true;
 }else oldOpenChestUI();
 if(!$('#lootOverlay').classList.contains('show'))return;const w=$('#lootWindow');w.className='loot-window';$('#lootConfetti').replaceChildren();$('#lootStatus').textContent='등급을 뽑아 보세요';$('#lootBalance').textContent=String(state.crates);$('#lootOpenBtn').textContent=state.crates>0?'🎁 상자 열기':'상자 없음';$('#lootOpenBtn').disabled=state.crates<=0;};
revealLoot=function(){
 if(openingLoot||boxBalance()<=0)return;
 const epic=lootMode==='epic';
 openingLoot=true;
 const win=$('#lootWindow');win.className='loot-window spinning'+(epic?' epic-box':'');
 $('#lootOpenBtn').disabled=true;$('#lootCloseBtn').disabled=true;
 $('#lootTitle').textContent='개봉 중';$('#lootRarity').className='loot-rarity';$('#lootRarity').textContent='기대하세요';
 $('#lootStatus').textContent='등급 추첨 중';$('#lootMessage').textContent='개봉 중';
 $('#lootChest').classList.remove('opened');$('#lootChest').textContent=epic?'💎':'🎁';sfx('event');
 let turn=0;clearInterval(lootInterval);
 lootInterval=setInterval(()=>{turn++;$('#lootReel').textContent=Array.from({length:9},()=>pick(['✉️','💰','🛡️','💎','👑','🛩️','🌈','🍀'])).join('　');if(turn===8)$('#lootStatus').textContent='등급 추첨 중';if(turn===17)$('#lootStatus').textContent='결과 공개!'},92);
 setTimeout(()=>{
  clearInterval(lootInterval);if(!$('#lootOverlay').classList.contains('show'))return;
  if(epic){state.epicCrates--;state.epicPending=Math.max(0,state.epicPending-1);}else state.crates--;state.openedCrates=(state.openedCrates||0)+1;
  const r=epic?rollEpicLoot():rollLoot(),names={loss:'⚠ 손실',common:'● 일반',rare:'◆ 희귀',epic:'✦ 영웅',legendary:'★ 전설'};
  win.className='loot-window reveal'+(epic?' epic-box':'')+(r.tier==='loss'?' loss-reveal':r.tier==='legendary'?' legendary-reveal':r.tier==='epic'?' epic-reveal':'');
  $('#lootChest').textContent=r.icon;$('#lootChest').classList.add('opened');
  $('#lootRarity').className='loot-rarity '+(r.tier==='common'?'':r.tier);$('#lootRarity').textContent=names[r.tier]+' 등급';
  $('#lootTitle').textContent=r.title;$('#lootStatus').textContent=r.tier==='loss'?'⚠️ LOSS · 이번 상자는 손실!':r.tier==='legendary'?'👑 LEGENDARY · 전설 획득!':r.tier==='epic'?'💜 EPIC · 영웅 획득!':'🎉 개봉 완료!';
  $('#lootMessage').textContent=r.text;$('#lootOpenBtn').textContent=epic?'💎 한 번 더 뽑기':'🎁 한 번 더 뽑기';$('#lootCloseBtn').disabled=false;
  openingLoot=false;lootParticles(r.tier==='legendary'?30:r.tier==='epic'?23:15,r.tier);
  sfx(r.tier==='loss'?'hit':r.tier==='common'?'win':'rare');if(r.tier==='epic'||r.tier==='legendary')sparkles('mix',30);
  addLog((epic?'에픽 상자 ':'상자 ')+names[r.tier]+' 보상 · '+r.title+' / '+r.text);
  checkAchievements();renderAll();save();$('#lootOpenBtn').disabled=boxBalance()<=0;
 },2250);
};
const oldMapOpen=mapOpen;
mapOpen=function(){const was=$('#mapOverlay').classList.contains('show');oldMapOpen();if(!was&&$('#mapOverlay').classList.contains('show')){state.mapVisits=(state.mapVisits||0)+1;checkAchievements();autosave();}};
const oldCompleteFlight=completeFlight;
completeFlight=function(){const before=state.round;oldCompleteFlight();if(state.round===before)return;state.bestRaw=Math.max(state.bestRaw||0,state.goodRaw);if(state.lastResult?.gotChest)rewardBurst('🎁','행운 상자 +1',1,'item');if(state.lastResult?.bonusTicket)rewardBurst('🎟️','연속 보너스 · 예보권 +1',1,'item');awardXp(state.lastResult?.star||1);checkAchievements();renderAll();autosave()};
const oldBind=bind;
bind=function(){
 oldBind();
 $('#planePrev').onclick=()=>cyclePlane(-1);$('#planeNext').onclick=()=>cyclePlane(1);
 $('#settingsToggle').onclick=()=>{setDockHeight(Math.max(baseDockHeight()+85,Math.min(innerHeight*.75,innerHeight-96)),true);$('.dock-body').scrollTop=0;};
 $('#dockExpandBtn').onclick=e=>{e.stopPropagation();toggleDock()};
 const grab=$('#dockGrab');
 grab.addEventListener('pointerdown',e=>{if(e.target.closest('button')||document.body.classList.contains('in-flight'))return;dragDock={y:e.clientY,h:dockEl.getBoundingClientRect().height,moved:false};grab.setPointerCapture(e.pointerId);document.body.classList.add('dock-dragging');dockEl.classList.add('dragging');});
 grab.addEventListener('pointermove',e=>{if(!dragDock)return;let dy=dragDock.y-e.clientY;if(Math.abs(dy)>4)dragDock.moved=true;setDockHeight(dragDock.h+dy,false);});
 const stop=()=>{if(!dragDock)return;dragDock=null;document.body.classList.remove('dock-dragging');dockEl.classList.remove('dragging');state.uiDockHeight=customDockHeight;autosave()};
 grab.addEventListener('pointerup',stop);grab.addEventListener('pointercancel',stop);
 grab.addEventListener('keydown',e=>{if(e.key==='ArrowUp'){setDockHeight((customDockHeight||baseDockHeight())+35,true);e.preventDefault()}if(e.key==='ArrowDown'){setDockHeight((customDockHeight||baseDockHeight())-35,true);e.preventDefault()}});
 $('#angleMinus').onclick=()=>setTuning(Number($('#angle').value)-1,Number($('#power').value));
 $('#anglePlus').onclick=()=>setTuning(Number($('#angle').value)+1,Number($('#power').value));
 $('#powerMinus').onclick=()=>setTuning(Number($('#angle').value),Number($('#power').value)-1);
 $('#powerPlus').onclick=()=>setTuning(Number($('#angle').value),Number($('#power').value)+1);
 $$('.preset-strip button').forEach(b=>b.onclick=()=>{const presets={balanced:[38,72],accuracy:[24,52],distance:[47,86]};setTuning(...presets[b.dataset.preset]);$$('.preset-strip button').forEach(x=>x.classList.toggle('active',x===b));sfx('event')});
 $('#angle').addEventListener('input',()=>setTuning(Number($('#angle').value),Number($('#power').value)));
 $('#power').addEventListener('input',()=>setTuning(Number($('#angle').value),Number($('#power').value)));
 window.addEventListener('resize',()=>{if(customDockHeight!==null){const v=limitDockHeight(customDockHeight);setDockHeight(v,false)}else{appEl.style.removeProperty('--dock-h')}});
};


// Economy UI: retained with legacy save data, no real-money features.
function riskTone(){const debt=debtSum(),cash=state.money;return debt>=45000||overdue()>6||cash<100?'high':debt>=8000||cash<650?'mid':'low'}
function renderFinanceUi(){
 const tone=riskTone(),name=tone==='high'?'위험':tone==='mid'?'주의':'안정';
 const ribbon=$('#financeRibbon');if(ribbon){ribbon.dataset.tone=tone;$('#financeStatus').textContent=(tone==='high'?'🚨 ':tone==='mid'?'⚠️ ':'🏦 ')+'재무 상태 '+name+' · 대출 '+money(debtSum());
  const l=state.finance?.last;const t=$('#financeLast');t.textContent=l?(l.type==='loan'?'대출 ':l.amount>0?'+':'')+money(l.amount):'운영비 · 손실 확률 존재';t.classList.toggle('loss-text',!!l&&(l.amount<0||l.type==='loan'));
 }
 const b=$('#insuranceBtn');if(b){b.textContent=state.insuranceOn?'보험 켜짐':'보험 끔';b.classList.toggle('on',state.insuranceOn);b.setAttribute('aria-pressed',String(state.insuranceOn));}
 const p=$('#insuranceCost');if(p)p.textContent=money(insurancePrice());
}
function renderFinanceOffice(){
 const host=$('#officeList');if(!host)return;const f=state.finance||{};
 const box=document.createElement('section');box.className='finance-dashboard';box.innerHTML=`<div class="finance-dashboard-head"><div><b>🏦 우체국 재무 상황</b><p>수입 · 지출 · 대출</p></div><span class="finance-alert ${riskTone()}">${riskTone()==='high'?'위험':riskTone()==='mid'?'주의':'안정'}</span></div><div class="finance-three"><div><small>누적 수입</small><strong>${money(f.earned||0)}</strong></div><div><small>누적 지출</small><strong class="loss-text">${money(f.spent||0)}</strong></div><div><small>발생한 대출</small><strong class="loss-text">${money(f.borrowed||0)}</strong></div></div><div class="finance-warning">배달 손실 35%+ · 추가 수익 27% · 뽑기 손실 16%</div><div class="finance-history"><b>최근 자금 흐름</b>${(f.ledger||[]).slice(0,5).map(l=>`<div><span>${safe(l.reason)}</span><strong class="${l.amount<0||l.type==='loan'?'loss-text':'gain-text'}">${l.amount>0?'+':''}${money(l.amount)}</strong></div>`).join('')||'<p>아직 자금 흐름이 없습니다.</p>'}</div>`;
 host.prepend(box);
}
const financialRenderOffice=renderOffice;
renderOffice=function(){financialRenderOffice();renderFinanceOffice()};
const financialRenderAll=renderAll;
renderAll=function(){financialRenderAll();renderFinanceUi()};
const financialBind=bind;
bind=function(){financialBind();const b=$('#insuranceBtn');if(b)b.onclick=()=>{if(state.flightState==='flying')return notify('발사 전에만 변경할 수 있습니다');state.insuranceOn=!state.insuranceOn;sfx('event');renderFinanceUi();autosave()}};


/* Main lobby, progressive stages, equipment and light aerial battle. */
const partCatalog=[
 {id:'wing',name:'활공 날개',icon:'🪽',desc:'활공 +6% / Lv',factor:1.06,base:230},
 {id:'engine',name:'추진 코어',icon:'🚀',desc:'발사 속도 +4% / Lv',factor:1.04,base:320},
 {id:'stabilizer',name:'균형 장치',icon:'🎯',desc:'방향 안정 +6% / Lv',factor:1.06,base:275},
 {id:'armor',name:'보호 코팅',icon:'🛡️',desc:'충돌·날씨 내구도 감소 완화',factor:1,base:290}
];
const partLevel=(plane,id)=>Math.max(0,Math.min(8,Math.floor(plane?.p?.parts?.[id]||0)));
function effectivePlaneStats(plane){
 const d=plane?.def||planeDefs[0],scale=(id)=>partLevel(plane,id);
 return {...d,speed:d.speed*(1+.04*scale('engine')),glide:d.glide*(1+.06*scale('wing')),stable:d.stable*(1+.06*scale('stabilizer'))};
}
function partCost(plane,id){const c=partCatalog.find(x=>x.id===id);return Math.ceil((c.base+Math.max(0,plane?.def?.price||0)*.025)*Math.pow(1.55,partLevel(plane,id)) /10)*10}
function upgradePart(id){
 if(state.gameOver)return notify('게임 오버입니다');if(state.flightState==='flying')return notify('비행 중에는 장착할 수 없습니다');
 const p=selectedPlane();if(!p)return;const lv=partLevel(p,id);if(lv>=8)return notify('최대 레벨입니다');
 const cost=partCost(p,id);
 openModal({mark:'⚙️',title:(lv?'부품 강화':'부품 장착'),message:`${partCatalog.find(x=>x.id===id).name} · Lv.${lv} → Lv.${lv+1}`,tip:`비용 ${money(cost)} · 잔액이 부족하면 기존 대출 규칙에 따라 빚이 발생합니다.`,primary:'강화하기',secondary:'취소',action:()=>{pay(cost,'비행기 '+id+' 업그레이드');if(state.gameOver)return;p.p.parts ||= {};p.p.parts[id]=lv+1;addLog('부품 강화 · '+id+' Lv.'+(lv+1)+' / '+money(cost));sparkles('✨',9);sfx('rare');renderAll();autosave();}});
}
function renderParts(){
 const g=$('#partsList'),h=$('#partsSummary');if(!g||!h)return;g.replaceChildren();const p=selectedPlane();if(!p){h.textContent='비행기를 선택해 주세요';return;}
 const es=effectivePlaneStats(p);
 h.innerHTML=`<div><strong>✈ ${safe(p.def.name)}</strong><small>속도 ${Math.round(es.speed*100)} · 활공 ${Math.round(es.glide*100)} · 안정 ${Math.round(es.stable*100)}</small></div><span class="part-level">${Object.values(p.p.parts||{}).reduce((a,b)=>a+b,0)} 강화</span>`;
 for(const c of partCatalog){const lv=partLevel(p,c.id),el=document.createElement('div');el.className='item parts-card';el.innerHTML=`<div class="part-icon">${c.icon}</div><div class="part-meta"><strong>${c.name} <span class="part-level">Lv.${lv}/8</span></strong><p>${c.desc}</p><div class="part-progress"><span style="width:${lv/8*100}%"></span></div><div class="part-price">${lv===8?'최대 강화':money(partCost(p,c.id))}</div></div>`;const b=document.createElement('button');b.className='action buy';b.disabled=lv>=8;b.textContent=lv===8?'완료':lv===0?'장착':'강화';b.onclick=()=>upgradePart(c.id);el.appendChild(b);g.appendChild(el)}
}
const priorRenderAllForParts=renderAll;
renderAll=function(){priorRenderAllForParts();renderParts()};
// A delivery consists of three separate flights. No combat or enemy damage.
// Select a different route, weather and package on each flight. The second flight
// changes mission category from the first, while the third is a varied finale.
const deliveryScenarios=[
 {id:'village',icon:'🌼',name:'마을 산책길',hint:'온화한 바람 · 장애물 적음',wind:.75,pay:1,obstacles:5},
 {id:'lake',icon:'💨',name:'호수 횡단',hint:'바람 변화 · 추가 보수 +12%',wind:1.2,pay:1.12,obstacles:8},
 {id:'festival',icon:'🎏',name:'축제 초대장',hint:'가벼운 축제 우편 · 보수 +16%',wind:.95,pay:1.16,obstacles:6},
 {id:'rush',icon:'⚡',name:'시간에 쫓긴 편지',hint:'급행 우편 · 보수 +18%',wind:1.08,pay:1.18,obstacles:8,weight:1.012},
 {id:'thermal',icon:'🌀',name:'기류 탐험',hint:'상승·하강기류가 많음',wind:1.02,pay:1.08,obstacles:7,moreZones:true},
 {id:'fragile',icon:'📦',name:'소중한 소포',hint:'충돌 주의 · 보수 +20%',wind:.91,pay:1.20,obstacles:6,fragile:true}
];
function configureRoundVariety(c){
 const d=state.delivery,step=Math.min(3,(d?.played||0)+1),past=d?.entries||[];
 const previous=past[past.length-1];
 if(step===1){
  c.type=state.gameMode==='stage'?(state.stageSelected%2?'accuracy':'distance'):(Math.random()<.52?'accuracy':'distance');
 }else if(step===2){c.type=(past[0]?.type||c.type)==='accuracy'?'distance':'accuracy';}
 else c.type=Math.random()<.50?'accuracy':'distance';
 const n=state.gameMode==='stage'?state.stageSelected:state.round+1;
 if(c.type==='accuracy'){
  c.target=state.gameMode==='stage'?Math.round(rng(80,165)+Math.min(240,(n-1)*2.1)):
  Math.round(rng(74,187)+Math.min(215,Math.sqrt(state.round)*15));
  c.goal=null;
 }else{
  const t=state.gameMode==='stage'?Math.max(0,n-1):state.round;
  const growth=state.gameMode==='stage'?Math.min(1300,t*13+33*Math.sqrt(t)):Math.min(1180,t*12+Math.sqrt(t)*30);
  c.goal=Math.round((490+growth)*rng(.95,1.07)/10)*10;c.target=null;
 }
 let available=deliveryScenarios.filter(x=>!past.some(e=>e.scenarioId===x.id));
 if(!available.length)available=deliveryScenarios;
 const scenario=pick(available);
 const usedWeather=past.map(e=>e.weatherId).filter(Boolean);
 const freshWeather=weatherDefs.filter(w=>!usedWeather.includes(w.id));
 c.weather=pick(freshWeather.length?freshWeather:weatherDefs);
 const usedPack=past.map(e=>e.packId).filter(Boolean);
 let packs=packages.filter(k=>!usedPack.includes(k.id));
 if(scenario.fragile) packs=packs.filter(k=>k.fragile);
 if(!packs.length)packs=packages;
 c.pack={...pick(packs)};c.pack.pay*=scenario.pay;
 c.weight=cargoWeight(c.pack,scenario);
 c.wind=rng(-5.1,5.1)*c.weather.wind*scenario.wind;
 const usedRegions=past.map(e=>e.regionName);
 c.region=pick(regions.filter(r=>!usedRegions.includes(r.name)).length?regions.filter(r=>!usedRegions.includes(r.name)):regions);
 const end=Math.max(1150,Math.max(c.target||0,c.goal||0)*1.9);
 c.zones=zoneList(end,c.weather);
 if(scenario.moreZones){c.zones.push({kind:'up',x:rng(70,end*.7),w:rng(65,120),strength:rng(14,24)});c.zones.push({kind:'down',x:rng(120,end*.7),w:rng(55,110),strength:rng(12,22)});c.zones.sort((a,b)=>a.x-b.x);}
 c.obstacles=obstacles(end).slice(0,scenario.obstacles);
 c.luckyRing={x:rng(95,Math.max(125,Math.min(end*.45,(c.target||c.goal||220)*.85))),y:rng(19,85),taken:false};
 c.scenarioId=scenario.id;c.scenarioIcon=scenario.icon;c.scenarioName=scenario.name;c.scenarioHint=scenario.hint;
 c.step=step;
}
const priorStageSpawn=spawnCustomer;
spawnCustomer=function(){
 priorStageSpawn();
 if(!state.current)return;
 const c=state.current,n=state.gameMode==='stage'?state.stageSelected:state.round+1;
 if(state.gameMode==='stage'){
  c.type=(n%4===0||n%6===0)?'distance':'accuracy';
  if(c.type==='accuracy'){
   c.target=Math.round(rng(80,165)+Math.min(240,(n-1)*2.1)); c.goal=null;
  }else{
   const t=Math.max(0,n-1);
   c.goal=Math.round((490+Math.min(1300,t*13+33*Math.sqrt(t)))*rng(.95,1.04)/10)*10; c.target=null;
  }
 }else{
  if(c.type==='accuracy') c.target=Math.round(rng(74,187)+Math.min(215,Math.sqrt(state.round)*15));
  else c.goal=Math.round((490+Math.min(1180,state.round*12+Math.sqrt(state.round)*30))*rng(.95,1.07)/10)*10;
 }
 configureRoundVariety(c);
 updateMission();
 $('#missionName').textContent=`${c.scenarioIcon} ${c.scenarioName} · `+(c.type==='accuracy'?'정확':'장거리');
 $('#missionDesc').textContent=`${c.pack.name} · ${c.weather.icon} ${c.weather.name} · `+(c.type==='accuracy'?`목표 ${c.target}m`:`희망 ${c.goal}m`);
 renderAll();selectRoundDefaults(c);updateDeliveryScreen();tutorial.routeReady();
};
const coreCompleteFlight=completeFlight;
completeFlight=function(){
 const previousRound=state.round;
 coreCompleteFlight();
 if(state.round===previousRound)return;
 const d=state.delivery;
 if(d?.active){
  d.played=Math.min(3,d.played+1);
  const result=state.lastResult;
  d.entries.push({star:result.star,pay:result.reward.total,dist:result.dist,
   type:result.c.type,weatherId:result.c.weather.id,packId:result.c.pack.id,
   regionName:result.c.region?.name,scenarioId:result.c.scenarioId,
   scenarioName:result.c.scenarioName,planeName:result.planeDef?.name||'종이비행기',
   angle:flight?flight.launchAngle:Number($('#angle').value),power:flight?flight.launchPower:Number($('#power').value)});
  d.net+=result.reward.total;
  d.mode=state.gameMode;
  $('#resultNext').textContent=d.played<3?`${d.played}/3 완료 · 다음 비행 준비`:'3/3 완료 · 최종 보상 확인';
 }
 updateDeliveryScreen();autosave();
};
function beginDeliverySession(){
 const old=state.delivery;
 if(old?.active&&old.mode===state.gameMode&&old.stage===state.stageSelected&&old.played<3)return;
 state.delivery={active:true,mode:state.gameMode,stage:state.stageSelected,played:0,net:0,entries:[],startedDay:state.day};
 autosave();
}
function syncReadyFlightControls(){
 const p=selectedPlane();
 $('#readyPlaneName').textContent=p?.def.name||'비행기 없음';
 const eff=p?effectivePlaneStats(p):null;
 $('#readyPlaneStats').textContent=p?`내구 ${p.p.dur}/${p.p.maxDur} · 속도 ${Math.round(eff.speed*100)}`:'비행기 구매 필요';
 $('#readyAngle').value=$('#angle').value;
 $('#readyPower').value=$('#power').value;
 $('#readyAngleValue').textContent=$('#angle').value+'°';
 $('#readyPowerValue').textContent=$('#power').value+'%';
}
function cycleReadyPlane(dir){
 const before=selectedPlane()?.key;
 cyclePlane(dir);
 if(before!==selectedPlane()?.key){renderParts();syncReadyFlightControls();}
}
function selectRoundDefaults(c){
 // Each flight starts with a useful but adjustable suggestion for its mission type.
 // Players may keep changing either slider or airplane until they launch.
 if(c.type==='accuracy'){
   const suggestedPower=limit(Math.round(24+(c.target-90)*.29),20,84);
   setTuning(12,suggestedPower);
 }else setTuning(43,80);
 syncReadyFlightControls();
}
function updateDeliveryScreen(){
 const d=state.delivery,step=limit((d?.played||0)+1,1,3);
 const ready=state.flightState==='ready'&&!!state.current&&started;
 $('#readyFlight').classList.toggle('show',ready);
 $('#deliveryPill').textContent='배송 '+step+' / 3';
 $('#readyTitle').textContent=(state.gameMode==='stage'?`STAGE ${state.stageSelected} · `:'')+`배송 ${step} / 3`;
 const c=state.current;
 $('#readyScenario').textContent=c?.scenarioName||'출발 준비';
 $('#readyDetail').textContent=c?`${c.weather.icon} ${c.weather.name} · ${c.pack.name} · 무게 ${(c.weight*100).toFixed(1)}%`:'비행 준비';
 $('#readyGoalChip').textContent=c?(c.type==='accuracy'?`🎯 ${c.target}m`:`🚀 ${c.goal}m`):'목표 확인';
 $('#readyRoundTip').textContent=c?.scenarioHint||'비행기와 발사 설정을 조정하세요';
 syncReadyFlightControls();
 $('#battleLaunch').disabled=!ready;
}
function concludeDelivery(){
 const d=state.delivery;if(!d?.active||d.played<3)return;
 d.active=false;
 const avg=d.entries.reduce((sum,e)=>sum+e.star,0)/3;
 const good=d.entries.filter(e=>e.star>=3).length;
 const cleared=avg>=3&&good>=2;
 let bonus=0,crate=false,crateCount=0;
 if(d.mode==='stage'){
  if(cleared){
   const n=d.stage,old=state.stageStars[n]||0,record=limit(Math.round(avg),1,5);
   state.stageStars[n]=Math.max(old,record);
   state.stageUnlocked=Math.max(state.stageUnlocked,n+1);
   state.stageWins++;
   if(!old){bonus=240+n*30;credit(bonus,'스테이지 최초 클리어');if(n%5===0){state.crates++;crate=true;crateCount++;}}
   if(state.stageSelected===n)state.stageSelected=n+1;
  }
 }else if(cleared){bonus=110+Math.floor(avg*90);credit(bonus,'3판 배송 완료 보너스');}
 if(avg>=4.3){state.crates++;crate=true;crateCount++;}
 const perfect=d.entries.length===3&&d.entries.every(e=>e.star===5);
 if(perfect){state.crates++;crate=true;crateCount++;}
 d.perfect=perfect;recordDeliveryStreak(d);
 const stamp=$('#perfectStamp');stamp.hidden=!perfect;stamp.classList.remove('imprint');
 if(perfect)setTimeout(()=>{if(state.delivery===d&&$('#deliveryOverlay').classList.contains('show')){stamp.classList.add('imprint');sfx('stamp');}},930);
 d.net+=bonus;d.bonus=bonus;d.crate=crate;d.avg=avg;d.cleared=cleared;
 renderAll();autosave();
 $('#deliverySummaryKicker').textContent=d.mode==='stage'?'STAGE '+String(d.stage).padStart(2,'0'):'THREE-FLIGHT DELIVERY';
 $('#deliveryHeading').textContent=d.mode==='stage'?(cleared?'스테이지 클리어!':'다음에 재도전!'):'배송 3판 완료!';
 $('#deliveryStars').textContent=stars(limit(Math.round(avg),1,5));
 $('#deliveryProgress').innerHTML=d.entries.map((r,i)=>`<span><div><strong>${i+1}판 · ${safe(r.scenarioName||'배송')}</strong><small>${safe(r.planeName||'종이비행기')}</small></div><b>${stars(r.star)}</b></span>`).join('');
 $('#deliveryTotal').textContent=(d.net>=0?'+':'−')+money(Math.abs(d.net));
 $('#deliveryTotal').classList.toggle('negative',d.net<0);
 $('#deliveryBonusLine').textContent='';
 const cards=$('#deliveryRewardCards');cards.replaceChildren();
 const gains=[]; // Completion bonus is included in the consolidated total.
 for(const [i,r] of gains.entries()){const e=document.createElement('div');e.className='delivery-reward-card '+r.cls;e.style.setProperty('--reveal-delay',(520+i*200)+'ms');e.innerHTML=`<span>${r.icon}</span><div>${r.title}<b>${r.value}</b></div>`;cards.append(e);}
 $$('#deliveryProgress > span').forEach((el,i)=>el.style.setProperty('--reveal-delay',(120+i*110)+'ms'));
 $('#deliveryOverlay').style.setProperty('--summary-actions-delay',(650+gains.length*200)+'ms');
 $('#deliveryOverlay').classList.add('show');$('#deliveryOverlay').setAttribute('aria-hidden','false');
 sfx(perfect?'perfect':cleared?'clear':'brake');
 const finalNet=d.net;
 setTimeout(()=>{if(state.delivery===d&&$('#deliveryOverlay').classList.contains('show'))rewardBurst(finalNet<0?'📉':'🪙',finalNet<0?'최종 배송 손실':'최종 배송 보상',finalNet,'coin',true);},570);

}
function scheduleNext(){
 clearTimeout(nextTimer);
 nextTimer=setTimeout(()=>{
  $('#result').classList.remove('show');$('#stage').classList.remove('stage-result');
  if(!started||state.gameOver)return;
  if((state.delivery?.played||0)>=3){concludeDelivery();return;}
  state.lastResult=null;spawnCustomer();
 },2900);
}
function reputationCost(){return Math.ceil((2600+(state.reputationBuys||0)*2200)*Math.pow(1.18,state.reputationBuys||0)/10)*10}
function buyReputation(){
 if(state.gameOver)return notify('게임 오버 상태입니다');
 if(aStars()>=4.999)return notify('평균 평점이 이미 최고입니다');
 const amount=reputationCost();
 openModal({mark:'🌟',title:'평판 도장',message:'구매하면 평균 평점에 +1.0★가 영구 적용됩니다. 최대 평점은 5★입니다.',tip:'가격 '+money(amount)+' · 잔액 부족 시 대출이 발생할 수 있습니다.',primary:'구매하기',secondary:'취소',action:()=>{
  pay(amount,'평판 도장 구매');if(state.gameOver)return;
  state.reputationBonus=(state.reputationBonus||0)+1;
  state.reputationBuys=(state.reputationBuys||0)+1;
  rewardBurst('🌟','평균 평판 +1.0★',1,'item');renderAll();autosave();
 }});
}
const originalRenderShop=renderShop;
renderShop=function(){
 originalRenderShop();const g=$('#shopList');const card=document.createElement('div');card.className='item reputation-shop-card';
 card.innerHTML=`<div><strong>🌟 평판 상승 도장 +1★</strong><p>평균 평점을 즉시 1점 상승 · 최대 5점</p><span class="price">현재 ${aStars().toFixed(2)}★ · ${money(reputationCost())}</span></div>`;
 const b=document.createElement('button');b.className='action buy';b.textContent=aStars()>=4.999?'최대 평점':'구매';b.disabled=aStars()>=4.999;b.onclick=buyReputation;card.append(b);g.prepend(card);const chest=g.querySelector('.lucky-chest-card');if(chest&&state.crates>0)g.prepend(chest);
};
let rewardQueue=[],lobbyRewardQueue=[],rewardRunning=false;
function rewardBurst(icon,title,amount=0,kind='coin',finalDelivery=false){
 if(kind==='coin'&&document.body.classList.contains('playing')&&!finalDelivery)return;
 const r={icon,title,amount,kind};
 if(document.body.classList.contains('playing')&&kind!=='coin'){
  if(kind==='level'||kind==='unlock')lobbyRewardQueue.push(r);
  return;
 }
 rewardQueue.push(r);drainRewards();
}
function drainRewards(){
 if(rewardRunning||!rewardQueue.length)return;
 const layer=$('#rewardsLayer');if(!layer)return;
 const {icon,title,amount,kind}=rewardQueue.shift();
 if(document.body.classList.contains('playing')&&kind!=='coin'){
  if(kind==='level'||kind==='unlock')lobbyRewardQueue.push({icon,title,amount,kind});
  drainRewards();return;
 }
 rewardRunning=true;
 const duration=kind==='level'?1250:850;
 const item=document.createElement('div');item.className='reward-pop '+kind+(amount<0?' negative':'');
 const amt=kind==='coin'?(amount>=0?'+':'−')+money(Math.abs(amount)):kind==='level'?'LV. '+amount:kind==='delivery'&&amount>0?'+'+money(amount):'';item.style.setProperty('--reward-duration',duration+'ms');
 item.innerHTML=`<div class="reward-pop-icon">${safe(icon)}</div><div class="reward-pop-title">${safe(title)}</div><strong>${safe(amt)}</strong>`;
 layer.append(item);if(kind==='level')sfx('level');else if(kind==='coin')sfx('coin');else if(kind==='unlock')sfx('quest');for(let k=0;k<9;k++){
  const dot=document.createElement('span');dot.className='reward-coin';dot.textContent=icon==='💰'?'🪙':'✦';dot.style.setProperty('--rx',Math.round(rng(-160,160))+'px');dot.style.setProperty('--ry',Math.round(rng(-125,60))+'px');dot.style.animationDelay=(k*35)+'ms';item.append(dot);
 }
 setTimeout(()=>{item.remove();rewardRunning=false;drainRewards()},duration+55);
}
const oldCreditVisual=credit;
credit=function(amount,reason){const received=oldCreditVisual(amount,reason);if(received>0&&received>=80)rewardBurst('🪙',reason,received,'coin');return received;};
const oldPayVisual=pay;
pay=function(amount,reason){const before=state.money,output=oldPayVisual(amount,reason);if(amount>=160&&started&&before>=0)rewardBurst('📉',reason,-amount,'coin');return output;};
appendAchievements=function(){const g=$('#achievementList');if(!g)return;g.replaceChildren();for(const a of badgeDefs){const ok=!!state.achievements?.[a.id],el=document.createElement('article');el.className='achievement '+(ok?'unlocked':'');el.innerHTML=`<b>${ok?a.icon:'🔒'} ${safe(a.name)}</b><p>${safe(a.desc)} · ${money(a.reward)} ${ok?'✓':' '}</p>`;g.append(el);}};
const renderNewRecords=renderRecords;
renderRecords=function(){renderNewRecords();appendAchievements();};
function stageTheme(n){const names=['햇살 평원','호숫가 돌풍','달빛 골목','하늘 우편로','산들바람 정상'];return names[(n-1)%5]}
function showLobby(){
 started=false;clearTimeout(nextTimer);nextTimer=null;flight=null;state.current=null;state.lastResult=null;
 state.flightState=state.gameOver?'gameover':'ready';
 document.body.classList.remove('in-flight','playing');document.body.classList.add('lobby-mode');
 $('#result').classList.remove('show');$('#stage').classList.remove('stage-result');
 $('#mapOverlay').classList.remove('show');$('#lootOverlay').classList.remove('show');$('#deliveryOverlay').classList.remove('show');
 $('#modalCover').classList.remove('show');$('#lobby').classList.add('show');
 setDockHeight(59,false);refreshLobby();renderAll();autosave();
 rewardQueue.push(...lobbyRewardQueue.splice(0));scheduleLobbyPresentation();
}
function refreshLobby(){
 ensureNewFields();$$('#modeSwitch button').forEach(b=>b.classList.toggle('active',b.dataset.mode===state.gameMode));
 $('#lobbyRandom').hidden=state.gameMode!=='random';$('#lobbyStage').hidden=state.gameMode!=='stage';
 const n=state.stageSelected,st=limit(state.stageStars[n]||0,0,5);
 $('#stageNumber').textContent=String(n).padStart(2,'0');$('#stageName').textContent=stageTheme(n);
 $('#stageStars').textContent='★'.repeat(st)+'☆'.repeat(5-st);
 $('#stageDesc').textContent='평균 3★ · 2판 성공 시 해금';
 $('#stagePrev').disabled=n<=1;$('#stageNext').disabled=n>=state.stageUnlocked;
 $('#lobbyProgress').textContent='STAGE '+String(state.stageUnlocked).padStart(2,'0');
 $('#lobbyRank').textContent='Lv.'+rankLevel();$('#lobbyCoins').textContent=money(state.money);
 $('#lobbyDebt').textContent='빚 '+money(debtSum());$('#lobbyClears').textContent='클리어 '+state.stageWins+'회';
 const d=state.delivery,ongoing=d?.active&&d.mode===state.gameMode&&d.stage===state.stageSelected;
 $('#lobbyStart span:first-child').textContent=state.gameOver?'새 인생 시작':ongoing?`배송 이어하기 · ${d.played}/3`:state.gameMode==='stage'?`STAGE ${String(n).padStart(2,'0')} · 3판 시작`:'3판 배송 시작';
}
let changingScene=false;
function cloudTransition(action){
 if(changingScene)return;changingScene=true;
 const el=$('#cloudCurtain');el.className='live';void el.offsetWidth;el.className='live closing';sfx('event');
 setTimeout(()=>{action();el.className='live opening'},660);
 setTimeout(()=>{el.className='';changingScene=false},1450);
}
function beginSelectedMode(){
 if(state.gameOver)return openModal({mark:'📪',title:'영업 종료',message:'새 인생을 시작해야 다시 도전할 수 있습니다.',primary:'새 인생',secondary:'취소',action:offerNewLife});
 cloudTransition(()=>{
  beginDeliverySession();
  started=true;document.body.classList.remove('lobby-mode','sheet-open');document.body.classList.add('playing');
  $('#lobby').classList.remove('show');setDockHeight(59,false);
  spawnCustomer();updateDeliveryScreen();sizeWorld();
 });
}
function goToLobby(){
 if(changingScene)return;
 if(state.flightState==='flying')return openModal({mark:'📮',title:'배송 중단',message:'진행 중인 이번 판을 중단하고 로비로 돌아가시겠습니까?',tip:'중단 수수료 120원',primary:'로비로',secondary:'계속 배송',action:()=>{pay(120,'배송 중단 수수료');cloudTransition(showLobby)}});
 cloudTransition(showLobby);
}
function compactFlightPanelHeight(){
 const body=dockEl.querySelector('.dock-body'),ribbon=$('#financeRibbon');
 const shown=dockEl.classList.contains('expanded')&&ribbon.getClientRects().length>0;
 // Opening initially guarantees layout is available; then measure actual content.
 const fallback=innerHeight>innerWidth?345:245;
 const needed=shown?Math.ceil(Math.max(ribbon.getBoundingClientRect().bottom,$('#dock .flight-setup').getBoundingClientRect().bottom)-body.getBoundingClientRect().top+body.scrollTop+$('#dockGrab').getBoundingClientRect().height+dockEl.querySelector('.nav').getBoundingClientRect().height+parseFloat(getComputedStyle(dockEl).paddingBottom||0)+12):fallback;
 return limitDockHeight(Math.max(170,needed));
}
function openLobbyTab(tab){
 selectTab(tab);
 if(tab!=='play')setDockHeight(Math.min(innerHeight*.72,innerHeight-68),true);
 else autosave();
}
// The fixed bottom sheet belongs to the lobby, not the active flight scene.
const dockDismiss=document.createElement('div');dockDismiss.id='dockDismiss';dockDismiss.hidden=true;dockDismiss.setAttribute('aria-hidden','true');document.body.append(dockDismiss,dockEl);
dockDismiss.addEventListener('click',()=>setDockHeight(59,true));
baseDockHeight=function(){return 59;};
limitDockHeight=function(value){return limit(Math.round(value),59,Math.max(90,innerHeight-68));};
setDockHeight=function(value,store=false){
 const h=limitDockHeight(value);customDockHeight=h;
 dockEl.style.height=h+'px';dockEl.classList.toggle('expanded',h>95);
 document.body.classList.toggle('sheet-open',h>95);
 dockDismiss.hidden=!(h>95&&document.body.classList.contains('lobby-mode'));
 if(h<=95)dockEl.classList.remove('tuning-focus');
 $('#grabText').textContent=h>95?'아래로 밀어 메뉴 닫기':'위로 밀어 메뉴 열기';
 if(store){state.uiDockHeight=h;autosave();}
 return h;
};
toggleDock=function(){setDockHeight(dockEl.classList.contains('expanded')?59:Math.min(innerHeight*.72,innerHeight-68),true);};
const rootSelectTab=selectTab;
function fitCompactFlightPanel(){
 $('.dock-body').scrollTop=0;
 // Render collapsed contents before measuring, without waiting for the height transition.
 if(!dockEl.classList.contains('expanded'))setDockHeight(Math.min(345,innerHeight-68),false);
 setDockHeight(compactFlightPanelHeight(),false);
}
selectTab=function(tab){rootSelectTab(tab);if(document.body.classList.contains('lobby-mode')){if(tab==='play')fitCompactFlightPanel();else setDockHeight(Math.min(innerHeight*.70,innerHeight-70),false)}};
let fitResizeTimer;
window.addEventListener('resize',()=>{clearTimeout(fitResizeTimer);fitResizeTimer=setTimeout(()=>{if(document.body.classList.contains('lobby-mode')&&dockEl.classList.contains('expanded')&&$('.tab.active')?.dataset.panel==='play'){const needed=compactFlightPanelHeight();if(customDockHeight<needed)setDockHeight(needed,false);}},300)});
const priorBindLobby=bind;
bind=function(){
 priorBindLobby();
 $('#lobbyStart').onclick=beginSelectedMode;
 $('#lobbyParts').onclick=()=>openLobbyTab('parts');
 $('#lobbyShop').onclick=()=>openLobbyTab('shop');
 $('#lobbyPrepare').onclick=()=>openLobbyTab('play');
 $('#lobbyHome').onclick=goToLobby;
 $('#battleLaunch').onclick=()=>{
  launch();if(state.flightState==='flying'&&flight){flight.launchAngle=Number($('#angle').value);flight.launchPower=Number($('#power').value);}
  updateDeliveryScreen();
 };
 $('#readyPlanePrev').onclick=()=>cycleReadyPlane(-1);
 $('#readyPlaneNext').onclick=()=>cycleReadyPlane(1);
 $('#readyAngle').addEventListener('input',()=>{setTuning(Number($('#readyAngle').value),Number($('#readyPower').value));syncReadyFlightControls()});
 $('#readyPower').addEventListener('input',()=>{setTuning(Number($('#readyAngle').value),Number($('#readyPower').value));syncReadyFlightControls()});

 // During dragging, the entire preparation card becomes transparent,
 // keeping only the two sliders and their live degree/percent readings.
 let tuningFocusTimer=0;
 const prep=$('#readyFlight');
 const focusStart=(surface)=>{
  clearTimeout(tuningFocusTimer);
  prep.classList.toggle('tuning-focus',surface==='prep');
  dockEl.classList.toggle('tuning-focus',surface==='dock');
 };
 const focusEnd=()=>{
  clearTimeout(tuningFocusTimer);
  tuningFocusTimer=setTimeout(()=>{
   prep.classList.remove('tuning-focus');
   dockEl.classList.remove('tuning-focus');
  },180);
 };
 for(const slider of [$('#readyAngle'),$('#readyPower')]){
  slider.addEventListener('pointerdown',()=>focusStart('prep'));
  slider.addEventListener('touchstart',()=>focusStart('prep'),{passive:true});
  slider.addEventListener('input',()=>{
   if(!prep.classList.contains('tuning-focus')){focusStart('prep');}
   clearTimeout(tuningFocusTimer);
   tuningFocusTimer=setTimeout(focusEnd,1100);
  });
  slider.addEventListener('pointerup',focusEnd);
  slider.addEventListener('pointercancel',focusEnd);
  slider.addEventListener('touchend',focusEnd,{passive:true});
  slider.addEventListener('touchcancel',focusEnd,{passive:true});
  slider.addEventListener('blur',focusEnd);
 }
 for(const slider of [$('#angle'),$('#power')]){
  slider.addEventListener('pointerdown',()=>focusStart('dock'));
  slider.addEventListener('touchstart',()=>focusStart('dock'),{passive:true});
  slider.addEventListener('pointerup',focusEnd);
  slider.addEventListener('pointercancel',focusEnd);
  slider.addEventListener('touchend',focusEnd,{passive:true});
  slider.addEventListener('touchcancel',focusEnd,{passive:true});
  slider.addEventListener('blur',focusEnd);
  slider.addEventListener('input',()=>{
   if(!dockEl.classList.contains('tuning-focus'))focusStart('dock');
   clearTimeout(tuningFocusTimer);
   tuningFocusTimer=setTimeout(focusEnd,1100);
  });
 }
 window.addEventListener('pointerup',focusEnd);
 window.addEventListener('pointercancel',focusEnd);
 window.addEventListener('blur',focusEnd);

 $('#deliveryHome').onclick=()=>{ $('#deliveryOverlay').classList.remove('show');cloudTransition(showLobby);};
 $('#deliveryContinue').onclick=()=>{ $('#deliveryOverlay').classList.remove('show');state.delivery=null;cloudTransition(()=>{
  beginDeliverySession();started=true;document.body.classList.add('playing');document.body.classList.remove('lobby-mode');
  $('#lobby').classList.remove('show');spawnCustomer();updateDeliveryScreen();
 });};
 $$('#modeSwitch button').forEach(b=>b.onclick=()=>{state.gameMode=b.dataset.mode;refreshLobby();sfx('event');autosave()});
 $('#stagePrev').onclick=()=>{state.stageSelected=Math.max(1,state.stageSelected-1);refreshLobby();autosave()};
 $('#stageNext').onclick=()=>{state.stageSelected=Math.min(state.stageUnlocked,state.stageSelected+1);refreshLobby();autosave()};
 $('#planeSelect').addEventListener('change',renderParts);
 $('#planePrev').addEventListener('click',()=>setTimeout(renderParts,0));
 $('#planeNext').addEventListener('click',()=>setTimeout(renderParts,0));
};

function updateLobbyGrowth(){
 const lv=rankLevel(),xp=state.xp%180;
 $('#lobbyRank').textContent='Lv.'+lv;$('#lobbyCoins').textContent=money(state.money);
 $('#rankLabel').textContent='우체부';$('#rankXp').textContent=xp+' / 180 XP';$('#rankXpFill').style.width=(xp/180*100)+'%';
 const next=planeDefs.find(def=>planeUnlockLevel(def)>lv);$('#rankLabel').title=next?'다음 해금 Lv.'+planeUnlockLevel(next)+' '+next.name:'모든 비행기 해금';
 const active=!!state.riskMode;$('#lobbyExpress').classList.toggle('active',active);$('#lobbyExpress').setAttribute('aria-pressed',String(active));$('#lobbyExpressState').textContent=active?'ON':'OFF';
 const hasNew=(state.newPlaneIds||[]).some(id=>planeDefs.some(d=>d.id===id&&planeUnlocked(d)));
 $('#lobbyShopNew').hidden=!hasNew;$('#navShopNew').hidden=!hasNew;
}
const growthRenderAll=renderAll;
renderAll=function(){growthRenderAll();updateLobbyGrowth()};
const growthBind=bind;
bind=function(){growthBind();$('#lobbyExpress').onclick=()=>{if(state.gameOver)return notify('게임 오버 상태입니다');toggleRisk();updateLobbyGrowth();save()};};
function init(){load();ensureNewFields();document.body.classList.add('lobby-mode');bind();applySavedTuning();setDockHeight(59,false);renderAll();sizeWorld();$('#modalCover').classList.remove('show');$('#lobby').classList.add('show');started=false;refreshLobby();}

let lootMode='normal';
function boxBalance(){return lootMode==='epic'?state.epicCrates||0:state.crates||0;}
function openEpicOrNormal(mode='normal',automatic=false){
 if(state.flightState==='flying'||$('#mapOverlay').classList.contains('show')||openingLoot)return;
 if(state.gameOver)return notify('게임 오버 상태입니다');
 ensureEpic();lootMode=mode==='epic'?'epic':'normal';const epic=lootMode==='epic';
 if(state.flightState==='result'){clearTimeout(nextTimer);lootPending=true;}
 const win=$('#lootWindow');win.className='loot-window'+(epic?' epic-box':'');
 $('#lootConfetti').replaceChildren();$('#lootChest').classList.remove('opened');$('#lootChest').textContent=epic?'💎':'🎁';
 $('#lootCaption').textContent=epic?'EPIC MAIL':'LUCKY MAIL';$('#lootTypeName').textContent=epic?'에픽 뽑기':'행운 뽑기';
 $('#lootTitle').textContent=epic?'에픽 상자':'행운 상자';$('#lootRarity').className='loot-rarity'+(epic?' epic':'');$('#lootRarity').textContent=epic?'에픽':'행운';
 $('#lootStatus').textContent=automatic?'새 에픽 상자':'';
 $('#lootMessage').textContent=boxBalance()>0?(epic?'비행기 또는 5배 보상':''):'보유 상자 없음';
 $('#normalOdds').hidden=epic;$('#epicOdds').hidden=!epic;$('#epicPlaneOdds').open=false;$('#lootOdds').open=false;
 $('#epicOddsList').innerHTML=planeDefs.map((d,i)=>'<div><span>'+safe(d.name)+'</span><b>'+epicPlaneWeights[i]+'%</b></div>').join('');
 $('#lootOpenBtn').textContent=boxBalance()>0?(epic?'💎 에픽 상자 열기':'🎁 상자 열기'):'상자 없음';$('#lootCloseBtn').disabled=false;
 $('#lootOverlay').classList.add('show');updateChestBadges();
 if(automatic)sfx('rare');
}
openChestUI=function(){openEpicOrNormal('normal');};
const epicShopBase=renderShop;
renderShop=function(){
 ensureEpic();epicShopBase();const card=document.createElement('div');card.className='item epic-chest-card'+(state.epicCrates>0?' epic-ready':'');
 card.innerHTML='<div><strong>💎 에픽 상자</strong><p>비행기 30% · 기타 보상 ×5</p><span class="price">보유 '+state.epicCrates+'개</span></div>';
 const b=document.createElement('button');b.className='action buy';b.textContent='에픽 뽑기';b.onclick=()=>openEpicOrNormal('epic');card.append(b);$('#shopList').prepend(card);
};
const epicBadgeBase=updateChestBadges;
updateChestBadges=function(){
 ensureEpic();epicBadgeBase();const total=state.crates+state.epicCrates;
 $('#lobbyShop').classList.toggle('lucky-ready',total>0);
 $('#lootBalance').textContent=String(boxBalance());$('#lootOpenBtn').disabled=openingLoot||boxBalance()<=0;
};
let epicEntryTimer=0;
function presentEpicOnEntry(){
 ensureEpic();save();clearTimeout(epicEntryTimer);
 if(!state.epicPending||!state.epicCrates||state.gameOver)return;
 const present=()=>{if(rewardRunning||rewardQueue.length||lobbyRewardQueue.length||streakAnimating||state.deliveryStreak?.pending?.length){epicEntryTimer=setTimeout(present,250);return;}if(!document.body.classList.contains('lobby-mode')||state.gameOver||!state.epicPending||!state.epicCrates)return;if(changingScene){epicEntryTimer=setTimeout(present,200);return;}if(!$('#lootOverlay').classList.contains('show')&&!$('#modalCover').classList.contains('show'))openEpicOrNormal('epic',true);};
 epicEntryTimer=setTimeout(present,220);
}
const epicLobbyBase=showLobby;
showLobby=function(){epicLobbyBase();presentEpicOnEntry();};


function exportBackup(){
 const snapshot={...state,current:null,lastResult:null,flightState:state.gameOver?'gameover':'ready'};
 const payload={format:'fly-post-office-backup',version:1,exportedAt:new Date().toISOString(),data:snapshot};
 try{
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='날아라_우편국_백업_'+new Date().toISOString().slice(0,10)+'.json';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
  notify('백업 파일 내보내기');
 }catch(e){notify('백업 파일을 만들 수 없습니다')}
}
function validateBackup(root){
 const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
 const number=v=>typeof v==='number'&&Number.isFinite(v);
 const nonneg=v=>number(v)&&v>=0;
 if(!obj(root)||root.format!=='fly-post-office-backup'||root.version!==1||!obj(root.data))throw Error('지원하지 않는 백업');
 const d=root.data;
 // Refuse malformed or unrelated files before replacing the existing save.
 if(!['money','round','day','month'].every(k=>nonneg(d[k]))||d.day<1||d.month<1||!obj(d.owned)||!Array.isArray(d.debts)||!Array.isArray(d.stars)||!Array.isArray(d.monthStars)||!obj(d.ai))throw Error('필수 저장 데이터 누락');
 for(const def of planeDefs){const list=d.owned[def.id];if(list!==undefined&&(!Array.isArray(list)||list.some(p=>!obj(p)||!nonneg(p.dur)||!number(p.maxDur)||p.maxDur<=0||p.dur>p.maxDur||(p.parts!==undefined&&(!obj(p.parts)||Object.values(p.parts).some(v=>!nonneg(v)||v>8))))))throw Error('비행기 데이터 오류');}
 if(!Array.isArray(d.owned.basic))throw Error('기본 비행기 누락');
 if(d.debts.some(x=>!obj(x)||!nonneg(x.amount)||!number(x.due)))throw Error('대출 데이터 오류');
 if([...d.stars,...d.monthStars].some(x=>!number(x)||x<0||x>5))throw Error('평점 데이터 오류');
 for(const k of ['logs','records','pendingDaily','newPlaneIds'])if(d[k]!==undefined&&!Array.isArray(d[k]))throw Error('기록 데이터 오류');
 for(const k of ['boosts','finance','legacy','achievements','stageStars','planeCoupons'])if(d[k]!=null&&!obj(d[k]))throw Error('저장 데이터 오류');
 if(!Array.isArray(d.ai.history)||d.finance?.ledger!=null&&!Array.isArray(d.finance.ledger)||d.legacy?.history!=null&&!Array.isArray(d.legacy.history))throw Error('기록 데이터 오류');
 if(d.delivery!=null&&(!obj(d.delivery)||!Array.isArray(d.delivery.entries)||!nonneg(d.delivery.played)||d.delivery.played>3||d.delivery.entries.length!==d.delivery.played||!number(d.delivery.net)||d.delivery.entries.some(e=>!obj(e)||!number(e.star)||!number(e.pay))))throw Error('배송 데이터 오류');
 if(d.daily!=null&&(!obj(d.daily)||!nonneg(d.daily.progress)||!number(d.daily.day)))throw Error('퀘스트 데이터 오류');
 // Ignore transient game scene data when restoring, just as ordinary saves do.
 return {...d,current:null,lastResult:null,flightState:d.gameOver?'gameover':'ready'};
}
async function readBackup(file){
 if(!file)return;
 try{
  if(file.size>5*1024*1024)throw Error('파일 크기 초과');
  const data=validateBackup(JSON.parse(await file.text(),(k,v)=>{if(k==='__proto__'||k==='constructor'||k==='prototype')throw Error('잘못된 데이터');return v;}));
  openModal({mark:'📂',title:'백업 불러오기',message:`Lv.${1+Math.floor((Number(data.xp)||0)/180)} · ${money(data.money)} · ${data.round}회 비행`,tip:'현재 진행 상황이 백업 데이터로 교체됩니다.',primary:'불러오기',secondary:'취소',action:()=>{
   try{
    // Update the in-memory state before reload so pagehide cannot restore the old game.
    localStorage.setItem(SAVE,JSON.stringify(data));
    state={...newState(),...data};clearTimeout(nextTimer);nextTimer=null;flight=null;saveDelay=0;location.reload();
   }catch(e){notify('저장 공간을 사용할 수 없습니다')}
  }});
 }catch(e){notify('올바른 날아라 우편국 백업 파일이 아닙니다')}
}
function renderSettings(){
 const g=$('#settingsList');if(!g)return;g.replaceChildren();
 const card=(icon,title,detail,button,act,cls='action')=>{
  const e=document.createElement('div');e.className='item settings-card';
  const t=document.createElement('div');t.innerHTML=`<strong>${icon} ${title}</strong><p>${detail}</p>`;e.append(t);
  const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=button;b.onclick=act;e.append(b);g.append(e);return b;
 };
 const b=card('🔊','소리',state.sound?'켜짐':'꺼짐',state.sound?'ON':'OFF',()=>{state.sound=!state.sound;if(state.sound)sfx('event');renderSettings();save()});b.setAttribute('aria-pressed',String(state.sound));
 card('📤','백업 내보내기','진행 상황 저장','내보내기',exportBackup);
 card('🕹️','조작 안내','첫 비행 안내 다시 보기','다시 보기',()=>tutorial.replay());
 card('📥','백업 불러오기','저장한 파일 복원','불러오기',()=>$('#backupInput').click());
 const legacy=state.legacy||{};
 card('🌱','새 인생 시작',`${Number(legacy.lives)||1}번째 인생`,'다시 태어나기',offerNewLife,'action buy');
 card('↺','기존 방식 초기화','빚 0원 · 현금 500만원 필요','초기화',attemptReset,'action negative');
}
const backupInput=document.createElement('input');backupInput.type='file';backupInput.id='backupInput';backupInput.accept='.json,application/json';backupInput.hidden=true;document.body.append(backupInput);
backupInput.addEventListener('change',()=>{const file=backupInput.files?.[0];backupInput.value='';readBackup(file)});
const settingsRenderBase=renderAll;
renderAll=function(){settingsRenderBase();renderSettings()};


// Complete-delivery streak is independent of the legacy per-flight coin combo.
let streakAnimating=false,lobbyPresentationTimer=0;
const chestSvg=epic=>`<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 14V9a5 5 0 0 1 5-5h14a5 5 0 0 1 5 5v5Z" fill="${epic?'#b598f6':'#ffdc87'}" stroke="${epic?'#7651b4':'#ae7828'}" stroke-width="1.5"/><rect x="3" y="13" width="26" height="15" rx="3" fill="${epic?'#8963ce':'#e8ae47'}" stroke="${epic?'#67469e':'#a5752c'}" stroke-width="1.5"/><path d="M8 6v21M24 6v21" stroke="${epic?'#e3d5ff':'#ffe6aa'}" stroke-width="2"/><rect x="13" y="12" width="6" height="9" rx="2" fill="${epic?'#f5e9ff':'#fff0ba'}"/><path d="m16 13 1 2 2 .5-1.5 1.5.3 2-1.8-1-1.8 1 .3-2-1.5-1.5 2-.5Z" fill="${epic?'#9862df':'#ba802e'}"/></svg>`;
function ensureDeliveryStreak(){
 let v=state.deliveryStreak;
 if(!v||typeof v!=='object'||Array.isArray(v))v=state.deliveryStreak={wins:0,display:0,pending:[]};
 for(const k of ['wins','display'])v[k]=Number.isFinite(v[k])?limit(Math.floor(v[k]),0,1000000):0;
 v.pending=Array.isArray(v.pending)?v.pending.filter(e=>e&&Number.isInteger(e.from)&&Number.isInteger(e.to)&&e.from>=0&&e.to>=0&&(e.to===e.from+1||e.to===0)).map(e=>({from:e.from,to:e.to,reward:e.reward==='epic'?'epic':e.reward==='normal'?'normal':null})):[];
 return v;
}
function streakStep(n){return n>0?(n-1)%5+1:0;}
function renderDeliveryStreak(value=ensureDeliveryStreak().display){
 const step=streakStep(value),track=$('#streakTrack');
 if(!track.children.length)for(let i=1;i<=5;i++){
  const slot=document.createElement('div');slot.className='streak-slot';slot.innerHTML='<i class="streak-fill"></i>'+(i===3||i===5?chestSvg(i===5):'');
  if(i===3||i===5)slot.title=i+'연승 · '+(i===5?'에픽':'행운')+' 상자';track.append(slot);
 }
 [...track.children].forEach((el,i)=>el.classList.toggle('filled',i<step));
 $('#streakCount').textContent=value;$('#lobbyStreak').classList.toggle('idle',value===0);
 track.setAttribute('aria-valuenow',String(step));track.setAttribute('aria-valuetext',`${value}연승, 5칸 중 ${step}칸. 3칸 행운 상자, 5칸 에픽 상자`);
}
function recordDeliveryStreak(d){
 const v=ensureDeliveryStreak(),from=v.wins,won=d.entries.length===3&&d.entries.every(e=>e.star>=3),to=won?from+1:0;
 const step=streakStep(to),reward=won&&step===3?'normal':won&&step===5?'epic':null;
 if(reward==='normal')state.crates++;
 if(reward==='epic')state.epicCrates=(state.epicCrates||0)+1;
 v.wins=to;if(to!==from)v.pending.push({from,to,reward});
 d.streakWon=won;d.streakReward=reward;d.streakCount=to;
}
function lobbyCanPresent(){return !document.hidden&&document.body.classList.contains('lobby-mode')&&$('#lobby').classList.contains('show')&&!changingScene&&!$('#lootOverlay').classList.contains('show')&&!$('#modalCover').classList.contains('show')&&!dockEl.classList.contains('expanded');}
function scheduleLobbyPresentation(){
 clearTimeout(lobbyPresentationTimer);
 lobbyPresentationTimer=setTimeout(presentLobbyProgress,160);
}
function presentLobbyProgress(){
 if(!document.body.classList.contains('lobby-mode'))return;
 if(!lobbyCanPresent()||streakAnimating||rewardRunning){scheduleLobbyPresentation();return;}
 const v=ensureDeliveryStreak(),e=v.pending[0];
 if(!e){drainRewards();return;}
 streakAnimating=true;const widget=$('#lobbyStreak');
 renderDeliveryStreak(e.from);
 // A new reward cycle clears the five filled cells before filling the next one.
 const rollover=e.to>0&&streakStep(e.to)===1&&e.from>0;
 const delay=rollover?420:80;
 if(rollover)renderDeliveryStreak(0);
 setTimeout(()=>{
  if(!lobbyCanPresent()){streakAnimating=false;renderDeliveryStreak(v.display);scheduleLobbyPresentation();return;}
  widget.classList.add(e.to===0?'extinguishing':'charging');renderDeliveryStreak(e.to);sfx(e.to===0?'extinguish':'streak');
  setTimeout(()=>{
   widget.classList.remove('extinguishing','charging');
   // If the player leaves mid-animation it remains queued for the next entry.
   if(!lobbyCanPresent()){streakAnimating=false;renderDeliveryStreak(v.display);scheduleLobbyPresentation();return;}
   v.display=e.to;v.pending.shift();
   if(e.reward){const slot=$('#streakTrack').children[e.reward==='epic'?4:2];slot.classList.add('claimed');setTimeout(()=>slot.classList.remove('claimed'),600);rewardQueue.unshift({icon:e.reward==='epic'?'💎':'🎁',title:(e.reward==='epic'?'에픽':'행운')+' 상자 +1',amount:0,kind:'item'});}
   streakAnimating=false;save();drainRewards();scheduleLobbyPresentation();
  },950);
 },delay);
}
const streakRefreshBase=refreshLobby;
refreshLobby=function(){streakRefreshBase();if(!streakAnimating)renderDeliveryStreak();};
const visibleRewardDrain=drainRewards;
drainRewards=function(){if(document.body.classList.contains('lobby-mode')&&!lobbyCanPresent()){scheduleLobbyPresentation();return;}visibleRewardDrain();};
document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleLobbyPresentation();});
document.addEventListener('pointerdown',e=>{if(e.target.closest('button:not(:disabled)'))sfx('tap');},{passive:true});


const tutorial = createTutorial({
 getState: () => state,
 save,
 closeMenu: () => setDockHeight(59, false),
 canShow: () => !changingScene && !document.hidden &&
  !['#modalCover', '#lootOverlay', '#mapOverlay', '#deliveryOverlay'].some(selector => $(selector).classList.contains('show')),
 isLobby: () => document.body.classList.contains('lobby-mode'),
 menuOpen: () => dockEl.classList.contains('expanded'),
 activeMenu: () => $('.tab.active')?.dataset.panel,
 currentType: () => state.current?.type,
});

export function bootGame({ progress, onReady }) {
 init();
 tutorial.init();
 renderDeliveryStreak();
 progress(.72, '항로 준비 중');
 return createFlightEngine({
  world,
  lobby: $('#hangarArt'),
  progress,
  onReady() {
   onReady();
   scheduleLobbyPresentation();
   presentEpicOnEntry();
  },
  update: stepGame,
  resize: sizeWorld,
  frame: () => {
   const plane = selectedPlane();
   return {
    playing: started && !document.body.classList.contains('lobby-mode'),
    mission: state.current,
    flight,
    cameraX,
    scale: worldScale(),
    project: worldXY,
    plane: plane?.def,
    planeAngle: flight?.angle ?? -Number($('#angle').value) * Math.PI / 180,
    engineLevel: partLevel(plane, 'engine'),
    wingLevel: partLevel(plane, 'wing'),
    armorLevel: partLevel(plane, 'armor'),
    aimAngle: Number($('#angle').value),
    aimPower: Number($('#power').value),
    aimSpeed: plane ? effectivePlaneStats(plane).speed * (state.boosts.tailwind > 0 ? 1.1 : 1) : 1,
    aiming: state.flightState === 'ready' && !!state.current,
   };
  },
 });
}
