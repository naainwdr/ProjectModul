/* ═══════════════════════════════════════════════════════════════
   PETUALANGAN PUISI NUSANTARA — app.js
   Sistem Buku Interaktif dengan Pop-Up Gambar
   ═══════════════════════════════════════════════════════════════ */

'use strict';

// ─── DATA ───────────────────────────────────────────────────────
var DATA = {};

function loadData() {
  ['poets', 'poems', 'quiz', 'glossary', 'poet-images', 'mission-images'].forEach(function(key) {
    var el = document.getElementById('data-' + key);
    if (el) {
      try { DATA[key] = JSON.parse(el.textContent); }
      catch(e) { console.warn('Failed to parse data-' + key, e); DATA[key] = null; }
    }
  });
}

// ─── STATE ──────────────────────────────────────────────────────
var state = {
  currentPage: 0,      // 0 = sampul
  quizIndex: 0,
  quizScore: 0,
  quizAnswered: false,
  workshopText: localStorage.getItem('workshop-poem') || '',
  progress: JSON.parse(localStorage.getItem('book-progress') || '{}'),
  quizDone: false,
};

// ─── DAFTAR HALAMAN ─────────────────────────────────────────────
// Setiap entry: { id, leftTitle, rightTitle, render }
var PAGES = [];

function buildPages() {
  var poems   = (DATA.poems    && DATA.poems.poems)    || [];
  var poets   = (DATA.poets    && DATA.poets.poets)    || [];
  var quiz    = (DATA.quiz     && DATA.quiz.quiz)      || {};
  var glossary = (DATA.glossary && DATA.glossary.glossary) || [];
  var missionImgs = DATA['mission-images'] || [];
  var poetImgs    = DATA['poet-images']    || {};

  PAGES = [
    // 1. Kata Pengantar
    {
      id: 'pengantar',
      chapter: 'Pembukaan',
      leftTitle: 'Pengantar',
      rightTitle: 'Tentang Buku',
      leftIllustration: missionImgs[0] || null,
      render: function() { return renderPengantar(); }
    },
    // 2. Daftar Isi (ringkasan bab)
    {
      id: 'daftar-isi',
      chapter: 'Daftar Isi',
      leftTitle: 'Isi Buku',
      rightTitle: 'Peta Misi',
      leftIllustration: missionImgs[1] || null,
      render: function() { return renderDaftarIsi(); }
    },
    // 3. Misi 1: Mengenal Puisi
    {
      id: 'misi-1',
      chapter: 'Bab I',
      leftTitle: 'Bab I',
      rightTitle: 'Mengenal Puisi',
      leftIllustration: missionImgs[2] || null,
      render: function() { return renderMisi1(); }
    },
    // 4. Misi 2: Analisis Puisi "Aku"
    {
      id: 'misi-2',
      chapter: 'Bab II',
      leftTitle: 'Bab II',
      rightTitle: 'Analisis Puisi',
      leftIllustration: missionImgs[3] || null,
      render: function() { return renderMisi2(poems); }
    },
    // 5. Misi 3: Penyair Nusantara
    {
      id: 'misi-3',
      chapter: 'Bab III',
      leftTitle: 'Bab III',
      rightTitle: 'Penyair Nusantara',
      leftIllustration: missionImgs[4] || null,
      poetIllustrations: poetImgs,
      render: function() { return renderMisi3(poets, poetImgs); }
    },
    // 6. Misi 4: Workshop Menulis
    {
      id: 'misi-4',
      chapter: 'Bab IV',
      leftTitle: 'Bab IV',
      rightTitle: 'Workshop Menulis',
      leftIllustration: missionImgs[5] || null,
      render: function() { return renderMisi4(); }
    },
    // 7. Misi 5: Kuis Evaluasi
    {
      id: 'misi-5',
      chapter: 'Bab V',
      leftTitle: 'Bab V',
      rightTitle: 'Evaluasi & Kuis',
      leftIllustration: missionImgs[6] || null,
      render: function() { return renderMisi5(quiz); }
    },
    // 8. Glosarium
    {
      id: 'glosarium',
      chapter: 'Glosarium',
      leftTitle: 'Kamus',
      rightTitle: 'Glosarium Puisi',
      leftIllustration: missionImgs[7] || null,
      render: function() { return renderGlosarium(glossary); }
    },
    // 9. Penutup
    {
      id: 'penutup',
      chapter: 'Penutup',
      leftTitle: 'Akhir Kata',
      rightTitle: 'Daftar Pustaka',
      leftIllustration: missionImgs[8] || null,
      render: function() { return renderPenutup(); }
    },
  ];
}

// ─── NAVIGASI HALAMAN ───────────────────────────────────────────

function showCover() {
  document.getElementById('scene-cover').classList.remove('hidden');
  document.getElementById('scene-cover').classList.add('flex');
  document.getElementById('scene-book').classList.add('hidden');
  document.getElementById('scene-book').classList.remove('flex');
  document.getElementById('scene-book').classList.add('hidden');
  document.getElementById('scene-book').classList.remove('flex');
}

function openBook() {
  document.getElementById('scene-cover').classList.add('hidden');
  document.getElementById('scene-cover').classList.remove('flex');
  document.getElementById('scene-book').classList.remove('hidden');
  document.getElementById('scene-book').classList.add('flex');
  if (state.currentPage === 0) state.currentPage = 1;
  renderPage(state.currentPage);
  if (state.currentPage === 0) state.currentPage = 1;
  renderPage(state.currentPage);
}

