/* Golden Bell: deterministic elimination model + classroom stage controller.
   Camera frames stay in QuizScanner; this module receives stable, roster-filtered answers. */
(function (root) {
  'use strict';
  var CHOICES = ['A', 'B', 'C', 'D'];
  function createModel(students, order) {
    if (!Array.isArray(students) || !students.length || !Array.isArray(order) || !order.length) throw new Error('Cần học sinh và câu hỏi.');
    var ids = students.map(function (s) { return s.id; });
    if (new Set(ids).size !== ids.length) throw new Error('Mã thẻ học sinh bị trùng.');
    var state = { students: students.map(function (s) { return { id: s.id, name: String(s.name) }; }), order: order.slice(), alive: new Set(ids), round: 0, locked: false, history: [], outcome: null, lastDropped: [], lastCorrect: [] };
    state.submitCount = function (answers) { return ids.filter(function (id) { return state.alive.has(id) && answers[id] && CHOICES.indexOf(answers[id].choice) >= 0; }).length; };
    state.lock = function (answers, correct) {
      if (state.locked) return null;
      if (CHOICES.indexOf(correct) < 0) throw new Error('Đáp án phải là A, B, C hoặc D.');
      var before = Array.from(state.alive), kept = [], dropped = [];
      before.forEach(function (id) { if (answers[id] && answers[id].choice === correct) kept.push(id); else dropped.push(id); });
      state.history.push({ round: state.round, before: before, kept: kept, dropped: dropped, correct: correct });
      state.alive = new Set(kept); state.lastDropped = dropped; state.lastCorrect = kept; state.locked = true;
      state.outcome = kept.length === 0 ? 'empty' : kept.length === 1 ? 'winner' : state.round === state.order.length - 1 ? 'finalists' : 'continue';
      return { alive: kept.slice(), dropped: dropped.slice(), outcome: state.outcome };
    };
    state.next = function () {
      if (!state.locked || state.outcome !== 'continue') return false;
      state.round++; state.locked = false; state.outcome = null; state.lastCorrect = []; state.lastDropped = []; return true;
    };
    state.undo = function () {
      var last = state.history[state.history.length - 1];
      if (!state.locked || !last || last.round !== state.round) return false;
      state.history.pop(); state.alive = new Set(last.before); state.locked = false; state.outcome = null; state.lastCorrect = []; state.lastDropped = []; return true;
    };
    return state;
  }
  function bellSvg(id) {
    return '<svg viewBox="0 0 220 255" width="100%" height="100%" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><defs>' +
      '<linearGradient id="'+id+'" x1="0" y1="0" x2="1" y2=".15"><stop stop-color="#8e5015"/><stop offset=".17" stop-color="#e2ad40"/><stop offset=".38" stop-color="#fff0a6"/><stop offset=".52" stop-color="#e5b643"/><stop offset=".77" stop-color="#b57520"/><stop offset=".9" stop-color="#f7d46c"/><stop offset="1" stop-color="#9c6017"/></linearGradient>' +
      '<radialGradient id="'+id+'-rim"><stop stop-color="#5e3416"/><stop offset=".7" stop-color="#bc8530"/><stop offset="1" stop-color="#ffe89b"/></radialGradient></defs>' +
      '<path d="M110 1V32" stroke="#b39154" stroke-width="5"/><ellipse cx="110" cy="39" rx="15" ry="17" fill="none" stroke="#f7d273" stroke-width="7"/><path d="M94 53Q109 42 126 53L127 69H93Z" fill="url(#'+id+')"/>' +
      '<path d="M35 196C60 179 54 139 64 105C70 78 84 62 110 62C138 62 152 82 158 108C166 143 163 178 185 196L194 207Q110 240 26 207Z" fill="url(#'+id+')" stroke="#f0cb6c" stroke-width="1.5"/>' +
      '<path d="M80 99Q77 146 68 176" stroke="#fff4bd" stroke-width="7" fill="none" opacity=".43" stroke-linecap="round"/><path d="M145 107Q151 152 159 176" stroke="#925613" stroke-width="5" fill="none" opacity=".3"/>' +
      '<path d="M58 174Q110 195 169 174" stroke="#9f671e" stroke-width="3" fill="none"/><path d="M55 180Q110 199 172 180" stroke="#ffe6a0" stroke-width="2" fill="none"/>' +
      '<ellipse cx="110" cy="207" rx="84" ry="23" fill="url(#'+id+'-rim)" stroke="#f9d87d" stroke-width="4"/><path d="M110 204V227" stroke="#a4752c" stroke-width="7"/><circle cx="110" cy="233" r="12" fill="url(#'+id+')" stroke="#f0ca74"/>' +
      '<path d="M32 202Q109 222 188 202" stroke="#fff4c3" stroke-width="3" fill="none" opacity=".8"/></svg>';
  }
  function create(ui) {
    var $ = function (id) { return document.getElementById(id); };
    var state = { running: false, phase: 'idle', sound: true, visible: false, model: null };
    var duration = 20, remaining = 20, deadline = 0, timer = null, finishTimer = null, resizeFrame = null;
    var generation = 0, snapshot = null, audio = null, track = null, audioSerial = 0, audioActive = false, audioBlocked = false;
    var ringContext = null, ringTimer = null, particlesFrame = null, particles = [], lastBurst = 0, lastFrame = 0;
    var musicWarmups = [], resizeObserver = null, lastFocused = null, buttonText = {}, seats = new Map();
    var filenames = { input: 'input.mp3', countdown: 'countdown.mp3', last10: 'countdown time 10s.mp3', winner: 'winner.mp3' };
    var volume = { input: .28, countdown: .45, last10: .55, winner: .65 };
    document.querySelectorAll('[data-golden-bell]').forEach(function (node, i) { node.innerHTML = bellSvg('golden-metal-'+i); });
    ['revealAnsBtn', 'nextQBtn', 'resetAnsBtn'].forEach(function (id) { buttonText[id] = $(id).textContent; });
    function clearClock() { if (timer !== null) { clearInterval(timer); timer = null; } }
    function cancelFinish() { if (finishTimer !== null) { clearTimeout(finishTimer); finishTimer = null; } }
    function audioMessage(text) { $('bellAudioStatus').textContent = text; }
    function audioUrl(key) { return new URL('../../media-images/' + encodeURIComponent(filenames[key]), new URL('quiz-assets/golden-bell.js', document.baseURI)).href; }
    function warmMusic() {
      if (musicWarmups.length) return;
      Object.keys(filenames).forEach(function (key) { try { var preload = new Audio(); preload.preload = 'auto'; preload.src = audioUrl(key); if (typeof preload.load === 'function') preload.load(); musicWarmups.push(preload); } catch(e) {} });
    }
    function initAudio() {
      if (!audio) {
        audio = new Audio(); audio.preload = 'auto';
        audio.addEventListener('error', function () { audioMessage('Không tải được nhạc · kiểm tra kết nối'); });
      }
    }
    function pauseAudio() { audioActive = false; audioSerial++; if (audio) audio.pause(); }
    function playTrack(key, restart, seconds) {
      if (!state.sound || !state.visible || !state.running) return;
      try {
        initAudio(); var changed = track !== key;
        if (changed) { audio.pause(); audio.src = audioUrl(key); track = key; }
        audio.loop = key !== 'last10'; audio.volume = volume[key];
        if (restart || changed) {
          var seek = function () { try { audio.currentTime = key === 'last10' && Number.isFinite(audio.duration) && Number.isFinite(seconds) ? Math.max(0, audio.duration - seconds) : 0; } catch(e) {} };
          if (audio.readyState >= 1) seek(); else audio.onloadedmetadata = seek;
        }
        var serial = ++audioSerial; audioActive = true;
        var promise = audio.play();
        if (promise && promise.then) promise.then(function () { if (serial === audioSerial) { audioBlocked = false; audioMessage('♫ '+(key === 'winner' ? 'Nhạc chiến thắng' : key === 'last10' ? '10 giây cuối' : key === 'countdown' ? 'Đang đếm giờ' : 'Nhạc nền')); } }).catch(function (error) { if (serial === audioSerial && error.name !== 'AbortError') { audioActive = false; audioBlocked = true; audioMessage('Bấm nút Nhạc để cho phép phát âm thanh'); } });
      } catch(e) { audioMessage('Âm thanh chưa khả dụng · game vẫn tiếp tục'); }
    }
    function desiredTrack() { if (state.phase === 'victory') return 'winner'; if (state.phase === 'thinking') return remaining <= 10 ? 'last10' : 'countdown'; return 'input'; }
    function syncMusic() { if (state.phase === 'paused') { pauseAudio(); return; } playTrack(desiredTrack(), false, remaining); }
    function ring() {
      if (!state.sound || !state.visible || state.phase !== 'victory') return;
      try {
        if (!ringContext) ringContext = new (window.AudioContext || window.webkitAudioContext)();
        ringContext.resume(); var time = ringContext.currentTime;
        [523.25, 1046.5, 1407.5, 1872.8].forEach(function (frequency, i) { var oscillator = ringContext.createOscillator(), gain = ringContext.createGain(); oscillator.type = 'sine'; oscillator.frequency.value = frequency; gain.gain.setValueAtTime(.001, time); gain.gain.linearRampToValueAtTime(.12 / (i + 1), time + .012); gain.gain.exponentialRampToValueAtTime(.001, time + 1.15); oscillator.connect(gain); gain.connect(ringContext.destination); oscillator.start(time); oscillator.stop(time + 1.2); });
      } catch(e) { /* Uploaded victory music remains available without Web Audio. */ }
    }
    function stopRinging() { if (ringTimer !== null) { clearInterval(ringTimer); ringTimer = null; } if (ringContext && ringContext.state === 'running') ringContext.suspend().catch(function () {}); }
    function startRinging() { stopRinging(); if (state.sound) { ring(); ringTimer = setInterval(ring, 1250); } }
    function toggleSound() {
      if (state.sound && audioBlocked && state.running) { syncMusic(); if (state.phase === 'victory') startRinging(); return; }
      state.sound = !state.sound; $('bellSound').textContent = state.sound ? '♫ Nhạc: Bật' : '♫ Nhạc: Tắt'; $('bellSound').setAttribute('aria-pressed', String(state.sound)); $('bellWinSound').textContent = state.sound ? '♫ Tắt nhạc' : '♫ Bật nhạc';
      if (state.sound) { syncMusic(); if (state.phase === 'victory') startRinging(); } else { pauseAudio(); stopRinging(); audioMessage('Âm thanh đang tắt'); }
    }
    function stopConfetti() { if (particlesFrame !== null) { cancelAnimationFrame(particlesFrame); particlesFrame = null; } particles = []; var c = $('bellConfetti'), ctx = c.getContext('2d'); if (ctx) ctx.clearRect(0, 0, c.width, c.height); }
    function startConfetti() {
      stopConfetti(); if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      var canvas = $('bellConfetti'), ctx = canvas.getContext('2d'); if (!ctx) return;
      var palette = ['#ffe19a','#f4bd52','#fff7d0','#98b7ff','#e691db','#70e7cf'];
      lastBurst = -2000; lastFrame = 0;
      function frame(time) {
        if (state.phase !== 'victory' || !state.visible) { particlesFrame = null; return; }
        var rect = canvas.getBoundingClientRect(), w = rect.width, h = rect.height, ratio = Math.min(window.devicePixelRatio || 1, 2);
        if (canvas.width !== Math.round(w * ratio) || canvas.height !== Math.round(h * ratio)) { canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio); }
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, w, h);
        var dt = Math.min((time - (lastFrame || time)) / 16.67, 2); lastFrame = time;
        if (time - lastBurst > 1050) {
          lastBurst = time; var count = particles.length < 140 ? 130 : 50;
          for (var i = 0; i < count && particles.length < 320; i++) { var side = i % 2; particles.push({ x: side ? w - 10 : 10, y: h * .72, vx: (side ? -1 : 1) * (3 + Math.random() * 8), vy: -8 - Math.random() * 11, spin: Math.random() * 6, speed: Math.random() * .15 - .075, color: palette[i % palette.length], size: 4 + Math.random() * 5 }); }
        }
        particles = particles.filter(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += .14 * dt; p.vx *= Math.pow(.993, dt); p.spin += p.speed * dt; if (p.y > h + 30 || p.x < -80 || p.x > w + 80) return false; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.spin); ctx.fillStyle = p.color; ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size * .6); ctx.restore(); return true; });
        particlesFrame = requestAnimationFrame(frame);
      }
      particlesFrame = requestAnimationFrame(frame);
    }
    function setMessage(text) { $('bellMessage').textContent = text; }
    function clockLabel() { $('bellTimer').textContent = state.phase === 'paused' ? 'Ⅱ' : state.phase === 'scanning' ? '✓' : state.phase === 'reveal' || state.phase === 'empty' || state.phase === 'victory' ? '—' : Math.ceil(remaining); $('bellTimer').classList.toggle('urgent', state.phase === 'thinking' && remaining <= 10); }
    function controls() {
      var phase = state.phase, active = state.running, locked = active && state.model.locked;
      $('bellOpenSetup').disabled = active; $('bellStop').hidden = !active;
      $('bellTimerStart').disabled = !active || phase !== 'ready'; $('bellTimerStart').textContent = '▶ Bắt đầu ' + duration + 's';
      $('bellPause').disabled = !active || (phase !== 'thinking' && phase !== 'paused'); $('bellPause').textContent = phase === 'paused' ? '▶' : 'Ⅱ'; $('bellPause').setAttribute('aria-label', phase === 'paused' ? 'Tiếp tục thời gian' : 'Tạm dừng thời gian');
      $('bellUndo').disabled = !locked; $('bellWinUndo').disabled = !locked;
      $('revealAnsBtn').disabled = !active || ['thinking','scanning'].indexOf(phase) < 0; $('revealAnsBtn').textContent = locked ? '✓ Đã chốt' : '✓ Chốt & loại';
      $('nextQBtn').disabled = !active || !locked || state.model.outcome !== 'continue'; $('nextQBtn').textContent = 'Câu tiếp →';
      $('resetAnsBtn').disabled = !active || locked; $('resetAnsBtn').textContent = '↻ Quét lại';
      $('bellRoundBadge').textContent = active ? 'CÂU '+(state.model.round+1)+' / '+state.model.order.length : 'SẴN SÀNG';
      clockLabel();
    }
    function pool() { return state.model ? state.model.students : ui.students(); }
    function aliveHas(id) { return !state.model || state.model.alive.has(id); }
    function buildSeats() {
      var floor = $('bellFloor'); floor.replaceChildren(); seats.clear();
      pool().forEach(function (s) { var node = document.createElement('div'); node.className = 'bell-seat'; node.title = '#'+s.id+' · '+s.name; node.setAttribute('aria-label', node.title); var number = document.createElement('strong'); number.className = 'bell-seat-number'; number.textContent = String(s.id).padStart(2, '0'); var name = document.createElement('span'); name.className = 'bell-seat-name'; name.textContent = s.name; node.append(number, name); floor.appendChild(node); seats.set(s.id, node); });
      fitFloor();
    }
    function fitFloor() {
      var floor = $('bellFloor'), count = pool().length, w = floor.clientWidth || 700, h = floor.clientHeight || 210;
      var bestCols = Math.min(count, 10), bestScore = Infinity;
      for (var cols = 4; cols <= Math.min(12, Math.max(count,4)); cols++) { var rows = Math.ceil(count / cols), cellW = w / cols, cellH = h / rows, score = Math.abs(Math.log(Math.max(.01, cellW / Math.max(1,cellH) / 2))) + (rows * cols - count) / Math.max(1,count) * .12; if (score < bestScore) { bestScore = score; bestCols = cols; } }
      floor.style.setProperty('--bell-cols', Math.max(1, Math.min(count, bestCols))); floor.style.setProperty('--bell-rows', Math.max(1, Math.ceil(count / Math.max(1,bestCols))));
    }
    function updateBoard() {
      var answers = ui.answers(), model = state.model, people = pool(), alive = model ? model.alive.size : people.length, submitted = model ? model.submitCount(answers) : 0;
      $('bellAlive').textContent = alive; $('bellSubmitted').textContent = submitted; $('bellOut').textContent = people.length - alive; $('bellFloorCount').textContent = alive+' / '+people.length+' thí sinh';
      seats.forEach(function (node, id) { var out = !aliveHas(id); node.classList.toggle('out', out); node.classList.toggle('scanned', !out && Boolean(answers[id]) && !(model && model.locked)); node.classList.toggle('correct', Boolean(model && model.locked && model.lastCorrect.indexOf(id) >= 0)); var roster = $('rosterPill-'+id); if (roster) roster.classList.toggle('bell-eliminated', out); });
      if (model) $('answeredRatio').textContent = submitted+' / '+alive+' em còn thi';
    }
    function fitText() {
      if (!state.visible) return;
      var text = $('qText'), box = text.parentElement; text.style.fontSize = ''; var size = parseFloat(getComputedStyle(text).fontSize);
      while (size > 11 && (text.scrollHeight > box.clientHeight - 14 || text.scrollWidth > box.clientWidth - 20)) { size -= 1; text.style.fontSize = size+'px'; }
      ['A','B','C','D'].forEach(function (letter) { var node = $('optText'+letter); node.style.fontSize = ''; var n = parseFloat(getComputedStyle(node).fontSize); while (n > 9 && (node.scrollHeight > node.parentElement.clientHeight - 10 || node.scrollWidth > node.clientWidth+1)) { n -= .5; node.style.fontSize = n+'px'; } });
    }
    function fit() {
      if (!state.visible) return;
      var tab = $('tab-bell'), full = document.fullscreenElement === tab, rect = tab.getBoundingClientRect();
      if (!full) tab.style.setProperty('--bell-height', Math.max(440, window.innerHeight - rect.top - 10)+'px');
      fitFloor(); fitText();
    }
    function queueFit() { if (resizeFrame !== null) cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(function () { resizeFrame = null; fit(); }); }
    function openSetup() {
      if (state.running) return;
      var questions = ui.manager().questions;
      $('bellBankInfo').textContent = ui.students().length+' thí sinh · '+questions.length+' câu hỏi MCQ trong tab Quản Lý Đề.';
      $('bellQuestionCount').max = Math.max(1, questions.length); $('bellQuestionCount').value = Math.min(Number($('bellQuestionCount').value)||5, Math.max(1,questions.length)); $('bellSettingsHint').textContent = '';
      if (!$('bellSetup').open) $('bellSetup').showModal();
    }
    function resetRound() {
      var manager = ui.manager(); manager.currentIndex = state.model.order[state.model.round]; manager.isAnswerRevealed = false; ui.resetAnswers(); ui.renderQuestion();
      state.phase = 'ready'; remaining = duration; setMessage('Sẵn sàng câu '+(state.model.round+1)+'. Bấm Bắt đầu để tính giờ suy nghĩ.');
      controls(); updateBoard(); syncMusic(); queueFit();
    }
    function start() {
      if (state.running) return;
      var manager = ui.manager(), n = Number($('bellQuestionCount').value), seconds = Number($('bellDuration').value), people = ui.students();
      function invalid(text) { $('bellSettingsHint').textContent = text; }
      if (ui.otherGameRunning()) { invalid('Hãy kết thúc game theo đội trước.'); return; }
      if (!people.length || people.length > 60 || people.some(function (s) { return !Number.isInteger(s.id) || s.id < 1 || s.id > 60; }) || new Set(people.map(function(s){return s.id;})).size !== people.length) { invalid('Danh sách cần 1–60 học sinh với mã thẻ 1–60 không trùng nhau.'); return; }
      if (!Number.isInteger(n) || n < 1 || n > manager.questions.length) { invalid('Chọn từ 1 đến '+manager.questions.length+' câu hỏi.'); return; }
      if (!Number.isInteger(seconds) || seconds < 5 || seconds > 300) { invalid('Thời gian cần là số nguyên từ 5 đến 300 giây.'); return; }
      var order = manager.questions.map(function (_, i) { return i; });
      if ($('bellOrder').value === 'shuffle') for (var j = order.length - 1; j > 0; j--) { var k = Math.floor(Math.random()*(j+1)), temp = order[j]; order[j] = order[k]; order[k] = temp; }
      order = order.slice(0,n);
      if (order.some(function (i) { var q = manager.questions[i]; return !q || !q.text || !q.options || !CHOICES.every(function(c){return typeof q.options[c] === 'string' && q.options[c].trim();}) || CHOICES.indexOf(q.correct) < 0; })) { invalid('Mỗi câu cần đủ A/B/C/D, nội dung câu hỏi và đáp án hợp lệ.'); return; }
      snapshot = { index: manager.currentIndex, revealed: manager.isAnswerRevealed, answers: Object.assign({}, ui.answers()) };
      duration = seconds; state.model = createModel(people, order); state.running = true; generation++; state.phase = 'ready'; $('bellSetup').close(); $('bellWin').hidden = true;
      // This call is in the Start button gesture, so browsers can unlock the supplied MP3s.
      if (state.sound) { initAudio(); playTrack('input', true); }
      $('tab-bell').classList.add('bell-running'); buildSeats(); resetRound();
      if ($('bellAutoFullscreen').checked && !document.fullscreenElement) fullscreen();
      try { localStorage.setItem('qr_golden_bell_settings', JSON.stringify({ duration: seconds, count: n, order: $('bellOrder').value })); } catch(e) {}
    }
    function tick() {
      if (state.phase !== 'thinking') return;
      remaining = Math.max(0, (deadline - performance.now())/1000); clockLabel();
      if (remaining <= 0) { clearClock(); state.phase = 'scanning'; setMessage('HẾT GIỜ SUY NGHĨ · Giơ thẻ để quét. Kiểm tra số đã nhận rồi bấm Chốt & loại.'); syncMusic(); controls(); return; }
      var wanted = remaining <= 10 ? 'last10' : 'countdown'; if (track !== wanted) playTrack(wanted, true, remaining);
    }
    function startTimer() {
      if (!state.running || state.phase !== 'ready') return;
      state.phase = 'thinking'; remaining = duration; deadline = performance.now()+duration*1000; clearClock();
      setMessage('Đang suy nghĩ · Học sinh chọn đáp án và giơ thẻ. Camera tiếp nhận thẻ còn trên sàn.'); controls(); playTrack(duration<=10?'last10':'countdown', true, remaining); timer = setInterval(tick, 100);
    }
    function pause() {
      if (state.phase === 'thinking') { remaining = Math.max(0,(deadline-performance.now())/1000); state.phase = 'paused'; clearClock(); pauseAudio(); setMessage('Đã tạm dừng thời gian và nhận thẻ. Bấm ▶ để tiếp tục.'); }
      else if (state.phase === 'paused') { state.phase = 'thinking'; deadline = performance.now()+remaining*1000; clearClock(); timer = setInterval(tick,100); syncMusic(); setMessage('Tiếp tục suy nghĩ và quét thẻ.'); }
      controls();
    }
    function lock() {
      if (!state.running || ['thinking','scanning'].indexOf(state.phase) < 0) return;
      var model = state.model, answers = ui.answers(), missing = model.alive.size-model.submitCount(answers);
      if (missing > 0 && !window.confirm('Còn '+missing+' thí sinh chưa được quét. Nếu chốt, các em này sẽ rời sàn. Chốt đáp án ngay?')) return;
      clearClock(); var q = ui.manager().getCurrentQuestion(), result = model.lock(answers,q.correct); if (!result) return;
      ui.manager().isAnswerRevealed = true; state.phase = result.outcome === 'empty' ? 'empty' : 'reveal'; ui.renderQuestion();
      setMessage(result.outcome === 'empty' ? 'Không còn thí sinh trên sàn. Bấm Hoàn tác để khôi phục và quét lại vòng này.' : 'Đáp án '+q.correct+' · '+result.alive.length+' em ở lại · '+result.dropped.length+' em rời sàn.');
      controls(); updateBoard(); syncMusic(); queueFit();
      if (result.outcome === 'winner' || result.outcome === 'finalists') { var token = ++generation; finishTimer = setTimeout(function () { finishTimer = null; if (state.running && token === generation && model.locked) victory(); },1300); }
    }
    function victory() {
      if (!state.running || !state.model.alive.size) return;
      state.phase = 'victory'; var winners = state.model.students.filter(function(s){return state.model.alive.has(s.id);});
      lastFocused = document.activeElement; $('bellWin').hidden = false; $('bellWin').classList.toggle('multiple',winners.length>1); $('bellWin').classList.toggle('many',winners.length>6);
      $('bellWinTitle').textContent = winners.length===1 ? 'NGƯỜI CHIẾN THẮNG' : 'ĐỒNG CHIẾN THẮNG'; $('bellWinnerNames').replaceChildren();
      $('bellWinnerNames').style.setProperty('--winner-cols', winners.length>30?6:winners.length>12?4:3);
      winners.forEach(function(s){var name=document.createElement('div');name.className='bell-winner-name';name.textContent=s.name;name.title='#'+s.id+' · '+s.name;$('bellWinnerNames').appendChild(name);});
      $('bellWinDetail').textContent = (winners.length===1 ? 'Thẻ #'+winners[0].id+' · ' : winners.length+' thí sinh · ')+'Chinh phục '+state.model.history.length+' câu hỏi trên hành trình tri thức.';
      playTrack('winner',true); startRinging(); startConfetti(); controls(); $('bellPlayAgain').focus();
    }
    function undo() {
      if (!state.running || !state.model.locked) return;
      if (!window.confirm('Hoàn tác kết quả câu vừa chốt, khôi phục thí sinh và quét lại câu này?')) return;
      generation++; cancelFinish(); stopConfetti(); stopRinging(); $('bellWin').hidden = true;
      if (!state.model.undo()) return;
      ui.manager().isAnswerRevealed = false; state.phase = 'scanning'; remaining = 0; ui.resetAnswers(); ui.renderQuestion();
      setMessage('Đã khôi phục thí sinh của vòng này. Giơ thẻ để quét lại rồi Chốt & loại.'); controls(); updateBoard(); syncMusic(); queueFit(); if(lastFocused&&lastFocused.isConnected)lastFocused.focus();
    }
    function next() {
      if (!state.running || !state.model.next()) { ui.toast('Hãy chốt câu hiện tại trước.'); return; }
      generation++; cancelFinish(); resetRound();
    }
    function resetScan() {
      if (!state.running || state.model.locked) { ui.toast('Câu đã chốt. Dùng Hoàn tác để khôi phục vòng.'); return; }
      ui.resetAnswers(); updateBoard(); ui.toast('Đã xóa các thẻ đã nhận của câu hiện tại.');
    }
    function restoreUI() {
      ['revealAnsBtn','nextQBtn','resetAnsBtn'].forEach(function(id){$(id).disabled=false;$(id).textContent=buttonText[id];});
      document.querySelectorAll('.bell-eliminated').forEach(function(node){node.classList.remove('bell-eliminated');});
      $('qText').style.fontSize=''; CHOICES.forEach(function(c){$('optText'+c).style.fontSize='';});
    }
    function stop(ask) {
      if (!state.running) return;
      if (ask && !window.confirm('Kết thúc cuộc thi Rung Chuông Vàng hiện tại?')) return;
      generation++; clearClock(); cancelFinish(); pauseAudio(); stopRinging(); stopConfetti(); state.running=false;state.phase='idle';state.model=null;
      $('bellWin').hidden=true;$('tab-bell').classList.remove('bell-running');$('bellStop').hidden=true;
      if(snapshot){ui.manager().currentIndex=snapshot.index;ui.manager().isAnswerRevealed=snapshot.revealed;ui.restoreAnswers(snapshot.answers);snapshot=null;}
      restoreUI();ui.renderQuestion();ui.updateStats();buildSeats();updateBoard();controls();setMessage('Cuộc thi đã kết thúc. Mở Thiết lập để bắt đầu lượt mới.');
    }
    function fullscreen() {
      var tab=$('tab-bell');
      try { var promise=document.fullscreenElement===tab?document.exitFullscreen():tab.requestFullscreen(); if(promise&&promise.catch)promise.catch(function(){ui.toast('Có thể dùng phím F11 nếu trình duyệt chặn toàn màn hình.');}); } catch(e){ui.toast('Trình duyệt chưa hỗ trợ toàn màn hình. Thầy có thể dùng F11.');}
    }
    state.onTab=function(tab){
      state.visible=tab==='bell';
      if(state.visible){
        warmMusic();
        $('bellQuizSlot').appendChild(document.querySelector('.live-quiz-grid'));
        document.querySelector('.question-card').insertBefore($('bellStage'),$('explanationBox'));
        var scanner=document.querySelector('.scanner-container');scanner.insertBefore($('bellScanHud'),scanner.firstChild);
        document.querySelector('.quiz-action-bar').prepend($('bellTimerControls'));
        ['bellStage','bellScanHud','bellTimerControls'].forEach(function(id){$(id).hidden=false;});
        if(!state.running){buildSeats();controls();updateBoard();}queueFit();if(!state.running)openSetup();
      }else{
        ['bellStage','bellScanHud','bellTimerControls'].forEach(function(id){$(id).hidden=true;$('bellParking').appendChild($(id));});
        restoreUI(); if(!state.running){var manager=ui.manager();ui.renderQuestion();ui.updateStats();}
      }
    };
    state.accepting=function(){return !state.running || (state.visible && ['thinking','scanning'].indexOf(state.phase)>=0);};
    state.canRecord=function(id){return !state.running || (state.visible && ['thinking','scanning'].indexOf(state.phase)>=0 && state.model.alive.has(id));};
    state.onAnswers=function(){if(state.visible)updateBoard();};
    state.badge=function(){return state.running?'CÂU '+(state.model.round+1)+' / '+state.model.order.length:null;};
    state.lock=lock;state.next=next;state.resetScan=resetScan;state.stop=stop;
    $('bellOpenSetup').addEventListener('click',openSetup);$('bellCloseSetup').addEventListener('click',function(){$('bellSetup').close();});$('bellStart').addEventListener('click',start);$('bellTimerStart').addEventListener('click',startTimer);$('bellPause').addEventListener('click',pause);$('bellUndo').addEventListener('click',undo);$('bellWinUndo').addEventListener('click',undo);$('bellSound').addEventListener('click',toggleSound);$('bellWinSound').addEventListener('click',toggleSound);$('bellFullscreen').addEventListener('click',fullscreen);$('bellStop').addEventListener('click',function(){stop(true);});$('bellPlayAgain').addEventListener('click',function(){stop(false);openSetup();});
    $('bellWin').addEventListener('keydown',function(event){if(event.key==='Escape'){event.preventDefault();return;}if(event.key!=='Tab')return;var buttons=[$('bellWinSound'),$('bellWinUndo'),$('bellPlayAgain')];var first=buttons[0],last=buttons[buttons.length-1];if(event.shiftKey&&document.activeElement===first){last.focus();event.preventDefault();}else if(!event.shiftKey&&document.activeElement===last){first.focus();event.preventDefault();}});
    document.addEventListener('fullscreenchange',function(){$('tab-bell').classList.toggle('bell-immersive',document.fullscreenElement===$('tab-bell'));queueFit();});
    document.addEventListener('visibilitychange',function(){if(document.hidden){if(state.phase==='thinking')pause();pauseAudio();stopRinging();}else if(state.visible&&state.running){syncMusic();if(state.phase==='victory')startRinging();}});
    window.addEventListener('resize',queueFit);window.addEventListener('pagehide',function(){generation++;clearClock();cancelFinish();pauseAudio();stopRinging();stopConfetti();});
    if(typeof ResizeObserver!=='undefined'){resizeObserver=new ResizeObserver(queueFit);resizeObserver.observe($('bellQuizSlot'));}
    try{var saved=JSON.parse(localStorage.getItem('qr_golden_bell_settings'));if(saved){if(Number.isInteger(saved.duration)&&saved.duration>=5&&saved.duration<=300)$('bellDuration').value=saved.duration;if(Number.isInteger(saved.count)&&saved.count>0)$('bellQuestionCount').value=saved.count;$('bellOrder').value=saved.order==='shuffle'?'shuffle':'original';}}catch(e){}
    return state;
  }
  var api={createModel:createModel,create:create};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GoldenBell=api;
})(typeof window!=='undefined'?window:globalThis);
