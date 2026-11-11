const DAY0="2026-11-12", H0=420, H1=1200, SPAN=H1-H0;
const SP=[
 {id:"A",n:"Sala A",loc:"Bloque 1, piso 2",cap:20,f:["Proyector","Pizarra"]},
 {id:"B",n:"Sala B",loc:"Bloque 1, piso 3",cap:12,f:["Pantalla","Videoconferencia"]},
 {id:"L3",n:"Laboratorio 3",loc:"Bloque 2, piso 1",cap:30,f:["30 equipos","Aire acondicionado"]},
 {id:"AU",n:"Auditorio",loc:"Bloque 3, piso 1",cap:120,f:["Sonido","Escenario"]}
];
const S={role:"usuario",tab:"esp",date:DAY0,nid:5,
 reqs:[
  {id:1,u:"Carlos Ficticio",sp:"A",d:DAY0,s:600,e:660,st:"aprobada",m:"Tutoría de proyecto"},
  {id:2,u:"Ana Prueba",sp:"A",d:DAY0,s:630,e:690,st:"pendiente",m:"Ensayo de sustentación"},
  {id:3,u:"Laura Demo",sp:"B",d:DAY0,s:840,e:900,st:"pendiente",m:"Reunión de semillero"},
  {id:4,u:"Carlos Ficticio",sp:"L3",d:DAY0,s:480,e:600,st:"aprobada",m:"Práctica de redes"}],
 hist:[]};