function goToPage(n, skipAnimation) {
  if (n < 1 || n > PAGES.length) return;
  var oldN = state.currentPage;
  if (n === oldN && !skipAnimation) return;
  state.currentPage = n;

  var isNext = n > oldN;
  var isMobile = window.innerWidth <= 768;

  if (skipAnimation) {
    renderDOM(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  var spread = document.getElementById('book-spread');
  if (!spread) {
    renderDOM(n);
    return;
  }

  // Siapkan konten
  var oldPage = PAGES[oldN - 1];
  var newPage = PAGES[n - 1];
  
  var oldLeftHTML = oldPage ? renderLeftPage(oldPage, oldN) : '';
  var oldRightHTML = oldPage ? oldPage.render() : '';
  var newLeftHTML = newPage ? renderLeftPage(newPage, n) : '';
  var newRightHTML = newPage ? newPage.render() : '';

  // Buat elemen flip
  var flipEl = document.createElement('div');
  flipEl.className = 'flipping-page';
  
  var frontEl = document.createElement('div');
  frontEl.className = 'flipping-page-front';
  
  var backEl = document.createElement('div');
  backEl.className = 'flipping-page-back';

  flipEl.appendChild(frontEl);
  flipEl.appendChild(backEl);
  spread.appendChild(flipEl);

  var animDuration = 600; // ms

  if (!isMobile) {
    // ── DESKTOP FLIP ──
    if (isNext) {
      // Flip Kanan ke Kiri
      flipEl.style.transformOrigin = 'left center';
      flipEl.style.left = '50%';
      flipEl.style.width = '50%';
      
      frontEl.className += ' book-page-right';
      frontEl.innerHTML = '<div class="page-corner-ornament top-right"></div><div id="page-content">' + oldRightHTML + '</div><div class="page-number-right">' + (oldN*2) + '</div>';
      
      backEl.className += ' book-page-left';
      backEl.innerHTML = '<div class="page-corner-ornament top-left"></div><div id="page-left-content">' + newLeftHTML + '</div><div class="page-number-left">' + toRoman(n*2-1) + '</div><div class="page-corner-ornament bottom-left"></div>';
      
      renderDOM(n); // Render new state underneath
      
      requestAnimationFrame(function() {
        flipEl.style.animation = 'flipToLeft ' + animDuration + 'ms cubic-bezier(0.645, 0.045, 0.355, 1) forwards';
      });
      
    } else {
      // Flip Kiri ke Kanan
      flipEl.style.transformOrigin = 'right center';
      flipEl.style.left = '0';
      flipEl.style.width = '50%';
      
      frontEl.className += ' book-page-left';
      frontEl.innerHTML = '<div class="page-corner-ornament top-left"></div><div id="page-left-content">' + oldLeftHTML + '</div><div class="page-number-left">' + toRoman(oldN*2-1) + '</div><div class="page-corner-ornament bottom-left"></div>';
      
      backEl.className += ' book-page-right';
      backEl.innerHTML = '<div class="page-corner-ornament top-right"></div><div id="page-content">' + newRightHTML + '</div><div class="page-number-right">' + (n*2) + '</div>';
      
      renderDOM(n); // Render new state underneath
      
      requestAnimationFrame(function() {
        flipEl.style.animation = 'flipToRight ' + animDuration + 'ms cubic-bezier(0.645, 0.045, 0.355, 1) forwards';
      });
    }

    setTimeout(function() {
      if (flipEl.parentNode) flipEl.parentNode.removeChild(flipEl);
      initPageContent(newPage);
    }, animDuration);

  } else {
    // ── MOBILE FLIP ──
    flipEl.style.width = 'calc(100% - 38px)';
    flipEl.style.left = '38px'; // Mulai setelah binder mobile
    flipEl.style.transformOrigin = 'left center';

    if (isNext) {
      // Flip page out to left
      frontEl.className += ' book-page-right';
      frontEl.innerHTML = '<div class="page-corner-ornament top-right"></div><div id="page-content">' + oldRightHTML + '</div><div class="page-number-right">' + (oldN*2) + '</div>';
      
      backEl.innerHTML = ''; // Tidak terlihat
      
      renderDOM(n);
      
      requestAnimationFrame(function() {
        flipEl.style.animation = 'flipToLeft ' + animDuration + 'ms cubic-bezier(0.645, 0.045, 0.355, 1) forwards';
      });

      setTimeout(function() {
        if (flipEl.parentNode) flipEl.parentNode.removeChild(flipEl);
        initPageContent(newPage);
      }, animDuration);

    } else {
      // Flip page in from left
      frontEl.innerHTML = ''; // Tidak terlihat
      
      backEl.className += ' book-page-right';
      backEl.innerHTML = '<div class="page-corner-ornament top-right"></div><div id="page-content">' + newRightHTML + '</div><div class="page-number-right">' + (n*2) + '</div>';
      
      // Jangan renderDOM dulu agar halaman lama masih terlihat di bawah
      flipEl.style.transform = 'rotateY(-180deg)';
      
      requestAnimationFrame(function() {
        // Hapus initial transform karena animation akan dioverride, tapi karena kita mau reverse flipToLeft:
        flipEl.style.animation = 'flipToRight ' + animDuration + 'ms cubic-bezier(0.645, 0.045, 0.355, 1) forwards';
        // Wait, flipToRight is 0 to 180. We need -180 to 0!
        flipEl.style.animation = 'none';
        flipEl.style.transition = 'transform ' + animDuration + 'ms cubic-bezier(0.645, 0.045, 0.355, 1)';
        flipEl.style.transform = 'rotateY(0deg)';
      });

      setTimeout(function() {
        renderDOM(n);
        if (flipEl.parentNode) flipEl.parentNode.removeChild(flipEl);
        initPageContent(newPage);
      }, animDuration);
    }
  }
}

// Render DOM tanpa animasi (langsung ganti isi html)
function renderDOM(n) {
  var page = PAGES[n - 1];
  if (!page) return;

  var leftEl = document.getElementById('page-left-content');
  var mobileCoverEl = document.getElementById('mobile-cover-content');
  
  if (leftEl) {
    leftEl.innerHTML = renderLeftPage(page, n);
    leftEl.style.opacity = '1';
  }
  if (mobileCoverEl) {
    mobileCoverEl.innerHTML = renderLeftPage(page, n);
    var revealEl = mobileCoverEl.querySelector('.reveal');
    if (revealEl) {
      revealEl.classList.remove('h-full');
      revealEl.style.justifyContent = 'flex-start';
    }
    
    // Logika Cover Interaktif di Mobile
    if (window.innerWidth <= 768) {
      var pageRight = document.getElementById('page-right');
      if (pageRight) pageRight.classList.add('mobile-cover-active');
      
      var coverImg = mobileCoverEl.querySelector('.animate-breathing');
      if (coverImg) {
        coverImg.style.cursor = 'pointer';
        coverImg.onclick = function() {
          if (pageRight) pageRight.classList.remove('mobile-cover-active');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        };
        
        // Teks bantuan di luar gambar
        var imgContainer = mobileCoverEl.querySelector('.mx-auto');
        if (imgContainer) {
          var tapText = document.createElement('p');
          tapText.className = 'animate-popup';
          tapText.style = 'text-align:center; font-size:13px; color:var(--color-accent-red); font-weight:bold; margin-top:12px; cursor:pointer;';
          tapText.innerHTML = '👆 Ketuk di sini atau pada gambar untuk membaca bab';
          tapText.onclick = coverImg.onclick;
          imgContainer.parentNode.insertBefore(tapText, imgContainer.nextSibling);
        }
      }
    }
  }

  var contentEl = document.getElementById('page-content');
  if (contentEl) {
    contentEl.innerHTML = page.render();
    contentEl.style.opacity = '1';
  }

  // Update text & UI state
  var leftNum = document.getElementById('page-num-left');
  var rightNum = document.getElementById('page-num-right');
  var pageLabel = document.getElementById('page-label');
  var pageInfoBot = document.getElementById('page-info-bottom');
  var pageInfoTop = document.getElementById('page-info-top');
  
  if (leftNum) leftNum.textContent = toRoman(n * 2 - 1);
  if (rightNum) rightNum.textContent = String(n * 2);
  if (pageLabel) pageLabel.textContent = 'Bab ' + n + ' / ' + PAGES.length;
  if (pageInfoBot) pageInfoBot.textContent = 'Halaman ' + n + ' dari ' + PAGES.length;
  if (pageInfoTop) pageInfoTop.textContent = 'Halaman ' + n + ' dari ' + PAGES.length;

  var prevBtn = document.getElementById('btn-prev-page');
  var nextBtn = document.getElementById('btn-next-page');
  if (prevBtn) prevBtn.disabled = (n <= 1);
  if (nextBtn) nextBtn.disabled = (n >= PAGES.length);

  updateBookTabs(n);
  updateProgressDots(n);
  initScrollReveal();
}


function updateLeftIllustration(page) {
  var container = document.getElementById('left-illustration');
  if (!container) return;

  if (page.leftIllustration) {
    container.classList.remove('hidden');
    container.innerHTML = buildPopupImageHTML(
      page.leftIllustration.src,
      page.leftIllustration.alt,
      page.chapter,
      'left-img-card'
    );
    // Animasi pop-up saat halaman berubah
    setTimeout(function() {
      var card = container.querySelector('.popup-image-card');
      if (card) {
        card.classList.remove('animate-popup');
        void card.offsetWidth;
        card.classList.add('animate-popup');
      }
    }, 200);
  } else {
    container.classList.add('hidden');
    container.innerHTML = '';
  }
}

function buildPopupImageHTML(src, alt, caption, extraId) {
  return '<div class="popup-image-container">'
    + '<div class="popup-image-card" id="' + (extraId||'') + '" '
    + 'data-src="' + src + '" data-caption="' + alt + '" data-desc="' + caption + '">'
    + '<img src="' + src + '" alt="' + alt + '" loading="lazy" width="280" height="200" '
    + 'style="width:100%;height:160px;object-fit:cover;">'
    + '<div class="popup-image-caption">' + alt + '</div>'
    + '</div>'
    + '</div>';
}

// ─── TAB BOOKMARK ATAS BUKU ──────────────────────────────────────

function buildBookTabs() {
  var bar = document.getElementById('book-tabs-bar');
  if (!bar) return;

  bar.innerHTML = PAGES.map(function(page, i) {
    var n = i + 1;
    return '<button class="book-tab" data-page="' + n + '" id="tab-' + page.id + '">'
      + '<span class="tab-num">' + toRoman(n) + '</span>'
      + page.chapter
      + '</button>';
  }).join('');

  bar.innerHTML += '<button class="book-tab" id="btn-close-book" style="color:var(--color-accent-red); margin-left:auto;">'
    + '<span class="tab-num">Keluar</span>Tutup</button>';

  bar.querySelectorAll('.book-tab[data-page]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var n = parseInt(btn.getAttribute('data-page'));
      goToPage(n);
    });
  });

  var closeBtn = document.getElementById('btn-close-book');
  if (closeBtn) {
    closeBtn.addEventListener('click', showCover);
  }
}

