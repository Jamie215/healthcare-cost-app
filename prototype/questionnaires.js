'use strict';
let questionnaireRanges=null,questionnaireRules=[],questionnaireGroups=[];
const questionnaireAnswers={};
const employmentOptions=['Employed full-time','Employed part-time','Self-employed','Unemployed','Retired','Student','Homemaker','Unable to work','Other'];
const intakeEmploymentOptions=['Employed full-time','Employed part-time','Self-employed','Homemaking','Student','Volunteer','Social Assistance','WSIB','Disability','Litigation','Temporary sick leave','Accident Insurance','Other'];
const incomeOptions=['Less than $20,000','$20,000-$39,999','$40,000-$59,999','$60,000-$79,999','$80,000-$100,000','More than $100,000','Prefer not to answer'];
function qRange(a,b,test){const key='questionnaire-visible-'+questionnaireRules.length;questionnaireRules.push({key,test});questionnaireRanges.push([a,b,key]);}
function qUpdate(){let changed=false;const d=draft();questionnaireRules.forEach(r=>{const visible=!!r.test();if(d[r.key]!==visible){d[r.key]=visible;changed=true;}});if(changed)updateConditional();}
function qChoice(labels,key,multiple=false){const controls=labels.map((label,index)=>{const c=check(label,{key:key+'-'+index,onChange:()=>{if(multiple)draft()[key]=controls.filter(x=>x.c.checked).map(x=>x.label);else{draft()[key]=label;controls.forEach(x=>x.c.checked=x.label===label);}qUpdate();}});if(!c)throw Error('Missing questionnaire choice: '+label);if(!multiple){c.type='radio';c.name=key;}c.checked=multiple?(draft()[key]||[]).includes(label):draft()[key]===label;return{c,label};});questionnaireGroups.push({key,controls});return controls;}
function qNumber(index,label){return field('0',label,{index,type:'number',placeholder:'0',min:'0',step:'any'});}
function qTime(index,noneIndex,key){const days=qNumber(index,key+' days'),hours=qNumber(index+1,key+' hours');const none=check('None',{index:noneIndex,key:key+' none',onChange:sync});function sync(){for(const input of [days,hours]){input.disabled=!!none.checked;input.required=!none.checked;if(none.checked){input.value='';draft()[input.name]='';input.closest('.field').classList.remove('invalid');}}}sync();}
function qError(message,controls=[]){controls.forEach(c=>{c.setAttribute('aria-invalid','true');c.style.outline='2px solid var(--error)';});showDialog('Complete the required questions');const p=document.createElement('p');p.textContent=message;dialogBody.append(p);}
function qValidate(){if(!validate())return false;for(const group of questionnaireGroups){const visible=group.controls.filter(({c})=>c.getClientRects().length&&getComputedStyle(c).visibility!=='hidden');if(visible.length&&!visible.some(({c})=>c.checked)){qError('Select an answer before continuing.',visible.map(x=>x.c));return false;}}return true;}
function qSave(){questionnaireAnswers[state.route]=JSON.parse(JSON.stringify(draft()));}
function qNext(label,route){button(label,()=>{if(!qValidate())return;qSave();go(route);});}
function questionnairePage(route){if(!route.endsWith('-home')&&!route.endsWith('-complete')){state.questionnaireProgress??={};state.questionnaireProgress[route.startsWith('intake-')?'intake':'checkin']=route;}questionnaireRanges=[];questionnaireRules=[];questionnaireGroups=[];state.drafts[route]??={};const d=draft();
 if(route.endsWith('-home')){home();button('Start',()=>go(route==='intake-home'?'intake-employment':'checkin-employment'));return;}
 if(route==='checkin-complete')document.title='3-month check-in complete · Healthcare Costs';
 if(route.endsWith('-complete')){button('Back to Home',()=>go('home'));return;}
 if(route==='intake-medications'){questionnaireMedications();return;}
 qSegments();
 const firstSegment=()=>Object.keys(d).filter(k=>k.startsWith('segment-')).sort((a,b)=>Number(a.slice(8))-Number(b.slice(8)))[0];
 const yes=()=>d[firstSegment()]===0;
 if(route==='intake-employment'||route==='checkin-employment'){
  const intake=route==='intake-employment';if(intake)intakeEmploymentDetails();field(intake?'Select an option':'Employed full-time','Employment status',{options:intake?intakeEmploymentOptions:employmentOptions,placeholder:'Select an option',onChange:qUpdate});field('Type your occupation here','Occupation',{placeholder:'Type your occupation here'});field('$80,000-$100,000','Annual household income',{options:incomeOptions,placeholder:'Select household income'});
  if(intake){fields.filter(f=>f.label!=='Other employment status').forEach(f=>{const shift=f.b.y>=411?136:f.b.y>=355?24:0;f.b={...f.b,y:f.b.y+shift};if(['Employment status','Occupation'].includes(f.label)){f.b.x=33;f.b.w=336;f.wrap.style.left='33px';f.wrap.style.width='336px';}f.wrap.style.top=f.b.y+'px';if(f.input.tagName==='SELECT'){f.wrap.querySelectorAll('svg,.chevron').forEach(e=>e.remove());const arrow=document.createElement('span');arrow.className='chevron';f.wrap.append(arrow);}});qRange(298,669,yes);intakeRetirementQuestion(()=>d[firstSegment()]===1);qRange(435,547,()=>d['Employment status']==='Other');qNext('Next','intake-medications');button('Go back',()=>go('intake-home'));}
  else{qRange(348,608,yes);qRange(482,608,()=>['Employed full-time','Employed part-time','Self-employed'].includes(d['Employment status']));qTime(0,0,'Paid employment time off');qNext('Next','checkin-homemaking');}
 }
 if(route==='checkin-homemaking'){qTime(0,0,'Homemaking time off');qTime(2,1,'Volunteer time off');qNext('Next','checkin-caregiving');button('Go back',()=>go('checkin-employment'));}
 if(route==='checkin-caregiving'){
  const choices=['I have not been a primary caregiver','I have been a primary caregiver. My role has NOT changed','I was a primary caregiver and now I am NO LONGER a primary caregiver','I was NOT a primary caregiver and now I AM a primary caregiver'];qChoice(choices,'Caregiving role');qTime(0,0,'Caregiving time off');qTime(2,1,'Caregiving provided');field('July 30, 2026','Date caregiving ended',{index:0,date:true});field('July 30, 2026','Date caregiving began',{index:1,date:true});field('Type the reason here','Reason caregiving ended',{index:0});field('Type the reason here','Reason caregiving began',{index:1});qRange(399,618,()=>d['Caregiving role']===choices[1]);qRange(681,875,()=>d['Caregiving role']===choices[2]);qRange(937,1290,()=>d['Caregiving role']===choices[3]);qNext('Next','checkin-assistance');button('Go back',()=>go('checkin-homemaking'));
 }
 if(route==='checkin-assistance')assistanceActivityQuestions(yes);
 if(route==='checkin-living'){
  const living=['Living in own home – no hired assistance','Living in own home – hired assistance required','Living in relative’s home – no hired assistance','Living in relative’s home – hired assistance required','Supportive housing / personal care home'];qChoice(living,'Living status');qRange(335,1920,yes);
  const regions=[[577,671],[732,1070],[1105,1200],[1261,1599],[1637,1920]];
  living.forEach((label,i)=>{field('July 30, 2026','Date of living change '+(i+1),{index:i,date:true});qRange(...regions[i],()=>d['Living status']===label);});
  [0,1].forEach(i=>{for(const label of ['Publicly funded','Insurance funded','Private funded'])check(label,{index:i,key:label+' '+i});field('$','Monthly charge '+(i+1),{index:i,type:'number',prefix:'$',min:'0'});});
  qChoice(['Assisted living (group home, retirement home)','Residential care','Long-term care facility, convalescent care, nursing home'],'Assisted living type');button('Finish',()=>{if(!qValidate())return;const key=d['Living status']===living[1]?0:d['Living status']===living[3]?1:null;if(yes()&&key!==null&&!['Publicly funded','Insurance funded','Private funded'].some(label=>d[label+' '+key])){qError('Select at least one source of funding.');return;}qSave();state.checkinComplete=true;go('checkin-complete');});button('Go back',()=>go('checkin-assistance'));
 }
 qUpdate();const update=()=>queueMicrotask(qUpdate);host.addEventListener('change',update);cleanup.push(()=>{host.removeEventListener('change',update);});
}
function questionnaireMedications(){state.medicationReturn='intake-medications';const add=button('Add medication',()=>intakeMedicationMenu(add));add?.setAttribute('aria-expanded','false');add?.setAttribute('aria-haspopup','menu');button('Upload medication label',()=>go('upload'));button('Go back',()=>go('intake-employment'));button('Finish',()=>{state.medications.push(...state.pending);state.pending=[];state.intakeComplete=true;state.medicationReturn=null;qSave();go('intake-complete');});const cardTitle=txt('Aspirin 325 mg')[0];if(cardTitle){let g=cardTitle.parentElement;while(g.parentElement!==svg){if([...g.children].some(e=>e.tagName==='rect'&&n(e,'width')>300))break;g=g.parentElement;}if(g!==svg)g.style.visibility='hidden';}
 const heading=txt('Your Medications')[0];const area=document.createElement('div');area.className='records';area.style.top=(heading?bounds(heading).y+35:400)+'px';area.style.maxHeight='230px';area.style.overflow='auto';const records=[...state.medications,...state.pending];if(!records.length){const note=document.createElement('p');note.textContent='No medications added. If you do not take any medications, select Finish.';area.append(note);}records.forEach(r=>{const card=document.createElement('div');card.className='record';const name=document.createElement('strong');name.textContent=r.name;const summary=document.createElement('p');summary.textContent=r.summary;card.append(name,summary);const dates=document.createElement('p');dates.className='medication-date-range';const start=r.details?.['Start date'],end=r.details?.['End date'];dates.textContent=start&&end?start+' – '+end:start?'Starts '+start:end?'Ends '+end:'Dates not provided';card.append(dates);area.append(card);});host.append(area);
}
function questionnaireHomeCards(){
 const midnight=new Date();midnight.setHours(24,0,0,0);const appointmentTimer=setTimeout(()=>{if(state.route==='home')render('home');},midnight-new Date()+200);cleanup.push(()=>clearTimeout(appointmentTimer));
 const cards=[];const detected=detectedQueue();if(detected.length)cards.push([detected.length+' possible healthcare '+(detected.length===1?'visit':'visits')+' detected','We detected that you may have been at healthcare locations.','detected-visits','Review visits']);
 for(const visit of dueReferralAppointments())cards.push(['Test/procedure appointment today','You previously logged a referral for '+visit.details['Test/procedure referred for']+'. Your appointment is scheduled for today.','referral-appointment:'+state.visits.indexOf(visit),'Log visit']);
 if(!state.intakeComplete)cards.push(['Complete your intake questions','Please answer a few questions about your lifestyle and healthcare needs.','intake-employment','Start questionnaire']);
 if(!state.checkinComplete)cards.push(['3-Month Check-in','Tell us about any changes to your living status.','checkin-employment','Start check-in']);
 if(!cards.length)return;
 const sectionTop=120,panel=document.createElement('section');panel.className='questionnaire-home-cards';panel.setAttribute('aria-label','Notifications');panel.style.cssText='position:absolute;left:33px;top:'+sectionTop+'px;width:336px;display:grid;gap:16px';
 for(const [title,description,route,actionText]of cards){
  const card=document.createElement('article');card.className='questionnaire-notification';card.style.cssText='background:white;border:1px solid var(--border);border-radius:12px;padding:24px';
  const heading=document.createElement('h2');heading.textContent=title;heading.dataset.textStyle='text/header/small';heading.style.cssText='font-size:var(--text-header-small-size);font-weight:var(--text-header-small-weight);line-height:20px;margin:0 0 12px';
  const descriptionNode=document.createElement('p');descriptionNode.textContent=description;descriptionNode.dataset.textStyle='text/body/medium';descriptionNode.style.cssText='font-family:Inter,sans-serif;font-size:var(--text-body-medium-size);font-weight:var(--text-body-medium-weight);line-height:var(--text-body-medium-line-height);margin:0 0 20px';
  const action=document.createElement('button');action.type='button';action.className='questionnaire-start';action.dataset.textStyle='text/button/medium';action.style.cssText='display:inline-flex;align-items:center;justify-content:space-between;gap:24px;min-height:40px;max-width:100%;background:white;color:var(--blue-500);border:1px solid var(--blue-500);border-radius:5px;padding:8px 16px;font-family:Inter,sans-serif;font-size:var(--text-button-medium-size);font-weight:var(--text-button-medium-weight);line-height:var(--text-button-medium-line-height)';const flow=route.startsWith('intake-')?'intake':'checkin',resume=/^(intake|checkin)-/.test(route)?state.questionnaireProgress?.[flow]:null;action.append(document.createTextNode(resume?'Continue questionnaire':actionText));
  const arrow=document.createElementNS('http://www.w3.org/2000/svg','svg');arrow.setAttribute('viewBox','0 0 24 24');arrow.setAttribute('width','20');arrow.setAttribute('height','20');arrow.setAttribute('aria-hidden','true');arrow.innerHTML='<path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" stroke-width="2"/>';action.append(arrow);action.onclick=()=>route.startsWith('referral-appointment:')?logReferralAppointment(state.visits[Number(route.split(':')[1])]):go(resume||route);card.append(heading,descriptionNode,action);panel.append(card);
 }
 host.append(panel);const shift=panel.offsetHeight+24,oldHeight=Number(host.dataset.height);
 svg.querySelectorAll('path,rect,text,line,circle,ellipse,polygon,polyline,image').forEach(e=>{if(e.closest('defs,clipPath,mask,pattern'))return;const b=bounds(e);if(b.y>=sectionTop&&b.h<oldHeight/2)e.setAttribute('transform','translate(0 '+shift+') '+(e.getAttribute('transform')||''));});
 [...host.children].filter(e=>e!==svg&&e!==panel).forEach(e=>{const y=parseFloat(e.style.top);if(y>=sectionTop)e.style.top=(y+shift)+'px';});
 host.dataset.height=oldHeight+shift;host.style.height=(oldHeight+shift)+'px';svg.setAttribute('height',oldHeight+shift);svg.setAttribute('viewBox','0 0 402 '+(oldHeight+shift));
}

