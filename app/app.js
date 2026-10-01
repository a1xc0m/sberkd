const PRODUCTS = [
  {id:'builder',name:'Конструктор «Космическая станция»',price:4700,icon:'🧩',ages:['child']},
  {id:'skates',name:'Роликовые коньки',price:5900,icon:'🛼',ages:['child']},
  {id:'book',name:'Набор книг о приключениях',price:1900,icon:'📚',ages:['child','teen']},
  {id:'headphones',name:'Беспроводные наушники',price:6900,icon:'🎧',ages:['teen']},
  {id:'camera',name:'Моментальная камера',price:8500,icon:'📷',ages:['teen']}
];

const KEY = 'family-goals-mvp-v1';
const INITIAL = {
  profiles: {
    child:{name:'Миша',age:7,balance:45,deposit:0,week:0,lastGain:0,ledger:[{text:'Стартовый демо-баланс',value:45}]},
    teen:{name:'Аня',age:15,balance:70,deposit:0,week:0,lastGain:0,ledger:[{text:'Стартовый демо-баланс',value:70}]}
  },
  tasks:[
    {id:'t1',profile:'child',title:'Прочитать 20 страниц',reward:15,creator:'parent',status:'open',kind:'usual'},
    {id:'t2',profile:'child',title:'Помочь с ужином',reward:10,creator:'grandparent',status:'pending',kind:'usual'},
    {id:'t3',profile:'teen',title:'Дослушать главу аудиокниги',reward:25,creator:'parent',status:'open',kind:'sound'}
  ],
  goals:[{id:'g1',profile:'child',productId:'builder',target:110,status:'active',request:false}],
  family:{grandparentEnabled:true,grandparentLimit:25,depositRate:1,visibleGifts:{child:['builder','book'],teen:['headphones','book']}}
};

function clone(value){return structuredClone(value)}
function load(){
  try{
    const old=JSON.parse(localStorage.getItem(KEY));
    if(!old?.profiles?.child||!Array.isArray(old.tasks)||!Array.isArray(old.goals))return clone(INITIAL);
    const data=clone(INITIAL);
    for(const key of ['child','teen']){
      data.profiles[key]={...data.profiles[key],...old.profiles[key],age:key==='child'?7:15};
      data.profiles[key].week=Number.isInteger(old.profiles[key]?.week)?old.profiles[key].week:(old.week||0);
      data.profiles[key].lastGain=old.profiles[key]?.lastGain||0;
    }
    data.tasks=old.tasks.map(task=>({...task,creator:task.creator==='Родитель'||task.creator==='parent'?'parent':'grandparent'}));
    data.goals=old.goals;
    data.family={...data.family,...old.family,visibleGifts:{...data.family.visibleGifts,...old.family?.visibleGifts}};
    return data;
  }catch{return clone(INITIAL)}
}