function updateBookTabs(activePage) {
  document.querySelectorAll('.book-tab').forEach(function(btn) {
    var n = parseInt(btn.getAttribute('data-page'));
    btn.classList.toggle('active', n === activePage);
  });
}

function updateProgressDots(activePage) {
  var container = document.getElementById('progress-dots');
  if (!container) return;
  container.innerHTML = PAGES.map(function(_, i) {
    var cls = 'book-progress-dot' + (i + 1 === activePage ? ' active' : '');
    return '<div class="' + cls + '"></div>';
  }).join('');
}

// ─── RENDER HALAMAN KIRI (Chapter Cover) ─────────────────────────

function renderLeftPage(page, n) {
  var img = page.leftIllustration;
  var html = '<div class="reveal flex flex-col h-full" style="justify-content:space-between;">';

  // Header bab
  html += '<div>'
    + '<p class="font-serif text-xs italic mb-2" style="color:var(--color-ink-300); letter-spacing:.08em; text-transform:uppercase;">'
    + page.chapter + '</p>'
    + '<p class="font-display font-bold" style="font-size:clamp(1.3rem,2.5vw,1.8rem); color:var(--color-ink-900); line-height:1.2;">'
    + page.rightTitle + '</p>'
    + '<div class="page-divider mt-3"><span style="font-size:10px; color:var(--color-accent-gold);">✦</span></div>'
    + '</div>';

  // Ilustrasi animasi zoom (breathing)
  if (img) {
    html += '<div class="mx-auto my-4" style="max-width:220px; width:100%;">'
      + '<div class="animate-breathing" style="border-radius:4px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.3); border:4px solid #fff;">'
      + '<img src="' + img.src + '" alt="' + escapeAttr(img.alt) + '" loading="lazy"'
      + ' style="width:100%;height:180px;object-fit:cover;display:block;">'
      + '<div class="popup-image-caption">' + escapeHTML(img.alt) + '</div>'
      + '</div></div>';
  } else {
    // Ornamen teks pengganti
    html += '<div class="flex-1 flex items-center justify-center">'
      + '<p style="font-size:4rem; opacity:0.15;">📖</p>'
      + '</div>';
  }

  // Quote / keterangan bawah
  html += '<div style="border-top:1px solid var(--color-paper-700); padding-top:12px; margin-top:8px;">'
    + '<p class="font-serif text-xs italic text-center" style="color:var(--color-ink-300);">'
    + 'Petualangan Puisi Nusantara</p>'
    + '</div>';

  html += '</div>';
  return html;
}



// ─── RENDER KONTEN TIAP HALAMAN ──────────────────────────────────

function renderPengantar() {
  return '<div class="reveal">'
    + '<p class="page-title">Kata Pengantar</p>'
    + '<div class="page-divider"><span>✦</span></div>'
    + '<div class="prose-text space-y-3 mt-4">'
    + '<p>Buku pengayaan ini hadir sebagai jembatan antara dunia akademik dan dunia seni sastra. Puisi bukan sekadar rangkaian kata indah, melainkan cermin jiwa manusia yang paling jujur.</p>'
    + '<p>Di dalam buku ini, kamu akan diajak berpetualang: membaca, menganalisis, mengenal penyairnya, mencoba menulis sendiri, hingga akhirnya menguji pemahamanmu.</p>'
    + '<p class="italic" style="color:var(--color-ink-500);">"Puisi adalah cara kita menemukan keindahan di antara kerumitan hidup."</p>'
    + '<p>Selamat berpetualangan, Penjelajah Kata!</p>'
    + '</div>'
    + '<div class="mt-6 text-right">'
    + '<p class="font-serif text-sm italic" style="color:var(--color-ink-500);">— Tim Penulis</p>'
    + '</div>'
    + '</div>';
}

function renderDaftarIsi() {
  var html = '<div class="reveal">'
    + '<p class="page-title">Peta Misi Petualanganmu</p>'
    + '<div class="page-divider"><span>✦</span></div>'
    + '<p class="prose-text text-sm mt-2 mb-4">Klik bab mana saja untuk langsung membuka halamannya.</p>'
    + '<div class="space-y-2">';

  PAGES.forEach(function(page, i) {
    var n = i + 1;
    html += '<button class="chapter-item w-full text-left" data-page="' + n + '">'
      + '<span class="chapter-number">' + toRoman(n) + '</span>'
      + '<div>'
      + '<div class="chapter-title">' + page.rightTitle + '</div>'
      + '<div class="chapter-subtitle">' + page.chapter + '</div>'
      + '</div>'
      + '</button>';
  });

  html += '</div></div>';
  return html;
}