function qSegments(){
 const yesTexts=txt('Yes'),noTexts=txt('No');yesTexts.forEach((yes,i)=>{const pair=[yes,noTexts[i]];if(!pair[1])return;const key='segment-'+Math.round(rectGroup(yes).b.y);draft()[key]??=null;const buttons=[];const apply=j=>{draft()[key]=j;pair.forEach((t,k)=>{const rg=rectGroup(t);rg.r.setAttribute('fill',k===j?'#0076BA':'white');rg.r.setAttribute('stroke',k===j?'#0076BA':'#E3E3E3');rg.r.setAttribute('stroke-width','1');t.setAttribute('fill',k===j?'white':'black');buttons[k]?.setAttribute('aria-pressed',String(k===j));});qUpdate();};pair.forEach((t,k)=>{const b=button(k===0?'Yes':'No',()=>apply(k),{element:t,box:rectGroup(t).b});b.classList.remove('primary');b.setAttribute('aria-pressed',String(draft()[key]===k));buttons.push(b);});apply(draft()[key]);});
}
function intakeEmploymentDetails(){
 const oldHeight=Number(host.dataset.height);
 const offset=y=>y>=411?136:y>=355?24:0;
 svg.querySelectorAll('path,rect,text,line,circle,ellipse,polygon,polyline,image').forEach(e=>{if(e.closest('defs,clipPath,mask,pattern'))return;const b=bounds(e),delta=offset(b.y);if(delta&&b.h<oldHeight/2){e.dataset.visitOffset=String(delta);e.setAttribute('transform','translate(0 '+delta+') '+(e.getAttribute('transform')||''));}});
 [...host.children].filter(e=>e!==svg).forEach(e=>{const top=parseFloat(e.style.top)||0;e.style.top=(top+offset(top))+'px';});
 const addLabel=(text,y,height)=>{const label=document.createElement('div');label.className='employment-question';label.textContent=text;label.style.lineHeight='20px';place(label,{x:33,y,w:336,h:height});};
 txt('Which of the following best describes your current employment status or main activity?').forEach(t=>t.style.visibility='hidden');
 addLabel('Which of the following best describes your employment status or main activity at the time of enrollment? Select one only.',298,76);
 txt('If employed, what is your current occupation (e.g. plumber, lawyer, teacher, etc)?').forEach(t=>t.style.visibility='hidden');
 addLabel('If employed, what was your occupation (e.g. plumber, lawyer, teacher, etc)?',554,60);
 addLabel('Other, specify',443,20);field(null,'Other employment status',{box:{x:33,y:473,w:336,h:43},placeholder:'Specify your employment status',required:true});
 host.dataset.height=oldHeight+136;host.style.height=(oldHeight+136)+'px';svg.setAttribute('height',oldHeight+136);svg.setAttribute('viewBox','0 0 402 '+(oldHeight+136));
}


