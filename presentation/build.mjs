import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.dirname(here);
const skill='C:/Users/ialex/.codex/plugins/cache/openai-primary-runtime/presentations/26.905.11957/skills/presentations';
const runtime='C:/Users/ialex/.cache/codex-runtimes/codex-primary-runtime/dependencies';
process.env.RUNTIME_NODE_MODULES=path.join(runtime,'node/node_modules');
const {Presentation,PresentationFile}=await import(pathToFileURL(path.join(runtime,'node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs')).href);
const {finalizePresentation}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')).href);
const build=path.join(root,'.codex-finalizer');
const output=path.join(here,'family-goals-mvp-v2.pptx');
await fs.mkdir(build,{recursive:true});

const C={dark:'#083E2C',green:'#087545',lime:'#CEFC74',ink:'#16382A',muted:'#627A6A',paper:'#F7FAF7',line:'#DCEADF',white:'#FFFFFF'};
const ppt=Presentation.create({slideSize:{width:1280,height:720}});
const font='Arial';
function box(slide,text,x,y,w,h,size=24,color=C.ink,bold=false){
  const shape=slide.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
  shape.text=text;
  shape.text.style={typeface:font,fontSize:size,bold,color,autoFit:'none'};
  return shape;
}
function slideBase(title,number,background=C.paper){
  const s=ppt.slides.add();s.background.fill=background;
  box(s,title,70,54,1130,74,42,background===C.dark?C.white:C.ink,true);
  box(s,String(number).padStart(2,'0'),1180,667,40,24,16,background===C.dark?'#A9D1BA':C.muted);
  return s;
}
function note(s,text){s.speakerNotes.textFrame.setText(text)}
// Image reads happen once before slide construction.
const cover=await fs.readFile(path.join(here,'assets/family-cover.png'));
const story=await fs.readFile(path.join(here,'assets/family-story.png'));
const screenshot=await fs.readFile(path.join(root,'app/mvp-preview.png'));

