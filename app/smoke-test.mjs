import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/ialex/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const dir=path.dirname(fileURLToPath(import.meta.url));
const files=new Set(['index.html','styles.css','themes.css','app.js','assets/sberkot-mascot.png']);
const server=http.createServer(async(req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'')||'index.html';
  if(!files.has(name)){res.writeHead(404).end();return}
  const content=await fs.readFile(path.join(dir,name));
  const type=name.endsWith('.css')?'text/css':name.endsWith('.js')?'text/javascript':name.endsWith('.png')?'image/png':'text/html';
  res.writeHead(200,{'Content-Type':type}).end(content);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const failures=[];
page.on('pageerror',error=>failures.push(error.message));
page.on('console',message=>{if(message.type()==='error')failures.push(message.text())});
const url=`http://127.0.0.1:${server.address().port}`;
const nav=async name=>page.locator(`button[data-view="${name}"]`).click();
const role=async name=>page.locator('#roleSelect').selectOption(name);
try{
  await page.goto(url);
  await page.getByRole('heading',{name:'Привет, Миша!'}).waitFor();
  assert.equal(await page.locator('.theme-kids').count(),1);
  assert.equal(await page.locator('.hero-mascot').evaluate(image=>image.complete&&image.naturalWidth>0),true);
  await page.screenshot({path:path.join(dir,'mvp-preview.png'),fullPage:true});

  // Default weekly rate yields a visible fractional increase.
  await nav('deposit');
  await page.getByRole('button',{name:'Положить баллы'}).click();
  await page.locator('#depositForm input[name="amount"]').fill('10');
  await page.locator('#depositForm button[type="submit"]').click();
  await page.getByRole('button',{name:'Пропустить неделю'}).click();
  await page.getByText('+0,1 Котиксов').waitFor();
  await page.getByText('Баллы на вкладе выросли до 10,1').waitFor();

  // Parent controls rate and the child's visible gift selection.
  await role('parent');
  await nav('family');
  await page.locator('#depositRate').fill('2.5');
  await page.getByRole('button',{name:'Сохранить процент'}).click();
  await nav('goals');
  const skates=page.locator('.catalog-item').filter({hasText:'Роликовые коньки'});
  await skates.getByRole('button',{name:'Показать ребёнку'}).click();
  await page.screenshot({path:path.join(dir,'mvp-parent-preview.png'),fullPage:true});
  await role('child');
  await nav('goals');
  await page.locator('.catalog-item').filter({hasText:'Роликовые коньки'}).waitFor();
  assert.equal(await page.locator('.catalog-item').filter({hasText:'Моментальная камера'}).count(),0);
  await nav('deposit');
  await page.getByRole('button',{name:'Пропустить неделю'}).click();
  await page.getByText('+0,25 Котиксов').waitFor();

  // A grandparent's pending task cannot be confirmed by the parent.
  await role('parent');
  await nav('tasks');
  const dinner=page.locator('.item').filter({hasText:'Помочь с ужином'});
  assert.equal(await dinner.getByRole('button',{name:'Подтвердить'}).count(),0);
  await role('grandparent');
  await nav('tasks');
  await page.locator('.item').filter({hasText:'Помочь с ужином'}).getByRole('button',{name:'Подтвердить'}).click();
  await page.locator('.item').filter({hasText:'Помочь с ужином'}).getByText('Выполнено').waitFor();
  await role('child');
  await nav('tasks');
  await page.locator('.item').filter({hasText:'Прочитать 20 страниц'}).getByRole('button',{name:'Я выполнил'}).click();
  await role('grandparent');
  await nav('tasks');
  assert.equal(await page.locator('.item').filter({hasText:'Прочитать 20 страниц'}).getByRole('button',{name:'Подтвердить'}).count(),0);
  await role('parent');
  await nav('tasks');
  await page.locator('.item').filter({hasText:'Прочитать 20 страниц'}).getByRole('button',{name:'Подтвердить'}).click();

  // Teen mode has its own visual theme. A completed gift deducts points once.
  await role('teen');
  assert.equal(await page.locator('.theme-teen').count(),1);
  assert.equal(await page.locator('.hero-mascot').count(),0);
  await page.screenshot({path:path.join(dir,'mvp-teen-preview.png'),fullPage:true});
  await nav('deposit');
  await page.getByRole('button',{name:'Положить баллы'}).click();
  await page.locator('#depositForm input[name="amount"]').fill('20');
  await page.locator('#depositForm button[type="submit"]').click();
  await nav('goals');
  await page.locator('.catalog-item').filter({hasText:'Набор книг'}).getByRole('button',{name:'Копить Сберсы'}).click();
  await role('parent');
  await page.locator('#profileSelect').selectOption('teen');
  await nav('goals');
  await page.getByRole('button',{name:'Одобрить цель'}).click();
  await page.locator('#goalForm input[name="target"]').fill('70');
  await page.locator('#goalForm button[type="submit"]').click();
  await role('teen');
  await nav('goals');
  await page.getByRole('button',{name:'Хочу получить'}).click();
  await role('parent');
  await page.locator('#profileSelect').selectOption('teen');
  await nav('goals');
  await page.getByRole('button',{name:'Купить и подарить'}).click();
  await page.getByRole('button',{name:'Заказать в демо'}).click();
  await page.getByText('Подарок заказан').waitFor();
  assert.equal(await page.getByRole('button',{name:'Купить и подарить'}).count(),0);
  await role('teen');
  await nav('deposit');
  await page.getByText('Подарок: Набор книг о приключениях').waitFor();
  assert.equal(await page.getByText('Подарок: Набор книг о приключениях').count(),1);
  assert.match(await page.locator('.deposit-stats').innerText(),/Доступно\s+0/);
  assert.match(await page.locator('.deposit-stats').innerText(),/На вкладе\s+0/);
  await page.setViewportSize({width:390,height:844});
  await role('child');
  await nav('overview');
  await page.screenshot({path:path.join(dir,'mvp-mobile-preview.png'),fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,'horizontal overflow on mobile');
  assert.equal(failures.length,0,failures.join('\n'));
  console.log('PASS: curated gifts, two themes, creator approval, gift deduction, weekly interest, parent rate');
}finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