function intakeMedicationMenu(anchor){
 const existing=host.querySelector('#intake-medication-menu');if(existing){existing.dispatchEvent(new Event('dismiss'));return;}
 const top=parseFloat(anchor.style.top)+parseFloat(anchor.style.height),height=Number(host.dataset.height),expandedHeight=80;
 const movedSvg=[],movedHtml=[];
 svg.querySelectorAll('path,rect,text,line,circle,ellipse,polygon,polyline,image').forEach(e=>{if(e.closest('defs,clipPath,mask,pattern'))return;const b=bounds(e);if(b.y>=top&&b.h<height/2){movedSvg.push([e,e.getAttribute('transform')]);e.setAttribute('transform','translate(0 '+expandedHeight+') '+(e.getAttribute('transform')||''));}});
 [...host.children].filter(e=>e!==svg&&e!==anchor).forEach(e=>{const y=parseFloat(e.style.top);if(y>=top){movedHtml.push([e,e.style.top]);e.style.top=(y+expandedHeight)+'px';}});
 const originalStyle=anchor.style.cssText,originalText=anchor.textContent;anchor.style.background='var(--blue-500)';anchor.style.color='white';anchor.style.fontWeight='600';anchor.style.borderRadius='5px 5px 0 0';anchor.textContent='+ Add medication';
 const panel=document.createElement('div');panel.id='intake-medication-menu';panel.setAttribute('role','menu');panel.setAttribute('aria-label','Add medication');panel.style.cssText='position:absolute;left:'+anchor.style.left+';top:'+top+'px;width:'+anchor.style.width+';height:80px;background:white;border:1px solid var(--border);border-top:0;border-radius:0 0 5px 5px;overflow:hidden;z-index:40';
 const resizeHeight=value=>{host.dataset.height=value;host.style.height=value+'px';svg.setAttribute('height',value);svg.setAttribute('viewBox','0 0 402 '+value);resize();};resizeHeight(height+expandedHeight);
 let closed=false;
 const close=(focus=false)=>{if(closed)return;closed=true;panel.remove();anchor.style.cssText=originalStyle;anchor.textContent=originalText;anchor.setAttribute('aria-expanded','false');movedSvg.forEach(([e,t])=>t===null?e.removeAttribute('transform'):e.setAttribute('transform',t));movedHtml.forEach(([e,y])=>e.style.top=y);resizeHeight(height);document.removeEventListener('pointerdown',outside);if(focus)anchor.focus();};
 const outside=e=>{if(!panel.contains(e.target)&&!anchor.contains(e.target))close();};
 for(const [label,route]of [['New medication','new-medication'],['Refill','refill']]){const row=document.createElement('button');row.type='button';row.setAttribute('role','menuitem');row.textContent=label;row.style.cssText='display:block;width:100%;height:40px;padding:0 12px;border:0;background:white;color:var(--muted);text-align:center;font-size:14px';row.onmouseenter=row.onfocus=()=>{row.style.background='#e1ebf0';row.style.color='var(--blue-500)';};row.onmouseleave=row.onblur=()=>{row.style.background='white';row.style.color='var(--muted)';};row.onclick=()=>{close();if(route==='new-medication')state.drafts[route]={};go(route);};panel.append(row);}
 panel.addEventListener('dismiss',()=>close(true));panel.onkeydown=e=>{const rows=[...panel.querySelectorAll('button')],i=rows.indexOf(document.activeElement);if(e.key==='Escape'){e.preventDefault();close(true);}else if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();rows[e.key==='Home'?0:e.key==='End'?rows.length-1:(i+(e.key==='ArrowDown'?1:-1)+rows.length)%rows.length].focus();}};
 panel.addEventListener('focusout',()=>queueMicrotask(()=>{if(!panel.contains(document.activeElement)&&document.activeElement!==anchor)close();}));host.append(panel);anchor.setAttribute('aria-controls',panel.id);anchor.setAttribute('aria-expanded','true');document.addEventListener('pointerdown',outside);cleanup.push(()=>close());
 anchor.onkeydown=e=>{if(e.key==='ArrowDown'&&panel.isConnected){e.preventDefault();panel.querySelector('button').focus();}if(e.key==='Escape')close(true);};
}

