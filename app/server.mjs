import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const directory=path.dirname(fileURLToPath(import.meta.url));
const files={'/':'index.html','/index.html':'index.html','/styles.css':'styles.css','/themes.css':'themes.css','/app.js':'app.js','/assets/sberkot-mascot.png':'assets/sberkot-mascot.png'};
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png'};
const port=Number(process.env.PORT)||8080;
http.createServer(async(req,res)=>{
  const filename=files[new URL(req.url,'http://localhost').pathname];
  if(!filename){res.writeHead(404).end('Not found');return}
  try{const content=await fs.readFile(path.join(directory,filename));res.writeHead(200,{'Content-Type':types[path.extname(filename)]}).end(content)}
  catch{res.writeHead(500).end('Server error')}
}).listen(port,'127.0.0.1',()=>console.log(`MVP открыт на http://127.0.0.1:${port}`));
