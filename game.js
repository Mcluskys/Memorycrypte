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
  let resolvingPair = false;
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
    const urls = [`${ASSET}cercueil-ouvert.webp`, ...Object.values(creatureFiles)];
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
      <span class="card-inner" aria-hidden="true">
        <span class="card-face card-back">
          <img class="coffin" src="${ASSET}cercueil-ferme.webp" alt="" draggable="false" decoding="async">
        </span>
        <span class="card-face card-front">
          <img class="coffin" src="${ASSET}cercueil-ouvert.webp" alt="" draggable="false" decoding="async">
          <img class="creature" src="${creatureFiles[type]}" alt="" draggable="false" decoding="async">
        </span>
      </span>`;

    card.addEventListener('click', () => reveal(card));
    return card;
  }

  function setClosed(card) {
    card.dataset.state = 'closed';
    card.classList.remove('is-open', 'jump');
    card.setAttribute('aria-label', `Carte ${Number(card.dataset.index) + 1}, face cachée`);
  }

  function setOpen(card) {
    card.dataset.state = 'open';
    card.classList.add('is-open', 'jump');
    card.setAttribute('aria-label', `Carte révélée : ${card.dataset.type}`);
    window.setTimeout(() => card.classList.remove('jump'), 460);
  }

  function setMatched(card) {
    card.dataset.state = 'matched';
    card.classList.add('is-open', 'is-matched');
    card.classList.remove('jump');
    card.setAttribute('aria-label', `Paire trouvée : ${card.dataset.type}`);
  }

  function resetTurn() {
    firstCard = null;
    secondCard = null;
    resolvingPair = false;
  }

  function newGame() {
    if (resolveTimer) {
      clearTimeout(resolveTimer);
      resolveTimer = null;
    }

    const deck = shuffle([...PAIRS, ...PAIRS]);
    resetTurn();
    matches = 0;
    moves = 0;
    movesEl.textContent = 'Coups : 0';
    victory.classList.add('hidden');
    board.replaceChildren();

    deck.forEach((type, index) => board.appendChild(makeCard(type, index)));
  }

  function reveal(card) {
    if (resolvingPair) return;
    if (card.dataset.state !== 'closed') return;

    setOpen(card);
    playOpenSound();

    if (!firstCard) {
      firstCard = card;
      return;
    }

    secondCard = card;
    resolvingPair = true;
    moves += 1;
    movesEl.textContent = `Coups : ${moves}`;

    const isMatch = firstCard.dataset.type === secondCard.dataset.type;

    resolveTimer = window.setTimeout(() => {
      if (isMatch) {
        setMatched(firstCard);
        setMatched(secondCard);
        matches += 1;
      } else {
        setClosed(firstCard);
        setClosed(secondCard);
      }

      resetTurn();
      resolveTimer = null;

      if (matches === PAIRS.length) {
        window.setTimeout(() => victory.classList.remove('hidden'), 300);
      }
    }, isMatch ? 520 : 900);
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
        const registration = await navigator.serviceWorker.register('./sw.js');
        void registration.update();
      } catch (_) {}
    });
  }
})();