function renderMisi1() {
  return '<div class="reveal space-y-4">'
    + '<p class="page-title">Mengenal Puisi</p>'
    + '<div class="page-divider"><span>✦</span></div>'
    + '<div class="prose-text space-y-3">'
    + '<p><strong style="color:var(--color-ink-900)">Puisi</strong> adalah karya sastra yang menggunakan bahasa yang padat, indah, dan penuh makna. Setiap kata dipilih dengan sangat cermat untuk menciptakan efek estetik dan emosional tertentu.</p>'
    + '</div>'
    + '<div style="border:1px solid var(--color-paper-700); border-radius:4px; padding:16px; background:var(--color-paper-800);">'
    + '<p class="font-serif text-xs font-semibold mb-3" style="color:var(--color-accent-gold); text-transform:uppercase; letter-spacing:.05em;">Unsur-Unsur Puisi</p>'
    + '<div class="grid grid-cols-2 gap-2">'
    + makeInfoCard('🔤', 'Diksi', 'Pilihan kata yang cermat & bermakna')
    + makeInfoCard('🎵', 'Rima', 'Persamaan bunyi yang menciptakan musikalitas')
    + makeInfoCard('🖼️', 'Citraan', 'Gambaran indera yang membuat puisi hidup')
    + makeInfoCard('✨', 'Majas', 'Gaya bahasa untuk memperindah ekspresi')
    + makeInfoCard('💭', 'Tema', 'Gagasan pokok yang diangkat penyair')
    + makeInfoCard('📣', 'Amanat', 'Pesan moral yang ingin disampaikan')
    + '</div></div>'
    + '<div class="mt-4">'
    + '<p class="font-serif text-xs font-semibold mb-2" style="color:var(--color-ink-300); text-transform:uppercase; letter-spacing:.05em;">Jenis-Jenis Puisi</p>'
    + '<div class="space-y-2">'
    + '<div style="border-left:3px solid var(--color-accent-gold); padding-left:12px;">'
    + '<p class="font-serif text-sm font-semibold" style="color:var(--color-ink-800);">Puisi Lama</p>'
    + '<p class="prose-text text-xs">Pantun, syair, gurindam, mantra — terikat pada aturan bait dan rima yang ketat.</p>'
    + '</div>'
    + '<div style="border-left:3px solid var(--color-accent-red); padding-left:12px;">'
    + '<p class="font-serif text-sm font-semibold" style="color:var(--color-ink-800);">Puisi Baru / Modern</p>'
    + '<p class="prose-text text-xs">Lebih bebas dalam struktur, namun tetap mempertahankan kepadatan makna dan estetika bahasa.</p>'
    + '</div>'
    + '</div>'
    + '</div>'
    + '<div class="mt-4 text-right">'
    + '<button class="btn-book-primary" id="btn-to-misi2">Lanjut ke Analisis →</button>'
    + '</div>'
    + '</div>';
}

function makeInfoCard(icon, title, desc) {
  return '<div style="padding:10px; border:1px solid var(--color-paper-600); border-radius:3px; background:var(--color-paper-950);">'
    + '<div class="flex items-center gap-2 mb-1">'
    + '<span style="font-size:1rem;">' + icon + '</span>'
    + '<span class="font-serif text-sm font-semibold" style="color:var(--color-ink-800);">' + title + '</span>'
    + '</div>'
    + '<p class="prose-text" style="font-size:0.75rem;">' + desc + '</p>'
    + '</div>';
}

function renderMisi2(poems) {
  var poem = poems.find(function(p) { return p.id === 'aku'; }) || poems[0];
  if (!poem) return '<p class="prose-text">Data puisi tidak ditemukan.</p>';

  var html = '<div class="space-y-4">'
    + '<div class="reveal">'
    + '<p class="page-title">Analisis Puisi</p>'
    + '<div class="page-divider"><span>✦</span></div>'
    + '<div style="background:var(--color-paper-800); border-radius:4px; padding:16px; margin-bottom:12px;">'
    + '<p class="font-serif text-xs mb-1" style="color:var(--color-ink-300); text-transform:uppercase; letter-spacing:.05em;">Cara menggunakan:</p>'
    + '<p class="prose-text text-xs">Ketuk/klik kata yang bergaris putus-putus untuk melihat analisis unsur puisinya.</p>'
    + '</div>'
    + '<div style="background:var(--color-paper-800); border-radius:4px; padding:20px; border:1px solid var(--color-paper-700);">'
    + '<p class="font-display font-bold text-center mb-1" style="font-size:1.3rem; color:var(--color-ink-900);">' + poem.title + '</p>'
    + '<p class="font-serif text-xs italic text-center mb-4" style="color:var(--color-ink-300);">— ' + poem.poet + ', ' + poem.year + '</p>'
    + '<div class="poem-text space-y-4">';

  // Render bait dan kata
  poem.stanzas.forEach(function(stanza) {
    html += '<div>';
    stanza.lines.forEach(function(line) {
      html += '<div class="mb-1">';
      if (line.words && line.words.length > 0) {
        line.words.forEach(function(wordObj) {
          if (wordObj.analysis) {
            var escaped = escapeAttr(JSON.stringify(wordObj.analysis));
            html += '<span class="word-tap" data-analysis="' + escaped + '">' + escapeHTML(wordObj.word) + '</span> ';
          } else {
            html += escapeHTML(wordObj.word) + ' ';
          }
        });
      } else {
        html += escapeHTML(line.text);
      }
      html += '</div>';
    });
    html += '</div>';
  });

  html += '</div></div></div>'
    + '<div class="reveal mt-4 text-right">'
    + '<button class="btn-book-primary" id="btn-to-misi3">Lanjut ke Penyair →</button>'
    + '</div>'
    + '</div>';

  return html;
}

