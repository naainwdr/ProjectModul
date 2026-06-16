// ═══════════════════════════════════════════════════════
//  PETUALANGAN PUISI NUSANTARA — app.js
//  Semua interaktivitas SPA tersimpan di sini
// ═══════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
//  LOAD EMBEDDED DATA
// ═══════════════════════════════════════════════════════
function loadData() {
  try {
    const poetsEl = document.getElementById('data-poets');
    const poemsEl = document.getElementById('data-poems');
    const quizEl = document.getElementById('data-quiz');
    return {
      poetsData: poetsEl ? JSON.parse(poetsEl.textContent) : { poets: [] },
      poemsData: poemsEl ? JSON.parse(poemsEl.textContent) : { poems: [] },
      quizData: quizEl ? JSON.parse(quizEl.textContent) : { quiz: { questions: [] } },
    };
  } catch(e) {
    console.error('Data load error:', e);
    return { poetsData: { poets: [] }, poemsData: { poems: [] }, quizData: { quiz: { questions: [] } } };
  }
}

// ═══════════════════════════════════════════════════════
//  STATE MANAGEMENT — LocalStorage
// ═══════════════════════════════════════════════════════
const STORAGE_KEY = 'puisi_petualangan_v1';

function getProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { completedMissions: [], poem: '', poemTitle: '', poemAuthor: '', quizScore: null };
    return JSON.parse(raw);
  } catch { return { completedMissions: [], poem: '', poemTitle: '', poemAuthor: '', quizScore: null }; }
}

function saveProgress(updates) {
  const current = getProgress();
  const merged = Object.assign({}, current, updates, { lastVisit: Date.now() });
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)); } catch(e) {}
}

function completeMission(num) {
  const p = getProgress();
  if (!p.completedMissions.includes(num)) {
    p.completedMissions.push(num);
    saveProgress({ completedMissions: p.completedMissions });
  }
}

function isMissionCompleted(num) {
  return getProgress().completedMissions.includes(num);
}

// ═══════════════════════════════════════════════════════
//  SECTION ROUTING — SPA Navigation
// ═══════════════════════════════════════════════════════
let currentSection = 'splash';

function showSection(sectionId) {
  document.querySelectorAll('section[id^="section-"]').forEach(function(s) {
    s.classList.add('hidden');
    s.classList.remove('block');
    s.classList.remove('animate-page-flip');
  });
  
  const target = document.getElementById('section-' + sectionId);
  if (!target) { console.warn('Section not found:', sectionId); return; }
  target.classList.remove('hidden');
  
  // Page flip effect
  setTimeout(function() {
    target.classList.add('animate-page-flip');
  }, 10);
  
  currentSection = sectionId;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  setTimeout(function() {
    target.querySelectorAll('.reveal').forEach(function(el, i) {
      setTimeout(function() { el.classList.add('visible'); }, i * 80);
    });
  }, 100);
  
  updateNavbar(sectionId);
  closeSidebar();
}

function updateNavbar(sectionId) {
  const navProgress = document.getElementById('nav-progress');
  if (sectionId === 'splash') {
    if (navProgress) navProgress.classList.add('hidden');
  } else {
    if (navProgress) navProgress.classList.remove('hidden');
    updateProgressUI();
  }
}

// ═══════════════════════════════════════════════════════
//  PROGRESS UI
// ═══════════════════════════════════════════════════════
function updateProgressUI() {
  const completed = getProgress().completedMissions.filter(function(n) { return n >= 1 && n <= 5; }).length;
  const pct = (completed / 5) * 100;
  
  const navBar = document.getElementById('nav-progress-bar');
  const navLabel = document.getElementById('nav-progress-label');
  if (navBar) navBar.style.width = pct + '%';
  if (navLabel) navLabel.textContent = 'Misi ' + completed + '/5';
  
  const overallBar = document.getElementById('overall-progress-bar');
  const overallText = document.getElementById('overall-progress-text');
  if (overallBar) overallBar.style.width = pct + '%';
  if (overallText) overallText.textContent = completed + ' / 5 Misi Selesai';
  
  updateMissionCards();
}