let state=load();
let view='overview',role='child',profile='child',modal=null,toastTimer;
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function e(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function uid(){return Math.random().toString(36).slice(2,10)}
function round(value){return Math.round((value+Number.EPSILON)*100)/100}
function points(value){return new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(value)}
function money(value){return new Intl.NumberFormat('ru-RU').format(value)+' ₽'}
function p(){return state.profiles[profile]}
function total(){return round(p().balance+p().deposit)}
function product(id){return PRODUCTS.find(item=>item.id===id)}
function isAdult(){return role==='parent'||role==='grandparent'}
function isChild(){return role==='child'||role==='teen'}
function units(){return profile==='child'?'Котиксов':'Сберсов'}
function unitShort(){return profile==='child'?'Котиксы':'Сберсы'}
function creatorName(creator){return creator==='parent'?'Родитель':'Бабушка / дедушка'}
function selected(id){return state.family.visibleGifts[profile]?.includes(id)}
function reviewerTasks(){return state.tasks.filter(task=>task.profile===profile&&task.status==='pending'&&task.creator===role)}
function status(value){return {
  open:['Новое','gray'],pending:['На проверке','wait'],approved:['Выполнено',''],rejected:['Вернуть','red'],
  wishlist:['Ждёт одобрения','wait'],active:['Активна',''],gift:['Запрошен подарок','wait'],
  purchased:['Подарок заказан',''],declined:['Отказано','red']
}[value]||[value,'gray']}
function badge(value){const [label,color]=status(value);return `<span class="tag ${color}">${label}</span>`}
function btn(label,action,id='',style='secondary',disabled=false){return `<button class="btn ${style} small" data-action="${action}" data-id="${e(id)}" ${disabled?'disabled':''}>${label}</button>`}

function nav(){return [['overview','Обзор'],['tasks','Задания'],['goals','Цели и каталог'],['deposit','Игровой вклад'],['family','Семья']]
  .map(([id,label])=>`<button data-view="${id}" class="${view===id?'active':''}">${label}</button>`).join('')}
function shell(body){
  const theme=role==='child'?'theme-kids':role==='teen'?'theme-teen':'theme-adult';
  const roleTitle=role==='parent'?'Родитель':role==='grandparent'?'Бабушка / дедушка':role==='teen'?'СберБанк Онлайн · подросток':'СберKids · ребёнок';
  return `<div class="app ${theme}"><aside class="sidebar"><div class="brand"><span>${role==='child'?'🐾':'✦'}</span>Семейные цели</div><div><div class="small-label">Меню</div><nav class="side-nav">${nav()}</nav></div><div class="note">Демонстрационный MVP. Баллы игровые. Оплата и внешние сервисы не подключены.</div></aside><main class="main"><header class="topbar"><strong>${roleTitle}</strong><div class="controls"><select id="roleSelect" aria-label="Роль для демонстрации"><option value="child" ${role==='child'?'selected':''}>Миша · ребёнок</option><option value="teen" ${role==='teen'?'selected':''}>Аня · подросток</option><option value="parent" ${role==='parent'?'selected':''}>Родитель</option><option value="grandparent" ${role==='grandparent'?'selected':''}>Бабушка / дедушка</option></select>${isAdult()?`<select id="profileSelect" aria-label="Профиль ребёнка"><option value="child" ${profile==='child'?'selected':''}>Миша, 7 лет</option><option value="teen" ${profile==='teen'?'selected':''}>Аня, 15 лет</option></select>`:''}</div></header><div class="content">${body}</div></main></div>${modal?renderModal():''}<div id="toast-slot"></div>`;
}
function head(kicker,title,description,action=''){return `<div class="heading"><div><div class="eyebrow">${kicker}</div><h1>${title}</h1><p>${description}</p></div>${action}</div>`}
function mascot(className=''){return `<img class="mascot ${className}" src="assets/sberkot-mascot.png" alt="СберКот приветствует Мишу">`}
function mentor(){
  const goal=state.goals.find(item=>item.profile===profile&&item.status==='active');
  if(!goal)return 'Выбери подарок из семейной витрины. Когда взрослый одобрит цель, я помогу копить!';
  const remaining=Math.max(0,round(goal.target-total()));
  if(!remaining)return 'Ура, цель достигнута! Теперь можно попросить взрослого о подарке.';
  return `До цели осталось ${points(remaining)} ${units()}. Делай полезные дела и наблюдай, как растёт твой счёт!`;
}
function overview(){
  const active=state.goals.find(item=>item.profile===profile&&item.status==='active');
  const waiting=isAdult()?reviewerTasks().length:state.tasks.filter(item=>item.profile===profile&&item.status==='pending').length;
  const hero=role==='child'
    ?`<section class="card hero kids-hero"><div class="hero-copy"><div class="eyebrow">СберKids · Котиксы</div><h2>Твои дела — твои большие мечты!</h2><p>Выбирай подарок, выполняй задания и собирай Котиксы вместе со СберКотом.</p>${btn('Выбрать подарок','go-goals','','light')}</div>${mascot('hero-mascot')}<span class="hero-sparkle">✦</span></section>`
    :role==='teen'?`<section class="card hero teen-hero"><div class="hero-copy"><div class="eyebrow">Сберсы / твой план</div><h2>Цель ближе с каждым действием.</h2><p>Выбирай из семейной подборки, следи за прогрессом и решай, куда направить баллы.</p>${btn('Открыть цели','go-goals','','light')}</div><div class="teen-orbit" aria-hidden="true"><span>01</span><span>GOAL</span></div></section>`
    :`<section class="card hero"><div class="hero-copy"><div class="eyebrow">Семейный конструктор целей</div><h2>Полезные дела приближают к подарку</h2><p>Взрослый задаёт правила, ребёнок видит свой прогресс.</p>${btn('Открыть цели','go-goals','','light')}</div></section>`;
  return head('Семейный конструктор целей',`Привет, ${isAdult()?'семья':p().name}!`,isAdult()?'Задания, игровые баллы и подарки в одном месте.':role==='child'?'СберКот поможет пройти путь к подарку.':'Планируй цель и двигайся в своём темпе.')+
    `<div class="grid two">${hero}<section class="card balance-card"><div class="eyebrow">Твой счёт</div><h2>Игровой баланс</h2><div class="stat">${points(total())}</div><div class="unit">${units()} всего</div><p class="muted">Доступно: ${points(p().balance)} · На игровом вкладе: ${points(p().deposit)}</p><div class="actions space-top">${btn('Открыть вклад','go-deposit')}</div></section></div>`+
    `<div class="grid two space-top"><section class="card"><div class="row"><h2>Ближайшая цель</h2>${active?badge(active.status):''}</div>${active?goalInner(active):'<div class="empty">Пока нет активной цели</div>'}</section><section class="card"><h2>${isAdult()?'Мои заявки на проверку':'Совет наставника'}</h2>${isAdult()?`<div class="stat">${waiting}</div><p class="muted">Задания, которые создали вы и ребёнок отметил выполненными</p>${btn('Проверить задания','go-tasks')}`:`<div class="tip mentor-tip">${profile==='child'?mascot('tip-mascot'):''}<div><strong>${profile==='child'?'СберКот подсказывает':'Коротко о цели'}</strong>${mentor()}</div></div>`}</section></div>`;
}
function taskCard(task){
  let actions='';
  if(isChild()&&task.status==='open')actions=btn('Я выполнил','submit-task',task.id);
  if(isAdult()&&task.status==='pending'&&task.creator===role)actions=btn('Подтвердить','approve-task',task.id,'')+btn('Вернуть','reject-task',task.id,'ghost');
  return `<div class="item"><div><div class="name">${e(task.title)} ${task.kind==='sound'?'<span title="Демо СберЗвука">🎧</span>':''}</div><div class="meta">Создал: ${creatorName(task.creator)} · Награда: ${points(task.reward)} ${units()}${task.kind==='sound'?' · СберЗвук (демо)':''}</div>${task.status==='pending'?`<div class="meta">Проверит: ${creatorName(task.creator)}</div>`:''}</div><div class="actions">${badge(task.status)}${actions}</div></div>`;
}
function tasks(){
  const list=state.tasks.filter(task=>task.profile===profile);
  const add=isAdult()?btn('Добавить задание','new-task','',''):'';
  return head('Дела и награды','Задания','Выполнение проверяет тот взрослый, который создал задание.',add)+`<div class="grid two"><section class="card"><h2>Список заданий</h2><div class="stack">${list.length?list.map(taskCard).join(''):'<div class="empty">Заданий пока нет</div>'}</div></section><aside class="card"><h2>Как начисляются баллы</h2><div class="tip"><strong>Правило семьи</strong>Ребёнок отмечает дело выполненным. Автор задания проверяет результат. После подтверждения баллы начисляются один раз.</div><p class="notice space-top">Бабушка и дедушка создают задания в пределах лимита, установленного родителем, и проверяют свои задания сами.</p></aside></div>`;
}
function goalInner(goal){
  const item=product(goal.productId);if(!item)return '';
  const percent=goal.status==='purchased'?100:Math.min(100,Math.floor(total()/goal.target*100));
  const amount=goal.status==='purchased'?goal.target:Math.min(total(),goal.target);
  const requestable=goal.status==='active'&&isChild()&&total()>=goal.target;
  const canBuy=goal.status==='gift'&&isAdult()&&total()>=goal.target;
  const actions=(requestable?btn('Хочу получить','request-gift',goal.id,''):goal.status==='active'&&isChild()?btn('Хочу получить','request-gift',goal.id,'',true):'')+
    (goal.status==='gift'&&isAdult()?btn('Купить и подарить','purchase-gift',goal.id,'',!canBuy)+(role==='parent'?btn('Отложить','decline-gift',goal.id,'ghost'):''):'');
  return `<div class="goal-card"><div class="row"><div class="goal-image">${item.icon}</div><div class="details"><div class="name">${e(item.name)}</div><div class="meta">Цена в демо-каталоге: ${money(item.price)}</div></div></div><div class="progress" aria-label="Прогресс цели ${percent}%"><span style="width:${percent}%"></span></div><div class="bottom"><span>${points(amount)} из ${points(goal.target)} ${units()}</span><span>${percent}%</span></div>${goal.status==='purchased'?`<p class="success-note">Заказ оформлен в демо-режиме. ${points(goal.spent||goal.target)} ${units()} списано с игрового счёта.</p>`:''}${goal.status==='gift'&&total()<goal.target?'<p class="notice">Баллов стало меньше порога. Покупку можно завершить после пополнения счёта.</p>':''}<div class="actions space-top">${actions}</div></div>`;
}
function goals(){
  const own=state.goals.filter(goal=>goal.profile===profile);
  const catalog=PRODUCTS.filter(item=>item.ages.includes(profile)&&(role==='parent'||selected(item.id)));
  const description=role==='parent'?`Выберите товары, которые увидит ${p().name}. Затем ребёнок сам выберет цель.`:isChild()?'Здесь только подарки, которые заранее выбрал родитель.':'Подборка подарков, выбранная родителем.';
  const items=own.map(goal=>`<div class="item goal-item"><div class="row status-row">${badge(goal.status)}</div>${goal.status==='wishlist'?`<div class="row"><div><div class="name">${e(product(goal.productId)?.name)}</div><div class="meta">Ребёнок хочет копить на этот подарок</div></div>${role==='parent'?btn('Одобрить цель','approve-goal',goal.id,''):''}</div>`:goalInner(goal)}</div>`).join('');
  const products=catalog.map(item=>`<div class="item catalog-item"><div class="row"><div class="catalog-image">${item.icon}</div><div><div class="name">${e(item.name)}</div><div class="meta">${money(item.price)}</div></div></div><div class="catalog-actions">${role==='parent'?btn(selected(item.id)?'Убрать из выбора':'Показать ребёнку','toggle-product',item.id,selected(item.id)?'ghost':'',false):isChild()?btn(`Копить ${unitShort()}`,'add-goal',item.id,'secondary',own.some(goal=>goal.productId===item.id&&goal.status!=='declined')):''}</div></div>`).join('');
  return head('Выбор подарка','Цели и каталог',description)+`<div class="grid two"><section class="card"><h2>Цели семьи</h2><div class="stack">${items||'<div class="empty">Выберите подарок в каталоге</div>'}</div></section><section class="card"><h2>${role==='parent'?'Подборка для ребёнка':'Доступные подарки'}</h2><p class="muted">Демо-каталог Мегамаркета. Цены примерные, реальные заказы не оформляются.</p><div class="stack">${products||'<div class="empty">Родитель ещё не выбрал подарки</div>'}</div></section></div>`;
}
function deposit(){
  const entries=p().ledger.slice().reverse();const rate=points(state.family.depositRate);
  const gain=p().lastGain>0?`<div class="interest-result" role="status"><span>За последнюю неделю</span><strong>+${points(p().lastGain)} ${units()}</strong><span>Баллы на вкладе выросли до ${points(p().deposit)}</span></div>`:'';
  return head('Финансовая грамотность','Игровой вклад',`Сейчас начисляется ${rate}% за игровую неделю. Ставку устанавливает родитель.`)+
    `<div class="grid two"><section class="card"><h2>Баллы и вклад</h2><div class="grid two deposit-stats"><div><div class="muted">Доступно</div><div class="stat">${points(p().balance)}</div></div><div><div class="muted">На вкладе</div><div class="stat">${points(p().deposit)}</div></div></div><p class="muted">Прошло игровых недель: ${p().week}. Прирост показывается с точностью до сотых балла.</p>${gain}<div class="actions deposit-actions">${isChild()?btn('Положить баллы','deposit-add','',''):''}${isChild()?btn('Забрать баллы','deposit-take'):''}${isChild()?btn('Пропустить неделю','next-week','','ghost',p().deposit<=0):''}</div><p class="notice space-top">Это игровая механика, не банковский вклад. Баллы нельзя вывести или обменять на деньги.</p></section><section class="card"><h2>История баллов</h2><div class="timeline">${entries.map(entry=>`<div class="entry"><span>${e(entry.text)}</span><span class="number">${entry.value>0?'+':''}${points(entry.value)}</span></div>`).join('')}</div></section></div>`;
}
function family(){
  return head('Участники семьи','Семейные настройки','Роли, подарки и игровой вклад в демонстрационном проекте.')+
    `<div class="grid two"><section class="card"><h2>Участники</h2><div class="family-row"><strong>Родитель</strong><div class="muted">Выбирает доступные подарки, одобряет цели и покупает их</div></div><div class="family-row"><strong>Миша, 7 лет</strong><div class="muted">СберKids · Котиксы</div></div><div class="family-row"><strong>Аня, 15 лет</strong><div class="muted">СберБанк Онлайн · Сберсы</div></div><div class="family-row"><strong>Бабушка / дедушка</strong><div class="muted">${state.family.grandparentEnabled?'Доступ включён':'Доступ выключен'} · Лимит задания ${points(state.family.grandparentLimit)} баллов</div></div></section><section class="card"><h2>Правила семьи</h2><p class="muted">Каждый взрослый проверяет задания, которые создал сам. Родитель управляет лимитом родственников и ставкой игрового вклада.</p>${role==='parent'?`<div class="form"><label class="field">Максимальная награда родственника за задание<input id="familyLimit" type="number" min="1" max="1000" value="${state.family.grandparentLimit}"></label><div class="actions">${btn(state.family.grandparentEnabled?'Отключить доступ':'Включить доступ','toggle-grandparent','','ghost')}${btn('Сохранить лимит','save-limit','','')}</div><label class="field">Процент игрового вклада за неделю<input id="depositRate" type="number" min="1" max="20" step="0.1" value="${state.family.depositRate}"></label><div class="actions">${btn('Сохранить процент','save-rate','','')}</div><p class="notice">Допустимое значение: от 1% до 20% в неделю. Новая ставка действует с ближайшей игровой недели.</p></div>`:`<div class="tip"><strong>Ставка вклада</strong>${points(state.family.depositRate)}% в неделю. Настраивает родитель.</div>`}</section></div>`;
}
function renderModal(){
  let content='';
  if(modal.type==='new-task')content=`<h2>Новое задание</h2><p>Баллы начислятся после проверки автором задания.</p><form id="taskForm" class="form"><label class="field">Название задания<input name="title" required maxlength="80" placeholder="Например, прочитать главу книги"></label><label class="field">Награда в игровых баллах<input name="reward" type="number" required min="1" max="${role==='grandparent'?state.family.grandparentLimit:1000}" value="10"></label><label class="field">Тип задания<select name="kind"><option value="usual">Обычное</option>${profile==='teen'?'<option value="sound">Аудиокнига в СберЗвуке (демо)</option>':''}</select></label><footer><button type="button" class="btn ghost" data-action="close-modal">Отмена</button><button class="btn" type="submit">Создать</button></footer></form>`;
  if(modal.type==='approve-goal'){
    const goal=state.goals.find(item=>item.id===modal.id),item=product(goal.productId);
    content=`<h2>Одобрить цель</h2><p>${e(item.name)} · ${money(item.price)}. Ориентир: ${Math.ceil(item.price/50)}–${Math.ceil(item.price/40)} ${units().toLowerCase()}. Выберите своё значение.</p><form id="goalForm" class="form"><label class="field">Порог в игровых баллах<input name="target" type="number" required min="1" max="100000" value="${Math.round(item.price/45)}"></label><footer><button type="button" class="btn ghost" data-action="close-modal">Отмена</button><button class="btn" type="submit">Одобрить</button></footer></form>`;
  }
  if(modal.type==='deposit')content=`<h2>${modal.mode==='add'?'Положить на игровой вклад':'Забрать с игрового вклада'}</h2><p>Перемещение игровых баллов без участия реальных денег.</p><form id="depositForm" class="form"><label class="field">Количество баллов<input name="amount" type="number" required min="${modal.mode==='add'?1:0.01}" step="0.01" max="${modal.mode==='add'?p().balance:p().deposit}" value="${Math.min(10,modal.mode==='add'?p().balance:p().deposit)}"></label><footer><button type="button" class="btn ghost" data-action="close-modal">Отмена</button><button class="btn" type="submit">Подтвердить</button></footer></form>`;
  if(modal.type==='purchase'){
    const goal=state.goals.find(item=>item.id===modal.id),item=product(goal.productId);
    content=`<h2>Демо-заказ подарка</h2><p><strong>${e(item.name)}</strong><br>Демонстрационная цена: ${money(item.price)}<br>После подтверждения с игрового счёта ребёнка спишется ${points(goal.target)} ${units()}.</p><div class="tip">Реальная оплата и доставка в MVP не подключены. Списание касается только игровых баллов.</div><footer><button class="btn ghost" data-action="close-modal">Отмена</button><button class="btn" data-action="confirm-purchase" data-id="${goal.id}">Заказать в демо</button></footer>`;
  }
  return `<div class="modal-wrap" data-action="close-modal"><div class="modal" role="dialog" aria-modal="true" aria-label="${e(modal.type)}">${content}</div></div>`;
}
function render(){document.getElementById('app').innerHTML=shell(({overview,tasks,goals,deposit,family})[view]())}
function notify(message){const slot=document.getElementById('toast-slot');slot.innerHTML=`<div class="toast">${e(message)}</div>`;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{if(slot)slot.innerHTML=''},3500)}
function ledger(text,value){p().ledger.push({text,value:round(value)})}
function action(name,id){
  const task=state.tasks.find(item=>item.id===id),goal=state.goals.find(item=>item.id===id);
  let message='';
  switch(name){
    case 'go-goals':view='goals';break;
    case 'go-tasks':view='tasks';break;
    case 'go-deposit':view='deposit';break;
    case 'close-modal':modal=null;break;
    case 'new-task':if(isAdult()&&(role!=='grandparent'||state.family.grandparentEnabled))modal={type:name};else message='Доступ родственника выключен';break;
    case 'submit-task':if(task?.profile===profile&&task.status==='open'&&isChild()){task.status='pending';message=`Задание отправлено на проверку: ${creatorName(task.creator).toLowerCase()}`}break;
    case 'approve-task':if(isAdult()&&task?.status==='pending'&&task.profile===profile&&task.creator===role){task.status='approved';p().balance=round(p().balance+task.reward);ledger('Задание: '+task.title,task.reward);message='Баллы начислены'}break;
    case 'reject-task':if(isAdult()&&task?.status==='pending'&&task.profile===profile&&task.creator===role){task.status='open';message='Задание возвращено ребёнку'}break;
    case 'toggle-product':if(role==='parent'&&product(id)?.ages.includes(profile)){const list=state.family.visibleGifts[profile];state.family.visibleGifts[profile]=list.includes(id)?list.filter(item=>item!==id):[...list,id];message=selected(id)?'Подарок виден ребёнку':'Подарок скрыт из выбора'}break;
    case 'add-goal':if(isChild()&&selected(id)&&product(id)?.ages.includes(profile)&&!state.goals.some(item=>item.profile===profile&&item.productId===id&&item.status!=='declined')){state.goals.push({id:uid(),profile,productId:id,target:0,status:'wishlist',request:false});message='Подарок добавлен в вишлист'}break;
    case 'approve-goal':if(role==='parent'&&goal?.status==='wishlist'&&goal.profile===profile)modal={type:name,id};break;
    case 'request-gift':if(isChild()&&goal?.status==='active'&&goal.profile===profile&&total()>=goal.target){goal.status='gift';message='Запрос отправлен взрослому'}break;
    case 'purchase-gift':if(isAdult()&&goal?.status==='gift'&&goal.profile===profile){if(total()<goal.target)message='Не хватает игровых баллов';else modal={type:'purchase',id}}break;
    case 'confirm-purchase':if(isAdult()&&goal?.status==='gift'&&goal.profile===profile){if(total()<goal.target){message='Не хватает игровых баллов для списания';break}const fromBalance=Math.min(p().balance,goal.target);p().balance=round(p().balance-fromBalance);p().deposit=round(p().deposit-(goal.target-fromBalance));ledger('Подарок: '+product(goal.productId).name,-goal.target);goal.spent=goal.target;goal.status='purchased';modal=null;message=`Демо-заказ оформлен. Списано ${points(goal.target)} ${units()}`}break;
    case 'decline-gift':if(role==='parent'&&goal?.status==='gift'){goal.status='active';message='Запрос отложен, баллы сохранены'}break;
    case 'deposit-add':if(isChild()&&p().balance>=1)modal={type:'deposit',mode:'add'};else message='Нужно не меньше 1 балла';break;
    case 'deposit-take':if(isChild()&&p().deposit>0)modal={type:'deposit',mode:'take'};break;
    case 'next-week':if(isChild()&&p().deposit>0){const gain=round(p().deposit*state.family.depositRate/100);p().deposit=round(p().deposit+gain);p().week++;p().lastGain=gain;ledger('Прирост за неделю ('+points(state.family.depositRate)+'%)',gain);message=gain?`Вклад вырос на ${points(gain)} ${units()}`:'Неделя прошла без прироста при ставке 0%'}else message='Сначала положите баллы на игровой вклад';break;
    case 'toggle-grandparent':if(role==='parent'){state.family.grandparentEnabled=!state.family.grandparentEnabled;message='Доступ родственника обновлён'}break;
    case 'save-limit':if(role==='parent'){const value=Number(document.getElementById('familyLimit')?.value);if(Number.isInteger(value)&&value>=1&&value<=1000){state.family.grandparentLimit=value;message='Лимит сохранён'}else message='Введите целое число от 1 до 1000'}break;
    case 'save-rate':if(role==='parent'){const value=Number(document.getElementById('depositRate')?.value);if(Number.isFinite(value)&&value>=1&&value<=20&&Math.round(value*10)===value*10){state.family.depositRate=value;message='Процент игрового вклада сохранён'}else message='Введите ставку от 1 до 20 с шагом 0,1'}break;
    default:return;
  }
  save();render();if(message)notify(message);
}

