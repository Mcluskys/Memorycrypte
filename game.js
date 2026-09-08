(() => {
  'use strict';

  const ASSET = './assets/';
  const PAIRS = ['vampire', 'sorciere', 'zombie', 'chauve-souris', 'momie'];
  const creatureFiles = Object.fromEntries(PAIRS.map(name => [name, `${ASSET}${name}.webp`]));

  const board = document.getElementById('board');
  const startScreen = document.getElementById('startScreen');
  const startBtn = document.getElementById('startBtn');
  const game = document.getElementById('game');
  const movesEl = document.getElementById('moves');
  const soundBtn = document.getElementById('soundBtn');
  const victory = document.getElementById('victory');
  const restartBtn = document.getElementById('restartBtn');

  let firstCard = null;
  let secondCard = null;
  let lockBoard = false;
  let matches = 0;
  let moves = 0;
  let soundOn = true;
  let ambience = null;
  let sfx = null;
  let resolveTimer = null;

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
    ambience = new Audio(`${ASSET}ambiance.${ext}`);
    ambience.loop = true;
    ambience.preload = 'metadata';
    ambience.volume = 0.34;

    sfx = new Audio(`${ASSET}grincement.${ext}`);
    sfx.preload = 'auto';
    sfx.volume = 0.36;
  }

  async function startAmbience() {
    setupAudio();
    if (!soundOn) return;
    try { await ambience.play(); } catch (_) {}
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
    const urls = [
      `${ASSET}cercueil-ferme.webp`,
      `${ASSET}cercueil-ouvert.webp`,
      ...Object.values(creatureFiles)
    ];
    return Promise.all(urls.map(url => new Promise(resolve => {
      const img = new Image();
      img.onload = img.onerror = resolve;
      img.src = url;
      if (img.decode) img.decode().then(resolve).catch(() => {});
    })));
  }

  function makeCard(type, index) {
    const card = document.createElement('button');
    card.className = 'card';
    card.type = 'button';
    card.dataset.type = type;
    card.dataset.index = String(index);
    card.dataset.state = 'closed';
    card.setAttribute('aria-label', `Carte ${index + 1}, face cachée`);
    card.innerHTML = `
      <span class="card-face card-back" aria-hidden="true">
        <img class="coffin" src="${ASSET}cercueil-ferme.webp" alt="" draggable="false" decoding="async">
      </span>
      <span class="card-face card-front" aria-hidden="true">
        <img class="coffin" src="${ASSET}cercueil-ouvert.webp" alt="" draggable="false" decoding="async">
        <img class="creature" src="${creatureFiles[type]}" alt="" draggable="false" decoding="async">
      </span>`;
    return card;
  }

  function openCard(card) {
    if (!card || card.dataset.state !== 'closed') return false;
    card.dataset.state = 'open';
    card.classList.add('is-open', 'jump');
    card.setAttribute('aria-label', `Carte révélée : ${card.dataset.type}`);
    window.setTimeout(() => card.classList.remove('jump'), 420);
    playOpenSound();
    return true;
  }

  function closeCard(card) {
    if (!card || card.dataset.state === 'matched') return;
    card.dataset.state = 'closed';
    card.classList.remove('is-open', 'jump');
    card.setAttribute('aria-label', `Carte ${Number(card.dataset.index) + 1}, face cachée`);
  }

  function matchCard(card) {
    if (!card) return;
    card.dataset.state = 'matched';
    card.classList.add('is-open', 'is-matched');
    card.classList.remove('jump');
    card.setAttribute('aria-label', `Paire trouvée : ${card.dataset.type}`);
    // On ne désactive pas le bouton : certains navigateurs mobiles gèrent mal
    // les éléments disabled pendant une animation. L'état "matched" suffit.
  }

  function clearTurn() {
    firstCard = null;
    secondCard = null;
    lockBoard = false;
  }

  function newGame() {
    if (resolveTimer) {
      clearTimeout(resolveTimer);
      resolveTimer = null;
    }

    const deck = shuffle([...PAIRS, ...PAIRS]);
    firstCard = null;
    secondCard = null;
    lockBoard = false;
    matches = 0;
    moves = 0;
    movesEl.textContent = 'Coups : 0';
    victory.classList.add('hidden');
    board.replaceChildren(...deck.map((type, index) => makeCard(type, index)));
  }

  function selectCard(card) {
    if (lockBoard) return;
    if (!card || card.dataset.state !== 'closed') return;
    if (!openCard(card)) return;

    if (!firstCard) {
      firstCard = card;
      return;
    }

    secondCard = card;
    lockBoard = true;
    moves += 1;
    movesEl.textContent = `Coups : ${moves}`;

    const matched = firstCard.dataset.type === secondCard.dataset.type;

    if (matched) {
      // La paire reste ouverte immédiatement et définitivement.
      matchCard(firstCard);
      matchCard(secondCard);
      matches += 1;

      resolveTimer = window.setTimeout(() => {
        clearTurn();
        resolveTimer = null;
        if (matches === PAIRS.length) {
          window.setTimeout(() => victory.classList.remove('hidden'), 250);
        }
      }, 280);
    } else {
      resolveTimer = window.setTimeout(() => {
        closeCard(firstCard);
        closeCard(secondCard);
        clearTurn();
        resolveTimer = null;
      }, 780);
    }
  }

  // Délégation unique : toute la surface du bouton est cliquable, même sur mobile.
  board.addEventListener('pointerup', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const card = event.target.closest('.card');
    if (!card || !board.contains(card)) return;
    event.preventDefault();
    selectCard(card);
  });

  // Accessibilité clavier (Entrée / Espace).
  board.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const card = event.target.closest('.card');
    if (!card) return;
    event.preventDefault();
    selectCard(card);
  });

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

  restartBtn.addEventListener('click', newGame);

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
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('./sw.js?v=6');
        await registration.update();
      } catch (_) {}
    });
  }
})();