function updateMissionCards() {
  const missionDeps = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5 };
  
  for (let num = 1; num <= 6; num++) {
    const card = document.getElementById('mission-card-' + num);
    if (!card) continue;
    
    const requiredDone = missionDeps[num];
    const all5 = getProgress().completedMissions.filter(function(n) { return n >= 1 && n <= 5; }).length === 5;
    const isCompleted = num <= 5 ? isMissionCompleted(num) : all5;
    const isLocked = !isCompleted && !isMissionCompleted(requiredDone) && requiredDone > 0;
    
    const lockOverlay = card.querySelector('.mission-lock-overlay');
    const doneBadge = card.querySelector('.mission-done-badge');
    
    if (isLocked) {
      if (lockOverlay) { lockOverlay.classList.remove('hidden'); lockOverlay.classList.add('flex'); }
      card.style.pointerEvents = 'none';
    } else {
      if (lockOverlay) { lockOverlay.classList.add('hidden'); lockOverlay.classList.remove('flex'); }
      card.style.pointerEvents = '';
    }
    
    if (isCompleted) {
      if (doneBadge) doneBadge.classList.remove('hidden');
    } else {
      if (doneBadge) doneBadge.classList.add('hidden');
    }
  }
}

// ═══════════════════════════════════════════════════════
//  SIDEBAR MENU
// ═══════════════════════════════════════════════════════
function openSidebar() {
  const sidebar = document.getElementById('menu-sidebar');
  const overlay = document.getElementById('nav-overlay');
  if (sidebar) sidebar.classList.add('open');
  if (overlay) overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeSidebar() {
  const sidebar = document.getElementById('menu-sidebar');
  const overlay = document.getElementById('nav-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// ═══════════════════════════════════════════════════════
//  MODAL HANDLERS
// ═══════════════════════════════════════════════════════
function openModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.remove('open'); document.body.style.overflow = ''; }
}
window.closeModal = closeModal;

function openPoetModal(poetId) {
  const data = loadData();
  const poet = data.poetsData.poets.find(function(p) { return p.id === poetId; });
  if (!poet) return;
  
  const container = document.getElementById('poet-modal-content');
  if (!container) return;
  
  const booksHTML = poet.books.map(function(book) {
    const poemsHTML = book.notable_poems.map(function(p) {
      return '<span class="px-2 py-0.5 rounded-full text-xs" style="background: ' + poet.accent + '15; color: ' + poet.accent + '; border: 1px solid ' + poet.accent + '30">' + p + '</span>';
    }).join('');
    return '<div class="glass-dark rounded-xl p-4">' +
      '<div class="flex items-start justify-between gap-2 mb-2">' +
        '<p class="font-serif font-bold text-cream-100 text-sm leading-tight">' + book.title + '</p>' +
        '<span class="shrink-0 text-xs text-cream-100/30 font-mono">' + book.year + '</span>' +
      '</div>' +
      '<p class="text-xs text-cream-100/50 leading-relaxed mb-2">' + book.description + '</p>' +
      '<div class="flex flex-wrap gap-1.5">' + poemsHTML + '</div>' +
    '</div>';
  }).join('');
  
  container.innerHTML =
    '<div class="flex items-start justify-between mb-6">' +
      '<div class="flex items-center gap-4">' +
        '<div class="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl font-serif font-bold text-cream-100" style="background: ' + poet.accent + '20; border: 2px solid ' + poet.accent + '40">' + poet.name.charAt(0) + '</div>' +
        '<div>' +
          '<h2 class="font-serif font-bold text-xl text-cream-100">' + poet.name + '</h2>' +
          '<p class="text-sm mt-0.5" style="color: ' + poet.accent + '">' + poet.era + '</p>' +
          '<p class="text-xs text-cream-100/40">' + poet.origin + ' · ' + poet.born + '–' + poet.died + '</p>' +
        '</div>' +
      '</div>' +
      '<button onclick="closeModal(\'poet-modal\')" class="p-2 rounded-lg hover:bg-navy-800 transition-colors ml-2 shrink-0">' +
        '<svg class="w-5 h-5 text-cream-100/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>' +
      '</button>' +
    '</div>' +
    '<div class="glass rounded-xl p-4 mb-4">' +
      '<p class="font-serif italic text-gold-300 text-base">' + poet.tagline + '</p>' +
    '</div>' +
    '<p class="text-cream-100/70 text-sm leading-relaxed mb-5">' + poet.bio + '</p>' +
    '<div><h3 class="font-semibold text-sm text-cream-100/80 mb-3">📚 Karya Utama</h3>' +
    '<div class="space-y-3">' + booksHTML + '</div></div>';
  
  openModal('poet-modal');
}
window.openPoetModal = openPoetModal;

// ═══════════════════════════════════════════════════════
//  MISI 3 — POEM ANALYSIS INTERACTIVITY
// ═══════════════════════════════════════════════════════
function initPoemAnalysis() {
  const data = loadData();
  const poems = data.poemsData.poems;
  
  document.querySelectorAll('.poem-tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const poemId = btn.getAttribute('data-poem-id');
      
      document.querySelectorAll('.poem-tab-btn').forEach(function(t) {
        t.className = 'poem-tab-btn shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all border glass border-navy-700 text-cream-100/60 hover:text-gold-400 hover:border-gold-500/30';
      });
      btn.className = 'poem-tab-btn shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all border bg-gold-500/20 border-gold-500/50 text-gold-300';
      
      document.querySelectorAll('.poem-display').forEach(function(d) { d.classList.add('hidden'); });
      const poemDisplay = document.getElementById('poem-display-' + poemId);
      if (poemDisplay) poemDisplay.classList.remove('hidden');
      
      resetAnalysisPanel();
      
      const poem = poems.find(function(p) { return p.id === poemId; });
      if (poem) {
        const temaEl = document.getElementById('poem-meta-tema');
        const amanatEl = document.getElementById('poem-meta-amanat');
        if (temaEl) temaEl.textContent = poem.tema;
        if (amanatEl) amanatEl.textContent = poem.amanat;
      }
    });
  });
  
  if (poems[0]) {
    const temaEl = document.getElementById('poem-meta-tema');
    const amanatEl = document.getElementById('poem-meta-amanat');
    if (temaEl) temaEl.textContent = poems[0].tema;
    if (amanatEl) amanatEl.textContent = poems[0].amanat;
  }
  
  document.querySelectorAll('.word-analyzable').forEach(function(el) {
    el.addEventListener('click', function() {
      document.querySelectorAll('.word-analyzable').forEach(function(w) { w.classList.remove('active'); });
      el.classList.add('active');
      
      try {
        const analysisData = JSON.parse(el.getAttribute('data-analysis'));
        const wordText = el.getAttribute('data-word');
        showAnalysis(wordText, analysisData);
      } catch(e) {
        console.warn('Analysis parse error', e);
      }
    });
  });
  
  const clearBtn = document.getElementById('btn-clear-analysis');
  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      document.querySelectorAll('.word-analyzable').forEach(function(w) { w.classList.remove('active'); });
      resetAnalysisPanel();
    });
  }
}