function assistanceActivityQuestions(yes){
 const choices=['Taking medications','Exercises / rehab','Dressing / undressing','Bathing / showering','Going to the bathroom','Grooming (hair, shaving)','Shopping (groceries)','Meal preparation','Housework','Managing finances','Transportation to the grocery store','Transportation to the bank','Other'];
 const start=373,slot=276,end=start+choices.length*slot,oldEnd=1170,height=Number(host.dataset.height),delta=end-oldEnd,d=draft();
 svg.querySelectorAll('path,rect,text,line,circle,ellipse,polygon,polyline,image').forEach(e=>{if(e.closest('defs,clipPath,mask,pattern'))return;const b=bounds(e);if(b.h>height/2)return;const mid=b.y+b.h/2;if(mid>=start&&mid<oldEnd)e.style.visibility='hidden';else if(b.y>=oldEnd){e.dataset.visitOffset=String(delta);e.setAttribute('transform','translate(0 '+delta+') '+(e.getAttribute('transform')||''));}});
 const controls=[];
 const label=(text,y,forId)=>{const el=document.createElement('label');el.className='employment-question';el.textContent=text;if(forId)el.htmlFor=forId;el.style.lineHeight='20px';place(el,{x:53,y,w:316,h:40});return el;};
 choices.forEach((activity,i)=>{const y=start+i*slot,key='assistance-'+i;const c=document.createElement('input');c.type='checkbox';c.className='check';c.id=key;c.name=activity;c.setAttribute('aria-label',activity);c.checked=(d['Assistance activities']||[]).includes(activity);place(c,{x:33,y:y+7,w:17,h:17});const title=label(activity,y+5,key);title.style.fontWeight='500';controls.push({c,label:activity});c.onchange=()=>{d['Assistance activities']=controls.filter(x=>x.c.checked).map(x=>x.label);qUpdate();};
  [['Number of hours of assistance',y+51],['Number of hours off paid employment',y+135]].forEach(([question,top],index)=>{const id=key+'-hours-'+index;label(question,top,id);const input=field(null,activity+' — '+question,{key:activity+' — '+question,box:{x:53,y:top+27,w:316,h:43},type:'number',min:'0',step:'any',placeholder:'0',suffix:'hr(s)',required:true});input.id=id;});
  const knee=document.createElement('input');knee.type='checkbox';knee.className='check';knee.id=key+'-knee';knee.setAttribute('aria-label',activity+' — assistance needed because of knee replacement');const kneeKey=activity+' — related to knee replacement';knee.checked=!!d[kneeKey];knee.onchange=()=>d[kneeKey]=knee.checked;place(knee,{x:53,y:y+226,w:17,h:17});const kneeLabel=label('Assistance was needed because of knee replacement',y+223,knee.id);kneeLabel.style.left='78px';kneeLabel.style.width='291px';kneeLabel.dataset.textStyle='text/body/medium';kneeLabel.style.fontFamily='Inter, sans-serif';kneeLabel.style.fontSize='14px';kneeLabel.style.fontWeight='400';kneeLabel.style.lineHeight='17px';
  qRange(y+44,y+slot,()=> (d['Assistance activities']||[]).includes(activity));
 });
 questionnaireGroups.push({key:'Assistance activities',controls});qRange(start,end,yes);
 host.dataset.height=height+delta;host.style.height=(height+delta)+'px';svg.setAttribute('height',height+delta);svg.setAttribute('viewBox','0 0 402 '+(height+delta));
 button('Next',()=>{if(!qValidate())return;qSave();go('checkin-living');},{box:{x:33,y:end+13,w:336,h:40}});button('Go back',()=>go('checkin-caregiving'),{box:{x:33,y:end+65,w:336,h:40}});
}

