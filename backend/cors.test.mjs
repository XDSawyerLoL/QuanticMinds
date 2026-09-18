import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import net from 'node:net';

function freePort(){
  return new Promise((resolve,reject)=>{
    const server=net.createServer();
    server.on('error',reject);
    server.listen(0,'127.0.0.1',()=>{
      const {port}=server.address();
      server.close(()=>resolve(port));
    });
  });
}

test('Pulse CORS accepts production Quantic origins and rejects unknown origins', async (t)=>{
  const port=await freePort();
  const child=spawn(process.execPath,['server.mjs'],{
    cwd:new URL('.',import.meta.url).pathname,
    env:{
      ...process.env,
      PORT:String(port),
      PUBLIC_BASE_URL:'http://127.0.0.1:'+port,
      FRONTEND_URL:'https://xdsawyerlol.github.io/QuanticSillage/pulse.html',
      PULSE_ALLOWED_ORIGINS:'https://mediumorchid-badger-314305.hostingersite.com',
      DATA_DIR:'./data-test-cors'
    },
    stdio:['ignore','pipe','pipe']
  });

  t.after(()=>child.kill('SIGTERM'));

  await new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>reject(new Error('server_start_timeout')),8000);
    const onData=(buf)=>{
      if(String(buf).includes('listening on')){
        clearTimeout(timeout);
        resolve();
      }
    };
    child.stdout.on('data',onData);
    child.stderr.on('data',()=>{});
    child.on('exit',(code)=>{
      clearTimeout(timeout);
      reject(new Error('server_exited_'+code));
    });
  });

  async function check(origin,expected){
    const response=await fetch('http://127.0.0.1:'+port+'/api/pulse/health',{
      method:'OPTIONS',
      headers:{Origin:origin,'Access-Control-Request-Method':'GET'}
    });
    assert.equal(response.status,204);
    assert.equal(response.headers.get('access-control-allow-origin'),expected);
  }

  await check('https://xdsawyerlol.github.io','https://xdsawyerlol.github.io');
  await check('https://mediumorchid-badger-314305.hostingersite.com','https://mediumorchid-badger-314305.hostingersite.com');

  const unknown=await fetch('http://127.0.0.1:'+port+'/api/pulse/health',{
    method:'OPTIONS',
    headers:{Origin:'https://evil.example','Access-Control-Request-Method':'GET'}
  });
  assert.equal(unknown.status,204);
  assert.equal(unknown.headers.get('access-control-allow-origin'),null);
});
