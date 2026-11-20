'use strict';
// Exact Figma geometry is retained in the SVG layout. These reusable controls
// replace editable component groups with accessible HTML inputs and behavior.
const host=document.querySelector('#screen'), viewport=document.querySelector('#viewport');
const dialog=document.querySelector('#dialog'), dialogBody=document.querySelector('#dialog-body');
const state={route:'home',visits:[],medications:[],pending:[],drafts:{},type:'Family Doctor',visitRoute:'primary',visitSelectorBack:'home',photo:null};
let svg,fields=[],cleanup=[],conditionalLayout=null,employmentRange=null;
const types={hospital:['Emergency Care','Hospital'],pharmacy:['Pharmacy'],primary:['Family Doctor','Walk-In Clinic'],specialist:['Allergist','Cardiologist','Ear, Nose & Throat (ENT) Specialist','Gastroenterologist','Hematologist','Respirologist','Surgeon'],rehab:['Chiropractor','Massage Therapist','Occupational Therapist','Physiotherapist'],clinic:['Nutrition Clinic','Pain Management Clinic','Sleep Disorder Clinic'],other:['Herbalist','Home Care or Community Nurse (CCAC)','Naturopath','Psychologist','Social Worker']};
const costs=['OHIP','Private insurance','Out of pocket'];
const tests=['CBC or other blood test','X-ray','MRI','CT scan','Ultrasound','Other'];
const expenseTypes=['Parking','Meal','Gasoline','Walking aids','Accommodation','Other'];
const icons={calendar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="5" width="18" height="16" rx="1"/><path d="M3 10h18M7 2v6M17 2v6M7 13h1m3 0h1m3 0h1M7 17h1m3 0h1m3 0h1"/></svg>',trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 5h18M9 5V3h6v2M5 5l1 16h12l1-16M10 8v10M14 8v10"/></svg>'};
const txt=(s)=>[...svg.querySelectorAll('text')].filter(t=>(t.dataset.questionText||t.textContent).trim()===s.trim());
const byId=(id)=>[...svg.querySelectorAll('[id]')].find(e=>e.id===id);
const n=(e,a)=>Number(e.getAttribute(a)||0);
function originalIcon(screen,id){const parsed=new DOMParser().parseFromString(SCREENS[screen].svg,'image/svg+xml').documentElement;parsed.style.cssText='position:absolute;visibility:hidden;pointer-events:none;left:-9999px';host.append(parsed);const groups=[...parsed.querySelectorAll('g[id]')];const group=groups.find(g=>g.id===id)||groups.find(g=>/^(healthicons:|tabler:|mingcute:|fa6-solid:|medical-icon:|icon-park-solid:|mynaui:)/.test(g.id))||groups.find(g=>/pill|doctor|hospital|physio/i.test(g.id));const result=document.createElementNS('http://www.w3.org/2000/svg','svg');if(group){const b=group.getBBox();result.setAttribute('viewBox',`${b.x} ${b.y} ${b.width} ${b.height}`);const copy=group.cloneNode(true);copy.querySelectorAll('[fill]').forEach(p=>{if(p.getAttribute('fill')!=='none')p.setAttribute('fill','currentColor')});copy.querySelectorAll('[stroke]').forEach(p=>{if(p.getAttribute('stroke')!=='none')p.setAttribute('stroke','currentColor')});result.append(copy);}parsed.remove();return result;}
function originalAdornments(source,b,wrap){if(!source)return;const gs=[...source.querySelectorAll('g[id]')].filter(g=>/^[a-z][a-z0-9-]*:/.test(g.id));if(!gs.length)return;wrap.querySelectorAll('.calendar,.chevron').forEach(e=>e.remove());for(const g of gs){const box=g.getBBox();if(box.width>30||box.height>30)continue;const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox',`${box.x} ${box.y} ${box.width} ${box.height}`);icon.setAttribute('aria-hidden','true');icon.style.cssText=`position:absolute;left:${box.x-b.x-1}px;top:${box.y-b.y-1}px;width:${box.width}px;height:${box.height}px;pointer-events:none`;icon.append(g.cloneNode(true));wrap.append(icon);}}
function captureConditionalLayout(){
 const ranges={'new-medication':[[220,345,'removed-din']],hospital:[[530,921,'segment-467'],[1040,1185,'segment-977']],primary:[[609,827,'segment-546']],specialist:[[623,815,'segment-560']],rehab:[[505,715,'segment-441']],pharmacy:[[362,715,'segment-298']],'system-reference':[[517,715,'segment-455']],expenses:[[456,684,'segment-393'],[844,945,'segment-780'],[945,1082,'removed-knee-question'],[1082,1190,'segment-780']]};
 if(typeof questionnaireRanges!=='undefined'&&questionnaireRanges)ranges[state.route]=questionnaireRanges;
 if(state.route==='refill'&&draft()['Select a refill'])ranges.refill=[];
 if(!ranges[state.route]&&!employmentRange)return;
 ranges[state.route]??=[];
 if(!state.route.startsWith('intake-')&&!state.route.startsWith('checkin-')&&state.route!=='expenses'&&state.route!=='new-medication')ranges[state.route]=ranges[state.route].map(([a,b,key])=>[a+100,b+100,key]);
 if(['new-medication','refill'].includes(state.route)){
 const cost=fields.find(f=>f.label==='Out-of-pocket cost for this medication');
 if(cost){const label=txt('Out-of-pocket cost for this medication')[0];const start=label?bounds(label).y:cost.b.y-28;ranges[state.route].push([start,cost.b.y+cost.b.h+24,'medication-pocket-visible']);}
 }
 if(state.route==='pharmacy'){
 const test=fields.find(f=>f.label==='Tests/procedure done');
 if(test)ranges.pharmacy=ranges.pharmacy.map(([start,end,key])=>[start,key==='segment-298'?test.b.y+test.b.h+16:end,key]);
 }
 if(employmentRange)ranges[state.route].push(employmentRange);
 // Remove leftover section padding after the admission follow-up block.
 if(state.route==='hospital')ranges[state.route].push([1021,1033,'removed-admission-gap']);
 const removedNames=['Clinic name','Discharge to'];
 fields.filter(f=>removedNames.includes(f.label)).forEach(f=>{ranges[state.route].push([f.b.y-32,f.label==='Discharge to'?1021:f.b.y+68,'removed-name-field']);f.input.required=false;f.input.disabled=true;f.wrap.remove();delete draft()[f.input.name];});
 fields=fields.filter(f=>!removedNames.includes(f.label));
 const nodes=[...svg.querySelectorAll('path,rect,text,line,circle,ellipse,polygon,polyline,image')].filter(e=>!e.closest('defs,clipPath,mask,pattern'));
 conditionalLayout={height:Number(host.dataset.height),ranges:ranges[state.route],svg:nodes.map(e=>{const b=bounds(e);b.y+=Number(e.dataset.visitOffset||0);return{e,b,transform:e.getAttribute('transform'),display:e.style.display}}),html:[...host.children].filter(e=>e!==svg).map(e=>({e,y:parseFloat(e.style.top)||0,h:parseFloat(e.style.height)||0,display:e.style.display}))};
}
function updateConditional(){
 if(!conditionalLayout)return;
 const d=draft(),l=conditionalLayout,hidden=l.ranges.filter(([, ,key])=>key.startsWith('segment-')?d[key]!==0:d[key]!==true).sort((a,b)=>a[0]-b[0]).reduce((out,r)=>{const last=out[out.length-1];if(last&&r[0]<=last[1])last[1]=Math.max(last[1],r[1]);else out.push([...r]);return out;},[]);
 const expenseDelta=state.route==='expenses'&&d['segment-393']===0?(d.expenseRows||[]).length*51-117:0;
 const inside=(y)=>hidden.some(([a,b])=>y>=a&&y<b),shift=(y)=>hidden.reduce((sum,[a,b])=>sum+(y>=b?b-a:0),0)-(y>=684?expenseDelta:0);
 l.svg.forEach(({e,b,transform,display})=>{const y=b.y+b.h/2;if(b.h>l.height/2)return;e.style.display=inside(y)?'none':display;const delta=shift(y);if(delta)e.setAttribute('transform','translate(0 '+(-delta)+') '+(transform||''));else if(transform)e.setAttribute('transform',transform);else e.removeAttribute('transform');});
 l.html.forEach(({e,y,h,display})=>{e.style.display=inside(y+h/2)?'none':display;e.style.top=(y-shift(y+h/2))+'px';});
 const height=l.height-hidden.reduce((sum,[a,b])=>sum+b-a,0)+expenseDelta;host.dataset.height=height;host.style.height=height+'px';svg.setAttribute('height',height);svg.setAttribute('viewBox','0 0 402 '+height);styleFollowUpQuestions(hidden,expenseDelta);sortControls();resize();
}

const bounds=e=>{const b=e.getBBox();return{x:b.x,y:b.y,w:b.width,h:b.height}};
function rectGroup(t){if(!t)return null;let p=t.parentElement;while(p&&p!==svg){const r=[...p.children].find(e=>e.tagName==='rect'&&n(e,'width')>30&&n(e,'width')<390&&n(e,'height')<100);if(r)return{g:p,r,b:{x:n(r,'x')-.5,y:n(r,'y')-.5,w:n(r,'width')+1,h:n(r,'height')+1}};p=p.parentElement;}return null;}
function place(el,b){Object.assign(el.style,{left:b.x+'px',top:b.y+'px',width:b.w+'px',height:b.h+'px'});host.append(el);return el;}
function announce(message){document.querySelector('#announcement').textContent=message;}
function setText(old,value,index=0){if(old===value)return;const t=txt(old)[index];if(!t)return;if(t.previousElementSibling?.hasAttribute('data-text-outline'))t.previousElementSibling.style.display='none';t.style.opacity='1';const spans=[...t.querySelectorAll('tspan')];if(spans.length){spans[0].textContent=value;spans.slice(1).forEach(s=>s.remove());}else t.textContent=value;}
function button(label,fn,opt={}){const t=opt.element||txt(label)[opt.index||0];if(!t&&!opt.box)return null;const rg=t&&rectGroup(t);let b=opt.box||(rg&&rg.b);if(!b){b=bounds(t);b={x:b.x-10,y:b.y-10,w:b.w+20,h:b.h+20};}if(label==='Change'&&t&&!opt.box){const group=bounds(t.parentElement);if(group.w<160&&group.h<60)b={x:group.x-8,y:group.y-10,w:group.w+16,h:Math.max(40,group.h+20)};}const el=document.createElement('button');el.type='button';el.className='control '+(opt.primary||rg?.r.getAttribute('fill')?.startsWith('#00')?'primary':'');el.textContent=label;el.setAttribute('aria-label',opt.aria||label);el.disabled=!!opt.disabled;place(el,b);if(el.classList.contains('primary')&&rg){const fill=rg.r.getAttribute('fill');el.addEventListener('pointerenter',()=>el.classList.contains('primary')&&rg.r.setAttribute('fill','#003d60'));el.addEventListener('pointerleave',()=>el.classList.contains('primary')&&rg.r.setAttribute('fill',fill));el.addEventListener('pointerdown',()=>el.classList.contains('primary')&&rg.r.setAttribute('fill','#002f44'));el.addEventListener('pointerup',()=>el.classList.contains('primary')&&rg.r.setAttribute('fill','#003d60'));}el.addEventListener('click',fn);return el;}
function hideText(t){if(t)t.style.visibility='hidden';}
function field(match,label,opt={}){const t=match==null?null:txt(match)[opt.index||0];if(!t&&!opt.box)return null;let rg=rectGroup(t), b=opt.box||rg?.b;if(!b){let p=t?.parentElement;const pb=p&&bounds(p);if(pb&&pb.w<380&&pb.h<80)b=pb;else throw Error('Missing field bounds: '+label);}
 if(rg)rg.g.style.visibility='hidden';else if(t)t.parentElement.style.visibility='hidden';
 const wrap=document.createElement('div');wrap.className='field';place(wrap,b);
 const input=document.createElement(opt.options?'select':'input');input.setAttribute('aria-label',label);input.name=opt.key||label;input.autocomplete='off';
 const draft=state.drafts[state.route]??={};let value=Object.hasOwn(draft,input.name)?draft[input.name]:'';
 opt.placeholder??=opt.date?'mm/dd/yyyy':opt.options?'Select '+label.toLowerCase():opt.type==='number'?'Enter '+(label.toLowerCase().includes('cost')||label.includes('amount')?'cost':'hours'): 'Enter '+label.toLowerCase();
 if(opt.options){if(opt.placeholder){const empty=new Option(opt.placeholder,'');input.add(empty);}for(const choice of opt.options)input.add(new Option(choice,choice));input.value=value;const arrow=document.createElement('span');arrow.className='chevron';wrap.append(arrow);}
 else{input.type=opt.type||'text';input.value=value;input.placeholder=opt.placeholder??'';if(opt.type==='number'){input.min=opt.min??'0';input.step=opt.step||'any';input.inputMode='decimal';}if(opt.pattern)input.pattern=opt.pattern;if(opt.maxLength)input.maxLength=opt.maxLength;}
 input.required=opt.required??(label!=='Major surgery/procedure'&&!label.startsWith('Search '));
 if(opt.suffix){const suffix=document.createElement('span');suffix.className='suffix';suffix.textContent=opt.suffix;wrap.append(suffix);wrap.insertBefore(input,suffix);}else wrap.append(input);
 if(opt.prefix){const prefix=document.createElement('span');prefix.className='prefix';prefix.textContent=opt.prefix;wrap.prepend(prefix);}
 if(opt.date){input.classList.add('date');input.placeholder=opt.placeholder||'mm/dd/yyyy';input.inputMode='numeric';const cal=document.createElement('span');cal.className='calendar';cal.innerHTML=icons.calendar;wrap.append(cal);const cb=document.createElement('button');cb.className='control';cb.style.cssText='right:4px;top:3px;width:30px;height:35px';cb.type='button';cb.setAttribute('aria-label','Choose '+label.toLowerCase());wrap.append(cb);cb.onclick=()=>datePicker(label,input,draft);}
 input.dataset.empty=String(!input.value);input.addEventListener('change',()=>input.dataset.empty=String(!input.value));draft[input.name]=value;input.addEventListener('input',()=>{draft[input.name]=input.value;wrap.classList.remove('invalid');input.removeAttribute('aria-invalid');opt.onInput?.(input.value)});input.addEventListener('change',()=>{draft[input.name]=input.value;opt.onChange?.(input.value)});
 originalAdornments(rg?.g||t?.parentElement,b,wrap);fields.push({input,wrap,label,opt,b});return input;}
function hospitalSuggestions(input){
 const wrap=input.closest('.field');wrap.classList.add('hospital-field');const list=document.createElement('div');list.className='hospital-suggestions';list.id='hospital-suggestions-'+input.name.toLowerCase().replace(/[^a-z0-9]+/g,'-');list.setAttribute('role','listbox');list.setAttribute('aria-label','Ontario hospital suggestions');list.hidden=true;wrap.append(list);
 input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-controls',list.id);input.setAttribute('aria-expanded','false');
 const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();let matches=[],active=-1;
 function close(){list.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');active=-1;}
 function choose(hospital){input.value=hospital.name;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));close();input.focus();announce(hospital.name+' selected.');}
 function show(){const q=normalize(input.value);close();matches=[];list.replaceChildren();if(q.length<2)return;const terms=q.split(' ');matches=ONTARIO_HOSPITALS.filter(h=>terms.every(t=>normalize(h.name+' '+h.city+' '+h.aliases).includes(t))).sort((a,b)=>Number(normalize(b.name).startsWith(q))-Number(normalize(a.name).startsWith(q))||a.name.localeCompare(b.name)).slice(0,8);
  if(!matches.length){const note=document.createElement('p');note.textContent='No suggestions found. You can enter the hospital name manually.';list.append(note);}else matches.forEach((h,i)=>{const option=document.createElement('div');option.id=list.id+'-option-'+i;option.setAttribute('role','option');option.setAttribute('aria-selected','false');const name=document.createElement('span');name.textContent=h.name;const city=document.createElement('small');city.textContent=h.city+', '+h.province;option.append(name,city);option.onpointerdown=e=>e.preventDefault();option.onclick=()=>choose(h);list.append(option);});list.hidden=false;input.setAttribute('aria-expanded','true');announce(matches.length?matches.length+' Ontario hospital suggestions available.':'No suggestions found. You can enter a hospital name manually.');
 }
 input.addEventListener('input',show);input.addEventListener('blur',close);
 input.addEventListener('keydown',e=>{if(e.key==='Escape'){close();return;}if(e.key==='Tab'){close();return;}if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(list.hidden)show();if(!matches.length)return;active=(active+(e.key==='ArrowDown'?1:active<0?0:-1)+matches.length)%matches.length;const options=[...list.querySelectorAll('[role=option]')];options.forEach((el,i)=>el.setAttribute('aria-selected',String(i===active)));input.setAttribute('aria-activedescendant',options[active].id);options[active].scrollIntoView({block:'nearest'});}else if(e.key==='Enter'&&!list.hidden&&active>=0){e.preventDefault();choose(matches[active]);}});
}
function datePicker(label,input,draft){
 document.querySelector('.date-calendar')?.dispatchEvent(new Event('dismiss-calendar'));
 const selected=new Date(input.value),today=new Date();let month=new Date(isNaN(selected)?today:selected);month.setDate(1);
 const popup=document.createElement('section');popup.className='date-calendar';popup.setAttribute('role','dialog');popup.setAttribute('aria-label',label+' calendar');document.body.append(popup);
 function position(){const frame=viewport.getBoundingClientRect(),field=input.getBoundingClientRect();const width=Math.min(336,frame.width-24,window.innerWidth-24);popup.style.width=width+'px';popup.style.left=Math.max(12,Math.min(field.left,frame.right-width-12,window.innerWidth-width-12))+'px';const height=popup.offsetHeight;popup.style.top=Math.max(8,Math.min(field.bottom+8,window.innerHeight-height-8))+'px';}
 function close(focus=false){popup.remove();document.removeEventListener('pointerdown',outside);window.removeEventListener('resize',position);window.removeEventListener('scroll',position,true);if(focus)input.focus();}
 popup.addEventListener('dismiss-calendar',()=>close());
 function choose(date){input.value=String(date.getMonth()+1).padStart(2,'0')+'/'+String(date.getDate()).padStart(2,'0')+'/'+date.getFullYear();input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));close(true);}
 function control(text,label,fn){const b=document.createElement('button');b.type='button';b.textContent=text;b.setAttribute('aria-label',label);b.onclick=fn;return b;}
 function draw(){popup.replaceChildren();const header=document.createElement('div');header.className='calendar-header';const title=document.createElement('strong');title.textContent=month.toLocaleDateString('en-US',{month:'long',year:'numeric'});header.append(control('‹','Previous month',()=>{month.setMonth(month.getMonth()-1);draw();}),title,control('›','Next month',()=>{month.setMonth(month.getMonth()+1);draw();}));popup.append(header);
 const grid=document.createElement('div');grid.className='calendar-grid';['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(day=>{const e=document.createElement('span');e.textContent=day;grid.append(e);});for(let i=0;i<month.getDay();i++)grid.append(document.createElement('span'));for(let day=1;day<=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();day++){const date=new Date(month.getFullYear(),month.getMonth(),day);const button=control(String(day),date.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}),()=>choose(date));button.dataset.day=day;button.setAttribute('aria-pressed',String(!isNaN(selected)&&date.toDateString()===selected.toDateString()));if(date.toDateString()===today.toDateString())button.setAttribute('aria-current','date');grid.append(button);}popup.append(grid);const footer=document.createElement('div');footer.className='calendar-footer';footer.append(control('Today','Choose today',()=>choose(today)),control('Close','Close calendar',()=>close(true)));popup.append(footer);position();}
 function outside(e){if(!popup.contains(e.target)&&!input.closest('.field').contains(e.target))close();}
 popup.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close(true);}else if(e.target.dataset.day&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const step={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[e.key];popup.querySelector('[data-day="'+(Number(e.target.dataset.day)+step)+'"]')?.focus();}};
 draw();(popup.querySelector('[aria-pressed="true"]')||popup.querySelector('[aria-current="date"]')||popup.querySelector('[data-day]')).focus({preventScroll:true});document.addEventListener('pointerdown',outside);window.addEventListener('resize',position);window.addEventListener('scroll',position,true);cleanup.push(()=>close());
}