function showAnalysis(word, data) {
  const defaultPanel = document.getElementById('analysis-default');
  const activePanel = document.getElementById('analysis-active');
  if (defaultPanel) defaultPanel.classList.add('hidden');
  if (activePanel) activePanel.classList.remove('hidden');
  
  const wordText = document.getElementById('analysis-word-text');
  const labelEl = document.getElementById('analysis-label');
  const jenisEl = document.getElementById('analysis-jenis');
  const maknaEl = document.getElementById('analysis-makna');
  const unsurEl = document.getElementById('analysis-unsur');
  
  if (wordText) wordText.textContent = '"' + word + '"';
  if (labelEl) labelEl.textContent = data.label || '—';
  if (jenisEl) jenisEl.textContent = data.jenis || '—';
  if (maknaEl) maknaEl.textContent = data.makna || '—';
  if (unsurEl) unsurEl.textContent = data.unsur || '—';
}

function resetAnalysisPanel() {
  const defaultPanel = document.getElementById('analysis-default');
  const activePanel = document.getElementById('analysis-active');
  if (defaultPanel) defaultPanel.classList.remove('hidden');
  if (activePanel) activePanel.classList.add('hidden');
}

// ═══════════════════════════════════════════════════════
//  MISI 4 — RUANG BERKARYA
// ═══════════════════════════════════════════════════════
function initWorkshop() {
  const textarea = document.getElementById('poem-content-textarea');
  const titleInput = document.getElementById('poem-title-input');
  const authorInput = document.getElementById('poem-author-input');
  const counter = document.getElementById('word-counter');
  
  const saved = getProgress();
  if (textarea && saved.poem) textarea.value = saved.poem;
  if (titleInput && saved.poemTitle) titleInput.value = saved.poemTitle;
  if (authorInput && saved.poemAuthor) authorInput.value = saved.poemAuthor;
  
  function updateCounter() {
    const text = (textarea && textarea.value) ? textarea.value.trim() : '';
    const words = text ? text.split(/\s+/).length : 0;
    if (counter) counter.textContent = words + ' kata';
  }
  if (textarea) textarea.addEventListener('input', updateCounter);
  updateCounter();
  
  let saveTimer;
  function autoSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function() {
      saveProgress({
        poem: textarea ? textarea.value : '',
        poemTitle: titleInput ? titleInput.value : '',
        poemAuthor: authorInput ? authorInput.value : '',
      });
    }, 1000);
  }
  if (textarea) textarea.addEventListener('input', autoSave);
  if (titleInput) titleInput.addEventListener('input', autoSave);
  if (authorInput) authorInput.addEventListener('input', autoSave);
  
  const saveBtn = document.getElementById('btn-save-poem');
  if (saveBtn) {
    saveBtn.addEventListener('click', function() {
      saveProgress({
        poem: textarea ? textarea.value : '',
        poemTitle: titleInput ? titleInput.value : '',
        poemAuthor: authorInput ? authorInput.value : '',
      });
      const status = document.getElementById('save-status');
      if (status) {
        status.classList.remove('hidden');
        status.classList.add('flex');
        setTimeout(function() {
          status.classList.add('hidden');
          status.classList.remove('flex');
        }, 3000);
      }
    });
  }
  
  const copyBtn = document.getElementById('btn-copy-poem');
  if (copyBtn) {
    copyBtn.addEventListener('click', async function() {
      const title = titleInput ? titleInput.value.trim() : '';
      const author = authorInput ? authorInput.value.trim() : '';
      const content = textarea ? textarea.value.trim() : '';
      
      let text = '';
      if (title) text += title + '\n';
      if (author) text += 'Karya: ' + author + '\n\n';
      text += content;
      
      try {
        await navigator.clipboard.writeText(text);
        const orig = copyBtn.innerHTML;
        copyBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg> Tersalin!';
        copyBtn.classList.add('text-emerald-400');
        setTimeout(function() { copyBtn.innerHTML = orig; copyBtn.classList.remove('text-emerald-400'); }, 2000);
      } catch(e) { alert('Tidak bisa menyalin. Coba secara manual.'); }
    });
  }
  
  const downloadBtn = document.getElementById('btn-download-poem');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', function() {
      const title = (titleInput ? titleInput.value.trim() : '') || 'Puisi Saya';
      const author = authorInput ? authorInput.value.trim() : '';
      const content = textarea ? textarea.value.trim() : '';
      
      if (window.jspdf && window.jspdf.jsPDF) {
        const doc = new window.jspdf.jsPDF();
        let y = 20;
        
        doc.setFontSize(18);
        doc.text(title, 20, y);
        y += 10;
        
        if (author) {
          doc.setFontSize(12);
          doc.text('Karya: ' + author, 20, y);
          y += 10;
        }
        
        doc.line(20, y, 190, y);
        y += 10;
        
        doc.setFontSize(12);
        const splitText = doc.splitTextToSize(content, 170);
        doc.text(splitText, 20, y);
        
        doc.save(title.replace(/[^a-z0-9]/gi, '_') + '_puisi.pdf');
      } else {
        // Fallback to txt
        const sep = '─'.repeat(30);
        let text = title + '\n';
        if (author) text += 'Karya: ' + author + '\n';
        text += '\n' + sep + '\n\n' + content;
        text += '\n\n' + sep + '\nDisimpan dari: Petualangan Puisi Nusantara\nTanggal: ' + new Date().toLocaleDateString('id-ID', {year:'numeric',month:'long',day:'numeric'});
        
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = title.replace(/[^a-z0-9]/gi,'_') + '_puisi.txt';
        a.click();
        URL.revokeObjectURL(a.href);
      }
    });
  }
  
  const clearBtn = document.getElementById('btn-clear-poem');
  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      if (confirm('Hapus semua tulisan puisi? Tindakan ini tidak bisa dibatalkan.')) {
        if (textarea) textarea.value = '';
        saveProgress({ poem: '' });
        updateCounter();
      }
    });
  }
}