document.addEventListener('click',event=>{
  const element=event.target.closest('[data-action], [data-view]');if(!element)return;
  if(element.dataset.view){view=element.dataset.view;render();return}
  if(element.dataset.action==='close-modal'&&event.target.closest('.modal')&&event.target!==element)return;
  action(element.dataset.action,element.dataset.id);
});
document.addEventListener('change',event=>{
  if(event.target.id==='roleSelect'){role=event.target.value;if(isChild())profile=role;view='overview';modal=null;render()}
  if(event.target.id==='profileSelect'){profile=event.target.value;view='overview';modal=null;render()}
});
document.addEventListener('submit',event=>{
  event.preventDefault();const form=event.target,data=new FormData(form);
  if(form.id==='taskForm'){
    const title=String(data.get('title')||'').trim(),reward=Number(data.get('reward'));
    if(!title||!Number.isInteger(reward)||reward<1||reward>(role==='grandparent'?state.family.grandparentLimit:1000))return notify('Проверьте название и награду');
    state.tasks.unshift({id:uid(),profile,title,reward,creator:role,status:'open',kind:data.get('kind')==='sound'?'sound':'usual'});
    modal=null;save();render();notify('Задание создано');
  }
  if(form.id==='goalForm'){
    const goal=state.goals.find(item=>item.id===modal?.id),target=Number(data.get('target'));
    if(!goal||!Number.isInteger(target)||target<1||target>100000)return notify('Введите корректный порог');
    goal.target=target;goal.status='active';modal=null;save();render();notify('Цель одобрена');
  }
  if(form.id==='depositForm'){
    const amount=Number(data.get('amount')),limit=modal.mode==='add'?p().balance:p().deposit;
    if(!Number.isFinite(amount)||amount<(modal.mode==='add'?1:0.01)||round(amount)!==amount||amount>limit)return notify('Проверьте количество баллов');
    if(modal.mode==='add'){p().balance=round(p().balance-amount);p().deposit=round(p().deposit+amount);ledger('На игровой вклад',-amount)}
    else{p().deposit=round(p().deposit-amount);p().balance=round(p().balance+amount);ledger('С игрового вклада',amount)}
    p().lastGain=0;modal=null;save();render();notify('Баллы перемещены');
  }
});
render();