function check(label,opt={}){const t=txt(label)[opt.index||0];if(!t)return;const g=t.parentElement;const r=[...g.children].find(e=>e.tagName==='rect'&&n(e,'width')<=20);if(!r)return;const b={x:n(r,'x')-.5,y:n(r,'y')-.5,w:17,h:17};r.style.visibility='hidden';const c=document.createElement('input');c.type=opt.radio?'radio':'checkbox';c.className='check';c.name=opt.key||label;c.setAttribute('aria-label',opt.aria||label);const draft=state.drafts[state.route]??={};c.checked=!!draft[c.name];place(c,b);const lb=button(label,()=>{c.checked=opt.radio?true:!c.checked;c.dispatchEvent(new Event('change'));},{element:t,box:{x:b.x+22,y:b.y-5,w:Math.min(310,bounds(t).w+12),h:28},aria:opt.aria||label});if(lb){lb.tabIndex=-1;lb.classList.add('check-label');}c.onchange=()=>{draft[c.name]=c.checked;opt.onChange?.(c.checked);updateConditional();};return c;}
function segmented(){const groups=[...svg.querySelectorAll('g')].map(g=>{const r=[...g.children].find(e=>e.tagName==='rect'&&n(e,'width')>=150&&n(e,'width')<=170&&n(e,'height')<45);const t=[...g.children].find(e=>e.tagName==='text');return r&&t?{g,r,t}:null}).filter(Boolean).sort((a,b)=>n(a.r,'y')-n(b.r,'y')||n(a.r,'x')-n(b.r,'x'));
 for(let i=0;i<groups.length;i+=2){const pair=groups.slice(i,i+2);if(pair.length<2)continue;const key='segment-'+Math.round(n(pair[0].r,'y'));const draft=state.drafts[state.route]??={};const selection=draft[key]??null;const buttons=[];function apply(j){draft[key]=j;pair.forEach((p,k)=>{[...p.g.children].filter(e=>e.tagName==='rect').forEach(r=>{if(r.getAttribute('fill'))r.setAttribute('fill',k===j?'#0076BA':'white');r.setAttribute('stroke',k===j?'#0076BA':'#E3E3E3');});p.t.setAttribute('fill',k===j?'white':'black');if(p.t.previousElementSibling?.hasAttribute('data-text-outline'))p.t.previousElementSibling.setAttribute('fill',k===j?'white':'black');buttons[k]?.setAttribute('aria-pressed',String(k===j));});queueMicrotask(updateConditional);}
 pair.forEach((p,j)=>{const b=button(p.t.textContent,()=>apply(j),{element:p.t});b.classList.remove('primary');b.setAttribute('aria-pressed',String(j===selection));buttons.push(b);});apply(selection);}
}
function closeControl(back='home'){const g=byId('line-md:close');if(g){const b=bounds(g);if(['visit-types','detected-record'].includes(state.route)){g.querySelector('path').setAttribute('d','M50 85H36M42 79L36 85L42 91');}button(['visit-types','detected-record'].includes(state.route)?'Go back':'Close',()=>go(back),{box:{x:b.x-8,y:b.y-8,w:b.w+16,h:b.h+16}});}else if(['new-medication','refill'].includes(state.route))button('Go back',()=>go(state.medicationReturn||'medications'),{box:{x:25,y:70,w:35,h:32}});}
function showDialog(title){dialogBody.replaceChildren();const h=document.createElement('h2');h.textContent=title;dialogBody.append(h);dialog.showModal();}
function menu(anchor,items){host.querySelector('.menu')?.remove();const m=document.createElement('div');m.className='menu';m.setAttribute('role','menu');const b={x:parseFloat(anchor.style.left),y:parseFloat(anchor.style.top)+parseFloat(anchor.style.height),w:Math.max(165,parseFloat(anchor.style.width)),h:0};m.style.cssText=`left:${b.x}px;top:${b.y}px;width:${b.w}px`;items.forEach(([label,fn])=>{const el=document.createElement('button');el.textContent=label;el.setAttribute('role','menuitem');el.onclick=()=>{m.remove();fn()};m.append(el);});host.append(m);anchor.setAttribute('aria-expanded','true');m.querySelector('button').focus();const dismiss=e=>{if(!m.contains(e.target)&&e.target!==anchor){m.remove();anchor.setAttribute('aria-expanded','false');document.removeEventListener('click',dismiss)}};setTimeout(()=>document.addEventListener('click',dismiss),0);cleanup.push(()=>document.removeEventListener('click',dismiss));m.onkeydown=e=>{if(e.key==='Escape'){m.remove();anchor.focus()}};}
function validate(){
 host.querySelectorAll('.error-note').forEach(e=>e.remove());
 host.querySelectorAll('[aria-invalid="true"]').forEach(e=>{e.removeAttribute('aria-invalid');e.style.outline='';});
 host.querySelectorAll('.invalid').forEach(e=>e.classList.remove('invalid'));
 const visible=e=>!e.disabled&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('[style*="display: none"]');
 const errors=[];
 const mark=(input,wrap,message)=>{input.setAttribute('aria-invalid','true');wrap.classList.add('invalid');const note=document.createElement('div');note.className='error-note';const compact=wrap.classList.contains('field')&&parseFloat(wrap.style.width)<120;note.textContent=compact?(input.validity.valueMissing?'Required.':'Invalid value.'):message;note.style.cssText='position:static;width:auto;padding:4px 0;font-size:12px';note.setAttribute('role','alert');if(wrap.classList.contains('field')){note.style.cssText+=';position:absolute;top:100%;left:0;right:0';if(compact){note.style.whiteSpace='nowrap';note.style.lineHeight='14px';}wrap.append(note);}else{input.style.outline='2px solid var(--error)';}errors.push({input,wrap,message});};
 const registered=new Set(fields.map(f=>f.input));
 for(const f of fields){if(!visible(f.input)||f.wrap.style.display==='none')continue;if(!f.input.checkValidity()||(f.opt.date&&f.input.value&&!Number.isFinite(Date.parse(f.input.value))))mark(f.input,f.wrap,f.input.validity.valueMissing?'This field is required.':'Enter a valid value.');}
 host.querySelectorAll('input[required],select[required]').forEach(input=>{if(!registered.has(input)&&visible(input)&&!input.checkValidity())mark(input,input.closest('.field')||input.parentElement,'This field is required.');});
 const groups=new Map();host.querySelectorAll('button[aria-pressed]').forEach(b=>{if(!visible(b)||!['Yes','No'].includes(b.textContent.trim()))return;const key=b.parentElement.classList.contains('employment-options')?'employment':Math.round(parseFloat(b.style.top));if(!groups.has(key))groups.set(key,[]);groups.get(key).push(b);});
 for(const buttons of groups.values()){if(buttons.some(b=>b.getAttribute('aria-pressed')==='true'))continue;buttons.forEach(b=>{b.setAttribute('aria-invalid','true');b.style.outline='2px solid var(--error)';});errors.push({input:buttons[0],wrap:buttons[0],message:'Choose Yes or No to continue.'});}
 if(errors.length){const first=errors[0];first.input.focus();first.wrap.scrollIntoView({block:'center',behavior:'smooth'});announce(first.message);if(first.input.tagName==='BUTTON'){const note=document.createElement('div');note.className='error-note';note.textContent=first.message;note.style.top=(parseFloat(first.input.style.top)||first.input.parentElement.offsetTop)+42+'px';host.append(note);}return false;}return true;
}
function draft(){return state.drafts[state.route]||{};}
function go(route,confirmed=false){
 if(state.activeReferralVisit&&state.route==='visit-types'&&Object.hasOwn(types,route)){
 const referral=state.activeReferralVisit.details;state.drafts[route]={'Date of visit':referral['Date of appointment'],'Reason for visit':referral['Test/procedure referred for']};
 }
 if(route==='home')state.activeReferralVisit=null;

 if(state.route==='detected-record'&&Object.hasOwn(types,route)){const visit=detectedQueue().find(v=>v.id===state.activeDetectedVisit);if(visit){state.drafts[route]={'Date of visit':visit.date,'Name of hospital':route==='hospital'?visit.name:'','Detected location':visit.name,'Detected address':visit.address,'Detected time':visit.time};state.drafts.expenses={};}}
if(route==='home')state.activeDetectedVisit=null;if(!confirmed&&questionnaireExitRequired(route)){confirmQuestionnaireExit(route);return;}questionnaireApprovedRoute=confirmed?route:null;location.hash=route;if(state.route===route)render(route);}
function resize(){numberVisibleQuestions();fitPageToContent();const scale=Math.min(1,window.innerWidth/402),frameHeight=state.route==='home'?window.innerHeight:Math.min(874*scale,window.innerHeight);host.style.transform=`scale(${scale})`;host.style.marginBottom=(Number(host.dataset.height)*(scale-1))+'px';viewport.style.height=frameHeight+'px';viewport.style.width=(402*scale)+'px';const frame=document.querySelector('#prototype-frame');frame.style.width=(402*scale)+'px';frame.style.height=frameHeight+'px';const dock=document.querySelector('.navigation-dock');if(dock){dock.style.transform='scale('+scale+')';viewport.style.height=Math.max(0,frameHeight-dock.offsetHeight*scale)+'px';}}
function render(requested){cleanup.forEach(f=>f());cleanup=[];fields=[];conditionalLayout=null;employmentRange=null;questionnaireRanges=null;let route=requested||'home';if(['intake-home','checkin-home'].includes(route))route='home';if(!SCREENS[route])route='home';if(route==='home-filled')route='home';if(route==='medications-filled')route='medications';state.route=route;let layout=route==='detected-record'?'visit-types':route;if(route==='home'&&state.visits.length+state.medications.length)layout='home-filled';if(route==='medications'&&(state.medications.length||state.pending.length))layout='medications-filled';const s=SCREENS[layout];host.innerHTML=s.svg;svg=host.querySelector('svg');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');host.dataset.height=s.height;host.style.height=s.height+'px';host.setAttribute('aria-label',s.name);document.title=s.name.replace(/^\d[.\da-z ]*/,'')+' · Healthcare Costs';
 if(route==='detected-visits'){renderDetected(route);return;}
 closeControl(route==='detected-record'?'detected-visits':state.activeDetectedVisit&&(Object.hasOwn(types,route)||route==='expenses')?'detected-visits':(state.medicationReturn&&['new-medication','refill','upload','review'].includes(route))?state.medicationReturn:route==='visit-types'?state.visitSelectorBack:['review','upload','new-medication','refill'].includes(route)?'medications':'home');
 if(route.startsWith('intake-')||route.startsWith('checkin-'))questionnairePage(route);else if(route==='home'){home();questionnaireHomeCards();}else if(['visit-types','detected-record'].includes(route)){visitTypes();if(route==='detected-record')detectedVisitIntro();}else if(Object.hasOwn(types,route)||route==='system-reference')visitForm(route);else if(route==='expenses')expenses();else if(route==='visit-saved'){button('Back to Home',()=>go('home'));button('Log a medication',()=>go('medications'));}else if(route==='medications')medications();else if(['new-medication','review','refill'].includes(route))medicationForm(route);else if(route==='upload')upload();else if(route==='medication-saved'){medRecords(true);button('Add another medication',()=>go('medications'),{box:{x:33,y:720,w:336,h:40},primary:true});button('Back to Home',()=>go('home'));}
 if(Object.hasOwn(types,route)||route==='system-reference')addVisitDate();
 if(route==='specialist')addSpecialistAppointment();
 if((Object.hasOwn(types,route)&&route!=='pharmacy')||route==='system-reference')addEmploymentQuestion();
 if(route.startsWith('intake-')||route.startsWith('checkin-')){host.querySelectorAll('button').forEach(b=>{if(b.getAttribute('aria-label')==='Go back')b.style.top=(Number(host.dataset.height)-55)+'px';});}annotateQuestions();hideUnselectedRefillDetails();setupNavigation();if(route==='home')setupHomeNavigation();if(['visit-types','detected-record'].includes(route))setupVisitSearch();captureConditionalLayout();updateConditional();sortControls();resize();updateNavigation();viewport.scrollTop=0;window.scrollTo(0,0);announce(s.name);}