// ═══════════════════════════════════════════════════════
//  MISI 5 — KUIS / HEALTH BAR
// ═══════════════════════════════════════════════════════
let quizState = { currentQ: 1, score: 0, answers: {}, total: 0 };
let quizDataRef = null;

function initQuiz() {
  const data = loadData();
  quizDataRef = data.quizData;
  const questions = quizDataRef.quiz.questions;
  quizState = { currentQ: 1, score: 0, answers: {}, total: questions.length };
  
  if (quizState.total === 0) { quizState.total = 1; } // prevent /0
  updateHealthBar();
  
  document.querySelectorAll('.quiz-option').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const qId = parseInt(btn.getAttribute('data-q'));
      const optIdx = parseInt(btn.getAttribute('data-opt'));
      const correct = parseInt(btn.getAttribute('data-correct'));
      
      if (quizState.answers[qId] !== undefined) return;
      quizState.answers[qId] = optIdx;
      
      const optContainer = document.getElementById('options-' + qId);
      if (optContainer) {
        optContainer.querySelectorAll('.quiz-option').forEach(function(o) { o.classList.add('disabled'); });
        optContainer.querySelectorAll('.quiz-option').forEach(function(o) {
          const oIdx = parseInt(o.getAttribute('data-opt'));
          if (oIdx === correct) o.classList.add('correct');
          else if (oIdx === optIdx) o.classList.add('wrong');
        });
      }
      
      if (optIdx === correct) {
        quizState.score += (100 / quizState.total);
        updateQuizScore();
      } else {
        updateHealthBar();
      }
      
      const explEl = document.getElementById('explanation-' + qId);
      if (explEl) explEl.classList.remove('hidden');
      
      const nextBtn = document.getElementById('btn-next-q-' + qId);
      if (nextBtn) nextBtn.classList.remove('hidden');
    });
  });
  
  document.querySelectorAll('[id^="btn-next-q-"]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const current = parseInt(btn.getAttribute('data-current'));
      const next = parseInt(btn.getAttribute('data-next'));
      const total = parseInt(btn.getAttribute('data-total'));
      
      if (next > total) {
        showQuizResult();
      } else {
        const currentCard = document.getElementById('q-card-' + current);
        const nextCard = document.getElementById('q-card-' + next);
        if (currentCard) currentCard.classList.add('hidden');
        if (nextCard) nextCard.classList.remove('hidden');
        
        const counter = document.getElementById('quiz-q-counter');
        if (counter) counter.textContent = 'Soal ' + next + ' dari ' + total;
      }
    });
  });
  
  const retryBtn = document.getElementById('btn-retry-quiz');
  if (retryBtn) {
    retryBtn.addEventListener('click', function() {
      quizState = { currentQ: 1, score: 0, answers: {}, total: questions.length };
      if (quizState.total === 0) quizState.total = 1;
      
      questions.forEach(function(q) {
        const qCard = document.getElementById('q-card-' + q.id);
        const explEl = document.getElementById('explanation-' + q.id);
        const nextBtn = document.getElementById('btn-next-q-' + q.id);
        const optCont = document.getElementById('options-' + q.id);
        
        if (qCard) qCard.classList.add('hidden');
        if (explEl) explEl.classList.add('hidden');
        if (nextBtn) nextBtn.classList.add('hidden');
        if (optCont) optCont.querySelectorAll('.quiz-option').forEach(function(o) {
          o.classList.remove('correct', 'wrong', 'disabled');
        });
      });
      
      const firstCard = document.getElementById('q-card-1');
      const resultPanel = document.getElementById('quiz-result');
      if (firstCard) firstCard.classList.remove('hidden');
      if (resultPanel) resultPanel.classList.add('hidden');
      
      const counter = document.getElementById('quiz-q-counter');
      if (counter) counter.textContent = 'Soal 1 dari ' + questions.length;
      
      updateHealthBar();
      updateQuizScore();
    });
  }
}