function renderMisi3(poets, poetImgs) {
  var html = '<div class="space-y-5">'
    + '<div class="reveal">'
    + '<p class="page-title">Penyair Nusantara</p>'
    + '<div class="page-divider"><span>✦</span></div>'
    + '</div>';

  poets.forEach(function(poet, idx) {
    var imgData = poetImgs[poet.id];
    html += '<div class="reveal" style="animation-delay:' + (idx * 0.1) + 's;">'
      + '<div style="border:1px solid var(--color-paper-700); border-radius:4px; padding:14px; background:var(--color-paper-950);">'
      + '<div class="flex gap-3">';

    // Foto pop-up penyair
    if (imgData) {
      html += '<div class="popup-image-container flex-shrink-0" style="width:90px;">'
        + '<div class="popup-image-card" data-src="' + imgData.src + '" data-caption="' + imgData.alt + '" data-desc="' + escapeAttr(poet.tagline) + '" style="border-radius:4px; overflow:hidden;">'
        + '<img src="' + imgData.src + '" alt="' + imgData.alt + '" loading="lazy" width="90" height="110"'
        + ' style="width:90px;height:110px;object-fit:cover;display:block;filter:sepia(0.15);">'
        + '<div class="popup-image-caption" style="font-size:9px;">' + imgData.alt + '</div>'
        + '</div></div>';
    }

    html += '<div class="flex-1">'
      + '<p class="font-display font-bold" style="font-size:1rem; color:var(--color-ink-900);">' + poet.name + '</p>'
      + '<p class="font-serif text-xs italic mb-1" style="color:var(--color-ink-300);">' + poet.born + ' – ' + (poet.died || 'sekarang') + ' · ' + poet.origin + '</p>'
      + '<div style="display:inline-block; padding:2px 8px; border:1px solid var(--color-accent-gold); border-radius:2px; margin-bottom:8px;">'
      + '<span class="font-serif" style="font-size:0.7rem; color:var(--color-accent-gold);">' + poet.era + '</span>'
      + '</div>'
      + '<p class="prose-text text-xs line-clamp-3">' + poet.bio.substring(0, 180) + '...</p>'
      + '<p class="font-serif text-xs italic mt-2" style="color:var(--color-accent-red);">' + poet.tagline + '</p>'
      + '</div>'
      + '</div>'
      + '</div>'
      + '</div>';
  });

  html += '<div class="reveal mt-2 text-right">'
    + '<button class="btn-book-primary" id="btn-to-misi4">Lanjut ke Workshop →</button>'
    + '</div>'
    + '</div>';
  return html;
}

function renderMisi4() {
  var savedTitle  = localStorage.getItem('poem-title')   || '';
  var savedAuthor = localStorage.getItem('poem-author')  || '';
  var savedText   = localStorage.getItem('poem-content') || '';

  return '<div class="space-y-4">'
    + '<div class="reveal">'
    + '<p class="page-title">Workshop Menulis Puisi</p>'
    + '<div class="page-divider"><span>✦</span></div>'
    + '<p class="prose-text text-sm mt-2">Saatnya kamu menjadi penyair! Tuangkan perasaan dan pikiranmu dalam bait-bait puisi.</p>'
    + '</div>'
    + '<div class="reveal space-y-3">'
    + '<div>'
    + '<label class="font-serif text-xs font-semibold block mb-1" style="color:var(--color-ink-500); text-transform:uppercase; letter-spacing:.05em;">Judul Puisi</label>'
    + '<input id="poem-title-input" type="text" placeholder="Masukkan judul puisimu..." value="' + escapeAttr(savedTitle) + '"'
    + ' style="width:100%; padding:8px 12px; border:1px solid var(--color-paper-700); border-radius:3px; background:var(--color-paper-800); font-family:var(--font-serif); font-size:0.95rem; color:var(--color-ink-800);" />'
    + '</div>'
    + '<div>'
    + '<label class="font-serif text-xs font-semibold block mb-1" style="color:var(--color-ink-500); text-transform:uppercase; letter-spacing:.05em;">Nama Penyair</label>'
    + '<input id="poem-author-input" type="text" placeholder="Nama kamu..." value="' + escapeAttr(savedAuthor) + '"'
    + ' style="width:100%; padding:8px 12px; border:1px solid var(--color-paper-700); border-radius:3px; background:var(--color-paper-800); font-family:var(--font-serif); font-size:0.95rem; color:var(--color-ink-800);" />'
    + '</div>'
    + '<div>'
    + '<label class="font-serif text-xs font-semibold block mb-1" style="color:var(--color-ink-500); text-transform:uppercase; letter-spacing:.05em;">Isi Puisi</label>'
    + '<textarea id="poem-content-input" class="poem-write-area" placeholder="Tulis bait-bait puisimu di sini...\nSetiap baris adalah satu larik...">'
    + escapeHTML(savedText)
    + '</textarea>'
    + '</div>'
    + '<div class="flex flex-wrap gap-2 mt-2">'
    + '<button class="btn-book-primary" id="btn-save-poem">💾 Simpan</button>'
    + '<button class="btn-book-secondary" id="btn-download-poem">📄 Unduh PDF</button>'
    + '<button class="btn-book-secondary" id="btn-clear-poem" style="border-color:var(--color-accent-red); color:var(--color-accent-red);">🗑️ Hapus</button>'
    + '</div>'
    + '<p class="font-serif text-xs italic mt-1" style="color:var(--color-ink-300);">Puisi tersimpan otomatis di perangkat kamu.</p>'
    + '</div>'
    + '<div class="reveal mt-2 text-right">'
    + '<button class="btn-book-primary" id="btn-to-misi5">Lanjut ke Evaluasi →</button>'
    + '</div>'
    + '</div>';
}

function renderMisi5(quiz) {
  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return '<p class="prose-text">Data kuis tidak tersedia.</p>';
  }

  if (state.quizDone) {
    return renderQuizResult(quiz);
  }

  var q = quiz.questions[state.quizIndex];
  var total = quiz.questions.length;
  var pct = Math.round((state.quizIndex / total) * 100);

  return '<div class="space-y-4">'
    + '<div class="reveal">'
    + '<p class="page-title">Evaluasi & Kuis</p>'
    + '<div class="page-divider"><span>✦</span></div>'
    + '<div class="flex items-center gap-3 mt-2">'
    + '<div style="flex:1; height:6px; background:var(--color-paper-700); border-radius:3px; overflow:hidden;">'
    + '<div style="width:' + pct + '%; height:100%; background:var(--color-accent-red); border-radius:3px; transition:width 0.5s ease;"></div>'
    + '</div>'
    + '<span class="font-serif text-xs" style="color:var(--color-ink-300);">' + state.quizIndex + '/' + total + '</span>'
    + '</div>'
    + '</div>'
    + '<div class="reveal">'
    + '<div style="background:var(--color-paper-800); border-radius:4px; padding:16px; border:1px solid var(--color-paper-700);">'
    + '<p class="font-serif text-xs mb-2" style="color:var(--color-ink-300);">Pertanyaan ' + (state.quizIndex + 1) + ' dari ' + total + '</p>'
    + '<p class="prose-text font-semibold" style="color:var(--color-ink-900); font-size:0.9rem;">' + escapeHTML(q.question) + '</p>'
    + '</div>'
    + '</div>'
    + '<div class="reveal space-y-2">'
    + q.options.map(function(opt, i) {
        return '<button class="quiz-option-book" data-index="' + i + '" data-correct="' + q.correct + '">'
          + '<span style="min-width:22px; height:22px; border-radius:50%; border:1.5px solid var(--color-ink-300); display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-family:var(--font-serif);">'
          + String.fromCharCode(65 + i)
          + '</span>'
          + '<span>' + escapeHTML(opt) + '</span>'
          + '</button>';
      }).join('')
    + '</div>'
    + '<div class="reveal" id="quiz-feedback" style="display:none;"></div>'
    + '<div class="reveal mt-2 flex gap-2 justify-end" id="quiz-next-area" style="display:none;">'
    + '<button class="btn-book-primary" id="btn-quiz-next">'
    + (state.quizIndex + 1 < total ? 'Pertanyaan Berikutnya →' : 'Lihat Hasil ✓')
    + '</button>'
    + '</div>'
    + '</div>';
}