function sortControls(){[...host.children].filter(e=>e!==svg).sort((a,b)=>(parseFloat(a.style.top)||0)-(parseFloat(b.style.top)||0)||(parseFloat(a.style.left)||0)-(parseFloat(b.style.left)||0)).forEach(e=>host.append(e));}
function home(){updateHomeCalendar();const add=button('Add a cost',()=>menu(add,[['Healthcare visit',()=>{state.activeDetectedVisit=null;state.drafts={};state.visitSelectorBack='home';go('visit-types')}],['Medication',()=>go('medications')]]));add.setAttribute('aria-haspopup','menu');const all=[...state.visits,...state.medications];if(all.length){const sum=all.reduce((s,r)=>s+r.cost,0);setText('$65.00','$'+sum.toFixed(2));const group=byId('Frame 81');if(group){let p=group;while(p.parentElement!==svg&&(![...p.children].some(e=>e.tagName==='rect'&&n(e,'height')>50)))p=p.parentElement;if(p!==svg&&bounds(p).h<150)p.style.visibility='hidden';}const area=document.createElement('div');area.className='records';area.style.top='413px';area.style.maxHeight='345px';area.style.overflow='auto';all.slice().reverse().forEach(r=>{const card=document.createElement('button');card.className='record home-record';card.style.textAlign='left';const icon=document.createElement('span');icon.className='record-icon';icon.append(originalIcon(r.medication?'pharmacy':(r.route||'primary'),r.medication?'mingcute:pill-fill':null));const body=document.createElement('span');const name=document.createElement('strong');name.textContent=r.name;const date=document.createElement('time');date.textContent=r.details?.['Date of visit']?new Date(/^\d{4}-\d{2}-\d{2}$/.test(r.details['Date of visit'])?r.details['Date of visit']+'T12:00:00':r.details['Date of visit']).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}):'August 5, 2026';body.append(name,date);const amount=document.createElement('span');amount.className='amount';amount.textContent='$'+r.cost.toFixed(2);card.append(icon,body,amount);card.onclick=()=>recordDetails(r);area.append(card);});host.append(area);}
 button('View details',showCosts);button('Costs',showCosts,{box:{x:155,y:790,w:92,h:80}});button('Home',()=>go('home'),{box:{x:45,y:790,w:90,h:80}});button('Account',()=>{showDialog('Account');const p=document.createElement('p');p.textContent='Alex';dialogBody.append(p);const q=document.createElement('p');q.textContent='Account settings are outside the supplied prototype screens.';dialogBody.append(q);},{box:{x:261,y:790,w:92,h:80}});}