function updateHealthBar() {
  const bar = document.getElementById('health-bar');
  const hpLabel = document.getElementById('quiz-hp-label');
  
  if (!quizDataRef) return;
  
  const wrong = Object.keys(quizState.answers).filter(function(qId) {
    const a = quizState.answers[qId];
    const q = quizDataRef.quiz.questions.find(function(q) { return q.id === parseInt(qId); });
    return q && a !== q.correct;
  }).length;
  
  const total = quizState.total || 1;
  const hp = Math.max(0, Math.round(((total - wrong) / total) * 100));
  if (bar) bar.style.width = hp + '%';
  if (hpLabel) hpLabel.textContent = hp + ' HP';
}

function updateQuizScore() {
  const scoreDisplay = document.getElementById('quiz-score-display');
  const score = Math.round(quizState.score);
  if (scoreDisplay) scoreDisplay.textContent = score + ' / 100 poin';
  updateHealthBar();
}

function showQuizResult() {
  document.querySelectorAll('.quiz-question-card').forEach(function(c) { c.classList.add('hidden'); });
  const resultPanel = document.getElementById('quiz-result');
  if (resultPanel) resultPanel.classList.remove('hidden');
  
  const finalScore = Math.round(quizState.score);
  saveProgress({ quizScore: finalScore });
  
  const resultScore = document.getElementById('result-score');
  const resultTitle = document.getElementById('result-title');
  const resultMsg = document.getElementById('result-message');
  const resultEmoji = document.getElementById('result-emoji');
  
  if (resultScore) resultScore.textContent = finalScore;
  
  if (finalScore >= 80) {
    if (resultTitle) resultTitle.textContent = 'Luar Biasa, Maestro!';
    if (resultMsg) resultMsg.textContent = 'Kamu menguasai materi puisi dengan sangat baik. Teruslah berkarya!';
    if (resultEmoji) resultEmoji.textContent = '\uD83C\uDFC6';
  } else if (finalScore >= 60) {
    if (resultTitle) resultTitle.textContent = 'Bagus, Penyair Muda!';
    if (resultMsg) resultMsg.textContent = 'Pemahaman yang baik! Coba ulangi untuk meningkatkan skor.';
    if (resultEmoji) resultEmoji.textContent = '\u2B50';
  } else {
    if (resultTitle) resultTitle.textContent = 'Teruslah Belajar!';
    if (resultMsg) resultMsg.textContent = 'Kembali ke materi dan coba lagi. Setiap kegagalan adalah pelajaran!';
    if (resultEmoji) resultEmoji.textContent = '\uD83D\uDCDA';
  }
}