function renderQuizResult(quiz) {
  var total = quiz.questions.length;
  var pct = Math.round((state.quizScore / total) * 100);
  var grade = pct >= 80 ? '🏆 Luar Biasa!' : pct >= 60 ? '📚 Bagus!' : '💪 Terus Belajar!';

  return '<div class="space-y-5 text-center">'
    + '<div class="reveal">'
    + '<p class="page-title">Hasil Evaluasimu</p>'
    + '<div class="page-divider"><span>✦</span></div>'
    + '</div>'
    + '<div class="reveal" style="padding:24px; background:var(--color-paper-800); border-radius:4px; border:1px solid var(--color-paper-700);">'
    + '<p style="font-size:3rem; margin-bottom:8px;">' + (pct >= 80 ? '🏆' : pct >= 60 ? '🌟' : '💡') + '</p>'
    + '<p class="font-display font-bold" style="font-size:1.6rem; color:var(--color-ink-900);">' + pct + '%</p>'
    + '<p class="font-serif italic mb-3" style="color:var(--color-ink-500);">' + grade + '</p>'
    + '<p class="prose-text text-sm">Kamu menjawab benar <strong>' + state.quizScore + '</strong> dari <strong>' + total + '</strong> pertanyaan.</p>'
    + '</div>'
    + '<div class="reveal space-y-2">'
    + '<button class="btn-book-primary mx-auto" id="btn-quiz-retry">🔄 Ulangi Kuis</button>'
    + '<button class="btn-book-secondary mx-auto mt-2" id="btn-to-glosarium">📖 Buka Glosarium →</button>'
    + '</div>'
    + '</div>';
}

function renderGlosarium(glossary) {
  var categories = ['Semua'];
  glossary.forEach(function(item) {
    if (item.category && categories.indexOf(item.category) === -1) {
      categories.push(item.category);
    }
  });

  var html = '<div class="space-y-4">'
    + '<div class="reveal">'
    + '<p class="page-title">Glosarium Puisi</p>'
    + '<div class="page-divider"><span>✦</span></div>'
    + '<input id="glossary-search" type="search" placeholder="Cari istilah..." '
    + 'style="width:100%; padding:8px 12px; border:1px solid var(--color-paper-700); border-radius:3px; background:var(--color-paper-800); font-family:var(--font-serif); font-size:0.9rem; color:var(--color-ink-800); margin-top:8px;" />'
    + '</div>'
    + '<div class="reveal flex flex-wrap gap-2">'
    + categories.map(function(cat) {
        return '<button class="glossary-filter btn-book-secondary text-xs py-1 px-3" data-cat="' + cat + '">' + cat + '</button>';
      }).join('')
    + '</div>'
    + '<div class="reveal space-y-2" id="glossary-list">'
    + glossary.map(function(item) {
        return '<div class="glossary-card" data-term="' + escapeAttr(item.term) + '" data-category="' + escapeAttr(item.category || '') + '">'
          + '<div class="flex items-center justify-between mb-1">'
          + '<span class="glossary-term">' + escapeHTML(item.term) + '</span>'
          + (item.category ? '<span class="category-tag" style="color:var(--color-accent-gold); border-color:var(--color-accent-gold); font-size:0.65rem;">' + escapeHTML(item.category) + '</span>' : '')
          + '</div>'
          + '<p class="glossary-def">' + escapeHTML(item.definition) + '</p>'
          + '</div>';
      }).join('')
    + '</div>'
    + '</div>';
  return html;
}

function renderPenutup() {
  return '<div class="space-y-4">'
    + '<div class="reveal">'
    + '<p class="page-title">Daftar Pustaka</p>'
    + '<div class="page-divider"><span>✦</span></div>'
    + '<div class="prose-text space-y-3 text-sm">'
    + '<p>Aminuddin. (2010). <em>Pengantar Apresiasi Karya Sastra.</em> Bandung: Sinar Baru Algensindo.</p>'
    + '<p>Damono, Sapardi Djoko. (1983). <em>Hujan Bulan Juni.</em> Jakarta: Grasindo.</p>'
    + '<p>Djojosuroto, Kinayati. (2006). <em>Puisi: Pendekatan dan Pembelajaran.</em> Bandung: Nuansa.</p>'
    + '<p>Pradopo, Rachmat Djoko. (2012). <em>Pengkajian Puisi.</em> Yogyakarta: Gadjah Mada University Press.</p>'
    + '<p>Waluyo, Herman J. (1991). <em>Teori dan Apresiasi Puisi.</em> Jakarta: Erlangga.</p>'
    + '</div>'
    + '</div>'
    + '<div class="reveal" style="border-top:1px solid var(--color-paper-700); padding-top:20px;">'
    + '<p class="page-title text-lg">Kata Penutup</p>'
    + '<div class="prose-text space-y-3 text-sm mt-3">'
    + '<p>Perjalananmu menjelajahi dunia puisi telah sampai di penghujung. Semoga pengalaman ini membuka mata dan hatimu terhadap keindahan bahasa Indonesia.</p>'
    + '<p class="italic text-center mt-4" style="color:var(--color-accent-red); font-size:1rem;">"Jika kamu sudah membaca, kamu tidak pernah benar-benar kesepian."</p>'
    + '<p class="text-center" style="color:var(--color-ink-300); font-size:0.8rem;">— Chairil Anwar</p>'
    + '</div>'
    + '</div>'
    + '<div class="reveal mt-6 flex justify-center">'
    + '<button class="btn-book-secondary text-xs" style="padding:6px 12px; display:flex; align-items:center; gap:6px;" id="btn-show-developer"><span>ℹ️</span> Informasi Pengembang</button>'
    + '</div>'
    + '<div id="developer-info-card" class="hidden animate-popup mx-auto" style="max-width:260px; background:var(--color-paper-950); border:1px solid var(--color-paper-700); padding:16px; border-radius:6px; font-size:13px; color:var(--color-ink-800); text-align:center; margin-top:12px; box-shadow:0 4px 12px rgba(0,0,0,0.1);">'
    + '<p class="font-bold mb-1" style="color:var(--color-ink-900);">Pengembang Sistem</p>'
    + '<p class="mb-3">Nina Wulandari</p>'
    + '<p class="font-serif text-xs italic" style="color:var(--color-ink-500);">Untuk Tugas Akhir:</p>'
    + '<p class="font-bold" style="color:var(--color-ink-900);">Firyal Nur Wulanti</p>'
    + '</div>'
    + '<div class="reveal text-center mt-6">'
    + '<button class="btn-book-primary" id="btn-restart">↩ Kembali ke Awal</button>'
    + '</div>'
    + '</div>';
}

