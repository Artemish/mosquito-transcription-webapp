/**
 * checks-panel.js
 *
 * UI for viewing, navigating, and dismissing open check items.
 * Renders as a slide-in drawer attached to the sidebar.
 *
 * Public surface (window.checksPanel):
 *   open()     – open the drawer and refresh
 *   close()    – close the drawer
 *   refresh()  – reload from server and redraw (also updates badge)
 */

(function () {

  // ── state ────────────────────────────────────────────────────────────────
  let allChecks  = [];
  let activeIndex = null;

  // ── DOM refs ──────────────────────────────────────────────────────────────
  let drawer, closeBtn, list, emptyMsg, summary,
      navBar, navLabel, prevBtn, nextBtn, openBtn;

  // ── helpers ───────────────────────────────────────────────────────────────

  function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('pt-MZ', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function updateBadge() {
    if (!openBtn) return;
    const n = allChecks.length;
    openBtn.dataset.count = n;
    openBtn.classList.toggle('checks-badge-active', n > 0);
    // Update button label to show count
    openBtn.querySelector('.checks-btn-label').textContent =
      n > 0 ? `Verificações (${n})` : 'Verificações';
  }

  // ── rendering ─────────────────────────────────────────────────────────────

  function render() {
    list.innerHTML = '';
    list.appendChild(emptyMsg);   // keep the empty-msg node in place

    if (allChecks.length === 0) {
      emptyMsg.style.display = '';
      navBar.style.display   = 'none';
      summary.textContent    = 'Não há verificações em aberto.';
      updateBadge();
      return;
    }

    emptyMsg.style.display = 'none';
    summary.textContent    =
      `${allChecks.length} verificaç${allChecks.length === 1 ? 'ão' : 'ões'} em aberto`;
    updateBadge();

    if (activeIndex !== null) {
      activeIndex = Math.max(0, Math.min(activeIndex, allChecks.length - 1));
      navBar.style.display = '';
      navLabel.textContent = `${activeIndex + 1} / ${allChecks.length}`;
    } else {
      navBar.style.display = 'none';
    }

    allChecks.forEach((check, idx) => {
      const card = document.createElement('div');
      card.className = 'checks-card' + (idx === activeIndex ? ' checks-card-active' : '');
      card.dataset.idx = idx;

      card.innerHTML = `
        <div class="checks-card-top">
          <button class="checks-goto-btn" data-idx="${idx}"
                  title="Navegar para este documento">
            ${escapeHtml(check.file_id)}
          </button>
          <button class="checks-done-btn btn btn-primary"
                  data-id="${check.id}" data-idx="${idx}"
                  title="Marcar como resolvido">✓</button>
        </div>
        <div class="checks-card-meta">
          Linha&nbsp;${check.row + 1} &middot; Col.&nbsp;${check.col + 1}
          &nbsp;&nbsp;<span class="checks-card-date">${formatDate(check.created_at)}</span>
        </div>
        <div class="checks-card-error">${escapeHtml(check.error_text)}</div>
      `;

      list.appendChild(card);
    });
  }

  // ── navigation ────────────────────────────────────────────────────────────

  async function goToCheck(idx) {
    activeIndex = idx;
    render();

    const check = allChecks[idx];
    if (!check) return;

    // Put row/col in the URL so the location is bookmarkable / shareable
    const url = new URL(window.location);
    url.searchParams.set('filename', check.file_id);
    url.searchParams.set('check_row', check.row);
    url.searchParams.set('check_col', check.col);
    window.history.pushState({}, '', url);

    closeDrawer();

    if (typeof sidebar !== 'undefined' && sidebar.selectFileById) {
      // headerTypesReady must resolve before selectFile calls setCurrentHeader
      if (typeof headerTypesReady !== 'undefined') await headerTypesReady;
      await sidebar.selectFileById(check.file_id, 'transcription');
    } else {
      if (typeof fetchAndDisplayImage === 'function')
        await fetchAndDisplayImage(check.file_id, 'transcription');
      if (typeof setTab === 'function') setTab('transcription');
    }

    // Show overlay and focus the specific cell
    if (typeof transcription_tab !== 'undefined' && transcription_tab.focusCheck) {
      transcription_tab.focusCheck(check.row, check.col);
    }
  }

  // ── dismissal ─────────────────────────────────────────────────────────────

  async function markDone(checkId, idx) {
    try {
      await removeCheck(checkId);
    } catch (e) {
      alert(`Erro ao remover verificação: ${e.message}`);
      return;
    }
    if (activeIndex !== null && idx <= activeIndex)
      activeIndex = Math.max(0, activeIndex - 1);
    allChecks.splice(idx, 1);
    if (allChecks.length === 0) activeIndex = null;
    render();
  }

  // ── open / close / refresh ────────────────────────────────────────────────

  function openDrawer() {
    drawer.classList.add('checks-drawer-open');
    refresh();
  }

  function closeDrawer() {
    drawer.classList.remove('checks-drawer-open');
  }

  async function refresh() {
    try {
      allChecks = await fetchChecks();
    } catch (e) {
      console.error('Erro ao carregar verificações:', e);
      allChecks = [];
    }
    render();
  }

  // ── lat/lon scan ──────────────────────────────────────────────────────────

  async function runLatlonScan() {
    const scanBtn = document.getElementById('checks-scan-btn');
    const orig    = scanBtn.innerHTML;
    scanBtn.disabled  = true;
    scanBtn.innerHTML = '&#8987; A verificar...';
    summary.textContent = 'A analisar coordenadas de todas as transcrições...';

    try {
      const response = await fetch('/checks/scan_latlon', {
        method: 'POST',
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || response.statusText);
      }
      const data = await response.json();
      const n = data.added ?? 0;
      await refresh();
      summary.textContent =
        `Análise concluída: ${n} verificaç${n === 1 ? 'ão nova adicionada' : 'ões novas adicionadas'}.`;
    } catch (e) {
      summary.textContent = `Erro durante a análise: ${e.message}`;
      console.error('Erro ao verificar lat/lon:', e);
    } finally {
      scanBtn.disabled  = false;
      scanBtn.innerHTML = orig;
    }
  }

  // ── init ──────────────────────────────────────────────────────────────────

  function init() {
    drawer   = document.getElementById('checks-drawer');
    closeBtn = document.getElementById('checks-drawer-close');
    list     = document.getElementById('checks-list');
    emptyMsg = document.getElementById('checks-empty-msg');
    summary  = document.getElementById('checks-summary');
    navBar   = document.getElementById('checks-nav');
    navLabel = document.getElementById('checks-nav-label');
    prevBtn  = document.getElementById('checks-prev-btn');
    nextBtn  = document.getElementById('checks-next-btn');
    openBtn  = document.getElementById('nav-checks');

    closeBtn.addEventListener('click', closeDrawer);
    document.getElementById('checks-scan-btn').addEventListener('click', runLatlonScan);

    prevBtn.addEventListener('click', () => {
      if (!allChecks.length) return;
      goToCheck(activeIndex === null ? allChecks.length - 1 : Math.max(0, activeIndex - 1));
    });
    nextBtn.addEventListener('click', () => {
      if (!allChecks.length) return;
      goToCheck(activeIndex === null ? 0 : Math.min(allChecks.length - 1, activeIndex + 1));
    });

    list.addEventListener('click', (e) => {
      const gotoBtn = e.target.closest('.checks-goto-btn');
      if (gotoBtn) { goToCheck(Number(gotoBtn.dataset.idx)); return; }

      const doneBtn = e.target.closest('.checks-done-btn');
      if (doneBtn) { markDone(Number(doneBtn.dataset.id), Number(doneBtn.dataset.idx)); }
    });

    if (openBtn) openBtn.addEventListener('click', openDrawer);

    refresh();   // populate badge without opening the drawer
  }

  document.addEventListener('DOMContentLoaded', init);

  window.checksPanel = { open: openDrawer, close: closeDrawer, refresh };

})();