function showCosts(){showDialog('Your Healthcare Costs');const all=[...state.visits,...state.medications];const p=document.createElement('p');p.textContent=all.length?'Total: $'+all.reduce((s,r)=>s+r.cost,0).toFixed(2):'You haven’t added any costs yet.';dialogBody.append(p);all.forEach(r=>{const b=document.createElement('button');b.className='action';b.textContent=r.name+' · $'+r.cost.toFixed(2);b.onclick=()=>recordDetails(r);dialogBody.append(b)});}
function recordDetails(r){if(dialog.open)dialog.close();showDialog(r.name);Object.entries(r.details||{}).filter(([k])=>!k.startsWith('segment')).forEach(([k,v])=>{if(v!==''&&v!==false){const p=document.createElement('p');p.textContent=k+': '+v;dialogBody.append(p)}});const p=document.createElement('p');p.textContent='Cost: $'+r.cost.toFixed(2);dialogBody.append(p);}
function visitTypes(){Object.entries(types).forEach(([route,names])=>names.forEach(name=>{const t=txt(name).find(t=>t.parentElement.querySelector('g[id^="weui:"]'))||txt(name)[0];if(!t)return;const b=bounds(t);button(name,()=>{state.type=name;state.visitRoute=route;go(route)},{element:t,box:{x:33,y:b.y-10,w:336,h:38}});}));const input=field('Type of healthcare visit','Search type of healthcare visit',{box:{x:33,y:1584,w:336,h:43},placeholder:'Type of healthcare visit',onInput:q=>{document.querySelector('.search-results')?.remove();if(!q)return;const matches=Object.entries(types).flatMap(([r,n])=>n.map(s=>[r,s])).filter(([,s])=>s.toLowerCase().includes(q.toLowerCase()));const box=document.createElement('div');box.className='menu search-results';box.style.cssText='left:33px;bottom:80px;width:336px;max-height:280px;overflow:auto';for(const [r,s]of matches){const b=document.createElement('button');b.textContent=s;b.onclick=()=>{state.type=s;state.visitRoute=r;go(r)};box.append(b)}if(!matches.length)box.textContent='No matching visits';const search=document.querySelector('.visit-search');box.style.left='0';box.style.bottom='51px';search.append(box);}});}
function addVisitDate(){
 const originalHeight=Number(host.dataset.height),dateOffset=state.route==='hospital'?124:100;
 // Keep the visit type and divider fixed; insert the date below the divider.
 svg.querySelectorAll('path,rect,text,line,circle,ellipse,polygon,polyline,image').forEach(e=>{
  if(e.closest('defs,clipPath,mask,pattern'))return;const b=bounds(e);
  if(b.y>=(state.route==='hospital'?230:245)&&b.h<originalHeight/2){e.dataset.visitOffset=String(dateOffset);e.setAttribute('transform','translate(0 '+dateOffset+') '+(e.getAttribute('transform')||''));}
 });
 [...host.children].filter(e=>e!==svg).forEach(e=>{const y=parseFloat(e.style.top);if(y>=245)e.style.top=(y+dateOffset)+'px';});
 fields.forEach(f=>{if(f.b.y>=245)f.b={...f.b,y:f.b.y+dateOffset};});
 const label=document.createElement('label');label.className='visit-date-label';label.htmlFor='date-of-visit';label.textContent='Date of visit';place(label,{x:33,y:255,w:336,h:20});
 const input=field(null,'Date of visit',{box:{x:33,y:283,w:336,h:43},placeholder:'mm/dd/yyyy',date:true,required:true});input.id='date-of-visit';
 const height=originalHeight+dateOffset;host.dataset.height=height;host.style.height=height+'px';svg.setAttribute('height',height);svg.setAttribute('viewBox','0 0 402 '+height);
}
function addEmploymentQuestion(){
 const next=[...host.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')==='Next');const nextY=parseFloat(next.style.top),y=['clinic','other'].includes(state.route)?Math.max(...fields.map(f=>f.b.y+f.b.h))+32:nextY-(state.route==='hospital'?14:0),height=Number(host.dataset.height),added=228-(nextY-y);
 svg.querySelectorAll('path,rect,text,line,circle,ellipse,polygon,polyline,image').forEach(e=>{if(e.closest('defs,clipPath,mask,pattern'))return;const b=bounds(e),offset=Number(e.dataset.visitOffset||0);if(b.y+offset>=nextY-1&&b.h<height/2){e.dataset.visitOffset=String(offset+added);e.setAttribute('transform','translate(0 '+added+') '+(e.getAttribute('transform')||''));}});
 [...host.children].filter(e=>e!==svg).forEach(e=>{const top=parseFloat(e.style.top);if(top>=nextY-1)e.style.top=(top+added)+'px';});
 const question=document.createElement('div');question.className='employment-question';question.id='employment-question';question.textContent='Did you take any time off paid employment for this visit?';place(question,{x:33,y,w:336,h:40});
 const group=document.createElement('div');group.className='employment-options';group.setAttribute('role','group');group.setAttribute('aria-labelledby',question.id);place(group,{x:33,y:y+58,w:336,h:39});const d=draft();
 const label=document.createElement('label');label.className='employment-question';label.htmlFor='visit-employment-hours';label.textContent='Number of hours off paid employment';place(label,{x:33,y:y+129,w:336,h:20});
 const input=field(null,'Number of hours off paid employment',{key:'Visit hours off paid employment',type:'number',box:{x:33,y:y+157,w:336,h:43},placeholder:'0',suffix:'hour(s)',required:true});input.id='visit-employment-hours';input.closest('.field').classList.add('hours-field');
 [true,false].forEach(answer=>{const b=document.createElement('button');b.type='button';b.textContent=answer?'Yes':'No';b.setAttribute('aria-pressed',String(d['Paid employment time off']===answer));b.onclick=()=>{d['Paid employment time off']=answer;if(!answer){input.value='';d[input.name]='';input.closest('.field').classList.remove('invalid');input.removeAttribute('aria-invalid');}group.querySelectorAll('button').forEach((el,i)=>el.setAttribute('aria-pressed',String((i===0)===answer)));updateConditional();};group.append(b);});
 employmentRange=[y+113,y+228,'Paid employment time off'];host.dataset.height=height+added;host.style.height=(height+added)+'px';svg.setAttribute('height',height+added);svg.setAttribute('viewBox','0 0 402 '+(height+added));
}
function visitForm(route){const defaults={hospital:'Emergency Care',primary:'Family Doctor',specialist:'Cardiologist',rehab:'Physiotherapist',clinic:'Pain Management Clinic',other:'Psychologist',pharmacy:'Pharmacy','system-reference':'Family Doctor'};if(state.visitRoute!==route&&route!=='system-reference'){state.type=defaults[route];state.visitRoute=route;}setText(defaults[route],state.type);button('Change',()=>{state.visitSelectorBack=state.route;go('visit-types')});segmented();check('Visit was related to knee replacement');check('Test/imaging was related to knee replacement');
 if(route==='primary'){field('Family Doctor Clinic','Clinic name',{value:'Family Doctor Clinic'});field('Leg pain','Reason for visit',{value:'Leg pain',required:true});}else if(['hospital','specialist','rehab','system-reference'].includes(route)){field(route==='system-reference'?'Type the reason':'Type the reason here','Reason for visit',{placeholder:route==='system-reference'?'Type the reason':'Type the reason here',required:true});}
 if(route==='hospital'){hospitalSuggestions(field('Type the name here','Name of hospital',{placeholder:'Type the name here',required:true}));field('July 30, 2026','Admission date',{value:'July 30, 2026',date:true});field('August 1, 2026','Discharge date',{value:'August 1, 2026',date:true});field('Type the surgery/procedure here','Major surgery/procedure',{placeholder:'Type the surgery/procedure here',required:false});hospitalSuggestions(field('Type the hospital here','Discharge to',{placeholder:'Type the hospital here'}));}
 if(['clinic','other'].includes(route)){field('$ 75.00','Cost of visit',{value:'75.00',type:'number',prefix:'$',required:true});field('OHIP','Type of cost',{value:'OHIP',options:costs});}
 const referral=route==='specialist'||route==='primary';if(referral){setText('Did you have any tests/imaging done?','Were you referred for a test/procedure?');setText('Tests/procedure done','Test/procedure referred for');setText('Location of test/procedure done','Date of appointment');delete draft()['Location of test/procedure done'];}
 const testText=txt('Select a test/procedure').length?'Select a test/procedure':'CBC or other blood test';if(txt(testText).length)field(testText,referral?'Test/procedure referred for':'Tests/procedure done',{options:tests,value:testText.startsWith('CBC')?testText:'',placeholder:'Select a test/procedure'});
 if(referral&&route==='primary'){const t=txt('Select a location')[0],rg=rectGroup(t);rg.g.style.visibility='hidden';field(null,'Date of appointment',{box:rg.b,date:true,required:true});}else if(txt('Select a location').length)field('Select a location','Location of test/procedure done',{options:['Hospital','Private clinic','Laboratory','Other'],placeholder:'Select a location'});
 button('Next',()=>{if(validate())go('expenses')});}
function expenses(){
 setText('Family Doctor',state.type);button('Change',()=>{state.visitSelectorBack=state.route;go('visit-types')});segmented();
 // Replace the reference's example rows with the reusable, initially empty template.
 for(const label of ['Parking','Meal','$ 15.00','$ 16.00','Add expense']){const group=rectGroup(txt(label)[0]);if(group)group.g.style.visibility='hidden';}
 svg.querySelectorAll('g[id]').forEach(g=>{if(/delete-rounded/.test(g.id))g.style.visibility='hidden';});
 const assistanceHours=field('0','Number of hours of assistance',{type:'number',index:0,box:{x:33,y:888,w:336,h:43},placeholder:'0',suffix:'hour(s)'});const employmentHours=field('0','Number of hours off paid employment',{type:'number',index:1,box:{x:33,y:1129,w:336,h:43},placeholder:'0',suffix:'hour(s)'});[assistanceHours,employmentHours].forEach(input=>input.closest('.field').classList.add('hours-field'));txt('hour(s)').forEach(t=>{t.style.visibility='hidden';if(t.previousElementSibling?.hasAttribute('data-text-outline'))t.previousElementSibling.style.visibility='hidden';});
 const d=draft(),rows=d.expenseRows??=[];delete d['Assistance related to knee replacement'];delete d['Assistance not related to knee replacement'];
 const area=document.createElement('div');area.className='expense-logging';area.style.cssText='position:absolute;left:33px;top:500px;width:336px';area.setAttribute('role','group');area.setAttribute('aria-label','Expense logging');host.append(area);
 const add=document.createElement('button');add.type='button';add.className='expense-add';add.append(originalIcon('expenses','material-symbols:add'),document.createTextNode('Add expense'));
 function drawRows(focusIndex){
  area.replaceChildren();
  rows.forEach((row,i)=>{
   const line=document.createElement('div');line.className='expense-row';
   const typeWrap=document.createElement('div');typeWrap.className='field expense-type';
   const type=document.createElement('select');type.setAttribute('aria-label','Expense type '+(i+1));type.required=true;type.add(new Option('Select an expense type',''));expenseTypes.forEach(value=>type.add(new Option(value,value)));type.value=row.type;type.dataset.empty=String(!row.type);typeWrap.append(type);const arrow=originalIcon('expenses','weui:arrow-outlined');arrow.classList.add('expense-chevron');typeWrap.append(arrow);
   const costWrap=document.createElement('div');costWrap.className='field expense-cost';const prefix=document.createElement('span');prefix.className='prefix';prefix.textContent='$';const cost=document.createElement('input');cost.type='number';cost.min='0';cost.step='.01';cost.inputMode='decimal';cost.required=true;cost.placeholder='Cost';cost.setAttribute('aria-label','Expense amount '+(i+1));cost.value=row.cost;costWrap.append(prefix,cost);
   type.onchange=()=>{row.type=type.value;type.dataset.empty=String(!type.value);typeWrap.classList.remove('invalid');};cost.oninput=()=>{row.cost=cost.value;costWrap.classList.remove('invalid');};
   const remove=document.createElement('button');remove.type='button';remove.className='expense-remove';remove.setAttribute('aria-label','Remove expense '+(i+1));remove.append(originalIcon('expenses','material-symbols:delete-rounded'));remove.onclick=()=>{rows.splice(i,1);drawRows();add.focus();announce('Expense removed');};
   line.append(typeWrap,costWrap,remove);area.append(line);
  });
  area.append(add);updateConditional();if(focusIndex!==undefined)area.querySelectorAll('select')[focusIndex]?.focus();
 }
 add.onclick=()=>{rows.push({type:'',cost:''});drawRows(rows.length-1);announce('Expense row added');};drawRows();
 button('Go back',()=>go(state.visitRoute));
 button('Save visit',()=>{if(!validate())return;
  const enabled=d['segment-393']===0;if(enabled&&!rows.length){showDialog('Add an expense');const note=document.createElement('p');note.textContent='Add at least one expense, or select No for additional expenses.';dialogBody.append(note);return;}

  const v=state.drafts[state.visitRoute]||{},details={...v,...d};delete details.expenseRows;
  if(enabled)rows.forEach((row,i)=>{details['Expense type '+(i+1)]=row.type;details['Expense amount '+(i+1)]=row.cost;});
  const cost=Number(v['Cost of visit']||0)+(enabled?rows.reduce((sum,row)=>sum+Number(row.cost),0):0);
  state.visits.push({name:state.type==='Physiotherapist'?'Physiotherapy visit':state.type+' visit',cost,route:state.visitRoute,details});state.drafts.expenses={};if(state.activeReferralVisit){state.activeReferralVisit.appointmentLogged=true;state.activeReferralVisit=null;}completeDetectedVisit();go('visit-saved');
 });
}

function medications(){state.medicationReturn=null;const add=button('Add medication',()=>menu(add,[['New medication',()=>{state.drafts['new-medication']={};go('new-medication')}],['Refill',()=>go('refill')]]));add.setAttribute('aria-haspopup','menu');button('Upload medication label',()=>go('upload'));button('Save & Continue',()=>{if(!state.pending.length){showDialog('Add a medication');const note=document.createElement('p');note.textContent='Add at least one medication before continuing.';dialogBody.append(note);return;}state.medications.push(...state.pending);state.lastSaved=[...state.pending];state.pending=[];go('medication-saved')});if(state.medications.length||state.pending.length)medRecords(false);}
function medRecords(saved){const g=[...svg.querySelectorAll('g')].find(g=>g.id.startsWith('Aspirin 325 mg'));if(g){let parent=g;while(parent.parentElement!==svg&&bounds(parent).h<90){if([...parent.children].some(e=>e.tagName==='rect'&&n(e,'width')>300))break;parent=parent.parentElement;}if(bounds(parent).h<150)parent.style.visibility='hidden';}
 const records=saved?(state.lastSaved||[]):[...state.medications,...state.pending];const container=document.createElement('div');container.className='records';container.style.top=(saved?408:380)+'px';container.style.maxHeight=saved?'280px':'350px';container.style.overflow='auto';records.forEach((r,i)=>{const card=document.createElement('div');card.className='record';const strong=document.createElement('strong');strong.textContent=r.name;const p=document.createElement('p');p.textContent=r.summary;card.append(strong,p);const dates=document.createElement('p');dates.className='medication-date-range';const start=r.details?.['Start date'],end=r.details?.['End date'];dates.textContent=start&&end?start+' – '+end:start?'Starts '+start:end?'Ends '+end:'Dates not provided';card.append(dates);container.append(card)});host.append(container);}
function medicationForm(route){const review=route==='review',refill=route==='refill';if(review){field('Atorvastatin','Medication Name',{value:state.photo?'':'Atorvastatin',required:true});{setText('We’ve found the following information','Review your medication label');setText('You can edit any information as needed','Enter the information from your photo');}}
 else if(refill){const previous=[...state.medications,...state.pending];field('Select a refill','Select a refill',{options:[...new Set(previous.map(m=>m.details['Medication Name']||m.details['Select a refill']).filter(Boolean))],placeholder:previous.length?'Select a refill':'No medications logged',required:true,onChange:name=>{const record=previous.find(r=>r.details['Medication Name']===name);if(record){Object.assign(state.drafts.refill,record.details,{'Select a refill':name});}render('refill');}});}
 else{field('Type the medication name here','Medication Name',{box:{x:33,y:163,w:336,h:43},placeholder:'Type the medication name here',required:true});delete draft().DIN;}
 field(review?'325':'Type the dose','Dose',{placeholder:'Type the dose',type:'number',value:review&&!state.photo?'325':'',min:'.001',required:true});field('mg','Dose unit',{placeholder:'Unit',required:true,options:['mg','mcg','g','mL','units']});field(review?'1':'# of pills','Pills per dose',{index:0,type:'number',value:review&&!state.photo?'1':'',placeholder:'# of pills',suffix:'per dose',min:'.001',required:true});field(review?'1':'# of doses','Doses per day',{index:review?1:0,type:'number',value:review&&!state.photo?'1':'',placeholder:'# of doses',suffix:'per day',min:'.001',required:true});field(review?'3':'# of days','How many days?',{type:'number',value:review&&!state.photo?'3':'',placeholder:'# of days',suffix:'day(s)',min:'1',required:true});check('Taken daily',review?{}:{onChange:updateMedicationDays});if(!review)updateMedicationDays();field(review?'05/12/2025':'mm/dd/yyyy','Start date',{required:false,date:true,index:0,value:review&&!state.photo?'05/12/2025':''});field(review?'5/13/2025':'mm/dd/yyyy','End date',{required:false,date:true,index:review?0:1,value:review&&!state.photo?'5/13/2025':''});if(review)field('Select a cost','Type of cost',{options:costs,placeholder:'Select a cost'});else medicationCostOptions();const costLabel=review?'Cost of this medication':'Out-of-pocket cost for this medication';if(!review)setText('Cost of this medication',costLabel);field('$',costLabel,{key:'Cost of this medication',type:'number',prefix:'$',placeholder:review?'Enter cost':'Enter out-of-pocket cost',value:'',required:true});
 setText('Start date','Start date (optional)');setText('End date','End date (optional)');fields.filter(f=>['Start date','End date'].includes(f.label)).forEach(f=>f.input.setAttribute('aria-label',f.label+' (optional)'));if(!review)updateMedicationOutOfPocket();
 const medicationName=fields.find(f=>f.label==='Medication Name');if(medicationName)medicationSuggestions(medicationName.input);
 if(state.medicationReturn&&!review)setText('Add medication','Save medication');
 button(review||state.medicationReturn?'Save medication':'Add medication',()=>{if(!validate())return;const d={...draft()};const name=d['Medication Name']||d['Select a refill'];const daily=Number(d.Dose)*Number(d['Pills per dose'])*Number(d['Doses per day']);const record={medication:true,name:`${name} ${d.Dose} ${d['Dose unit']}`,summary:`${d['Pills per dose']} pill/dose, ${daily} ${d['Dose unit']}/day, ${d['How many days?']} days`,cost:Number(d['Cost of this medication']||0),details:d};state.medications.push(record);state.lastSaved=[record];state.drafts[route]={};state.medicationReturn=null;go('medication-saved',true)},state.medicationReturn&&!review?{box:{x:33,y:Number(host.dataset.height)-80,w:336,h:40},primary:true}:{});if(review)button('Retake photo',()=>go('upload'));}
function upload(){if(state.photo){const img=svg.querySelector('image');if(img)img.setAttribute('href',state.photo);}button('Go back',()=>go(state.medicationReturn||'medications'));button('Next',()=>{if(!state.photo){showDialog('Medication label required');const note=document.createElement('p');note.textContent='Choose or take a medication label photo to continue.';dialogBody.append(note);return;}state.drafts.review={};go('review')});const uploadFile=document.createElement('input');uploadFile.type='file';uploadFile.accept='image/*';uploadFile.setAttribute('capture','environment');uploadFile.hidden=true;host.append(uploadFile);uploadFile.onchange=()=>{const file=uploadFile.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{state.photo=reader.result;render('upload');announce('Photo loaded. Continue to enter the label information.')};reader.readAsDataURL(file)};button('Choose or take a medication label photo',()=>uploadFile.click(),{box:{x:162,y:626,w:71,h:71}});const flash=button('Flash',()=>{flash.setAttribute('aria-pressed',flash.getAttribute('aria-pressed')!=='true');announce('Flash is simulated in this prototype.')},{box:{x:285,y:637,w:52,h:52}});flash.setAttribute('aria-pressed','false');}
window.addEventListener('hashchange',()=>{const route=location.hash.slice(1)||'home';if(questionnaireApprovedRoute===route){questionnaireApprovedRoute=null;render(route);return;}if(questionnaireExitRequired(route)){history.replaceState(null,'','#'+state.route);confirmQuestionnaireExit(route);return;}render(route);});window.addEventListener('resize',resize);dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});document.addEventListener('keydown',e=>{if(e.key==='Escape')host.querySelector('.menu')?.remove()});document.fonts.ready.then(()=>render(location.hash.slice(1)||'home'));
if(document.modelContext?.registerTool){
 const tools=[{name:'read_healthcare_prototype_summary',title:'Read prototype summary',description:'Read the current screen and counts of records saved in this prototype session.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute(input){if(input&&Object.keys(input).length)throw Error('No parameters are accepted.');return{screen:state.route,visits:state.visits.length,medications:state.medications.length,pendingMedications:state.pending.length,total:[...state.visits,...state.medications].reduce((s,r)=>s+r.cost,0)};}},{name:'start_healthcare_logging',title:'Start logging a cost',description:'Open the visit selector or medication list. This only starts the flow; it does not save a record.',inputSchema:{type:'object',properties:{kind:{type:'string',enum:['visit','medication']}},required:['kind'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){if(!input||!['visit','medication'].includes(input.kind)||Object.keys(input).length!==1)throw Error('kind must be visit or medication.');const route=input.kind==='visit'?'visit-types':'medications';if(input.kind==='visit')state.visitSelectorBack='home';history.replaceState(null,'','#'+route);render(route);return{screen:route,saved:false};}}];
 for(const tool of tools){try{Promise.resolve(document.modelContext.registerTool(tool)).catch(()=>{});}catch{}}
}











function setupNavigation(){
 document.querySelector('.navigation-dock')?.remove();
 const labels=[...(state.route==='medication-saved'?['Back to Home']:[]),'Add another medication','Finish','Next','Save visit','Go back','Save medication','Add medication','Retake photo'];
 const buttons=[...host.querySelectorAll('button')].filter(b=>b.style.display!=='none'&&labels.includes(b.getAttribute('aria-label'))&&!(state.route==='intake-medications'&&b.getAttribute('aria-label')==='Add medication')&&parseFloat(b.style.top)>300);
 if(!buttons.length)return;
 const dock=document.createElement('nav');dock.className='navigation-dock';dock.setAttribute('aria-label','Page navigation');
 buttons.sort((a,b)=>state.route==='medication-saved'?(a.getAttribute('aria-label')==='Add another medication'?-1:1):parseFloat(a.style.top)-parseFloat(b.style.top)).forEach(b=>{const label=b.getAttribute('aria-label');const rg=rectGroup(txt(label)[0]);if(rg&&n(rg.r,'height')<100&&bounds(rg.g).h<150)rg.g.style.visibility='hidden';else txt(label).forEach(t=>{t.style.visibility='hidden';if(t.previousElementSibling?.hasAttribute('data-text-outline'))t.previousElementSibling.style.visibility='hidden';});b.removeAttribute('style');b.className='navigation-button'+(['Go back','Retake photo'].includes(label)?' secondary':'');if(state.route==='medication-saved'){dock.classList.add('medication-confirmation-actions');b.dataset.component=label==='Back to Home'?'Button/ghost':'Button/primary';if(label==='Back to Home')b.classList.add('ghost');}dock.append(b);});
 document.querySelector('#prototype-frame').append(dock);
}
function updateNavigation(){
 const dock=document.querySelector('.navigation-dock');if(!dock)return;
 dock.querySelectorAll('button').forEach(b=>{b.disabled=false;b.removeAttribute('title');});
}
host.addEventListener('input',()=>queueMicrotask(updateNavigation));
host.addEventListener('change',()=>queueMicrotask(updateNavigation));
host.addEventListener('click',()=>queueMicrotask(updateNavigation));

function addSpecialistAppointment(){
 const height=Number(host.dataset.height);
 svg.querySelectorAll('path,rect,text,line,circle,ellipse,polygon,polyline,image').forEach(e=>{if(e.closest('defs,clipPath,mask,pattern'))return;const b=bounds(e),offset=Number(e.dataset.visitOffset||0);if(b.y+offset>=815&&b.h<height/2){e.dataset.visitOffset=String(offset+100);e.setAttribute('transform','translate(0 100) '+(e.getAttribute('transform')||''));}});
 [...host.children].filter(e=>e!==svg).forEach(e=>{const top=parseFloat(e.style.top);if(top>=815)e.style.top=(top+100)+'px';});
 const label=document.createElement('label');label.className='visit-date-label';label.htmlFor='specialist-appointment-date';label.textContent='Date of appointment';place(label,{x:33,y:840,w:336,h:20});const input=field(null,'Date of appointment',{box:{x:33,y:868,w:336,h:43},date:true,required:true});input.id='specialist-appointment-date';host.dataset.height=height+100;host.style.height=(height+100)+'px';svg.setAttribute('height',height+100);svg.setAttribute('viewBox','0 0 402 '+(height+100));
}

function setupVisitSearch(){
 const input=host.querySelector('[aria-label="Search type of healthcare visit"]');if(!input)return;const wrap=input.closest('.field');wrap.classList.add('visit-search');wrap.removeAttribute('style');wrap.querySelectorAll('svg,.calendar,.chevron').forEach(e=>e.remove());const icon=originalIcon('visit-types','material-symbols:search');icon.classList.add('visit-search-icon');wrap.prepend(icon);input.placeholder='Type of healthcare visit';input.required=false;const dock=document.createElement('div');dock.className='navigation-dock search-dock';dock.append(wrap);document.querySelector('#prototype-frame').append(dock);
}

function medicationSuggestions(input){
 const wrap=input.closest('.field');wrap.classList.add('hospital-field');const list=document.createElement('div');list.className='hospital-suggestions';list.id='medication-suggestions-'+input.name.toLowerCase().replace(/[^a-z0-9]+/g,'-');list.setAttribute('role','listbox');list.setAttribute('aria-label','Medication suggestions');list.hidden=true;wrap.append(list);
 input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-controls',list.id);input.setAttribute('aria-expanded','false');
 const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();let matches=[],active=-1;
 function close(){list.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');active=-1;}
 function choose(hospital){input.value=hospital.name;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));close();input.focus();announce(hospital.name+' selected.');}
 function show(){const q=normalize(input.value);close();matches=[];list.replaceChildren();const terms=q.split(' ');matches=["Aspirin","Celebrex","Indomethacin","Ibuprofen (Advil)","Diclofenac (Arthrotec)","Mobicox (Meloxicam)","Naproxen (Naprosyn)","Plaquenil (Hydroxychloroquine)","Aralen (Chloroquine)","Arava (Leflunomide)","Rheumatrex (Methotrexate)","Azulfidine (Sulfasalazine)","Remicade (Infliximab)","Enbrel (Etanercept)","Humira (Adalimumab)","Tylenol Regular Strength","Tylenol Extra Strength","Tylenol 2, 3","Percocets","Tramacet","Hydromorphone (Dilaudid)","Gabapentin","Lyrica","Fentanyl","Toradol"].map(name=>({name})).filter(h=>terms.every(t=>normalize(h.name).includes(t))).sort((a,b)=>Number(normalize(b.name).startsWith(q))-Number(normalize(a.name).startsWith(q))||a.name.localeCompare(b.name));
  if(!matches.length){const note=document.createElement('p');note.textContent='No suggestions found. You can enter the medication name manually.';list.append(note);}else matches.forEach((h,i)=>{const option=document.createElement('div');option.id=list.id+'-option-'+i;option.setAttribute('role','option');option.setAttribute('aria-selected','false');const name=document.createElement('span');name.textContent=h.name;option.append(name);option.onpointerdown=e=>e.preventDefault();option.onclick=()=>choose(h);list.append(option);});list.hidden=false;input.setAttribute('aria-expanded','true');announce(matches.length?matches.length+' Medication suggestions available.':'No suggestions found. You can enter a medication name manually.');
 }
 input.addEventListener('focus',show);input.addEventListener('input',show);input.addEventListener('blur',close);
 input.addEventListener('keydown',e=>{if(e.key==='Escape'){close();return;}if(e.key==='Tab'){close();return;}if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(list.hidden)show();if(!matches.length)return;active=(active+(e.key==='ArrowDown'?1:active<0?0:-1)+matches.length)%matches.length;const options=[...list.querySelectorAll('[role=option]')];options.forEach((el,i)=>el.setAttribute('aria-selected',String(i===active)));input.setAttribute('aria-activedescendant',options[active].id);options[active].scrollIntoView({block:'nearest'});}else if(e.key==='Enter'&&!list.hidden&&active>=0){e.preventDefault();choose(matches[active]);}});
}