// ═══════════════════════════════════════════════════════
//  GLOSARIUM — Search & Filter
// ═══════════════════════════════════════════════════════
function initGlossary() {
  const searchInput = document.getElementById('glossary-search');
  const grid = document.getElementById('glossary-grid');
  const empty = document.getElementById('glossary-empty');
  
  let activeCategory = 'Semua';
  
  function filterGlossary() {
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const items = document.querySelectorAll('.glossary-item');
    let visibleCount = 0;
    
    items.forEach(function(item) {
      const term = item.getAttribute('data-term') || '';
      const def = item.getAttribute('data-def') || '';
      const cat = item.getAttribute('data-cat') || '';
      
      const matchesSearch = !query || term.includes(query) || def.includes(query);
      const matchesCat = activeCategory === 'Semua' || cat === activeCategory;
      
      if (matchesSearch && matchesCat) {
        item.classList.remove('hidden');
        visibleCount++;
      } else {
        item.classList.add('hidden');
      }
    });
    
    if (empty) {
      if (visibleCount === 0) {
        empty.classList.remove('hidden');
        if (grid) grid.classList.add('hidden');
      } else {
        empty.classList.add('hidden');
        if (grid) grid.classList.remove('hidden');
      }
    }
  }
  
  if (searchInput) searchInput.addEventListener('input', filterGlossary);
  
  document.querySelectorAll('.glossary-filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      activeCategory = btn.getAttribute('data-cat') || 'Semua';
      
      document.querySelectorAll('.glossary-filter-btn').forEach(function(b) {
        b.className = 'glossary-filter-btn px-3 py-1.5 rounded-full text-xs font-medium transition-all border glass border-navy-600 text-cream-100/50 hover:border-gold-500/30 hover:text-gold-400';
      });
      btn.className = 'glossary-filter-btn px-3 py-1.5 rounded-full text-xs font-medium transition-all border bg-gold-500/20 border-gold-500/40 text-gold-300';
      
      filterGlossary();
    });
  });
}