let questionnaireApprovedRoute=null;
function activeQuestionnaire(){
 const route=state.route;
 if(route.startsWith('intake-')&&!route.endsWith('-home')&&!route.endsWith('-complete'))return 'intake';
 if(route.startsWith('checkin-')&&!route.endsWith('-home')&&!route.endsWith('-complete'))return 'checkin';
 if(state.medicationReturn==='intake-medications'&&['new-medication','refill','upload','review'].includes(route))return 'intake';
 return null;
}
function questionnaireExitRequired(destination){
 const flow=activeQuestionnaire();if(!flow)return false;
 if(destination.startsWith(flow+'-')&&!destination.endsWith('-home'))return false;
 if(flow==='intake'&&['new-medication','refill','upload','review'].includes(destination))return false;
 return true;
}
function confirmQuestionnaireExit(destination){
 if(dialog.open)dialog.close();showDialog('Exit questionnaire?');
 const message=document.createElement('p');message.textContent='You have not finished this questionnaire. You can continue from Home while this prototype remains open.';
 const stay=document.createElement('button');stay.type='button';stay.className='action';stay.textContent='No, continue';stay.onclick=()=>dialog.close();
 const leave=document.createElement('button');leave.type='button';leave.className='action';leave.textContent='Yes, exit';leave.style.cssText='background:transparent;color:var(--colour-text-close);border:1px solid var(--colour-text-close)';leave.onclick=()=>{dialog.close();go(destination,true);};
 dialogBody.append(message,stay,leave);stay.focus();
}
window.addEventListener('beforeunload',event=>{if(activeQuestionnaire()){event.preventDefault();event.returnValue='';}});