function medicationCostOptions(){
 const costs=['OHIP','Private insurance','Out of pocket'];
 const previous=draft()['Type of cost'];
 const selected=new Set((Array.isArray(previous)?previous:[previous]).filter(v=>costs.includes(v)));
 const input=field('Select a cost','Type of cost',{options:costs,placeholder:'Select all that apply',required:true});
 const wrap=input.closest('.field');input.classList.add('sr-only');input.tabIndex=-1;
 const trigger=document.createElement('button');trigger.type='button';trigger.setAttribute('aria-label','Type of cost (select all that apply)');trigger.setAttribute('aria-expanded','false');trigger.style.cssText='width:100%;height:100%;border:0;background:transparent;text-align:left;padding:0 34px 0 15px;color:inherit;border-radius:inherit';
 const panel=document.createElement('div');panel.id='medication-cost-options';panel.hidden=true;panel.setAttribute('role','group');panel.setAttribute('aria-label','Type of cost — select all that apply');panel.style.cssText='position:absolute;left:-1px;right:-1px;top:calc(100% + 4px);background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:8px;box-shadow:0 4px 12px #0002';trigger.setAttribute('aria-controls',panel.id);
 const close=()=>{panel.hidden=true;trigger.setAttribute('aria-expanded','false');wrap.style.zIndex='';};
 let syncing=false;
 const sync=()=>{const focused=panel.contains(document.activeElement)?document.activeElement:null;syncing=true;const values=costs.filter(c=>selected.has(c));input.value=values[0]||'';draft()['Type of cost']=values;trigger.textContent=values.length?values.join(', '):'Select all that apply';trigger.style.fontSize=values.length>2?'12px':'';wrap.classList.remove('invalid');input.removeAttribute('aria-invalid');updateMedicationOutOfPocket();updateNavigation();if(focused&&!panel.hidden)focused.focus({preventScroll:true});syncing=false;};
 for(const value of costs){const label=document.createElement('label');label.style.cssText='display:flex;align-items:center;gap:10px;padding:10px 8px;cursor:pointer';const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.value=value;checkbox.checked=selected.has(value);checkbox.style.cssText='width:18px;height:18px;flex:none;accent-color:var(--blue-500)';checkbox.onchange=()=>{if(checkbox.checked)selected.add(value);else selected.delete(value);panel.querySelectorAll('input[type=checkbox]').forEach(c=>c.checked=selected.has(c.value));sync();};label.append(checkbox,document.createTextNode(value));panel.append(label);}
 trigger.onclick=()=>{const open=panel.hidden;panel.hidden=!open;trigger.setAttribute('aria-expanded',String(open));wrap.style.zIndex=open?'40':'';};
 input.onfocus=()=>trigger.focus();
 wrap.addEventListener('keydown',e=>{if(e.key==='Escape'){close();trigger.focus();}});
 wrap.addEventListener('focusout',e=>{if(!syncing&&!wrap.contains(e.relatedTarget))close();});
 const outside=e=>{if(!wrap.contains(e.target))close();};document.addEventListener('pointerdown',outside);cleanup.push(()=>document.removeEventListener('pointerdown',outside));
 wrap.append(trigger,panel);sync();
}

