/* ═══════════════════════════════════════════════════════════════
   Buku Pengayaan — app.js
   Sistem Buku Interaktif dengan Pop-Up Gambar
   ═══════════════════════════════════════════════════════════════ */

'use strict';

// ─── DATA ───────────────────────────────────────────────────────
var DATA = {};

function loadData() {
  ['poets', 'poems', 'quiz', 'glossary', 'poet-images', 'mission-images', 'bibliography'].forEach(function (key) {
    var el = document.getElementById('data-' + key);
    if (el) {
      try { DATA[key] = JSON.parse(el.textContent); }
      catch (e) { console.warn('Failed to parse data-' + key, e); DATA[key] = null; }
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
  var poems = (DATA.poems && DATA.poems.poems) || [];
  var poets = (DATA.poets && DATA.poets.poets) || [];
  var quiz = (DATA.quiz && DATA.quiz.quiz) || {};
  var glossary = (DATA.glossary && DATA.glossary.glossary) || [];
  var missionImgs = DATA['mission-images'] || [];
  var poetImgs = DATA['poet-images'] || {};

  PAGES = [
    // 1. Kata Pengantar
    {
      id: 'pengantar',
      chapter: 'Halaman i',
      leftTitle: 'Halaman i',
      rightTitle: 'Kata Pengantar',
      leftIllustration: missionImgs[0] || null,
      render: function () { return renderPengantar(); }
    },
    // 2. Daftar Isi
    {
      id: 'daftar-isi',
      chapter: 'Halaman ii',
      leftTitle: 'Halaman ii',
      rightTitle: 'Daftar Isi',
      leftIllustration: missionImgs[1] || null,
      render: function () { return renderDaftarIsi(); }
    },
    // 3. Petunjuk Penggunaan Buku
    {
      id: 'petunjuk',
      chapter: 'Halaman iii',
      leftTitle: 'Halaman iii',
      rightTitle: 'Petunjuk Penggunaan',
      leftIllustration: missionImgs[2] || null,
      render: function () { return renderPetunjuk(); }
    },
    // 4. Pembelajaran - Pendahuluan
    {
      id: 'pendahuluan',
      chapter: 'Halaman 1',
      leftTitle: 'Pembelajaran',
      rightTitle: 'A. Pendahuluan',
      leftIllustration: missionImgs[3] || null,
      render: function () { return renderHalamanDinamis('pendahuluan'); }
    },
    // 5. Uraian Materi - Hakikat Puisi
    {
      id: 'hakikat-puisi',
      chapter: 'Halaman 2',
      leftTitle: 'Pembelajaran',
      rightTitle: '1. Hakikat Puisi',
      leftIllustration: missionImgs[4] || null,
      render: function () { return renderHalamanDinamis('hakikat-puisi'); }
    },
    // 6. Uraian Materi - Puisi & Sosial
    {
      id: 'puisi-sosial',
      chapter: 'Halaman 3',
      leftTitle: 'Pembelajaran',
      rightTitle: '2. Puisi dan Kehidupan Sosial',
      leftIllustration: missionImgs[5] || null,
      render: function () { return renderPuisiSosial(); }
    },
    // 7. Uraian Materi - Representasi Realitas
    {
      id: 'puisi-representasi',
      chapter: 'Halaman 4',
      leftTitle: 'Pembelajaran',
      rightTitle: '3. Puisi sebagai Representasi Realitas Sosial',
      render: function () { return renderPuisiRepresentasi(); }
    },
    // 8. Uraian Materi - Pengungsian
    {
      id: 'puisi-pengungsian',
      chapter: 'Halaman 5',
      leftTitle: 'Pembelajaran',
      rightTitle: '4. Pengungsian sebagai Representasi Realitas Sosial',
      render: function () { return renderPuisiPengungsian(); }
    },
    // 9. Analisis Puisi 1
    {
      id: 'analisis-puisi-1',
      chapter: 'Halaman 6',
      leftTitle: 'Pembelajaran',
      rightTitle: '● Analisis Puisi 1 — Kepada Langit',
      render: function () { return renderAnalisisPuisi('analisis-puisi-1', 'analisis-puisi-2'); }
    },
    // 10. Analisis Puisi 2
    {
      id: 'analisis-puisi-2',
      chapter: 'Halaman 7',
      leftTitle: 'Pembelajaran',
      rightTitle: '● Analisis Puisi 2 — Pertanyaan',
      render: function () { return renderAnalisisPuisi('analisis-puisi-2', 'analisis-puisi-3'); }
    },
    // 11. Analisis Puisi 3
    {
      id: 'analisis-puisi-3',
      chapter: 'Halaman 8',
      leftTitle: 'Pembelajaran',
      rightTitle: '● Analisis Puisi 3 — Waktu Pun Terhenti',
      render: function () { return renderAnalisisPuisi('analisis-puisi-3', 'analisis-puisi-4'); }
    },
    // 12. Analisis Puisi 4
    {
      id: 'analisis-puisi-4',
      chapter: 'Halaman 9',
      leftTitle: 'Pembelajaran',
      rightTitle: '● Analisis Puisi 4 — Atas Nama Negara',
      render: function () { return renderAnalisisPuisi('analisis-puisi-4', 'analisis-puisi-5'); }
    },
    // 13. Analisis Puisi 5
    {
      id: 'analisis-puisi-5',
      chapter: 'Halaman 10',
      leftTitle: 'Pembelajaran',
      rightTitle: '● Analisis Puisi 5 — Suara dari Pengungsian',
      render: function () { return renderAnalisisPuisi('analisis-puisi-5', 'rangkuman'); }
    },

    // 9. Rangkuman
    {
      id: 'rangkuman',
      chapter: 'Halaman 11',
      leftTitle: 'Pembelajaran',
      rightTitle: 'C. Rangkuman',
      render: function () { return renderRangkuman(); }
    },
    // 10. Kuis
    {
      id: 'kuis',
      chapter: 'Halaman 12',
      leftTitle: 'Pembelajaran',
      rightTitle: 'D. Kuis',
      render: function () { return renderKuis(quiz); }
    },
    // 11. Glosarium
    {
      id: 'glosarium',
      chapter: 'Halaman iv',
      leftTitle: 'Halaman iv',
      rightTitle: 'Glosarium',
      render: function () { return renderGlosarium(glossary); }
    },
    // 12. Daftar Pustaka
    {
      id: 'daftar-pustaka',
      chapter: 'Halaman v',
      leftTitle: 'Halaman v',
      rightTitle: 'Daftar Pustaka',
      render: function () { return renderDaftarPustaka((DATA.bibliography && DATA.bibliography.bibliography) || []); }
    },
    // 13. Biografi Penulis
    {
      id: 'biografi',
      chapter: 'Halaman vi',
      leftTitle: 'Halaman vi',
      rightTitle: 'Biografi Penulis',
      render: function () { return renderBiografi(); }
    }
  ];

  // Pastikan semua halaman memiliki gambar cover
  var imgIndex = 6; // Mulai dari index ke-6 karena 0-5 biasanya sudah dipakai hardcode di atas
  PAGES.forEach(function (page) {
    if (!page.leftIllustration && missionImgs.length > 0) {
      page.leftIllustration = missionImgs[imgIndex % missionImgs.length];
      imgIndex++;
    }
  });
}

// ─── NAVIGASI HALAMAN ───────────────────────────────────────────

function showCover() {
  document.getElementById('scene-cover').classList.remove('hidden');
  document.getElementById('scene-cover').classList.add('flex');
  document.getElementById('scene-book').classList.add('hidden');
  document.getElementById('scene-book').classList.remove('flex');
}

function openBook() {
  document.getElementById('scene-cover').classList.add('hidden');
  document.getElementById('scene-cover').classList.remove('flex');
  document.getElementById('scene-book').classList.remove('hidden');
  document.getElementById('scene-book').classList.add('flex');
  if (state.currentPage === 0) state.currentPage = 1;

  // Render and initialize the current page without animation
  renderDOM(state.currentPage);
  initPageContent(PAGES[state.currentPage - 1]);
}

function goToPage(n, skipAnimation) {
  if (n < 1 || n > PAGES.length) return;
  var oldN = state.currentPage;
  if (n === oldN && !skipAnimation) return;
  state.currentPage = n;

  var isNext = n > oldN;
  var isMobile = window.innerWidth <= 1024;

  if (skipAnimation) {
    renderDOM(n);
    var newPage = PAGES[n - 1];
    if (newPage) initPageContent(newPage);
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
      frontEl.innerHTML = '<div class="page-corner-ornament top-right"></div><div id="page-content">' + oldRightHTML + '</div><div class="page-number-right">' + (oldN * 2) + '</div>';

      backEl.className += ' book-page-left';
      backEl.innerHTML = '<div class="page-corner-ornament top-left"></div><div id="page-left-content">' + newLeftHTML + '</div><div class="page-number-left">' + toRoman(n * 2 - 1) + '</div><div class="page-corner-ornament bottom-left"></div>';

      renderDOM(n); // Render new state underneath

      requestAnimationFrame(function () {
        flipEl.style.animation = 'flipToLeft ' + animDuration + 'ms cubic-bezier(0.645, 0.045, 0.355, 1) forwards';
      });

    } else {
      // Flip Kiri ke Kanan
      flipEl.style.transformOrigin = 'right center';
      flipEl.style.left = '0';
      flipEl.style.width = '50%';

      frontEl.className += ' book-page-left';
      frontEl.innerHTML = '<div class="page-corner-ornament top-left"></div><div id="page-left-content">' + oldLeftHTML + '</div><div class="page-number-left">' + toRoman(oldN * 2 - 1) + '</div><div class="page-corner-ornament bottom-left"></div>';

      backEl.className += ' book-page-right';
      backEl.innerHTML = '<div class="page-corner-ornament top-right"></div><div id="page-content">' + newRightHTML + '</div><div class="page-number-right">' + (n * 2) + '</div>';

      renderDOM(n); // Render new state underneath

      requestAnimationFrame(function () {
        flipEl.style.animation = 'flipToRight ' + animDuration + 'ms cubic-bezier(0.645, 0.045, 0.355, 1) forwards';
      });
    }

    setTimeout(function () {
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
      frontEl.innerHTML = '<div class="page-corner-ornament top-right"></div><div id="page-content">' + oldRightHTML + '</div><div class="page-number-right">' + (oldN * 2) + '</div>';

      backEl.innerHTML = ''; // Tidak terlihat

      renderDOM(n);

      requestAnimationFrame(function () {
        flipEl.style.animation = 'flipToLeft ' + animDuration + 'ms cubic-bezier(0.645, 0.045, 0.355, 1) forwards';
      });

      setTimeout(function () {
        if (flipEl.parentNode) flipEl.parentNode.removeChild(flipEl);
        initPageContent(newPage);
      }, animDuration);

    } else {
      // Flip page in from left
      frontEl.innerHTML = ''; // Tidak terlihat

      backEl.className += ' book-page-right';
      backEl.innerHTML = '<div class="page-corner-ornament top-right"></div><div id="page-content">' + newRightHTML + '</div><div class="page-number-right">' + (n * 2) + '</div>';

      // Jangan renderDOM dulu agar halaman lama masih terlihat di bawah
      flipEl.style.transform = 'rotateY(-180deg)';

      requestAnimationFrame(function () {
        // Hapus initial transform karena animation akan dioverride, tapi karena kita mau reverse flipToLeft:
        flipEl.style.animation = 'flipToRight ' + animDuration + 'ms cubic-bezier(0.645, 0.045, 0.355, 1) forwards';
        // Wait, flipToRight is 0 to 180. We need -180 to 0!
        flipEl.style.animation = 'none';
        flipEl.style.transition = 'transform ' + animDuration + 'ms cubic-bezier(0.645, 0.045, 0.355, 1)';
        flipEl.style.transform = 'rotateY(0deg)';
      });

      setTimeout(function () {
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
    var pageRight = document.getElementById('page-right');
    // Selalu hapus dulu mobile-cover-active sebelum menentukan ulang
    if (pageRight) pageRight.classList.remove('mobile-cover-active');

    if (window.innerWidth <= 1024) {
      var coverImg = mobileCoverEl.querySelector('.animate-breathing');

      if (coverImg && page.leftIllustration) {
        if (pageRight) pageRight.classList.add('mobile-cover-active');
        coverImg.style.cursor = 'pointer';
        coverImg.onclick = function () {
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
      // Jika tidak ada gambar: mobile-cover-active sudah dihapus di atas,
      // sehingga page-content langsung tampil dan mobile-cover-content tersembunyi
    }
  }

  var contentEl = document.getElementById('page-content');
  if (contentEl) {
    contentEl.innerHTML = page.render();
    contentEl.style.opacity = '1';
  }

  // Update text & UI state
  var pageLabel = document.getElementById('page-label');
  var pageInfoBot = document.getElementById('page-info-bottom');
  var pageInfoTop = document.getElementById('page-info-top');

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
    setTimeout(function () {
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
  // Ukuran panjang x lebar disesuaikan dengan proporsi 4:3 (portrait 3:4 = lebar 120px, tinggi 160px)
  return '<div class="popup-image-container" style="display:flex; justify-content:center; padding-top:20px;">'
    + '<div class="popup-image-card" id="' + (extraId || '') + '" '
    + 'data-src="' + src + '" data-caption="' + alt + '" data-desc="' + caption + '" '
    + 'style="width: 150px; height: 200px; margin: 0 auto; box-shadow: 2px 4px 10px rgba(0,0,0,0.3);">'
    + '<img src="' + src + '" alt="' + alt + '" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;">'
    + '</div>'
    + '<div class="popup-image-caption" style="margin-top:12px; font-size:0.85rem; font-weight:bold; color:var(--color-ink-900); text-align:center;">' + alt + '</div>'
    + '</div>';
}

// ─── TAB BOOKMARK ATAS BUKU ──────────────────────────────────────

function buildBookTabs() {
  var bar = document.getElementById('book-tabs-bar');
  if (!bar) return;

  bar.innerHTML = PAGES.map(function (page, i) {
    var n = i + 1;
    return '<button class="book-tab" data-page="' + n + '" id="tab-' + page.id + '">'
      + '<span class="tab-num">' + page.chapter + '</span>'
      + page.rightTitle
      + '</button>';
  }).join('');

  bar.innerHTML += '<button class="book-tab" id="btn-close-book" style="color:var(--color-accent-red); margin-left:auto;">'
    + '<span class="tab-num">Keluar</span>Tutup</button>';

  bar.querySelectorAll('.book-tab[data-page]').forEach(function (btn) {
    btn.addEventListener('click', function () {
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
  document.querySelectorAll('.book-tab').forEach(function (btn) {
    var n = parseInt(btn.getAttribute('data-page'));
    btn.classList.toggle('active', n === activePage);
  });
}

function updateProgressDots(activePage) {
  var container = document.getElementById('progress-dots');
  if (!container) return;
  container.innerHTML = PAGES.map(function (_, i) {
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
    html += '<div class="mx-auto my-4 flex justify-center">'
      + '<div class="animate-breathing" style="position:relative; width: 150px; height: 200px; border-radius:4px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.3); border:4px solid #fff;">'
      + '<img src="' + img.src + '" alt="' + escapeAttr(img.alt) + '" loading="lazy"'
      + ' style="width:100%; height:100%; object-fit:cover; display:block;">'
      + '<div class="popup-image-caption" style="text-align:center;">' + escapeHTML(img.alt) + '</div>'
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
    + 'Suara dari Pengungsian: Membaca Puisi, Memaknai Realitas Kehidupan</p>'
    + '</div>';

  html += '</div>';
  return html;
}



// ─── RENDER KONTEN TIAP HALAMAN ──────────────────────────────────

function renderPengantar() {
  return '<div class="reveal">'
    + '<p class="page-title">Kata Pengantar</p>'
    + '<div class="page-divider"><span>✦</span></div>'
    + '<div class="prose-text space-y-3 mt-4 text-justify">'
    + '<p class="indent-8">Puji syukur ke hadirat Tuhan Yang Maha Esa atas rahmat dan karunia-Nya sehingga buku pengayaan materi Puisi untuk peserta didik kelas XI ini dapat diselesaikan dengan baik.</p>'
    + '<p class="indent-8">Buku pengayaan ini disusun sebagai pendamping pembelajaran Bahasa Indonesia yang diharapkan dapat membantu peserta didik memahami puisi dengan lebih mudah dan menyenangkan. Melalui buku ini, peserta didik akan mempelajari berbagai materi tentang puisi, mulai dari pengertian, unsur-unsur pembangun, cara memahami makna puisi, hingga mengapresiasi puisi sebagai karya sastra yang dekat dengan kehidupan sehari-hari. Materi disajikan secara runtut dan dilengkapi dengan contoh, rangkuman, serta kuis agar peserta didik dapat belajar secara mandiri maupun bersama guru di kelas.</p>'
    + '<p class="indent-8">Puisi tidak hanya berisi rangkaian kata-kata yang indah, tetapi juga menyampaikan perasaan, pengalaman, gagasan, dan berbagai persoalan yang terjadi dalam kehidupan. Oleh karena itu, melalui buku ini diharapkan peserta didik dapat mengembangkan kemampuan berpikir kritis, kreativitas, empati, serta kepekaan terhadap lingkungan sosial di sekitarnya. Selain itu, peserta didik juga diharapkan semakin percaya diri dalam mengungkapkan ide dan perasaannya melalui karya sastra.</p>'
    + '<p class="indent-8">Penulis berharap buku pengayaan ini dapat menjadi sumber belajar yang bermanfaat dan menambah semangat peserta didik dalam mempelajari puisi. Penulis juga menyadari bahwa buku ini masih memiliki kekurangan. Oleh karena itu, kritik dan saran yang membangun sangat diharapkan sebagai bahan perbaikan di masa mendatang. Semoga buku ini dapat memberikan manfaat bagi peserta didik, guru, dan semua pihak yang menggunakannya dalam proses pembelajaran Bahasa Indonesia.</p>'
    + '</div>'
    + '<div class="mt-6 text-right">'
    + '<p class="font-serif text-sm italic pb-6" style="color:var(--color-ink-500);">Bandung, 14 Juli 2026<br><br></br>Penulis</p>'
    + '</div>'
    + '</div>';
}

function renderDaftarIsi() {
  var html = '<div class="reveal">'
    + '<p class="page-title">Daftar Isi</p>'
    + '<div class="page-divider"><span>✦</span></div>'
    + '<p class="prose-text text-sm mt-2 mb-4">Klik bab mana saja untuk langsung membuka halamannya.</p>'
    + '<div class="space-y-1" style="display: flex; flex-direction: column; gap: 4px;">';

  var hasRenderedPembelajaran = false;
  var hasRenderedUraianMateri = false;

  PAGES.forEach(function (page, i) {
    if (page.id.startsWith('analisis-puisi-')) return;

    var n = i + 1;
    var title = page.rightTitle || "";

    // ─── SISIPAN 1: LEVEL 1 (Pembelajaran) ───
    if (/a\.\s+pendahuluan/i.test(title) && !hasRenderedPembelajaran) {
      html += '<button class="chapter-item" data-page="' + n + '" style="display: flex; align-items: flex-end; width: 100%; text-align: left; background: transparent; border: none; cursor: pointer; padding-top: 4px; padding-bottom: 4px; padding-left: 0px; font-weight: bold; color: #1f2937;">'
        + '<span style="flex-shrink: 0; padding-right: 4px;">Pembelajaran</span>'
        + '<span style="flex-grow: 1; border-bottom: 1px dotted #9ca3af; margin: 0 4px; margin-bottom: 3px;"></span>'
        + '<span style="flex-shrink: 0; padding-left: 4px; text-align: right; min-w: 24px;">1</span>'
        + '</button>';
      hasRenderedPembelajaran = true;
    }

    // ─── SISIPAN 2: LEVEL 2 (B. Uraian Materi) ───
    if (/^1\.\s+hakikat/i.test(title) && !hasRenderedUraianMateri) {
      html += '<button class="chapter-item" data-page="' + n + '" style="display: flex; align-items: flex-end; width: 100%; text-align: left; background: transparent; border: none; cursor: pointer; padding-top: 4px; padding-bottom: 4px; padding-left: 16px; font-weight: 600; font-size: 0.875rem; color: #374151;">'
        + '<span style="flex-shrink: 0; padding-right: 4px;">B. Uraian Materi</span>'
        + '<span style="flex-grow: 1; border-bottom: 1px dotted #9ca3af; margin: 0 4px; margin-bottom: 3px;"></span>'
        + '<span style="flex-shrink: 0; padding-left: 4px; text-align: right; min-w: 24px;">1</span>'
        + '</button>';
      hasRenderedUraianMateri = true;
    }

    // ─── PENGATURAN LEVEL INDENTASI ITEM ASLI ───
    var paddingLeft = "0px";   // Level 1: Mepet kiri (Kata Pengantar, Daftar Isi, Petunjuk, Pembelajaran, Glosarium, dll)
    var textStyle = "font-weight: bold; color: #1f2937;";

    if (/^[A-Za-z]\.\s/.test(title)) {
      // Level 2: Menjorok 16px (A. Pendahuluan, B. Uraian Materi, C. Rangkuman, D. Kuis)
      paddingLeft = "16px";
      textStyle = "font-weight: 600; font-size: 0.875rem; color: #374151;";
    } else if (/^\d+\.\s/.test(title)) {
      // Level 3: Menjorok 32px (1. Hakikat Puisi, 2. Puisi & Sosial, dst)
      paddingLeft = "32px";
      textStyle = "font-weight: normal; font-size: 0.875rem; color: #4b5563; opacity: 0.95;";
    }

    // Bersihkan penulisan nomor halaman untuk Daftar Isi
    var pageNum = page.chapter.replace("Halaman ", "").replace("Hal. ", "").trim();

    // Penyelarasan nama khusus untuk Petunjuk Penggunaan
    var displayTitle = title;
    if (/petunjuk/i.test(title)) {
      displayTitle = "Petunjuk Penggunaan Buku";
    }

    // Render tombol utama asli dari array PAGES
    html += '<button class="chapter-item" data-page="' + n + '" style="display: flex; align-items: flex-end; width: 100%; text-align: left; background: transparent; border: none; cursor: pointer; padding-top: 4px; padding-bottom: 4px; padding-left: ' + paddingLeft + '; ' + textStyle + '">'
      + '<span style="flex-shrink: 0; padding-right: 4px;">' + displayTitle + '</span>'
      + '<span style="flex-grow: 1; border-bottom: 1px dotted #9ca3af; margin: 0 4px; margin-bottom: 3px;"></span>'
      + '<span style="flex-shrink: 0; padding-left: 4px; text-align: right; min-w: 24px;">' + pageNum + '</span>'
      + '</button>';
  });

  html += '</div></div>';
  return html;
}

// ─── HELPER: Ambil data dari DATA.poems.poems berdasarkan id ───
function getPoem(id) {
  var poems = (DATA.poems && DATA.poems.poems) || [];
  for (var i = 0; i < poems.length; i++) {
    if (poems[i].id === id) return poems[i];
  }
  return null;
}

// ─── RENDER HALAMAN DINAMIS (dari poems.json) ───────────────────
function renderHalamanDinamis(id) {
  var c = getPoem(id);
  var page = null;
  // Cari info halaman di PAGES
  for (var i = 0; i < PAGES.length; i++) {
    if (PAGES[i].id === id) { page = PAGES[i]; break; }
  }
  var title = page ? page.rightTitle : (c ? c.title : id);
  var nextId = null;
  for (var j = 0; j < PAGES.length; j++) {
    if (PAGES[j].id === id && j + 1 < PAGES.length) { nextId = PAGES[j + 1].id; break; }
  }

  var contentHTML = '';
  if (c && c.paragraphs) {
    contentHTML = c.paragraphs.map(function (p) {
      if (p.trim().substring(0, 4) === '<div') return p;
      return '<p class="indent-8 text-justify mb-3 text-sm text-gray-800 leading-relaxed">' + p + '</p>';
    }).join('');
  } else {
    contentHTML = '<p class="text-center text-gray-400 py-4 italic">Konten tidak tersedia.</p>';
  }

  var nextPageNum = 0;
  for (var k = 0; k < PAGES.length; k++) {
    if (PAGES[k].id === nextId) { nextPageNum = k + 1; break; }
  }

  return '<div class="reveal space-y-4">'
    + '<p class="page-title">' + title + '</p>'
    + '<div class="page-divider"><span>\u2726</span></div>'
    + '<div class="prose-text mt-4">'
    + contentHTML
    + '</div>'
    + (nextPageNum > 0 ? '<div class="mt-6 text-right pb-4"><button class="btn-book-primary" onclick="goToPage(' + nextPageNum + ')">Lanjut \u2192</button></div>' : '')
    + '</div>';
}

// ─── RENDER ANALISIS PUISI INDIVIDUAL ────────────────────────────
function renderAnalisisPuisi(id, nextId) {
  var c = getPoem(id);
  var contentHTML = '';
  if (c && c.paragraphs) {
    contentHTML = c.paragraphs.map(function (p) {
      // 1. Teks Puisi (sudah berupa div)
      if (p.trim().substring(0, 4) === '<div') {
        return '<div style="background:var(--color-paper-950); border-top:1px solid var(--color-paper-600); border-bottom:1px solid var(--color-paper-600); padding:24px 12px; margin:24px 0;">' + p + '</div>';
      }

      // 2. Realitas Sosial (Notes style)
      if (p.indexOf('Realitas sosial yang tampak pada puisi') > -1) {
        // Hapus tag strong lama
        var cleanP = p.replace(/<strong>Realitas sosial yang tampak pada puisi:<\/strong><br>/g, '');
        // Bersihkan bullet point standar dan ganti dengan styling list
        var listItems = cleanP.split('• ').filter(Boolean).map(function (item) {
          return '<li style="margin-bottom: 6px;">' + item.trim() + '</li>';
        }).join('');

        return '<div style="background:var(--color-paper-800); border-left:4px solid var(--color-accent-gold); border-radius:4px; padding:16px; margin:20px 0; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">'
          + '<div style="font-family:var(--font-serif); font-weight:bold; color:var(--color-ink-900); font-size:1rem; border-bottom:1px dashed var(--color-paper-600); padding-bottom:8px; margin-bottom:10px;">Catatan: Realitas Sosial</div>'
          + '<ul style="list-style-type:square; padding-left:20px; font-size:0.875rem; color:var(--color-ink-900);">' + listItems + '</ul>'
          + '</div>';
      }

      // 3. Struktur Fisik / Batin (Card style dengan Diamond Numbering)
      if (p.indexOf('<strong>a) Struktur Fisik</strong>') > -1 || p.indexOf('<strong>b) Struktur Batin</strong>') > -1) {
        var isFisik = p.indexOf('<strong>a)') > -1;
        var badgeText = isFisik ? 'A' : 'B';
        var titleText = isFisik ? 'Struktur Fisik' : 'Struktur Batin';

        // Hilangkan judul aslinya
        var textContent = p.replace(/<strong>[a-b]\) Struktur (Fisik|Batin)<\/strong><br>/, '');

        // Membungkus point (diksi, citraan, dll)
        // Format aslinya: • <strong>Diksi:</strong> Penjelasan...
        // Kita jadikan list yang cantik
        var listItems = textContent.split('• ').filter(Boolean).map(function (item) {
          // highlight bagian pertama (strong)
          return '<div style="margin-bottom: 12px; font-size:0.875rem; color:var(--color-ink-900); line-height:1.6; text-align:justify; display:flex; align-items:flex-start;">' +
            '<span style="display:inline-block; margin-right:8px; margin-top:2px; color:var(--color-accent-red); font-size:12px;">\u25C6</span>' + // \u25C6 is a diamond unicode char
            '<div>' + item.trim() + '</div></div>';
        }).join('');

        return '<div style="background:var(--color-paper-950); border:1px solid var(--color-paper-700); border-radius:6px; padding:16px 16px 4px 16px; margin:20px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">'
          + '<div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">'
          + '<div style="width:28px; height:28px; background:var(--color-accent-red); transform:rotate(45deg); display:flex; align-items:center; justify-content:center; flex-shrink:0;">'
          + '<span style="transform:rotate(-45deg); color:#fff; font-family:var(--font-serif); font-weight:bold; font-size:0.9rem;">' + badgeText + '</span>'
          + '</div>'
          + '<h4 style="font-family:var(--font-display); font-weight:bold; color:var(--color-ink-900); font-size:1.1rem; margin:0;">' + titleText + '</h4>'
          + '</div>'
          + '<div>' + listItems + '</div>'
          + '</div>';
      }

      // Fallback untuk paragraf biasa
      return '<p class="text-justify mb-3 text-sm text-gray-800 leading-relaxed">' + p + '</p>';
    }).join('');
  } else {
    contentHTML = '<p class="text-center text-gray-400 py-4 italic">Konten analisis tidak tersedia.</p>';
  }

  var nextPageNum = 0;
  if (nextId) {
    for (var i = 0; i < PAGES.length; i++) {
      if (PAGES[i].id === nextId) { nextPageNum = i + 1; break; }
    }
  }

  var title = c ? c.title : id;
  var nextLabel = nextId === 'rangkuman' ? 'Lanjut ke Rangkuman \u2192' : 'Analisis Berikutnya \u2192';

  return '<div class="reveal space-y-2">'
    + '<p class="page-title">' + title + '</p>'
    + '<div class="page-divider"><span>\u2726</span></div>'
    + '<div class="prose-text">'
    + contentHTML
    + '</div>'
    + (nextPageNum > 0 ? '<div class="mt-6 text-right pb-4"><button class="btn-book-primary" onclick="goToPage(' + nextPageNum + ')">' + nextLabel + '</button></div>' : '')
    + '</div>';
}

function renderHakikatPuisi() {
  var ids = ['hakikat-puisi', 'struktur-fisik', 'struktur-batin', 'fungsi-puisi'];
  var contentHTML = '';
  if (typeof KONTEN_BUKU !== 'undefined') {
    ids.forEach(function (id) {
      var c = KONTEN_BUKU.filter(function (item) { return item.id === id; })[0];
      if (c) {
        if (id !== 'hakikat-puisi') {
          contentHTML += '<p class="font-serif text-sm font-bold mt-4 mb-2" style="color:var(--color-ink-900);">' + c.title + '</p>';
        }
        contentHTML += c.paragraphs.map(function (p) { return '<p class="indent-8 text-justify mb-2 text-sm text-gray-800 leading-relaxed">' + p + '</p>'; }).join('');
      }
    });
  }

  return '<div class="reveal space-y-4">'
    + '<p class="page-title">1. Hakikat Puisi</p>'
    + '<div class="page-divider"><span>✦</span></div>'
    + '<div class="prose-text">'
    + contentHTML
    + '</div>'
    + '<div class="mt-6 text-right pb-4">'
    + '<button class="btn-book-primary" onclick="goToPage(6)">Lanjut ke Puisi & Sosial →</button>'
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

function renderPetunjuk() {
  return '<div class="reveal space-y-4">'
    + '<p class="page-title">Petunjuk Penggunaan Buku</p>'
    + '<div class="page-divider"><span>✦</span></div>'
    + '<div class="prose-text space-y-3 mt-4 text-justify">'
    + '<p class="indent-8">Buku pengayaan digital ini disusun sebagai materi pelengkap untuk membantu peserta didik memperdalam pemahaman tentang puisi. Materi di dalamnya dapat dipelajari secara mandiri kapan saja dan di mana saja sesuai dengan kebutuhan. Agar proses belajar berjalan dengan baik dan tujuan pembelajaran dapat tercapai, perhatikan petunjuk berikut.</p>'

    // Menggunakan space-y-2 agar antar poin memiliki jarak yang pas
    + '<ol class="list-decimal pl-5 space-y-2 text-sm text-gray-700">'
    + '<li>Berdoalah sebelum memulai kegiatan belajar agar proses pembelajaran berjalan dengan lancar.</li>'
    + '<li>Bacalah pendahuluan terlebih dahulu untuk mengetahui tujuan dan manfaat buku pengayaan ini.</li>'
    + '<li>Pelajari materi secara berurutan sesuai dengan sistematika yang telah disajikan agar memperoleh pemahaman yang lebih utuh.</li>'
    + '<li>Bacalah setiap contoh puisi beserta pembahasannya dengan saksama. Perhatikan struktur fisik, struktur batin, makna, pesan, dan persoalan sosial yang terdapat dalam puisi.</li>'
    + '<li>Hubungkan materi yang dipelajari dengan pengalaman, lingkungan sekitar, atau peristiwa yang terjadi dalam kehidupan sehari-hari agar pemahaman menjadi lebih bermakna.</li>'
    + '<li>Catat informasi atau hal-hal penting selama mempelajari materi sebagai bahan untuk mengingat kembali materi yang telah dipelajari.</li>'
    + '<li>Kerjakan kuis pada akhir pembelajaran secara mandiri untuk mengetahui tingkat pemahaman terhadap materi yang telah dipelajari.</li>'
    + '<li>Diskusikan materi dengan guru atau teman apabila masih mengalami kesulitan dalam memahami pembahasan.</li>'
    + '<li>Gunakan glosarium untuk mengetahui arti istilah-istilah yang belum dipahami.</li>'
    + '<li>Pelajari kembali materi yang belum dipahami sebelum melanjutkan ke pembahasan berikutnya.</li>'
    + '<li>Manfaatkan fitur buku digital, seperti daftar isi dan tautan antarbagian, untuk memudahkan menemukan materi yang ingin dipelajari.</li>'
    + '</ol>'

    + '<p class="indent-8 mt-4 font-medium italic text-gray-800">Selamat belajar dan menikmati keindahan puisi. Semoga buku pengayaan digital ini dapat membantu peserta didik memperdalam pemahaman tentang puisi, menganalisis struktur fisik dan struktur batin puisi, memahami hubungan puisi dengan realitas sosial, mengembangkan kemampuan berpikir kritis dan kreatif, serta menumbuhkan sikap empati dan kepedulian terhadap berbagai persoalan dalam kehidupan.</p>'
    + '</div>'

    + '<div class="mt-6 text-right pb-4">' // pb-4 ditambahkan agar ada sedikit space di bawah tombol jika di-scroll
    + '<button class="btn-book-primary" onclick="goToPage(4)">Mulai Pembelajaran →</button>'
    + '</div>'
    + '</div>';
}

function renderPendahuluan() {
  var c = getPoem('pendahuluan');
  var paragraphsHTML = '';
  if (c && c.paragraphs) {
    paragraphsHTML = c.paragraphs.map(function (p) { return '<p class="indent-8 text-justify mb-3">' + p + '</p>'; }).join('');
  }

  return '<div class="reveal space-y-4">'
    + '<p class="page-title">A. Pendahuluan</p>'
    + '<div class="page-divider"><span>✦</span></div>'
    + '<div class="prose-text space-y-3 mt-4">'
    + paragraphsHTML
    + '</div>'
    + '<div class="mt-6 text-right pb-4">'
    + '<button class="btn-book-primary" onclick="goToPage(5)">Lanjut ke Hakikat Puisi →</button>'
    + '</div>'
    + '</div>';
}

function renderPuisiSosial() {
  var c = getPoem('puisi-sosial');
  var contentHTML = '';
  if (c && c.paragraphs) {
    contentHTML = c.paragraphs.map(function (p) { return '<p class="indent-8 text-justify mb-3 text-sm text-gray-800 leading-relaxed">' + p + '</p>'; }).join('');
  }

  var nextPageNum = 0;
  for (var i = 0; i < PAGES.length; i++) {
    if (PAGES[i].id === 'puisi-representasi') { nextPageNum = i + 1; break; }
  }

  return '<div class="reveal space-y-4">'
    + '<p class="page-title">2. Puisi dan Kehidupan Sosial</p>'
    + '<div class="page-divider"><span>\u2726</span></div>'
    + '<div class="prose-text">'
    + contentHTML
    + '</div>'
    + '<div class="mt-6 text-right pb-4">'
    + '<button class="btn-book-primary" onclick="goToPage(' + (nextPageNum || 7) + ')">Lanjut ke Representasi Realitas \u2192</button>'
    + '</div>'
    + '</div>';
}

function renderPuisiRepresentasi() {
  var c = getPoem('puisi-representasi');
  var contentHTML = '';
  if (c && c.paragraphs) {
    contentHTML = c.paragraphs.map(function (p) { return '<p class="indent-8 text-justify mb-3 text-sm text-gray-800 leading-relaxed">' + p + '</p>'; }).join('');
  } else {
    contentHTML = '<p class="text-center text-gray-500 py-4">Konten tidak ditemukan.</p>';
  }

  var nextPageNum = 0;
  for (var i = 0; i < PAGES.length; i++) {
    if (PAGES[i].id === 'puisi-pengungsian') { nextPageNum = i + 1; break; }
  }

  return '<div class="reveal space-y-4">'
    + '<p class="page-title">3. Puisi sebagai Representasi Realitas Sosial</p>'
    + '<div class="page-divider"><span>\u2726</span></div>'
    + '<div class="prose-text">'
    + contentHTML
    + '</div>'
    + '<div class="mt-6 text-right pb-4">'
    + '<button class="btn-book-primary" onclick="goToPage(' + (nextPageNum || 8) + ')">Lanjut ke Pengungsian \u2192</button>'
    + '</div>'
    + '</div>';
}

function renderPuisiPengungsian() {
  var c = getPoem('puisi-pengungsian');
  var contentHTML = '';
  if (c && c.paragraphs) {
    contentHTML = c.paragraphs.map(function (p) {
      return '<p class="indent-8 text-justify mb-3 text-sm text-gray-800 leading-relaxed">' + p + '</p>';
    }).join('');
  } else {
    contentHTML = '<p class="text-center text-gray-500 py-4">Konten tidak ditemukan.</p>';
  }

  var nextPageNum = 0;
  for (var i = 0; i < PAGES.length; i++) {
    if (PAGES[i].id === 'analisis-puisi-1') { nextPageNum = i + 1; break; }
  }

  return '<div class="reveal space-y-4">'
    + '<p class="page-title">4. Pengungsian sebagai Representasi Realitas Sosial dalam Puisi</p>'
    + '<div class="page-divider"><span>✦</span></div>'
    + '<div class="prose-text">'
    + contentHTML
    + '</div>'
    + '<div class="mt-6 text-right pb-4">'
    + '<button class="btn-book-primary" onclick="goToPage(' + (nextPageNum || 9) + ')">Lihat Analisis Puisi →</button>'
    + '</div>'
    + '</div>';
}

function renderRangkuman() {
  // Mencari halaman target 'kuis' secara dinamis di array PAGES agar navigasi tidak meleset
  var targetPage = 10; // fallback default
  if (typeof PAGES !== 'undefined' && PAGES.length) {
    for (var ri = 0; ri < PAGES.length; ri++) {
      if (PAGES[ri].id === 'kuis') {
        targetPage = ri + 1;
        break;
      }
    }
  }

  var html = '<div class="reveal space-y-4">'
    + '<p class="page-title">C. Rangkuman</p>'
    + '<div class="page-divider"><span>✦</span></div>'
    + '<div class="space-y-5 mt-4" style="max-height: 65vh; overflow-y: auto; padding-right: 8px;">';

  // Group 1: Hakikat Puisi
  html += '<div style="background:var(--color-paper-950); border-left:3px solid var(--color-accent-gold); padding:14px; border-radius:4px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">'
    + '<p class="font-serif font-bold text-sm mb-2" style="color:var(--color-ink-900);">📜 Hakikat & Struktur Puisi</p>'
    + '<ul class="prose-text text-xs text-justify text-gray-800 leading-relaxed list-none space-y-2 m-0 p-0">'
    + '<li style="display:flex; gap:6px;"><span class="font-bold flex-shrink-0" style="min-width:14px;">1.</span><span>Puisi adalah karya sastra yang mengungkapkan pikiran, perasaan, dan pengalaman penyair melalui bahasa yang indah, padat, dan penuh makna.</span></li>'
    + '<li style="display:flex; gap:6px;"><span class="font-bold flex-shrink-0" style="min-width:14px;">2.</span><span>Struktur puisi terdiri atas struktur fisik dan struktur batin. Struktur fisik meliputi diksi, citraan, majas, rima atau irama, dan tipografi. Struktur batin meliputi tema, rasa, nada, dan amanat.</span></li>'
    + '</ul></div>';

  // Group 2: Realitas Sosial & Pengungsian
  html += '<div style="background:var(--color-paper-800); border:1px solid var(--color-paper-600); padding:14px; border-radius:6px; box-shadow: inset 0 0 10px rgba(0,0,0,0.02); margin-top: 16px;">'
    + '<p class="font-serif font-bold text-sm mb-2" style="color:var(--color-ink-900);">🌍 Puisi sebagai Cermin Sosial</p>'
    + '<ul class="prose-text text-xs text-justify text-gray-800 leading-relaxed list-none space-y-2 m-0 p-0">'
    + '<li style="display:flex; gap:6px;"><span class="font-bold flex-shrink-0" style="min-width:14px;">3.</span><span>Puisi sebagai representasi realitas sosial berarti puisi tidak hanya menyampaikan keindahan bahasa, tetapi juga menggambarkan berbagai peristiwa dan persoalan yang terjadi dalam kehidupan masyarakat.</span></li>'
    + '<li style="display:flex; gap:6px;"><span class="font-bold flex-shrink-0" style="min-width:14px;">4.</span><span>Realitas sosial adalah berbagai peristiwa dan kondisi yang terjadi dalam kehidupan masyarakat, seperti persoalan kemanusiaan, lingkungan, kemiskinan, maupun pengungsian.</span></li>'
    + '<li style="display:flex; gap:6px;"><span class="font-bold flex-shrink-0" style="min-width:14px;">5.</span><span>Fenomena pengungsian adalah salah satu isu kemanusiaan yang terjadi akibat bencana alam, konflik, atau keadaan darurat lainnya. Pengungsian tidak hanya menyebabkan kehilangan tempat tinggal, tetapi juga menimbulkan berbagai kesulitan dan penderitaan.</span></li>'
    + '<li style="display:flex; gap:6px;"><span class="font-bold flex-shrink-0" style="min-width:14px;">6.</span><span>Fenomena pengungsian dapat diangkat menjadi tema puisi karena mampu menggambarkan pengalaman, perasaan, dan perjuangan para pengungsi melalui bahasa yang puitis sehingga pembaca lebih mudah memahami persoalan kemanusiaan tersebut.</span></li>'
    + '</ul></div>';

  // Group 3: Karya & Analisis
  html += '<div style="background:var(--color-paper-950); border-left:3px solid var(--color-accent-red); padding:14px; border-radius:4px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); margin-top: 16px;">'
    + '<p class="font-serif font-bold text-sm mb-2" style="color:var(--color-ink-900);">✍️ Analisis & Apresiasi</p>'
    + '<ul class="prose-text text-xs text-justify text-gray-800 leading-relaxed list-none space-y-2 m-0 p-0">'
    + '<li style="display:flex; gap:6px;"><span class="font-bold flex-shrink-0" style="min-width:14px;">7.</span><span>Buku kumpulan puisi Suara dari Pengungsian karya Nissa Rengganis mengangkat tema pengungsian dan berbagai persoalan kemanusiaan melalui puisi-puisi yang sarat makna.</span></li>'
    + '<li style="display:flex; gap:6px;"><span class="font-bold flex-shrink-0" style="min-width:14px;">8.</span><span>Analisis struktur fisik pada lima puisi menunjukkan bahwa pemilihan diksi, citraan, majas, rima atau irama, serta tipografi berperan dalam memperkuat makna dan suasana puisi.</span></li>'
    + '<li style="display:flex; gap:6px;"><span class="font-bold flex-shrink-0" style="min-width:14px;">9.</span><span>Analisis struktur batin menunjukkan bahwa tema, rasa, nada, dan amanat dalam kelima puisi menggambarkan kesedihan, kehilangan, harapan, kritik sosial, serta kepedulian terhadap sesama.</span></li>'
    + '<li style="display:flex; gap:6px;"><span class="font-bold flex-shrink-0" style="min-width:19px;">10.</span><span>Melalui analisis puisi, pembaca dapat memahami bahwa puisi tidak hanya berfungsi sebagai karya sastra yang indah, tetapi juga sebagai media untuk menumbuhkan empati, kepekaan sosial, dan kepedulian terhadap persoalan kemanusiaan.</span></li>'
    + '</ul></div>';

  html += '</div>'
    + '<div class="mt-6 text-right pb-4">'
    + '<button class="btn-book-primary" onclick="goToPage(' + targetPage + ')">Lanjut ke Kuis Evaluasi →</button>'
    + '</div>'
    + '</div>';

  return html;
}

function renderBiografi() {
  return '<div class="reveal space-y-4">'
    + '<p class="page-title">Biografi Penulis</p>'
    + '<div class="page-divider"><span>✦</span></div>'

    // Pembungkus untuk semua kartu biografi
    + '<div class="space-y-4" style="max-height: 65vh; overflow-y: auto; padding-right: 8px;">'

    // 1. Profil Pemilik Tugas Akhir
    + '<div style="background:var(--color-paper-950); border:1px solid var(--color-paper-700); padding:16px; border-radius:6px; display: flex; gap: 16px; align-items: center;">'
    + '<div style="width:50px; height:50px; background:var(--color-paper-700); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.5rem; flex-shrink: 0;">👩‍🎓</div>'
    + '<div>'
    + '<h3 class="font-display font-bold text-base" style="color:var(--color-ink-900); margin: 0;">Firyal Nur Wulanti</h3>'
    + '<p class="font-serif text-xs italic" style="color:var(--color-accent-red); margin: 2px 0 6px 0;">Penulis & Pemilik Tugas Akhir</p>'
    + '<p class="prose-text text-xs text-justify" style="margin: 0;">Merancang landasan penelitian, konsep dasar pengayaan, serta bertanggung jawab penuh atas keutuhan materi utama dalam penyusunan tugas akhir ini.</p>'
    + '</div>'
    + '</div>'

    // 2. Profil Penulis dan Editor Modul
    + '<div style="background:var(--color-paper-950); border:1px solid var(--color-paper-700); padding:16px; border-radius:6px; display: flex; gap: 16px; align-items: center;">'
    + '<div style="width:50px; height:50px; background:var(--color-paper-700); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.5rem; flex-shrink: 0;">✍️</div>'
    + '<div>'
    + '<h3 class="font-display font-bold text-base" style="color:var(--color-ink-900); margin: 0;">Hasna Nailah Luthfiyah</h3>'
    + '<p class="font-serif text-xs italic" style="color:var(--color-accent-red); margin: 2px 0 6px 0;">Penulis & Editor Modul</p>'
    + '<p class="prose-text text-xs text-justify" style="margin: 0;">Menyusun struktur kebahasaan, memilih ragam materi puisi, serta menyelaraskan seluruh redaksi tulisan agar materi disajikan secara runtut, adaptif, dan mudah dipahami.</p>'
    + '</div>'
    + '</div>'

    // 3. Profil Pengembang Sistem
    + '<div style="background:var(--color-paper-950); border:1px solid var(--color-paper-700); padding:16px; border-radius:6px; display: flex; gap: 16px; align-items: center;">'
    + '<div style="width:50px; height:50px; background:var(--color-paper-700); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.5rem; flex-shrink: 0;">💻</div>'
    + '<div>'
    + '<h3 class="font-display font-bold text-base" style="color:var(--color-ink-900); margin: 0;">Nina Wulandari</h3>'
    + '<p class="font-serif text-xs italic" style="color:var(--color-accent-red); margin: 2px 0 6px 0;">Pengembang Sistem</p>'
    + '<p class="prose-text text-xs text-justify" style="margin: 0;">Membangun arsitektur perangkat lunak modul digital interaktif, mengintegrasikan sistem navigasi booklet, serta merancang interaktivitas pop-up analisis unsur puisi.</p>'
    + '</div>'
    + '</div>'

    + '</div>' // Akhir dari pembungkus scroll
    + '</div>';
}

var GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx8IVsMff1xlCP3Gqio1xg9fXsnAY9ab0hiucqSK2yZyLrnUkyEDXn9yR69jdxEy3zMUA/exec";

function renderKuis(quiz) {
  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return '<p class="prose-text">Data kuis tidak tersedia.</p>';
  }

  var draft = {};
  try {
    draft = JSON.parse(localStorage.getItem('quizDraft')) || {};
  } catch (e) { }

  var html = '<div class="space-y-6" style="max-height: 65vh; overflow-y: auto; padding-right: 8px;">';

  // Header
  html += '<div class="reveal">';
  html += '<p class="page-title">' + (quiz.title || 'A. KUIS') + '</p>';
  html += '<div class="page-divider"><span>✦</span></div>';
  if (quiz.description) {
    html += '<p class="prose-text text-sm mt-4 text-center">' + quiz.description + '</p>';
  }

  // Info Kriteria Penilaian
  html += '<div class="mt-4 p-4" style="background:var(--color-paper-800); border-left:3px solid var(--color-accent-gold); border-radius:4px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">';
  html += '<p class="font-serif font-bold text-sm mb-2" style="color:var(--color-ink-900);">🎯 Kriteria Penilaian (Skor Maksimal: 100)</p>';
  html += '<ul class="prose-text text-xs text-gray-800 list-disc pl-4 space-y-1">';
  html += '<li><span class="font-bold">Soal Objektif (Benar/Salah):</span> 4 soal x 5 poin = 20 Poin</li>';
  html += '<li><span class="font-bold">Soal Esai Analisis (2 Soal):</span> 25 poin x 2 = 50 Poin</li>';
  html += '<li><span class="font-bold">Karya Puisi Mandiri:</span> Maksimal 30 Poin</li>';
  html += '</ul>';
  html += '<p class="prose-text text-xs text-red-600 mt-3 italic">* Catatan: Nilai akan dievaluasi secara manual oleh pengajar dan tidak akan langsung muncul setelah menekan tombol Selesai.</p>';
  html += '</div>';

  html += '</div>';

  // Form Identitas
  html += '<div class="reveal space-y-3 mt-4 p-4" style="background:var(--color-paper-800); border:1px solid var(--color-paper-600); border-radius:6px;">';
  html += '<p class="font-serif font-bold text-sm" style="color:var(--color-ink-900);">Identitas Diri</p>';
  html += '<div style="display:flex; flex-direction:column; gap:8px;">';
  html += '<input type="text" id="quiz_nama" value="' + (draft.nama || '') + '" oninput="saveQuizDraft()" placeholder="Nama Lengkap" style="padding: 10px; border: 1px solid var(--color-paper-600); border-radius: 4px; background: var(--color-paper-950); font-family: inherit; font-size: 0.85rem; color: var(--color-ink-900); width: 100%;">';
  html += '<input type="text" id="quiz_kelas" value="' + (draft.kelas || '') + '" oninput="saveQuizDraft()" placeholder="Kelas" style="padding: 10px; border: 1px solid var(--color-paper-600); border-radius: 4px; background: var(--color-paper-950); font-family: inherit; font-size: 0.85rem; color: var(--color-ink-900); width: 100%;">';
  html += '</div>';
  html += '</div>';

  // Poem if exists
  if (quiz.poem) {
    html += '<div class="reveal" style="background:var(--color-paper-800); border:1px solid var(--color-paper-600); border-radius:6px; padding:16px;">';
    if (quiz.poem.title) html += '<p class="font-serif font-bold text-left mb-1" style="color:var(--color-ink-900);">' + quiz.poem.title + '</p>';
    html += '<div class="text-left font-serif text-sm" style="color:var(--color-ink-800); line-height: 1.6;">';
    if (quiz.poem.lines) {
      quiz.poem.lines.forEach(function (line) {
        if (line.trim() === '') {
          html += '<br>';
        } else {
          html += line + '<br>';
        }
      });
    }
    if (quiz.poem.meta) {
      html += '<br><small style="color:var(--color-ink-500);">' + quiz.poem.meta + '</small>';
    }
    html += '</div></div>';
  }

  // Questions
  quiz.questions.forEach(function (q) {
    html += '<div class="reveal space-y-2 mt-6">';

    if (q.instruction) {
      html += '<p class="font-serif font-bold text-sm" style="color:var(--color-ink-900);">' + q.instruction + '</p>';
    }

    if (q.type === 'matrix') {
      html += '<div style="overflow-x: auto;">';
      html += '<table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 0.85rem;" class="prose-text">';

      // Headers
      if (q.headers) {
        html += '<tr style="background:var(--color-paper-800); border-bottom: 2px solid var(--color-paper-600);">';
        q.headers.forEach(function (h, i) {
          var width = i === 1 ? '55%' : 'auto';
          var align = i === 1 ? 'left' : 'center';
          html += '<th style="padding: 8px; text-align: ' + align + '; width: ' + width + '; border: 1px solid var(--color-paper-600);">' + h + '</th>';
        });
        html += '</tr>';
      }

      // Statements
      if (q.statements) {
        q.statements.forEach(function (s, idx) {
          html += '<tr style="border-bottom: 1px solid var(--color-paper-600); background: ' + (idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.3)') + ';">';
          html += '<td style="padding: 8px; text-align: center; border: 1px solid var(--color-paper-600);">' + s.no + '</td>';
          html += '<td style="padding: 8px; border: 1px solid var(--color-paper-600); line-height: 1.4;">' + s.text + '</td>';

          html += '<td style="padding: 8px; text-align: center; border: 1px solid var(--color-paper-600);"><input type="radio" name="matrix_' + s.no + '" value="BENAR" onchange="saveQuizDraft()" style="accent-color: var(--color-accent-red); cursor: pointer;" ' + (draft['matrix_' + s.no] === 'BENAR' ? 'checked' : '') + '></td>';
          html += '<td style="padding: 8px; text-align: center; border: 1px solid var(--color-paper-600);"><input type="radio" name="matrix_' + s.no + '" value="SALAH" onchange="saveQuizDraft()" style="accent-color: var(--color-accent-red); cursor: pointer;" ' + (draft['matrix_' + s.no] === 'SALAH' ? 'checked' : '') + '></td>';

          html += '</tr>';
        });
      }
      html += '</table></div>';
    }
    else if (q.type === 'essay') {
      html += '<p class="prose-text text-sm mb-2">' + q.question + '</p>';
      if (q.rules) {
        html += '<ul class="list-disc pl-5 mb-2 prose-text text-xs text-gray-700">';
        q.rules.forEach(function (r) { html += '<li>' + r + '</li>'; });
        html += '</ul>';
      }
      var rows = q.id === 4 ? 6 : 4;
      var cachedVal = draft['essay_' + q.id] || '';
      html += '<textarea id="essay_' + q.id + '" oninput="saveQuizDraft()" placeholder="Ketik jawabanmu di sini..." style="width: 100%; min-height: ' + (rows * 24) + 'px; padding: 10px; border: 1px solid var(--color-paper-600); border-radius: 4px; background: var(--color-paper-800); font-family: inherit; font-size: 0.85rem; color: var(--color-ink-900); resize: vertical; box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);">' + cachedVal + '</textarea>';
    }

    html += '</div>';
  });

  html += '<div class="reveal mt-8 text-center pb-4">';
  html += '<button class="btn-book-primary" id="btn-submit-quiz" onclick="submitQuiz()">Kirim Jawaban ✓</button>';
  html += '</div>';

  html += '</div>'; // End scrollable wrapper

  return html;
}

window.saveQuizDraft = function () {
  var getRadioVal = function (name) {
    var radios = document.getElementsByName(name);
    for (var i = 0; i < radios.length; i++) {
      if (radios[i].checked) return radios[i].value;
    }
    return "-";
  };
  var n = document.getElementById('quiz_nama');
  if (!n) return;
  var draft = {
    nama: n.value,
    kelas: document.getElementById('quiz_kelas').value,
    matrix_1: getRadioVal('matrix_1'),
    matrix_2: getRadioVal('matrix_2'),
    matrix_3: getRadioVal('matrix_3'),
    matrix_4: getRadioVal('matrix_4'),
    essay_2: document.getElementById('essay_2') ? document.getElementById('essay_2').value : '',
    essay_3: document.getElementById('essay_3') ? document.getElementById('essay_3').value : '',
    essay_4: document.getElementById('essay_4') ? document.getElementById('essay_4').value : ''
  };
  localStorage.setItem('quizDraft', JSON.stringify(draft));
};

function submitQuiz() {
  var nama = document.getElementById('quiz_nama').value.trim();
  var kelas = document.getElementById('quiz_kelas').value.trim();

  if (!nama) {
    showCustomAlert("Mohon isi Nama Lengkap terlebih dahulu.");
    document.getElementById('quiz_nama').focus();
    return;
  }

  var btn = document.getElementById('btn-submit-quiz');
  var originalText = btn.innerHTML;
  btn.innerHTML = "Sedang Mengirim...";
  btn.disabled = true;
  btn.style.opacity = "0.7";

  // Kumpulkan jawaban matrix
  var getRadioVal = function (name) {
    var radios = document.getElementsByName(name);
    for (var i = 0; i < radios.length; i++) {
      if (radios[i].checked) return radios[i].value;
    }
    return "-";
  };

  var data = {
    nama: nama,
    kelas: kelas,
    matrix_1: getRadioVal('matrix_1'),
    matrix_2: getRadioVal('matrix_2'),
    matrix_3: getRadioVal('matrix_3'),
    matrix_4: getRadioVal('matrix_4'),
    essay_2: document.getElementById('essay_2') ? document.getElementById('essay_2').value.trim() : '-',
    essay_3: document.getElementById('essay_3') ? document.getElementById('essay_3').value.trim() : '-',
    essay_4: document.getElementById('essay_4') ? document.getElementById('essay_4').value.trim() : '-'
  };

  // Validasi semua kolom wajib diisi
  if (!data.nama || !data.kelas || data.matrix_1 === '-' || data.matrix_2 === '-' || data.matrix_3 === '-' || data.matrix_4 === '-' || !data.essay_2 || data.essay_2 === '-' || !data.essay_3 || data.essay_3 === '-' || !data.essay_4 || data.essay_4 === '-') {
    showCustomAlert("Semua kolom (termasuk identitas, pilihan ganda, dan esai/puisi) wajib diisi!");
    btn.innerHTML = originalText;
    btn.disabled = false;
    btn.style.opacity = "1";
    return;
  }

  fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    }
  })
    .then(function () {
      btn.innerHTML = originalText;
      btn.disabled = false;
      btn.style.opacity = "1";

      showCustomAlert("Berhasil! Jawabanmu telah tersimpan dengan aman.\n\nSkor akhir Anda akan dievaluasi oleh pengajar berdasarkan kriteria penilaian (Maksimal: 100 Poin).", "Sukses");
      localStorage.removeItem('quizDraft');
      goToPage(11); // redirect ke Glosarium/Daftar Pustaka
    })
    .catch(function (error) {
      btn.innerHTML = originalText;
      btn.disabled = false;
      btn.style.opacity = "1";
      showCustomAlert("Gagal mengirim data. Pastikan Anda terhubung ke internet.", "Gagal");
      console.error(error);
    });
}

function renderGlosarium(glossary) {
  var categories = ['Semua'];
  glossary.forEach(function (item) {
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
    + categories.map(function (cat) {
      return '<button class="glossary-filter btn-book-secondary text-xs py-1 px-3" data-cat="' + cat + '">' + cat + '</button>';
    }).join('')
    + '</div>'
    + '<div class="reveal space-y-2" id="glossary-list">'
    + glossary.map(function (item) {
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

function renderDaftarPustaka(bibliography) {
  if (!bibliography || bibliography.length === 0) {
    return '<p class="prose-text text-sm">Data daftar pustaka tidak tersedia.</p>';
  }

  // Mencari halaman target 'biografi' secara dinamis di array PAGES
  var targetPage = 13; // fallback default
  if (typeof PAGES !== 'undefined' && PAGES.length) {
    for (var ri = 0; ri < PAGES.length; ri++) {
      if (PAGES[ri].id === 'biografi') {
        targetPage = ri + 1;
        break;
      }
    }
  }

  // Loop untuk merakit item daftar pustaka sesuai konvensi APA Style
  var itemsHTML = bibliography.map(function (item) {
    var text = item.author + ' (' + item.year + '). <em>' + item.title + '</em>.';

    if (item.journal) {
      text += ' ' + item.journal;
      if (item.volume) {
        text += ', ' + item.volume;
        if (item.number) text += '(' + item.number + ')';
      }
    }
    if (item.publisher) text += ' ' + item.publisher + '.';
    if (item.pages) text += ' ' + item.pages + '.';
    if (item.doi) text += ' <a href="' + item.doi + '" target="_blank" class="text-blue-600 hover:underline break-all" style="font-size: 0.8rem;">' + item.doi + '</a>';

    // Menggunakan gaya paragraf indentasi gantung khas daftar pustaka
    return '<p style="text-indent: -24px; padding-left: 24px;" class="text-justify">' + text + '</p>';
  }).join('');

  return '<div class="space-y-4">'
    + '<div class="reveal">'
    + '<p class="page-title">Daftar Pustaka</p>'
    + '<div class="page-divider"><span>✦</span></div>'
    + '<div class="prose-text space-y-4 text-xs text-gray-800 leading-relaxed" style="max-height: 65vh; overflow-y: auto; padding-right: 8px;">'
    + itemsHTML
    + '</div>'
    + '</div>'
    + '<div class="reveal text-right mt-6 pb-4">'
    + '<button class="btn-book-primary" onclick="goToPage(' + targetPage + ')">Lanjut ke Biografi Penulis →</button>'
    + '</div>'
    + '</div>';
}

// ─── INIT INTERAKTIVITAS SETELAH RENDER ────────────────────────

function initPageContent(page) {
  var restartBtn = document.getElementById('btn-restart');
  if (restartBtn) restartBtn.addEventListener('click', function () {
    showCover();
    state.currentPage = 0;
    updateBookTabs(0);
    window.scrollTo(0, 0);
  });

  // Klik kata analisis
  document.querySelectorAll('.word-tap').forEach(function (el) {
    el.addEventListener('click', function () {
      try {
        var analysis = JSON.parse(el.getAttribute('data-analysis'));
        openWordModal(analysis, el.textContent);
      } catch (e) { }
    });
  });

  // Foto pop-up: klik untuk membesar
  document.querySelectorAll('.popup-image-card').forEach(function (card) {
    card.style.cursor = 'pointer';
    card.addEventListener('click', function () {
      var src = card.getAttribute('data-src');
      var caption = card.getAttribute('data-caption');
      var desc = card.getAttribute('data-desc');
      openImageModal(src, caption, desc);
    });
  });

  // Daftar isi bab (jika ada di halaman konten)
  document.querySelectorAll('#page-content .chapter-item').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var n = parseInt(btn.getAttribute('data-page'));
      if (n) goToPage(n);
    });
  });

  // Workshop
  initWorkshopListeners();

  // Glosarium
  initGlossaryListeners();

  // Scroll reveal
  setTimeout(initScrollReveal, 100);
}

function bindPageNav(btnId, pageNum) {
  var btn = document.getElementById(btnId);
  if (btn) btn.addEventListener('click', function () { goToPage(pageNum); });
}

// ─── WORKSHOP LISTENERS ─────────────────────────────────────────

function initWorkshopListeners() {
  var titleInput = document.getElementById('poem-title-input');
  var authorInput = document.getElementById('poem-author-input');
  var contentInput = document.getElementById('poem-content-input');
  var saveBtn = document.getElementById('btn-save-poem');
  var downloadBtn = document.getElementById('btn-download-poem');
  var clearBtn = document.getElementById('btn-clear-poem');

  if (!contentInput) return;

  // Auto-save on input
  [titleInput, authorInput, contentInput].forEach(function (el) {
    if (!el) return;
    el.addEventListener('input', function () {
      if (titleInput) localStorage.setItem('poem-title', titleInput.value);
      if (authorInput) localStorage.setItem('poem-author', authorInput.value);
      if (contentInput) localStorage.setItem('poem-content', contentInput.value);
    });
  });

  if (saveBtn) saveBtn.addEventListener('click', function () {
    saveBtn.textContent = '✓ Tersimpan!';
    setTimeout(function () { saveBtn.textContent = '💾 Simpan'; }, 2000);
  });

  if (clearBtn) clearBtn.addEventListener('click', function () {
    if (!confirm('Hapus puisi yang sudah ditulis?')) return;
    if (titleInput) titleInput.value = '';
    if (authorInput) authorInput.value = '';
    if (contentInput) contentInput.value = '';
    localStorage.removeItem('poem-title');
    localStorage.removeItem('poem-author');
    localStorage.removeItem('poem-content');
  });

  if (downloadBtn) downloadBtn.addEventListener('click', function () {
    var title = (titleInput && titleInput.value.trim()) || 'Puisi Saya';
    var author = (authorInput && authorInput.value.trim()) || '';
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
  document.querySelectorAll('.quiz-option-book').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (state.quizAnswered) return;
      state.quizAnswered = true;

      var chosen = parseInt(btn.getAttribute('data-index'));
      var correct = parseInt(btn.getAttribute('data-correct'));
      var isRight = chosen === correct;

      if (isRight) state.quizScore++;

      // Tandai semua opsi
      document.querySelectorAll('.quiz-option-book').forEach(function (b) {
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
      if (nextBtn) nextBtn.addEventListener('click', function () {
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
  if (retryBtn) retryBtn.addEventListener('click', function () {
    state.quizIndex = 0;
    state.quizScore = 0;
    state.quizDone = false;
    state.quizAnswered = false;
    renderPage(state.currentPage, true);
  });
}

// ─── GLOSARIUM LISTENERS ────────────────────────────────────────

function initGlossaryListeners() {
  var searchEl = document.getElementById('glossary-search');
  var listEl = document.getElementById('glossary-list');

  function filterGlossary(query, cat) {
    if (!listEl) return;
    listEl.querySelectorAll('.glossary-card').forEach(function (card) {
      var term = (card.getAttribute('data-term') || '').toLowerCase();
      var catVal = (card.getAttribute('data-category') || '').toLowerCase();
      var matchQ = !query || term.includes(query.toLowerCase());
      var matchC = !cat || cat === 'semua' || catVal === cat.toLowerCase();
      card.style.display = (matchQ && matchC) ? '' : 'none';
    });
  }

  var activeCat = 'semua';
  if (searchEl) searchEl.addEventListener('input', function () {
    filterGlossary(searchEl.value, activeCat);
  });

  document.querySelectorAll('.glossary-filter').forEach(function (btn) {
    btn.addEventListener('click', function () {
      activeCat = btn.getAttribute('data-cat');
      document.querySelectorAll('.glossary-filter').forEach(function (b) {
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

// ─── MODAL CUSTOM ALERT ──────────────────────────────────────────

function showCustomAlert(message, title) {
  var modal = document.getElementById('modal-alert-popup');
  if (!modal) {
    alert(message);
    return;
  }
  document.getElementById('modal-alert-title').textContent = title || 'Pemberitahuan';
  document.getElementById('modal-alert-message').innerHTML = escapeHTML(message).replace(/\n/g, '<br>');
  modal.classList.add('open');
}

function closeCustomAlert() {
  var modal = document.getElementById('modal-alert-popup');
  if (modal) modal.classList.remove('open');
}

// ─── SCROLL REVEAL ───────────────────────────────────────────────

function initScrollReveal() {
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal:not(.visible)').forEach(function (el) {
    obs.observe(el);
  });
}

// ─── UTILITAS ───────────────────────────────────────────────────

function toRoman(n) {
  var val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  var sym = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  var r = '';
  for (var i = 0; i < val.length; i++) {
    while (n >= val[i]) { r += sym[i]; n -= val[i]; }
  }
  return r;
}

function escapeHTML(str) {
  if (typeof str !== 'string') return String(str || '');
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  if (typeof str !== 'string') str = JSON.stringify(str);
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─── SWIPE TOUCH (MOBILE) ────────────────────────────────────────

function initSwipe() {
  // Fitur swipe dimatikan agar tidak mengganggu proses scroll pengguna (terlalu sensitif/berpindah halaman otomatis)
}

// ─── KEYBOARD ────────────────────────────────────────────────────

function initKeyboard() {
  document.addEventListener('keydown', function (e) {
    var overlay1 = document.getElementById('modal-word-analysis');
    var overlay2 = document.getElementById('modal-image-popup');
    var overlay3 = document.getElementById('modal-alert-popup');
    if (e.key === 'Escape') {
      if (overlay1 && overlay1.classList.contains('open')) closeWordModal();
      if (overlay2 && overlay2.classList.contains('open')) closeImageModal();
      if (overlay3 && overlay3.classList.contains('open')) closeCustomAlert();
      return;
    }
    if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
    if (e.key === 'ArrowRight') goToPage(state.currentPage + 1);
    if (e.key === 'ArrowLeft') goToPage(state.currentPage - 1);
  });
}

// ─── EVENT LISTENERS UTAMA ──────────────────────────────────────

function initCoreListeners() {
  // Sampul: klik untuk buka buku
  var cover = document.getElementById('book-cover');
  var openBtn = document.getElementById('btn-open-book');
  if (cover) cover.addEventListener('click', openBook);
  if (openBtn) openBtn.addEventListener('click', function (e) { e.stopPropagation(); openBook(); });
  cover && cover.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') openBook();
  });

  // Tutup buku
  var backBtn = document.getElementById('btn-cover-back');
  if (backBtn) backBtn.addEventListener('click', showCover);

  // Prev/Next halaman
  var prevBtn = document.getElementById('btn-prev-page');
  var nextBtn = document.getElementById('btn-next-page');
  if (prevBtn) prevBtn.addEventListener('click', function () { goToPage(state.currentPage - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { goToPage(state.currentPage + 1); });


  // Modal word close
  var wClose = document.getElementById('btn-close-word-modal');
  if (wClose) wClose.addEventListener('click', closeWordModal);
  var wOverlay = document.getElementById('modal-word-analysis');
  if (wOverlay) wOverlay.addEventListener('click', function (e) {
    if (e.target === wOverlay) closeWordModal();
  });

  // Modal image close
  var iClose = document.getElementById('btn-close-image-modal');
  if (iClose) iClose.addEventListener('click', closeImageModal);
  var iOverlay = document.getElementById('modal-image-popup');
  if (iOverlay) iOverlay.addEventListener('click', function (e) {
    if (e.target === iOverlay) closeImageModal();
  });

  // Modal alert close
  var aOverlay = document.getElementById('modal-alert-popup');
  var aCloseBtn = document.getElementById('btn-close-alert-modal');
  var aOkBtn = document.getElementById('btn-ok-alert-modal');
  if (aOverlay) aOverlay.addEventListener('click', function (e) {
    if (e.target === aOverlay) closeCustomAlert();
  });
  if (aCloseBtn) aCloseBtn.addEventListener('click', closeCustomAlert);
  if (aOkBtn) aOkBtn.addEventListener('click', closeCustomAlert);
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

  console.log('📖  Suara dari Pengungsian — Buku terbuka!');
  console.log('   Halaman tersedia:', PAGES.length);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