function dueReferralAppointments(today=new Date()){
 return state.visits.filter(visit=>{
  const d=visit.details||{},key=visit.route==='primary'?'segment-546':visit.route==='specialist'?'segment-560':null;
  if(visit.appointmentLogged||!key||d[key]!==0||!d['Test/procedure referred for']||!d['Date of appointment'])return false;
  const raw=d['Date of appointment'],date=new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw)?raw+'T12:00:00':raw);
  return date.getFullYear()===today.getFullYear()&&date.getMonth()===today.getMonth()&&date.getDate()===today.getDate();
 });
}
function showReferralAppointment(visit){
 if(!visit)return;showDialog('Test/procedure appointment');
 const d=visit.details;for(const text of ['Test/procedure: '+d['Test/procedure referred for'],'Appointment date: '+d['Date of appointment'],'Referral recorded during: '+visit.name]){const p=document.createElement('p');p.textContent=text;dialogBody.append(p);}
 const close=document.createElement('button');close.type='button';close.className='action';close.textContent='Done';close.onclick=()=>dialog.close();dialogBody.append(close);
}

function logReferralAppointment(visit){
 if(!visit)return;
 state.activeDetectedVisit=null;state.activeReferralVisit=visit;state.visitSelectorBack='home';state.drafts.expenses={};go('visit-types');
}

