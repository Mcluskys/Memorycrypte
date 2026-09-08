(() => {
  'use strict';

  const ASSET = './assets/';
  const pairs = ['vampire', 'sorciere', 'zombie', 'chauve-souris', 'momie'];
  const creatureFiles = Object.fromEntries(pairs.map(name => [name, `${ASSET}${name}.webp`]));

  const board = document.getElementById('board');
  const startScreen = document.getElementById('startScreen');
  const startBtn = document.getElementById('startBtn');
  const game = document.getElementById('game');
  const movesEl = document.getElementById('moves');
  const soundBtn = document.getElementById('soundBtn');
  const victory = document.getElementById('victory');
  const restartBtn = document.getElementById('restartBtn');

  let cards = [];
  let first = null;
  let second = null;
  let locked = false;
  let matches = 0;
  let moves = 0;
  let soundOn = true;
  let ambience = null;
  let sfx = null;

  const shuffle = (items) => {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  };

  const supportsOpus = () => {
    const a = document.createElement('audio');
    return Boolean(a.canPlayType && a.canPlayType('audio/ogg; codecs="opus"').replace(/no/, ''));
  };

  function setupAudio() {
    if (ambience) return;
    const ext = supportsOpus() ? 'ogg' : 'mp3';
    ambience = new Audio(`${ASSET}ambiance.${ext}`);
    ambience.loop = true;
    ambience.preload = 'auto';
    ambience.volume = 0.34;

    sfx = new Audio(`${ASSET}grincement.${ext}`);
    sfx.preload = 'auto';
    sfx.volume = 0.36;
  }

  async function startAmbience() {
    setupAudio();
    if (!soundOn) return;
    try { await ambience.play(); } catch (_) { /* geste utilisateur requis sur certains navigateurs */ }
  }

  function playOpenSound() {
    if (!soundOn || !sfx) return;
    try {
      sfx.pause();
      sfx.currentTime = 0;
      void sfx.play();
    } catch (_) {}
  }

  function preloadImages() {
    const urls = [`${ASSET}cercueil-ouvert.webp`, ...Object.values(creatureFiles)];
    return Promise.all(urls.map(url => new Promise(resolve => {
      const img = new Image();
      img.onload = img.onerror = resolve;
      img.src = url;
      if (img.decode) img.decode().then(resolve).catch(() => {});
    })));
  }

  function makeCard(type, index) {
    const button = document.createElement('button');
    button.className = 'card';
    button.type = 'button';
    button.dataset.type = type;
    button.dataset.index = String(index);
    button.setAttribute('aria-label', `Carte ${index + 1}, face cachée`);
    button.innerHTML = `
      <span class="card-inner">
        <span class="card-face card-back">
          <img class="coffin" src="${ASSET}cercueil-ferme.webp" alt="" draggable="false" decoding="async">
        </span>
        <span class="card-face card-front">
          <img class="coffin" src="${ASSET}cercueil-ouvert.webp" alt="" draggable="false" decoding="async">
          <img class="creature" src="${creatureFiles[type]}" alt="" draggable="false" decoding="async">
        </span>
      </span>`;
    button.addEventListener('click', () => reveal(button));
    return button;
  }

  function newGame() {
    const deck = shuffle([...pairs, ...pairs]);
    first = null;
    second = null;
    locked = false;
    matches = 0;
    moves = 0;
    movesEl.textContent = 'Coups : 0';
    victory.classList.add('hidden');
    board.replaceChildren();
    cards = deck.map((type, index) => {
      const el = makeCard(type, index);
      board.appendChild(el);
      return el;
    });
  }

  function reveal(card) {
    if (locked || card === first || card.classList.contains('is-open') || card.classList.contains('is-matched')) return;

    card.classList.add('is-open', 'jump');
    card.setAttribute('aria-label', `Carte révélée : ${card.dataset.type}`);
    playOpenSound();
    setTimeout(() => card.classList.remove('jump'), 460);

    if (!first) {
      first = card;
      return;
    }

    second = card;
    moves += 1;
    movesEl.textContent = `Coups : ${moves}`;
    locked = true;

    const isMatch = first.dataset.type === second.dataset.type;
    window.setTimeout(() => {
      if (isMatch) {
        first.classList.add('is-matched');
        second.classList.add('is-matched');
        first.disabled = true;
        second.disabled = true;
        matches += 1;
      } else {
        first.classList.remove('is-open');
        second.classList.remove('is-open');
        first.setAttribute('aria-label', `Carte ${Number(first.dataset.index) + 1}, face cachée`);
        second.setAttribute('aria-label', `Carte ${Number(second.dataset.index) + 1}, face cachée`);
      }

      first = null;
      second = null;
      locked = false;

      if (matches === pairs.length) {
        window.setTimeout(() => victory.classList.remove('hidden'), 350);
      }
    }, 850);
  }

  startBtn.addEventListener('click', async () => {
    startBtn.disabled = true;
    startBtn.textContent = 'Ouverture de la crypte…';
    setupAudio();
    void startAmbience();
    await preloadImages();
    newGame();
    startScreen.classList.add('hidden');
    game.classList.remove('hidden');
  });

  restartBtn.addEventListener('click', () => newGame());

  soundBtn.addEventListener('click', async () => {
    soundOn = !soundOn;
    soundBtn.setAttribute('aria-pressed', String(!soundOn));
    soundBtn.textContent = soundOn ? '🔊' : '🔇';
    soundBtn.setAttribute('aria-label', soundOn ? 'Couper le son' : 'Activer le son');
    setupAudio();
    if (soundOn) await startAmbience();
    else ambience.pause();
  });

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
})();
