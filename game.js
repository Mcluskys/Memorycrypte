(() => {
  'use strict';

  const ASSET = './assets/';
  const PAIRS = ['vampire', 'sorciere', 'zombie', 'chauve-souris', 'momie'];
  const creatureFile = (name) => `${ASSET}${name}.png?v=7`;

  const board = document.getElementById('board');
  const startScreen = document.getElementById('startScreen');
  const startBtn = document.getElementById('startBtn');
  const game = document.getElementById('game');
  const movesEl = document.getElementById('moves');
  const soundBtn = document.getElementById('soundBtn');
  const victory = document.getElementById('victory');
  const restartBtn = document.getElementById('restartBtn');

  let firstCard = null, secondCard = null, lockBoard = false;
  let matches = 0, moves = 0, soundOn = true;
  let ambience = null, sfx = null, resolveTimer = null;

  function shuffle(items) {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }

  function supportsOpus() {
    const audio = document.createElement('audio');
    return Boolean(audio.canPlayType && audio.canPlayType('audio/ogg; codecs="opus"').replace(/no/, ''));
  }

  function setupAudio() {
    if (ambience) return;
    const ext = supportsOpus() ? 'ogg' : 'mp3';
    ambience = new Audio(`${ASSET}ambiance.${ext}?v=7`);
    ambience.loop = true; ambience.preload = 'metadata'; ambience.volume = 0.34;
    sfx = new Audio(`${ASSET}grincement.${ext}?v=7`);
    sfx.preload = 'auto'; sfx.volume = 0.36;
  }

  async function startAmbience() {
    setupAudio();
    if (!soundOn) return;
    try { await ambience.play(); } catch (_) {}
  }

  function playOpenSound() {
    if (!soundOn || !sfx) return;
    try { sfx.pause(); sfx.currentTime = 0; void sfx.play(); } catch (_) {}
  }

  function preloadImages() {
    const urls = [`${ASSET}cercueil-ferme.png?v=7`, `${ASSET}cercueil-ouvert.png?v=7`, ...PAIRS.map(creatureFile)];
    return Promise.all(urls.map(url => new Promise(resolve => {
      const img = new Image(); img.onload = img.onerror = resolve; img.src = url;
    })));
  }

  function makeCard(type, index) {
    const card = document.createElement('button');
    card.className = 'card'; card.type = 'button';
    card.dataset.type = type; card.dataset.index = String(index); card.dataset.state = 'closed';
    card.setAttribute('aria-label', `Carte ${index + 1}, face cachée`);
    card.innerHTML = `
      <span class="card-face card-back" aria-hidden="true">
        <img class="coffin" src="${ASSET}cercueil-ferme.png?v=7" alt="" draggable="false">
      </span>
      <span class="card-face card-front" aria-hidden="true">
        <img class="coffin" src="${ASSET}cercueil-ouvert.png?v=7" alt="" draggable="false">
        <img class="creature" src="${creatureFile(type)}" alt="" draggable="false">
      </span>`;
    return card;
  }

  function openCard(card) {
    if (!card || card.dataset.state !== 'closed') return false;
    card.dataset.state = 'open'; card.classList.add('is-open', 'jump');
    setTimeout(() => card.classList.remove('jump'), 420); playOpenSound(); return true;
  }

  function closeCard(card) {
    if (!card || card.dataset.state === 'matched') return;
    card.dataset.state = 'closed'; card.classList.remove('is-open', 'jump');
  }

  function matchCard(card) {
    if (!card) return;
    card.dataset.state = 'matched';
    card.classList.add('is-open', 'is-matched');
    card.classList.remove('jump');
  }

  function clearTurn() { firstCard = null; secondCard = null; lockBoard = false; }

  function newGame() {
    if (resolveTimer) clearTimeout(resolveTimer);
    const deck = shuffle([...PAIRS, ...PAIRS]);
    firstCard = secondCard = null; lockBoard = false; matches = 0; moves = 0;
    movesEl.textContent = 'Coups : 0'; victory.classList.add('hidden');
    board.replaceChildren(...deck.map(makeCard));
  }

  function selectCard(card) {
    if (lockBoard || !card || card.dataset.state !== 'closed') return;
    if (!openCard(card)) return;
    if (!firstCard) { firstCard = card; return; }

    secondCard = card; lockBoard = true; moves++;
    movesEl.textContent = `Coups : ${moves}`;

    if (firstCard.dataset.type === secondCard.dataset.type) {
      matchCard(firstCard); matchCard(secondCard); matches++;
      resolveTimer = setTimeout(() => {
        clearTurn(); resolveTimer = null;
        if (matches === PAIRS.length) setTimeout(() => victory.classList.remove('hidden'), 250);
      }, 250);
    } else {
      resolveTimer = setTimeout(() => {
        closeCard(firstCard); closeCard(secondCard); clearTurn(); resolveTimer = null;
      }, 800);
    }
  }

  function cardFromEvent(event) {
    const node = event.target instanceof Element ? event.target.closest('.card') : null;
    return node && board.contains(node) ? node : null;
  }

  board.addEventListener('click', (event) => {
    const card = cardFromEvent(event); if (!card) return;
    event.preventDefault(); selectCard(card);
  });

  board.addEventListener('touchend', (event) => {
    const card = cardFromEvent(event); if (!card) return;
    event.preventDefault(); selectCard(card);
  }, { passive: false });

  startBtn.addEventListener('click', async () => {
    startBtn.disabled = true; startBtn.textContent = 'Ouverture de la crypte…';
    setupAudio(); void startAmbience(); await preloadImages(); newGame();
    startScreen.classList.add('hidden'); game.classList.remove('hidden');
  });

  restartBtn.addEventListener('click', newGame);
  soundBtn.addEventListener('click', async () => {
    soundOn = !soundOn; soundBtn.textContent = soundOn ? '🔊' : '🔇';
    setupAudio(); if (soundOn) await startAmbience(); else ambience.pause();
  });

  // Supprime les anciens service workers/caches : évite les images périmées ou 404 mises en cache sur mobile.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(reg => reg.unregister())).catch(() => {});
  }
  if ('caches' in window) {
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('memory-crypte-')).map(k => caches.delete(k)))).catch(() => {});
  }
})();