function updateMedicationDays(){
 const days=fields.find(f=>f.label==='How many days?');if(!days)return;
 const daily=!!draft()['Taken daily'];
 days.input.disabled=daily;days.input.required=!daily;
 if(daily){days.wrap.classList.remove('invalid');days.input.removeAttribute('aria-invalid');host.querySelectorAll('.error-note').forEach(e=>e.remove());}
 updateNavigation();
}

function updateMedicationOutOfPocket(){
 if(!['new-medication','refill'].includes(state.route))return;
 const cost=fields.find(f=>f.label==='Out-of-pocket cost for this medication');if(!cost)return;
 const selected=draft()['Type of cost'];
 const visible=Array.isArray(selected)?selected.includes('Out of pocket'):selected==='Out of pocket';
 draft()['medication-pocket-visible']=visible;
 cost.wrap.style.visibility=visible?'visible':'hidden';
 cost.input.disabled=!visible;cost.input.required=visible;
 txt('Out-of-pocket cost for this medication').forEach(t=>t.style.visibility=visible?'visible':'hidden');
 if(!visible){cost.input.value='';draft()['Cost of this medication']='';cost.wrap.classList.remove('invalid');cost.input.removeAttribute('aria-invalid');host.querySelectorAll('.error-note').forEach(e=>e.remove());}
 updateConditional();updateNavigation();
}