// ─── INIT INTERAKTIVITAS SETELAH RENDER ────────────────────────

function initPageContent(page) {
  // Navigasi lanjut dari tombol dalam halaman
  bindPageNav('btn-to-misi2', 4);
  bindPageNav('btn-to-misi3', 5);
  bindPageNav('btn-to-misi4', 6);
  bindPageNav('btn-to-misi5', 7);
  bindPageNav('btn-to-glosarium', 8);

  var restartBtn = document.getElementById('btn-restart');
  if (restartBtn) restartBtn.addEventListener('click', function() {
    showCover();
    state.currentPage = 0;
    updateBookTabs(0);
    window.scrollTo(0, 0);
  });

  // Tombol informasi pengembang
  var btnDev = document.getElementById('btn-show-developer');
  var devCard = document.getElementById('developer-info-card');
  if (btnDev && devCard) {
    btnDev.addEventListener('click', function() {
      devCard.classList.toggle('hidden');
    });
  }

  // Klik kata analisis
  document.querySelectorAll('.word-tap').forEach(function(el) {
    el.addEventListener('click', function() {
      try {
        var analysis = JSON.parse(el.getAttribute('data-analysis'));
        openWordModal(analysis, el.textContent);
      } catch(e) {}
    });
  });

  // Foto pop-up: klik untuk membesar
  document.querySelectorAll('.popup-image-card').forEach(function(card) {
    card.style.cursor = 'pointer';
    card.addEventListener('click', function() {
      var src = card.getAttribute('data-src');
      var caption = card.getAttribute('data-caption');
      var desc = card.getAttribute('data-desc');
      openImageModal(src, caption, desc);
    });
  });

  // Daftar isi bab (jika ada di halaman konten)
  document.querySelectorAll('#page-content .chapter-item').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var n = parseInt(btn.getAttribute('data-page'));
      if (n) goToPage(n);
    });
  });

  // Workshop
  initWorkshopListeners();

  // Kuis
  initQuizListeners();

  // Glosarium
  initGlossaryListeners();

  // Scroll reveal
  setTimeout(initScrollReveal, 100);
}

function bindPageNav(btnId, pageNum) {
  var btn = document.getElementById(btnId);
  if (btn) btn.addEventListener('click', function() { goToPage(pageNum); });
}

// ─── WORKSHOP LISTENERS ─────────────────────────────────────────

function initWorkshopListeners() {
  var titleInput   = document.getElementById('poem-title-input');
  var authorInput  = document.getElementById('poem-author-input');
  var contentInput = document.getElementById('poem-content-input');
  var saveBtn      = document.getElementById('btn-save-poem');
  var downloadBtn  = document.getElementById('btn-download-poem');
  var clearBtn     = document.getElementById('btn-clear-poem');

  if (!contentInput) return;

  // Auto-save on input
  [titleInput, authorInput, contentInput].forEach(function(el) {
    if (!el) return;
    el.addEventListener('input', function() {
      if (titleInput)   localStorage.setItem('poem-title',   titleInput.value);
      if (authorInput)  localStorage.setItem('poem-author',  authorInput.value);
      if (contentInput) localStorage.setItem('poem-content', contentInput.value);
    });
  });

  if (saveBtn) saveBtn.addEventListener('click', function() {
    saveBtn.textContent = '✓ Tersimpan!';
    setTimeout(function() { saveBtn.textContent = '💾 Simpan'; }, 2000);
  });

  if (clearBtn) clearBtn.addEventListener('click', function() {
    if (!confirm('Hapus puisi yang sudah ditulis?')) return;
    if (titleInput)   titleInput.value   = '';
    if (authorInput)  authorInput.value  = '';
    if (contentInput) contentInput.value = '';
    localStorage.removeItem('poem-title');
    localStorage.removeItem('poem-author');
    localStorage.removeItem('poem-content');
  });

  if (downloadBtn) downloadBtn.addEventListener('click', function() {
    var title   = (titleInput && titleInput.value.trim())   || 'Puisi Saya';
    var author  = (authorInput && authorInput.value.trim()) || '';
    var content = (contentInput && contentInput.value.trim()) || '';

    if (window.jspdf && window.jspdf.jsPDF) {
      var doc = new window.jspdf.jsPDF();
      var y = 20;
      doc.setFontSize(18);
      doc.text(title, 20, y); y += 10;
      if (author) { doc.setFontSize(12); doc.text('Karya: ' + author, 20, y); y += 10; }
      doc.line(20, y, 190, y); y += 10;
      doc.setFontSize(12);
      var lines = doc.splitTextToSize(content, 170);
      doc.text(lines, 20, y);
      doc.save(title.replace(/[^a-z0-9]/gi, '_') + '_puisi.pdf');
    } else {
      // Fallback txt
      var text = title + '\n' + (author ? 'Karya: ' + author + '\n' : '') + '\n' + '─'.repeat(30) + '\n\n' + content;
      var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = title.replace(/[^a-z0-9]/gi, '_') + '_puisi.txt';
      a.click();
      URL.revokeObjectURL(a.href);
    }
  });
}

// ─── KUIS LISTENERS ─────────────────────────────────────────────

function initQuizListeners() {
  document.querySelectorAll('.quiz-option-book').forEach(function(btn) {
    btn.addEventListener('click', function() {
      if (state.quizAnswered) return;
      state.quizAnswered = true;

      var chosen  = parseInt(btn.getAttribute('data-index'));
      var correct = parseInt(btn.getAttribute('data-correct'));
      var isRight = chosen === correct;

      if (isRight) state.quizScore++;

      // Tandai semua opsi
      document.querySelectorAll('.quiz-option-book').forEach(function(b) {
        var idx = parseInt(b.getAttribute('data-index'));
        b.classList.add('disabled');
        if (idx === correct) b.classList.add('correct');
        if (idx === chosen && !isRight) b.classList.add('wrong');
      });

      // Feedback
      var feedback = document.getElementById('quiz-feedback');
      if (feedback) {
        feedback.style.display = 'block';
        feedback.innerHTML = '<div style="padding:12px 16px; border-radius:4px; border:1px solid ' + (isRight ? '#2d6a4f' : 'var(--color-accent-red)') + '; background:' + (isRight ? 'rgba(45,106,79,0.08)' : 'rgba(139,26,26,0.06)') + ';">'
          + '<p class="font-serif font-semibold text-sm" style="color:' + (isRight ? '#2d6a4f' : 'var(--color-accent-red)') + ';">'
          + (isRight ? '✓ Benar! ' : '✗ Belum tepat. ')
          + '</p>'
          + '<p class="prose-text text-xs mt-1">' + escapeHTML(DATA.quiz.quiz.questions[state.quizIndex].explanation || '') + '</p>'
          + '</div>';
      }

      var nextArea = document.getElementById('quiz-next-area');
      if (nextArea) nextArea.style.display = 'flex';

      var nextBtn = document.getElementById('btn-quiz-next');
      if (nextBtn) nextBtn.addEventListener('click', function() {
        state.quizIndex++;
        state.quizAnswered = false;
        if (state.quizIndex >= DATA.quiz.quiz.questions.length) {
          state.quizDone = true;
        }
        renderPage(state.currentPage, true);
      }, { once: true });
    });
  });

  var retryBtn = document.getElementById('btn-quiz-retry');
  if (retryBtn) retryBtn.addEventListener('click', function() {
    state.quizIndex   = 0;
    state.quizScore   = 0;
    state.quizDone    = false;
    state.quizAnswered = false;
    renderPage(state.currentPage, true);
  });
}