const t=(m)=>String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0");
const sp=(id)=>SP.find(x=>x.id===id);
const now=()=>new Date().toLocaleString("es-CO",{dateStyle:"short",timeStyle:"short"});
const esc=(s)=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function log(r,from,to,actor){S.hist.push({r:r.id,from,to,actor,at:now()})}
S.reqs.forEach(r=>{log(r,"—","pendiente",r.u);if(r.st!=="pendiente")log(r,"pendiente",r.st,"Admin Prueba")});
// Regla RF-06: franjas contiguas (11:00 y 11:00) NO se superponen
const cruza=(a,b)=>a.sp===b.sp&&a.d===b.d&&a.s<b.e&&b.s<a.e;
const conflicto=(r)=>S.reqs.find(o=>o.id!==r.id&&o.st==="aprobada"&&cruza(r,o));
function toast(m){const e=document.getElementById("toast");e.textContent=m;e.classList.add("on");clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove("on"),3200)}
const TABS=[["esp","Espacios"],["disp","Disponibilidad y solicitud"],["his","Mis solicitudes e historial"],["ges","Gestión"]];
function nav(){const n=document.getElementById("nav");n.innerHTML=TABS.map(([k,l])=>`<button role="tab" data-tab="${k}" aria-selected="${S.tab===k}">${l}</button>`).join("")}
function draw(){nav();document.querySelectorAll("[data-role]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.role===S.role));
 ({esp:vEsp,disp:vDisp,his:vHis,ges:vGes})[S.tab]()}
const main=document.getElementById("main");
function ocupados(id){return S.reqs.filter(r=>r.sp===id&&r.d===S.date&&r.st==="aprobada").length}
function vEsp(){main.innerHTML=`<h2>Catálogo de espacios</h2><div class="grid">`+SP.map(x=>`<div class="card"><h3>${x.n}</h3><p class="sub">${x.loc}</p><p class="sub">Capacidad: ${x.cap} personas</p><div>${x.f.map(f=>`<span class="chip">${f}</span>`).join("")}</div><p style="margin:12px 0 0"><button class="btn" data-act="ver" data-id="${x.id}">Ver disponibilidad</button></p></div>`).join("")+`</div>`}
function vDisp(){
 const sel=S.sel||"A";
 main.innerHTML=`<h2>Consultar disponibilidad</h2>
 <div class="row"><label>Fecha<input type="date" id="fd" value="${S.date}"></label></div>
 <div class="legend"><span>■ Aprobada (ocupado)</span><span>▨ Pendiente (aún no bloquea)</span><span>□ Libre</span></div>
 <div class="tl" id="tl"></div>
 <h2 style="margin-top:22px">Solicitar reserva</h2>
 <div class="card"><div class="row">
 <label>Espacio<select id="fs">${SP.map(x=>`<option value="${x.id}" ${x.id===sel?"selected":""}>${x.n}</option>`).join("")}</select></label>
 <label>Inicio<select id="fi"></select></label><label>Fin<select id="ff"></select></label></div>
 <div class="row" style="margin-top:10px"><label>Motivo<input id="fm" maxlength="80" placeholder="Ej. Estudio en grupo"></label></div>
 <div id="fnote"></div>
 <p style="margin:12px 0 0"><button class="btn" data-act="enviar">Enviar solicitud</button></p></div>`;
 const opts=(from,to,sel)=>{let h="";for(let m=from;m<=to;m+=30)h+=`<option value="${m}" ${m===sel?"selected":""}>${t(m)}</option>`;return h};
 document.getElementById("fi").innerHTML=opts(H0,H1-30,600);document.getElementById("ff").innerHTML=opts(H0+30,H1,660);
 tl();chk()}
function tl(){const e=document.getElementById("tl");if(!e)return;
 let h=`<div class="hours"><span></span><div>${[7,9,11,13,15,17,19].map(x=>`<span>${x}:00</span>`).join("")}</div></div>`;
 h+=SP.map(x=>`<div class="tlr"><b>${x.n}</b><div class="track">`+S.reqs.filter(r=>r.sp===x.id&&r.d===S.date&&r.st!=="rechazada").map(r=>`<div class="blk ${r.st}" style="left:${(r.s-H0)/SPAN*100}%;width:${(r.e-r.s)/SPAN*100}%" title="${t(r.s)}–${t(r.e)} · ${esc(r.u)} · ${r.st}">${t(r.s)}–${t(r.e)}</div>`).join("")+`</div></div>`).join("");
 e.innerHTML=h}
function chk(){const f=document.getElementById("fnote");if(!f)return;
 const r=cur();let h="",ok=true;
 if(r.e<=r.s){h=`<div class="note b">La hora de inicio debe ser anterior a la hora de fin.</div>`;ok=false}
 else{const c=conflicto(r);h=c?`<div class="note w">Ya existe una reserva aprobada de ${t(c.s)} a ${t(c.e)} en este espacio. Puedes enviar la solicitud, pero el gestor no podrá aprobarla.</div>`:`<div class="note o">Franja sin reservas aprobadas.</div>`}
 f.innerHTML=h;document.querySelector('[data-act="enviar"]').disabled=!ok}
function cur(){return{id:0,sp:fs.value,d:S.date,s:+fi.value,e:+ff.value,u:"Ana Prueba"}}
function vHis(){
 const mine=S.role==="gestor"?S.reqs:S.reqs.filter(r=>r.u==="Ana Prueba");
 main.innerHTML=`<h2>${S.role==="gestor"?"Todas las solicitudes":"Mis solicitudes"}</h2><div class="list">`+(mine.length?mine.map(r=>`<div class="card"><div><b>${sp(r.sp).n}</b> · ${r.d} · ${t(r.s)}–${t(r.e)}<br><span class="sub">${esc(r.m||"Sin motivo")} · ${esc(r.u)} · #${r.id}</span></div><span class="st ${r.st}">${r.st}</span></div>`).join(""):`<div class="card">Aún no tienes solicitudes. Ve a “Disponibilidad y solicitud” para crear la primera.</div>`)+`</div>
 <h2 style="margin-top:20px">Historial de cambios de estado</h2>`+
 S.hist.filter(x=>mine.some(r=>r.id===x.r)).slice().reverse().map(x=>{const r=S.reqs.find(q=>q.id===x.r);return `<div class="ev"><b>#${x.r}</b> ${sp(r.sp).n}: ${x.from} → <b>${x.to}</b><br><small>${esc(x.actor)} · ${x.at}</small></div>`}).join("")}
function vGes(){
 if(S.role!=="gestor"){main.innerHTML=`<div class="card"><h2>Acceso denegado</h2><p>Solo el rol Gestor puede aprobar o rechazar solicitudes. Cambia de rol arriba para probar el flujo de aprobación.</p><span class="st rechazada">Acción no permitida para Usuario</span></div>`;return}
 const p=S.reqs.filter(r=>r.st==="pendiente"),d=S.reqs.filter(r=>r.st!=="pendiente");
 main.innerHTML=`<h2>Solicitudes pendientes (${p.length})</h2><div class="list">`+(p.length?p.map(r=>{const c=conflicto(r);return `<div class="card"><div><b>${sp(r.sp).n}</b> · ${r.d} · ${t(r.s)}–${t(r.e)}<br><span class="sub">${esc(r.m||"Sin motivo")} · ${esc(r.u)} · #${r.id}</span>${c?`<div class="note b">Se superpone con la reserva aprobada #${c.id} (${t(c.s)}–${t(c.e)}). No se puede aprobar.</div>`:""}</div><div class="row"><button class="btn" data-act="ap" data-id="${r.id}">Aprobar</button><button class="btn bad" data-act="re" data-id="${r.id}">Rechazar</button></div></div>`}).join(""):`<div class="card">No hay solicitudes pendientes.</div>`)+`</div><h2 style="margin-top:20px">Resueltas</h2><div class="list">`+d.map(r=>`<div class="card"><div><b>${sp(r.sp).n}</b> · ${r.d} · ${t(r.s)}–${t(r.e)}<br><span class="sub">${esc(r.u)} · #${r.id}</span></div><span class="st ${r.st}">${r.st}</span></div>`).join("")+`</div>`}
document.addEventListener("click",e=>{
 const b=e.target.closest("button");if(!b)return;
 if(b.dataset.role){S.role=b.dataset.role;if(S.tab==="ges"||S.tab==="his")draw();else draw();toast("Sesión como "+(S.role==="gestor"?"Gestor":"Usuario"));return}
 if(b.dataset.tab){S.tab=b.dataset.tab;draw();return}
 const a=b.dataset.act,id=+b.dataset.id;
 if(a==="ver"){S.sel=b.dataset.id;S.tab="disp";draw()}
 if(a==="enviar"){const r=cur();r.id=S.nid++;r.m=fm.value.trim();r.st="pendiente";S.reqs.push(r);log(r,"—","pendiente","Ana Prueba");toast("Solicitud #"+r.id+" enviada con estado pendiente");S.tab="his";draw()}
 if(a==="ap"||a==="re"){
  if(S.role!=="gestor"){toast("Acción denegada: se requiere rol Gestor");return}
  const r=S.reqs.find(x=>x.id===id);
  if(a==="ap"){const c=conflicto(r);if(c){toast("Bloqueado: se superpone con la reserva aprobada #"+c.id);return}r.st="aprobada"}else r.st="rechazada";
  log(r,"pendiente",r.st,"Admin Prueba");toast("Solicitud #"+r.id+" "+r.st);draw()}
});
document.addEventListener("change",e=>{
 if(e.target.id==="fd"){S.date=e.target.value||DAY0;tl();chk()}
 if(["fs","fi","ff"].includes(e.target.id)){if(e.target.id==="fi"&&+ff.value<=+fi.value){ff.value=Math.min(+fi.value+60,H1)}chk()}
});
draw();