{
  const s=ppt.slides.add();s.background.fill=C.dark;
  s.images.add({blob:new Uint8Array(cover),contentType:'image/png',alt:'Родитель и ребёнок обсуждают подарок дома',fit:'cover',position:{left:0,top:0,width:1280,height:720}});
  box(s,'Семейный\nконструктор целей',72,174,650,190,58,C.white,true);
  box(s,'Котиксы & Сберсы',75,380,590,50,27,C.lime,true);
  box(s,'Демонстрационный MVP семейного продукта',75,593,590,45,21,C.white);
  note(s,'Продукт для детей 6–13 лет и подростков 14–17 лет. Ребёнок делает полезные дела, копит игровые баллы и выбирает подарок. Взрослый подтверждает результат и отдельно решает вопрос покупки.');
}
{
  const s=slideBase('Общий маршрут к подарку',2,C.white);
  box(s,'Ребёнку нужен понятный путь\nк своей цели',75,177,575,115,32,C.ink,true);
  box(s,'Взрослому нужны правила,\nконтроль и ясный бюджет',75,352,575,115,32,C.green,true);
  box(s,'Продукт показывает прогресс ребёнку и оставляет решение о покупке за взрослым.',75,560,555,95,23,C.muted);
  s.images.add({blob:new Uint8Array(story),contentType:'image/png',alt:'Ребёнок и отец вместе обсуждают конструктор',fit:'cover',position:{left:705,top:0,width:575,height:720}});
  note(s,'Сегодня желание ребёнка, договорённости о делах и покупка часто разрознены. Общий сценарий даёт ребёнку видимый прогресс, а взрослому сохраняет контроль.');
}
{
  const s=slideBase('Как работает продукт',3);
  const rows=[['01','Взрослый задаёт полезное дело и награду'],['02','Ребёнок выполняет, родитель подтверждает'],['03','Ребёнок выбирает товар, родитель одобряет цель'],['04','Игровые баллы копятся, прогресс виден семье'],['05','Взрослый отдельно решает, покупать ли подарок']];
  rows.forEach((r,i)=>{const y=154+i*99;box(s,r[0],80,y,105,62,43,C.green,true);box(s,r[1],204,y+4,985,68,28,C.ink,i===4)});
  note(s,'Пять шагов замкнутого цикла. Родственники могут создавать задания в пределах лимитов. Финальное подтверждение выполнения остаётся за родителем. Просьба о подарке не оформляет заказ.');
}
{
  const s=slideBase('Два возраста, одна семейная логика',4,C.white);
  box(s,'6–13',78,183,520,105,70,C.green,true);box(s,'СберKids',79,295,520,50,31,C.ink,true);
  box(s,'Котиксы\nСберКот объясняет простым языком\nКрупный и наглядный интерфейс',80,365,500,185,25,C.muted);
  box(s,'14–17',672,183,520,105,70,C.green,true);box(s,'СберБанк Онлайн',673,295,520,50,31,C.ink,true);
  box(s,'Сберсы\nВзрослый тон наставника\nЗадания со СберЗвуком при интеграции',674,365,530,185,25,C.muted);
  box(s,'Родитель подтверждает выполнение и задаёт правила цели в обоих режимах.',80,594,1110,57,24,C.ink,true);
  note(s,'Два интерфейса и два названия игровых баллов. Бизнес-логика общая. Подростковый сценарий включает семейную привязку; событие прослушивания не заменяет родительского подтверждения.');
}
{
  const s=slideBase('Рабочий демонстрационный MVP',5);
  s.images.add({blob:new Uint8Array(screenshot),contentType:'image/png',alt:'Главный экран работающего MVP',fit:'contain',position:{left:62,top:155,width:760,height:475}});
  box(s,'В прототипе можно:',858,176,354,48,29,C.green,true);
  box(s,'Создать и подтвердить задание',858,255,354,69,24,C.ink);
  box(s,'Одобрить цель и следить за прогрессом',858,348,354,88,24,C.ink);
  box(s,'Запросить подарок и завершить демо-сценарий',858,458,354,100,24,C.ink);
  box(s,'Локальное сохранение в браузере. Внешние сервисы не подключены.',858,602,347,70,17,C.muted);
  note(s,'Прототип позволяет переключаться между ребёнком, подростком, родителем и родственником. Есть игровой вклад и семейный лимит. Демо-покупка не списывает деньги.');
}
{
  const s=slideBase('Обучение внутри действия',6,C.white);
  const cols=[
    {x:76,n:'01',t:'Игровой вклад',d:'Баллы можно отложить, увидеть игровой прирост и вернуть обратно.'},
    {x:476,n:'02',t:'ИИ-наставник',d:'План накопления и объяснение процентов в момент выбора цели.'},
    {x:876,n:'03',t:'Контент СберЗвука',d:'Прослушивание может стать заданием после проверки интеграции.'}
  ];
  cols.forEach(o=>{box(s,o.n,o.x,190,300,80,55,C.green,true);box(s,o.t,o.x,295,330,75,30,C.ink,true);box(s,o.d,o.x,392,330,178,25,C.muted)});
  box(s,'Эти механики расширяют базовый цикл и требуют отдельной проверки в пилоте.',76,615,1110,48,21,C.ink,true);
  note(s,'Игровой вклад не является банковским вкладом. Примеры процентов из концепции не утверждены как тариф. ИИ не гарантирует подарок и не принимает решения за взрослого.');
}
{
  const s=slideBase('Контроль взрослого',7);
  box(s,'Игровые баллы не оплачивают товар',78,177,1120,75,39,C.green,true);
  box(s,'Начисление — только после подтверждения родителя',79,306,1100,68,28,C.ink);
  box(s,'Покупка — только после отдельного решения и оплаты взрослым',79,402,1100,80,28,C.ink);
  box(s,'Правовую модель, детские данные и права родственников нужно проверить до запуска.',79,562,1100,82,23,C.muted);
  note(s,'Котиксы и Сберсы нельзя вывести, перевести или обналичить по текущей концепции. Покупателем является взрослый. Юридические и налоговые утверждения не считаются подтверждёнными до заключения профильных команд.');
}
{
  const s=slideBase('Пилот и измерение эффекта',8,C.white);
  box(s,'Сначала проверяем понимание',78,182,1080,55,32,C.green,true);
  box(s,'Различают ли семьи игровые баллы и деньги? Понимают ли добровольность покупки?',79,251,1060,88,25,C.ink);
  box(s,'Затем измеряем поведение',78,383,1080,55,32,C.green,true);
  box(s,'Первый завершённый цикл, время проверки заданий, возвраты к цели, запросы и покупки.',79,451,1070,110,25,C.ink);
  box(s,'Оборот Мегамаркета и удержание подростков оцениваем с контрольной группой.',79,605,1100,48,21,C.muted);
  note(s,'Пилот: сначала тест прототипа, затем ограниченный запуск базового цикла. Числовые пороги успеха должны опираться на базовые данные, а не быть придуманы заранее.');
}
{
  const s=slideBase('Следующий шаг',9,C.dark);
  box(s,'Уточнить правила баллов,\nсемейную верификацию\nи интеграции',78,184,1100,260,49,C.white,true);
  box(s,'Затем определить состав ограниченного пилота и критерии успеха.',80,518,1070,108,30,C.lime);
  note(s,'Есть описанная механика, рабочий демонстрационный MVP и план проверки гипотез. Нужна совместная проработка продуктовой, юридической и технической команд.');
}

const candidate=path.join(build,'candidate.pptx');
await (await PresentationFile.exportPptx(ppt)).save(candidate);
const result=await finalizePresentation({
  workspaceDir:root,candidatePath:candidate,finalPath:output,
  pythonExecutable:path.join(runtime,'python/python.exe'),
  integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),
  layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),
  layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit'],
  explicitTotalSlideCount:9,requiredNativeTableOwnerSlides:[],requiredNativeChartOwnerSlides:[],
  fontPolicy:{basis:'design',families:[font]},verifyArtifactToolImport:true,
  receiptPath:path.join(build,'validation-v2.json')
});
if(!result?.finalPath)console.log(result);
console.log(output);