host.addEventListener('click',e=>{const b=e.target.closest('button[aria-pressed]');if(b&&['Yes','No'].includes(b.textContent.trim())){host.querySelectorAll('button[aria-invalid="true"]').forEach(el=>{if(el.parentElement===b.parentElement||el.style.top===b.style.top){el.removeAttribute('aria-invalid');el.style.outline='';}});}});

function currentMonthRange(today=new Date()){
 const month=today.toLocaleDateString('en-US',{month:'long'});
 const lastDay=new Date(today.getFullYear(),today.getMonth()+1,0).getDate();
 return month+' 1 - '+month+' '+lastDay;
}
function updateHomeCalendar(){
 let label='July 1 - July 31',timer;
 const refresh=()=>{const now=new Date(),next=currentMonthRange(now);setText(label,next);label=next;const midnight=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1);timer=setTimeout(refresh,midnight-now+100);};
 refresh();cleanup.push(()=>clearTimeout(timer));
}

function setupHomeNavigation(){
 const dock=document.createElement('nav');dock.className='navigation-dock home-navigation';dock.setAttribute('aria-label','Main navigation');dock.style.cssText='height:84px;padding:0;display:block;background:var(--page);border-top:1px solid var(--border)';
 const artwork=document.createElementNS('http://www.w3.org/2000/svg','svg');artwork.setAttribute('viewBox','0 790 402 84');artwork.setAttribute('width','402');artwork.setAttribute('height','84');artwork.setAttribute('aria-hidden','true');artwork.style.cssText='position:absolute;inset:0;pointer-events:none';
 svg.querySelectorAll('path,rect,text,line,circle,ellipse,polygon,polyline,image').forEach(e=>{if(e.closest('defs,clipPath,mask,pattern'))return;const b=bounds(e);if(b.y>=780&&b.h<100){const copy=e.cloneNode(true);copy.removeAttribute('id');copy.removeAttribute('transform');artwork.append(copy);e.style.visibility='hidden';}});
 dock.append(artwork);for(const label of ['Home','Costs','Account']){const control=[...host.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')===label);if(!control)continue;control.style.top='0px';control.style.height='84px';if(label==='Home')control.setAttribute('aria-current','page');dock.append(control);}
 document.querySelector('#prototype-frame').append(dock);
}

// Label requirements without changing the text used to locate form artwork.
function annotateQuestions(){
 const hospitalLabel=txt('Name of hospital')[0];
 if(state.route==='hospital'&&hospitalLabel)hospitalLabel.setAttribute('font-weight','500');
 const surgeryGroup=byId('Major surgery/procedure if any (optional)');
 if(surgeryGroup){
  surgeryGroup.querySelectorAll('path').forEach(el=>el.style.display='none');
  surgeryGroup.querySelectorAll('text').forEach(el=>{if(el.textContent.trim()==='(optional)')el.style.display='none';else{el.style.opacity='1';el.setAttribute('font-weight','500');}});
 }

 const optional=label=>/optional|Start.*date|End date|Major surgery/i.test(label);
 const add=(el,isOptional)=>{
  const original=el.textContent.trim();if(!original||el.dataset.questionText||/\(optional\)$/i.test(original))return;
  el.dataset.questionText=original;el.style.opacity='1';if(el.previousElementSibling?.hasAttribute('data-text-outline'))el.previousElementSibling.style.display='none';
  const svgLabel=el.namespaceURI==='http://www.w3.org/2000/svg';
  const suffix=svgLabel?document.createElementNS(el.namespaceURI,'tspan'):document.createElement('span');
  suffix.textContent=isOptional?' (optional)':' *';suffix.setAttribute('aria-hidden','true');
  if(!isOptional){suffix.style.fill='var(--colour-text-error)';suffix.style.color='var(--colour-text-error)';suffix.style.fontSize='var(--text-header-small-size)';suffix.style.fontWeight='var(--text-header-small-weight)';suffix.dataset.textStyle='text/header/small';}
  el.append(suffix);
 };
 if(!fields.length&&!questionnaireGroups.length)return;
 svg.querySelectorAll('text[font-weight="500"]').forEach(el=>{
  const label=el.textContent.trim();if(label==='Type of visit')return;
  add(el,optional(label));
 });
 host.querySelectorAll('.employment-question,.visit-date-label').forEach(el=>{
  if(el.htmlFor&&host.querySelector('#'+CSS.escape(el.htmlFor))?.type==='checkbox')return;
  add(el,optional(el.textContent));
 });
 fields.forEach(f=>{if(f.label.startsWith('Search '))return;f.input.setAttribute('aria-label',f.label+(f.opt.required===false?' (optional)':' (required)'));});
}

function hideUnselectedRefillDetails(){
 if(state.route!=='refill'||draft()['Select a refill'])return;
 const selector=fields.find(f=>f.label==='Select a refill');if(!selector)return;
 const cutoff=selector.b.y+selector.b.h+4;
 svg.querySelectorAll('path,rect,text,line,circle,ellipse,polygon,polyline,image').forEach(el=>{
  if(el.closest('defs,clipPath,mask,pattern'))return;
  const b=bounds(el);if(b.y>=cutoff&&b.h<Number(host.dataset.height)/2)el.style.display='none';
 });
 [...host.children].filter(el=>el!==svg&&parseFloat(el.style.top)>=cutoff).forEach(el=>el.style.display='none');
 fields.filter(f=>f!==selector).forEach(f=>{f.input.disabled=true;f.wrap.style.display='none';});
 host.dataset.height=String(cutoff+32);host.style.height=(cutoff+32)+'px';svg.setAttribute('height',cutoff+32);svg.setAttribute('viewBox','0 0 402 '+(cutoff+32));
}

// Shared follow-up treatment from the design-system component.
function styleFollowUpQuestions(hidden,expenseDelta=0){
 const l=conditionalLayout;if(!l)return;
 host.querySelectorAll('.follow-up-accent').forEach(el=>el.remove());
 const candidates=l.ranges.filter(([, ,key])=>!key.startsWith('removed-'));
 // Assistance fields share one trigger, separated only by a removed legacy question.
 if(state.route==='expenses'){
  const assistance=candidates.filter(([, ,key])=>key==='segment-780');
  if(assistance.length>1){for(let i=candidates.length-1;i>=0;i--)if(candidates[i][2]==='segment-780')candidates.splice(i,1);candidates.push([Math.min(...assistance.map(r=>r[0])),Math.max(...assistance.map(r=>r[1])),'segment-780']);}
 }
 // Nested conditional branches share their outer group's rail.
 const groups=candidates.filter(([a,b],i)=>!candidates.some(([x,y],j)=>j!==i&&x<=a&&y>=b&&(x<a||y>b||j<i)));
 const contains=y=>groups.some(([a,b])=>y>=a&&y<b);
 const scale=320/336,dx=49-33*scale;
 l.svg.forEach(({e,b})=>{if(b.h>l.height/2||!contains(b.y+b.h/2))return;const current=e.getAttribute('transform')||'';e.setAttribute('transform','translate('+dx+' 0) scale('+scale+' 1) '+current);});
 l.html.forEach(({e,y,h})=>{
  if(!contains(y+h/2))return;
  if(!e.dataset.followUpLeft)e.dataset.followUpLeft=e.style.left||'0px';
  e.style.left=(parseFloat(e.dataset.followUpLeft)*scale+dx)+'px';e.style.transformOrigin='top left';e.style.transform='scaleX('+scale+')';
 });
 const project=y=>y-hidden.reduce((total,[a,b])=>total+Math.max(0,Math.min(y,b)-a),0)+(y>=684?expenseDelta:0);
 for(const [a,b]of groups){const top=project(a),bottom=project(b);if(bottom-top<8)continue;
  const rail=document.createElement('div');rail.className='follow-up-accent';rail.setAttribute('aria-hidden','true');rail.style.cssText='position:absolute;pointer-events:none;left:33px;top:'+top+'px;width:2px;height:'+Math.max(0,bottom-top-16)+'px;background:var(--blue-300);border-radius:1px';host.append(rail);
 }
}

function detectedVisitIntro(){
 const visit=detectedQueue().find(v=>v.id===state.activeDetectedVisit);if(!visit)return;
 const intro=document.createElement('p');intro.className='detected-intro';intro.style.cssText='position:absolute;left:33px;top:120px;width:336px;margin:0;font-size:14px;line-height:20px';intro.textContent='Select your reason for visiting '+visit.name+' on '+detectedDate(visit.date)+' at '+visit.time+'.';host.append(intro);
 setText('Select the type of visit','');const shift=intro.offsetHeight,oldHeight=Number(host.dataset.height);
 svg.querySelectorAll('path,rect,text,line,circle,ellipse,polygon,polyline,image').forEach(el=>{if(el.closest('defs,clipPath,mask,pattern'))return;const b=bounds(el);if(b.y>=120&&b.h<oldHeight/2)el.setAttribute('transform','translate(0 '+shift+') '+(el.getAttribute('transform')||''));});
 [...host.children].filter(el=>el!==svg&&el!==intro).forEach(el=>{const y=parseFloat(el.style.top);if(y>=120)el.style.top=(y+shift)+'px';});host.dataset.height=oldHeight+shift;host.style.height=(oldHeight+shift)+'px';svg.setAttribute('height',oldHeight+shift);svg.setAttribute('viewBox','0 0 402 '+(oldHeight+shift));
}

function fitPageToContent(){
 if(!svg||!host.isConnected)return;
 const origin=host.getBoundingClientRect(),scale=origin.width/402||1;let bottom=0;
 if(state.route==='home'){const label=txt('View details')[0],button=host.querySelector('button[aria-label="View details"]');if(label&&button){const b=label.getBoundingClientRect();button.style.left=((b.left-origin.left)/scale-8)+'px';button.style.top=((b.top-origin.top)/scale-10)+'px';button.style.width='120px';button.style.height='36px';}}

 const visible=el=>{const style=getComputedStyle(el);return style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)!==0&&el.getClientRects().length;};
 svg.querySelectorAll('path,rect,text,line,circle,ellipse,polygon,polyline,image').forEach(el=>{
  if(el.closest('defs,clipPath,mask,pattern')||!visible(el))return;
  const b=el.getBoundingClientRect();if(b.width/scale>390&&b.height/scale>400)return;
  bottom=Math.max(bottom,(b.bottom-origin.top)/scale);
 });
 [...host.children].filter(el=>el!==svg&&visible(el)).forEach(el=>{const b=el.getBoundingClientRect();bottom=Math.max(bottom,(b.bottom-origin.top)/scale);});
 if(bottom){const height=Math.ceil(bottom+24);host.dataset.height=height;host.style.height=height+'px';svg.setAttribute('height',height);svg.setAttribute('viewBox','0 0 402 '+height);}
}

function numberVisibleQuestions(){
 if(!svg||!fields.length)return;
 const candidates=[...svg.querySelectorAll('text[font-weight="500"]'),...host.querySelectorAll('.employment-question,.visit-date-label')];
 const visible=el=>{if(!el.getClientRects().length)return false;for(let node=el;node&&node!==host;node=node.parentElement){const style=getComputedStyle(node);if(style.display==='none'||style.visibility==='hidden')return false;}return true;};
 const questions=candidates.filter(el=>{
  const label=el.dataset.questionText||el.textContent.trim();
  if(!label||label==='Type of visit'||label==='(optional)'||!visible(el))return false;
  if(el.htmlFor&&host.querySelector('#'+CSS.escape(el.htmlFor))?.type==='checkbox')return false;
  return true;
 }).map(el=>{
  const saved=conditionalLayout?.svg.find(item=>item.e===el)||conditionalLayout?.html.find(item=>item.e===el);
  const originalY=saved?(saved.b?saved.b.y+saved.b.h/2:saved.y+saved.h/2):null;
  const follow=originalY!==null&&conditionalLayout.ranges.some(([a,b,key])=>!key.startsWith('removed-')&&originalY>=a&&originalY<b);
  return{el,follow,y:el.getBoundingClientRect().top};
 }).sort((a,b)=>a.y-b.y);
 const offset=questionNumberOffset();let number=offset,letter=0;
 const letters=index=>{let value='';for(let n=index+1;n;n=Math.floor((n-1)/26))value=String.fromCharCode(97+(n-1)%26)+value;return value;};
 for(const {el,follow}of questions){
  let prefix;if(follow&&number){prefix=number+letters(letter++)+'. ';}else{number++;letter=0;prefix=number+'. ';}
  if(!el.dataset.questionText)el.dataset.questionText=el.textContent.trim();
  if(el.namespaceURI==='http://www.w3.org/2000/svg'){
   const first=el.querySelector('tspan');if(!first)continue;
   if(first.dataset.unnumbered===undefined)first.dataset.unnumbered=first.textContent;
   first.textContent=prefix+first.dataset.unnumbered;
   el.style.opacity='1';if(el.previousElementSibling?.hasAttribute('data-text-outline'))el.previousElementSibling.style.display='none';
  }else{
   let marker=el.querySelector('.question-number');if(!marker){marker=document.createElement('span');marker.className='question-number';el.prepend(marker);}marker.textContent=prefix;
  }
 }
 state.questionCounts??={};state.questionCounts[state.route]=number-offset;
}

function questionNumberOffset(){
 const counts=state.questionCounts||{},route=state.route;
 const checkin=['checkin-employment','checkin-homemaking','checkin-caregiving','checkin-assistance','checkin-living'];
 const index=checkin.indexOf(route);if(index>=0)return checkin.slice(0,index).reduce((sum,page)=>sum+(counts[page]||0),0);
 if(route==='expenses')return counts[state.visitRoute]||0;
 if(['new-medication','refill','review'].includes(route)&&state.medicationReturn==='intake-medications')return counts['intake-employment']||0;
 return 0;
}