// ═══════════════════════════════════════════════════════
//  SCROLL REVEAL OBSERVER
// ═══════════════════════════════════════════════════════
function initScrollReveal() {
  if (!window.IntersectionObserver) return;
  
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  
  document.querySelectorAll('.reveal').forEach(function(el) { observer.observe(el); });
}

// ═══════════════════════════════════════════════════════
//  POET CARDS — Click Handlers
// ═══════════════════════════════════════════════════════
function initPoetCards() {
  document.querySelectorAll('.poet-card').forEach(function(card) {
    card.addEventListener('click', function() {
      const poetId = card.getAttribute('data-poet-id');
      if (poetId) openPoetModal(poetId);
    });
  });
}

// ═══════════════════════════════════════════════════════
//  EVENT LISTENERS SETUP
// ═══════════════════════════════════════════════════════
function initEventListeners() {
  // NAV
  const homeBtn = document.getElementById('btn-go-home');
  if (homeBtn) homeBtn.addEventListener('click', function() { showSection('splash'); });
  
  const openMenuBtn = document.getElementById('btn-open-menu');
  if (openMenuBtn) openMenuBtn.addEventListener('click', openSidebar);
  
  const closeMenuBtn = document.getElementById('btn-close-menu');
  if (closeMenuBtn) closeMenuBtn.addEventListener('click', closeSidebar);
  
  const navOverlay = document.getElementById('nav-overlay');
  if (navOverlay) navOverlay.addEventListener('click', closeSidebar);
  
  const glossaryNavBtn = document.getElementById('btn-open-glossary');
  if (glossaryNavBtn) glossaryNavBtn.addEventListener('click', function() { showSection('glossary'); });
  
  // SPLASH
  const mulaiBtn = document.getElementById('btn-mulai');
  if (mulaiBtn) mulaiBtn.addEventListener('click', function() { openModal('modal-petunjuk'); });
  
  const closePetunjukBtn = document.getElementById('btn-close-petunjuk');
  if (closePetunjukBtn) closePetunjukBtn.addEventListener('click', function() { closeModal('modal-petunjuk'); });
  
  const startAdventureBtn = document.getElementById('btn-start-adventure');
  if (startAdventureBtn) startAdventureBtn.addEventListener('click', function() {
    closeModal('modal-petunjuk');
    showSection('mission-map');
  });
  
  // MODAL backdrop
  document.querySelectorAll('.modal-overlay').forEach(function(m) {
    m.addEventListener('click', function(e) {
      if (e.target === m) closeModal(m.id);
    });
  });
  
  // MISSION CARDS
  document.querySelectorAll('.mission-card').forEach(function(card) {
    card.addEventListener('click', function() {
      const sectionId = card.getAttribute('data-section');
      if (sectionId) showSection(sectionId);
    });
  });
  
  // MISSION COMPLETE BUTTONS
  ['1','2','3','4'].forEach(function(num) {
    const btn = document.getElementById('btn-complete-mission-' + num);
    if (btn) btn.addEventListener('click', function() {
      completeMission(parseInt(num));
      updateProgressUI();
      showSection('mission-map');
    });
  });
  
  const m5btn = document.getElementById('btn-complete-mission-5');
  if (m5btn) m5btn.addEventListener('click', function() {
    completeMission(5);
    updateProgressUI();
    showSection('closing');
  });
  
  // MENU NAV BUTTONS
  document.querySelectorAll('.menu-nav-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const section = btn.getAttribute('data-section');
      if (section) showSection(section);
    });
  });
  
  // BACK BUTTONS
  document.querySelectorAll('.btn-back').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const target = btn.getAttribute('data-target') || 'mission-map';
      showSection(target);
    });
  });
  
  // DAFTAR ISI
  document.querySelectorAll('.daftar-isi-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const section = btn.getAttribute('data-section');
      if (section) showSection(section);
    });
  });
  
  // ESC KEY
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeModal('modal-petunjuk');
      closeModal('poet-modal');
      closeSidebar();
    }
  });
}

// ═══════════════════════════════════════════════════════
//  INITIALIZATION
// ═══════════════════════════════════════════════════════
function bootstrap() {
  initEventListeners();
  initPoetCards();
  initPoemAnalysis();
  initWorkshop();
  initQuiz();
  initGlossary();
  initScrollReveal();
  updateProgressUI();
  showSection('splash');
  
  console.log('\u2726 Petualangan Puisi Nusantara \u2014 Loaded!');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