function intakeRetirementQuestion(show){
 const start=669,space=128,height=Number(host.dataset.height),d=draft();
 svg.querySelectorAll('path,rect,text,line,circle,ellipse,polygon,polyline,image').forEach(e=>{
  if(e.closest('defs,clipPath,mask,pattern'))return;
  const b=bounds(e),offset=Number(e.dataset.visitOffset||0);
  if(b.y+offset>=start&&b.h<height/2){e.dataset.visitOffset=String(offset+space);e.setAttribute('transform','translate(0 '+space+') '+(e.getAttribute('transform')||''));}
 });
 [...host.children].filter(e=>e!==svg).forEach(e=>{const y=parseFloat(e.style.top);if(y>=start)e.style.top=(y+space)+'px';});
 fields.forEach(f=>{if(f.b.y>=start)f.b={...f.b,y:f.b.y+space};});
 const title=document.createElement('div');title.className='employment-question';title.id='intake-retired-label';title.textContent='Are you retired?';place(title,{x:33,y:start+8,w:336,h:20});
 const group=document.createElement('div');group.className='employment-options';group.setAttribute('role','group');group.setAttribute('aria-labelledby',title.id);place(group,{x:33,y:start+44,w:336,h:40});
 const controls=['Yes','No'].map(label=>{const c=document.createElement('button');c.type='button';c.textContent=label;c.checked=d['Are you retired?']===label;c.setAttribute('aria-pressed',String(c.checked));c.onclick=()=>{d['Are you retired?']=label;controls.forEach(item=>{item.c.checked=item.label===label;item.c.setAttribute('aria-pressed',String(item.c.checked));item.c.removeAttribute('aria-invalid');item.c.style.outline='';});};group.append(c);return{c,label};});
 host.append(group);questionnaireGroups.push({key:'Are you retired?',controls});qRange(start,start+space,show);
 host.dataset.height=height+space;host.style.height=(height+space)+'px';svg.setAttribute('height',height+space);svg.setAttribute('viewBox','0 0 402 '+(height+space));
}