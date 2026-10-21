const $ = s => document.querySelector(s), SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const fmt = s => [s / 3600, s / 60 % 60, s % 60].map(n => String(Math.floor(n)).padStart(2, '0')).join(':');
const cls = s => 's-' + s.split(/[ -]/)[0];
// ---- IndexedDB (call history + recordings) ----
const db = new Promise(r => { const q = indexedDB.open('aria', 1); q.onupgradeneeded = () => q.result.createObjectStore('calls', { keyPath: 'id' }); q.onsuccess = () => r(q.result) });
const tx = async (m, f) => { const d = await db; return new Promise(r => { const t = d.transaction('calls', m), o = f(t.objectStore('calls')); t.oncomplete = () => r(o.result) }) };
const saveCall = c => tx('readwrite', s => s.put(c)), allCalls = async () => (await tx('readonly', s => s.getAll())).sort((a, b) => b.id - a.id), clearCalls = () => tx('readwrite', s => s.clear());
// ---- state ----
let msgs = [], active = false, sec = 0, tmr, rec, chunks = [], stream, recog, muted = false, busy = false, startedAt;
const lang = () => $('#lang').value;
function setStatus(t, live) { const e = $('#status'); e.textContent = t; e.className = 'badge' + (live ? ' live' : '') }
function orb(state) { $('#orb').className = 'orb ' + (state || '') }
$('#wave').innerHTML = '<i></i>'.repeat(18); [...$('#wave').children].forEach((e, i) => e.style.animationDelay = (i * .07) + 's');
function addMsg(role, text) { msgs.push({ role, text, t: fmt(sec).slice(3) }); const c = $('#chat'); c.querySelector('.hint')?.remove(); const d = document.createElement('div'); d.className = 'm ' + (role === 'ai' ? 'ai' : 'me'); d.innerHTML = `${text.replace(/</g, '&lt;')}<small>${role === 'ai' ? 'Vexora' : 'Customer'} • ${fmt(sec).slice(3)}</small>`; c.append(d); c.scrollTop = 1e9 }
async function api(body) { const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, lang: lang() }) }); const j = await r.json(); if (!r.ok) throw new Error(j.error); return j }
// ---- speech ----
function speak(text) {
  return new Promise(res => {
    if (!('speechSynthesis' in window)) return res();
    speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = lang(); u.rate = 1;
    const v = speechSynthesis.getVoices().find(v => v.lang.replace('_', '-').startsWith(lang().slice(0, 2))); if (v) u.voice = v;
    u.onstart = () => orb('talk'); u.onend = u.onerror = () => { orb(); res() }; speechSynthesis.speak(u);
  });
}
function listen() {
  if (!active || muted || !SR) return;
  recog = new SR(); recog.lang = lang(); recog.interimResults = false;
  recog.onstart = () => { if (!busy) orb('listen') };
  recog.onresult = e => { const t = e.results[0][0].transcript.trim(); if (t) handleUser(t) };
  recog.onend = () => { orb(); if (active && !busy && !muted) setTimeout(listen, 300) };
  recog.onerror = e => { if (e.error === 'not-allowed') alert('Microphone blocked. Allow mic access or type your reply.') };
  try { recog.start() } catch { }
}
async function handleUser(text) {
  if (!active || busy) return; busy = true; recog?.abort(); addMsg('me', text); setStatus('AI thinking…', true);
  try { const { reply } = await api({ mode: 'reply', messages: msgs }); setStatus('Speaking', true); addMsg('ai', reply); await speak(reply) }
  catch (e) { addMsg('ai', 'Error: ' + e.message) }
  busy = false; if (active) { setStatus('Listening', true); listen() }
}
// ---- call lifecycle ----
$('#start').onclick = async () => {
  if (!$('#consent').checked) return alert('Please tick the recording consent box first.');
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }) } catch { alert('Mic not available – you can still type replies.') }
  msgs = []; $('#chat').innerHTML = ''; chunks = []; sec = 0; active = true; startedAt = Date.now();
  if (stream && window.MediaRecorder) { rec = new MediaRecorder(stream); rec.ondataavailable = e => chunks.push(e.data); rec.start() }
  tmr = setInterval(() => $('#timer').textContent = fmt(++sec), 1000);
  $('#start').disabled = true; $('#end').disabled = false; $('#sum').textContent = 'Call in progress…'; $('#sstat').textContent = '—'; $('#sstat').className = 'badge big';
  busy = true; setStatus('Connecting…', true);
  try { const { reply } = await api({ mode: 'reply', messages: [] }); addMsg('ai', reply); setStatus('Speaking', true); await speak(reply) } catch (e) { addMsg('ai', 'Error: ' + e.message) }
  busy = false; setStatus('Listening', true); listen();
};
$('#end').onclick = async () => {
  if (!active) return; active = false; clearInterval(tmr); recog?.abort(); speechSynthesis.cancel(); orb(); setStatus('Summarising…');
  $('#end').disabled = true; $('#start').disabled = false;
  const blob = await new Promise(r => { if (!rec || rec.state === 'inactive') return r(null); rec.onstop = () => r(new Blob(chunks, { type: rec.mimeType })); rec.stop() });
  stream?.getTracks().forEach(t => t.stop());
  let s = { summary: 'No conversation.', requirements: [], objections: [], nextSteps: [], sentiment: 'Neutral', status: 'No Response' };
  if (msgs.some(m => m.role === 'me')) try { s = await api({ mode: 'summary', messages: msgs }) } catch (e) { s.summary = 'Summary failed: ' + e.message }
  const call = { id: startedAt, date: new Date(startedAt).toLocaleString(), duration: sec, lang: lang(), msgs: [...msgs], blob, ...s };
  await saveCall(call); setStatus('Ended'); showCall(call); refresh();
};
$('#mic').onclick = () => { muted = !muted; $('#mic').classList.toggle('off', muted); $('#mic small').textContent = muted ? 'Unmute' : 'Mute'; if (muted) recog?.abort(); else listen() };
$('#tf').onsubmit = e => { e.preventDefault(); const t = $('#ti').value.trim(); $('#ti').value = ''; if (t && active) handleUser(t) };
// ---- display ----
const li = a => a?.length ? `<ul>${a.map(x => `<li>${x}</li>`).join('')}</ul>` : '<span class="muted">None</span>';
const sumHTML = c => `<p>${c.summary}</p><p><b>Requirements</b>${li(c.requirements)}</p><p><b>Objections</b>${li(c.objections)}</p><p><b>Next steps</b>${li(c.nextSteps)}</p><p><b>Sentiment:</b> ${c.sentiment}</p>`;
function showCall(c) { $('#sum').innerHTML = sumHTML(c); $('#sstat').textContent = c.status; $('#sstat').className = 'badge big ' + cls(c.status); if (c.blob) { $('#player').src = URL.createObjectURL(c.blob) } }
async function refresh() {
  const cs = await allCalls();
  $('#hlist').innerHTML = cs.length ? cs.map(c => `<div class="hrow" data-id="${c.id}"><div><b>${c.date}</b><div class="muted">${fmt(c.duration)} • ${c.lang.startsWith('hi') ? 'Hindi' : 'English'} • ${c.summary.slice(0, 70)}…</div></div><span class="badge ${cls(c.status)}">${c.status}</span></div>`).join('') : '<p class="muted">No calls yet.</p>';
  const n = s => cs.filter(c => c.status === s).length, tot = cs.reduce((a, c) => a + c.duration, 0);
  const k = [['Total calls', cs.length], ['Converted', n('Converted')], ['Interested', n('Interested')], ['Demo requested', n('Demo Requested')], ['Follow-up', n('Follow-up Required')], ['Not interested', n('Not Interested')], ['No response', n('No Response')], ['Conversion', cs.length ? Math.round(n('Converted') / cs.length * 100) + '%' : '0%']];
  $('#stats').innerHTML = k.map(([a, b]) => `<div class="kpi"><b>${b}</b>${a}</div>`).join('');
  $('#pstats').innerHTML = [['Calls', cs.length], ['Talk time', fmt(tot)], ['Converted', n('Converted')]].map(([a, b]) => `<div class="kpi"><b>${b}</b>${a}</div>`).join('');
  window._cs = cs;
}
$('#hlist').onclick = e => { const r = e.target.closest('.hrow'); if (!r) return; const c = _cs.find(x => x.id == r.dataset.id), d = $('#hdet'); d.hidden = false;
  d.innerHTML = `<h3>${c.date} <span class="badge ${cls(c.status)}">${c.status}</span></h3>${c.blob ? `<audio controls src="${URL.createObjectURL(c.blob)}"></audio>` : '<p class="muted">No recording</p>'}<div class="muted" style="margin:12px 0">${sumHTML(c)}</div><h4>Transcript</h4><div class="tr">${c.msgs.map(m => `<p><b>${m.role === 'ai' ? 'Vexora' : 'Customer'}</b> [${m.t}]: ${m.text.replace(/</g, '&lt;')}</p>`).join('')}</div>`; d.scrollIntoView({ behavior: 'smooth' }) };
document.querySelectorAll('.nav[data-v]').forEach(b => b.onclick = () => { document.querySelectorAll('.nav').forEach(x => x.classList.remove('on')); b.classList.add('on'); document.querySelectorAll('.view').forEach(v => v.classList.remove('on')); $('#v-' + b.dataset.v).classList.add('on'); refresh() });
const openP = () => { refresh(); $('#prof').hidden = false }; $('#profBtn').onclick = $('#meBtn').onclick = openP; $('#px').onclick = () => $('#prof').hidden = true;
$('#clear').onclick = async () => { if (confirm('Delete all saved calls?')) { await clearCalls(); refresh() } };
if (!SR) $('#chat').insertAdjacentHTML('afterbegin', '<p class="hint">⚠️ Voice recognition needs Chrome/Edge. You can still type replies.</p>');
speechSynthesis.onvoiceschanged = () => { }; refresh();