// ─── GLOSARIUM LISTENERS ────────────────────────────────────────

function initGlossaryListeners() {
  var searchEl = document.getElementById('glossary-search');
  var listEl   = document.getElementById('glossary-list');

  function filterGlossary(query, cat) {
    if (!listEl) return;
    listEl.querySelectorAll('.glossary-card').forEach(function(card) {
      var term  = (card.getAttribute('data-term')     || '').toLowerCase();
      var catVal= (card.getAttribute('data-category') || '').toLowerCase();
      var matchQ = !query || term.includes(query.toLowerCase());
      var matchC = !cat || cat === 'semua' || catVal === cat.toLowerCase();
      card.style.display = (matchQ && matchC) ? '' : 'none';
    });
  }

  var activeCat = 'semua';
  if (searchEl) searchEl.addEventListener('input', function() {
    filterGlossary(searchEl.value, activeCat);
  });

  document.querySelectorAll('.glossary-filter').forEach(function(btn) {
    btn.addEventListener('click', function() {
      activeCat = btn.getAttribute('data-cat');
      document.querySelectorAll('.glossary-filter').forEach(function(b) {
        b.style.borderColor = '';
        b.style.color = '';
      });
      btn.style.borderColor = 'var(--color-accent-gold)';
      btn.style.color = 'var(--color-accent-gold)';
      filterGlossary(searchEl ? searchEl.value : '', activeCat);
    });
  });
}

// ─── MODAL KATA ──────────────────────────────────────────────────

function openWordModal(analysis, word) {
  document.getElementById('modal-word-title').textContent = word || '';
  document.getElementById('modal-word-label').textContent = analysis.label || '';
  document.getElementById('modal-word-jenis').textContent = analysis.jenis || '';
  document.getElementById('modal-word-makna').textContent = analysis.makna || '';
  document.getElementById('modal-word-unsur').textContent = analysis.unsur || '';
  document.getElementById('modal-word-analysis').classList.add('open');
}

function closeWordModal() {
  document.getElementById('modal-word-analysis').classList.remove('open');
}

// ─── MODAL GAMBAR ────────────────────────────────────────────────

function openImageModal(src, caption, desc) {
  document.getElementById('modal-popup-img').src = src;
  document.getElementById('modal-popup-img').alt = caption;
  document.getElementById('modal-popup-caption').textContent = caption;
  document.getElementById('modal-popup-desc').textContent = desc || '';
  document.getElementById('modal-image-popup').classList.add('open');
}

function closeImageModal() {
  document.getElementById('modal-image-popup').classList.remove('open');
}

// ─── SCROLL REVEAL ───────────────────────────────────────────────

function initScrollReveal() {
  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal:not(.visible)').forEach(function(el) {
    obs.observe(el);
  });
}

// ─── UTILITAS ───────────────────────────────────────────────────

function toRoman(n) {
  var val = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  var sym = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
  var r = '';
  for (var i = 0; i < val.length; i++) {
    while (n >= val[i]) { r += sym[i]; n -= val[i]; }
  }
  return r;
}

function escapeHTML(str) {
  if (typeof str !== 'string') return String(str || '');
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function escapeAttr(str) {
  if (typeof str !== 'string') str = JSON.stringify(str);
  return str.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')
            .replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ─── SWIPE TOUCH (MOBILE) ────────────────────────────────────────

function initSwipe() {
  var startX = 0;
  var spread = document.getElementById('book-spread');
  if (!spread) return;

  spread.addEventListener('touchstart', function(e) {
    startX = e.changedTouches[0].clientX;
  }, { passive: true });

  spread.addEventListener('touchend', function(e) {
    var dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) goToPage(state.currentPage + 1);
    else         goToPage(state.currentPage - 1);
  }, { passive: true });
}

// ─── KEYBOARD ────────────────────────────────────────────────────

function initKeyboard() {
  document.addEventListener('keydown', function(e) {
    var overlay1 = document.getElementById('modal-word-analysis');
    var overlay2 = document.getElementById('modal-image-popup');
    if (e.key === 'Escape') {
      if (overlay1 && overlay1.classList.contains('open')) closeWordModal();
      if (overlay2 && overlay2.classList.contains('open')) closeImageModal();
      return;
    }
    if (document.activeElement && ['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
    if (e.key === 'ArrowRight') goToPage(state.currentPage + 1);
    if (e.key === 'ArrowLeft')  goToPage(state.currentPage - 1);
  });
}

// ─── EVENT LISTENERS UTAMA ──────────────────────────────────────

function initCoreListeners() {
  // Sampul: klik untuk buka buku
  var cover = document.getElementById('book-cover');
  var openBtn = document.getElementById('btn-open-book');
  if (cover)   cover.addEventListener('click',   openBook);
  if (openBtn) openBtn.addEventListener('click', function(e) { e.stopPropagation(); openBook(); });
  cover && cover.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') openBook();
  });

  // Tutup buku
  var backBtn = document.getElementById('btn-cover-back');
  if (backBtn) backBtn.addEventListener('click', showCover);

  // Prev/Next halaman
  var prevBtn = document.getElementById('btn-prev-page');
  var nextBtn = document.getElementById('btn-next-page');
  if (prevBtn) prevBtn.addEventListener('click', function() { goToPage(state.currentPage - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function() { goToPage(state.currentPage + 1); });


  // Modal word close
  var wClose = document.getElementById('btn-close-word-modal');
  if (wClose) wClose.addEventListener('click', closeWordModal);
  var wOverlay = document.getElementById('modal-word-analysis');
  if (wOverlay) wOverlay.addEventListener('click', function(e) {
    if (e.target === wOverlay) closeWordModal();
  });

  // Modal image close
  var iClose = document.getElementById('btn-close-image-modal');
  if (iClose) iClose.addEventListener('click', closeImageModal);
  var iOverlay = document.getElementById('modal-image-popup');
  if (iOverlay) iOverlay.addEventListener('click', function(e) {
    if (e.target === iOverlay) closeImageModal();
  });
}

// ─── BOOTSTRAP ───────────────────────────────────────────────────

function bootstrap() {
  loadData();
  buildPages();
  buildBookTabs();
  initCoreListeners();
  initSwipe();
  initKeyboard();
  showCover();

  console.log('📖 Petualangan Puisi Nusantara — Buku terbuka!');
  console.log('   Halaman tersedia:', PAGES.length);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
