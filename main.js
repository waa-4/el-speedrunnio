/*
  EL SPEEDRUNNIO v1 FIXED

  Fix in this version:
  - The game no longer creates stacked requestAnimationFrame loops.
  - Movement now uses dt scaling, so frame rate changes do not make the game faster/slower.
*/

const CONFIG = {
  tile: 40,
  gravity: 1900,
  frictionGround: 0.84,
  frictionAir: 0.96,
  idleExplodeTime: 5,

  playerBase: {
    speed: 1200,
    maxRun: 310,
    jump: 860,
    dash: 520,
    swordDamage: 1
  },

  upgrades: {
    speed: { name: "Speed", cost: 2, max: 8, add: 35 },
    jump: { name: "Jump", cost: 2, max: 8, add: 28 },
    dash: { name: "Dash", cost: 2, max: 8, add: 30 }
  },

  levels: [
    {
      id: "1-1",
      name: "Move or Boom",
      reward: 2,
      par: 30,
      map: [
        "########################",
        "#P....................G#",
        "#.............C........#",
        "#......####............#",
        "#......................#",
        "#............####......#",
        "#......................#",
        "########################"
      ]
    },
    {
      id: "1-2",
      name: "The Floor Has Opinions",
      reward: 2,
      par: 35,
      map: [
        "########################",
        "#P....................G#",
        "#....####..............#",
        "#..............C.......#",
        "#.........^^^^.........#",
        "#......####......####..#",
        "#......................#",
        "########################"
      ]
    },
    {
      id: "1-3",
      name: "Breakable Panic",
      reward: 2,
      par: 40,
      map: [
        "########################",
        "#P...........X........G#",
        "#...........XXX........#",
        "#.....C.....XXX........#",
        "#..........#####.......#",
        "#......................#",
        "#...............C......#",
        "########################"
      ]
    }
  ],

  defaultCustomMap: [
    "########################",
    "#P....................G#",
    "#........C.............#",
    "#......####............#",
    "#...............^^^^...#",
    "#......................#",
    "#......................#",
    "########################"
  ].join("\n")
};

const screens = {
  start: document.getElementById("startScreen"),
  difficulty: document.getElementById("difficultyScreen"),
  rick: document.getElementById("rickScreen"),
  main: document.getElementById("mainMenuScreen"),
  levels: document.getElementById("levelsScreen"),
  upgrades: document.getElementById("upgradesScreen"),
  editor: document.getElementById("editorScreen"),
  custom: document.getElementById("customScreen"),
  game: document.getElementById("gameScreen")
};

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const saveKey = "move_or_explode_v1_save";
const customKey = "move_or_explode_v1_custom_levels";

let save = loadSave();
let customLevels = loadCustomLevels();

let keys = {};
let mobile = { left: false, right: false, jump: false, dash: false };
let game = null;

let animationId = null;
let gameLoopRunning = false;
let lastTime = 0;

function showScreen(name) {
  Object.values(screens).forEach(screen => screen.classList.remove("active"));
  screens[name].classList.add("active");

  if (name !== "game") {
    stopGameLoop();
  }

  refreshUI();
}

function startGameLoop() {
  stopGameLoop();
  gameLoopRunning = true;
  lastTime = performance.now();
  animationId = requestAnimationFrame(loop);
}

function stopGameLoop() {
  gameLoopRunning = false;
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

function loadSave() {
  try {
    return JSON.parse(localStorage.getItem(saveKey)) || {
      points: 0,
      beaten: {},
      upgrades: { speed: 0, jump: 0, dash: 0 }
    };
  } catch {
    return { points: 0, beaten: {}, upgrades: { speed: 0, jump: 0, dash: 0 } };
  }
}

function saveGame() {
  localStorage.setItem(saveKey, JSON.stringify(save));
}

function loadCustomLevels() {
  try {
    return JSON.parse(localStorage.getItem(customKey)) || [];
  } catch {
    return [];
  }
}

function saveCustomLevels() {
  localStorage.setItem(customKey, JSON.stringify(customLevels));
}

function refreshUI() {
  document.getElementById("pointsText").textContent = save.points;
  document.getElementById("upgradePointsText").textContent = save.points;
  document.getElementById("gamePointsHud").textContent = save.points;
  renderLevels();
  renderUpgrades();
  renderCustomLevels();
}

function getStats() {
  return {
    speed: CONFIG.playerBase.speed + save.upgrades.speed * CONFIG.upgrades.speed.add,
    maxRun: CONFIG.playerBase.maxRun + save.upgrades.speed * 18,
    jump: CONFIG.playerBase.jump + save.upgrades.jump * CONFIG.upgrades.jump.add,
    dash: CONFIG.playerBase.dash + save.upgrades.dash * CONFIG.upgrades.dash.add,
    swordDamage: CONFIG.playerBase.swordDamage
  };
}

document.getElementById("startBtn").onclick = () => showScreen("difficulty");

document.querySelectorAll(".backBtn").forEach(btn => {
  btn.onclick = () => showScreen("start");
});

document.querySelectorAll(".menuBackBtn").forEach(btn => {
  btn.onclick = () => showScreen("main");
});

document.querySelectorAll(".fakeDiff").forEach(btn => {
  btn.onclick = () => {
    document.getElementById("rickTitle").textContent = `${btn.dataset.name} was a lie`;
    document.getElementById("rickText").textContent = "You selected the rickroll difficulty. Pure Insane is the only real door.";
    showScreen("rick");
  };
});

document.getElementById("rickBackBtn").onclick = () => showScreen("difficulty");
document.getElementById("pureInsaneBtn").onclick = () => showScreen("main");
document.getElementById("playBtn").onclick = () => showScreen("levels");
document.getElementById("upgradeBtn").onclick = () => showScreen("upgrades");
document.getElementById("editorBtn").onclick = () => showScreen("editor");
document.getElementById("customBtn").onclick = () => showScreen("custom");

document.getElementById("wipeSaveBtn").onclick = () => {
  if (!confirm("Wipe points, beaten levels, and upgrades?")) return;
  save = { points: 0, beaten: {}, upgrades: { speed: 0, jump: 0, dash: 0 } };
  saveGame();
  refreshUI();
};

// Visual editor state
const TILE_TYPES = [
  { key: ".", name: "Empty", className: "empty", icon: "" },
  { key: "#", name: "Solid", className: "solid", icon: "#" },
  { key: "P", name: "Player", className: "player", icon: "P" },
  { key: "G", name: "Goal", className: "goal", icon: "G" },
  { key: "C", name: "Chaser", className: "chaser", icon: "C" },
  { key: "X", name: "Breakable", className: "breakable", icon: "X" },
  { key: "^", name: "Spike", className: "spike", icon: "^" }
];

let selectedEditorTile = "#";
let editorGrid = [];
let editorPainting = false;

initVisualEditor(CONFIG.defaultCustomMap);

document.getElementById("saveCustomBtn").onclick = () => {
  const level = makeCustomLevelFromEditor();
  if (!level) return;
  customLevels.push(level);
  saveCustomLevels();
  refreshUI();
  alert("Custom level saved.");
};

document.getElementById("exportCustomBtn").onclick = () => {
  const level = makeCustomLevelFromEditor();
  if (!level) return;
  document.getElementById("shareBox").value = btoa(unescape(encodeURIComponent(JSON.stringify(level))));
};

document.getElementById("importCustomBtn").onclick = () => {
  try {
    const text = document.getElementById("shareBox").value.trim();
    const level = JSON.parse(decodeURIComponent(escape(atob(text))));
    if (!level.name || !Array.isArray(level.map)) throw new Error("Bad level");
    customLevels.push({
      id: "custom-" + Date.now(),
      name: level.name,
      reward: 2,
      par: level.par || 60,
      custom: true,
      map: level.map
    });
    saveCustomLevels();
    refreshUI();
    alert("Imported custom level.");
  } catch {
    alert("Import failed. Paste a valid exported level code.");
  }
};

function makeCustomLevelFromEditor() {
  syncGridToText();

  const name = document.getElementById("editorName").value.trim() || "Custom Level";
  const lines = getEditorMapLines();

  if (lines.length < 3) {
    alert("Map needs at least 3 rows.");
    return null;
  }

  const joined = lines.join("");
  if (!joined.includes("P") || !joined.includes("G")) {
    alert("Map needs P for player and G for goal.");
    return null;
  }

  return {
    id: "custom-" + Date.now(),
    name,
    reward: 2,
    par: 60,
    custom: true,
    map: lines
  };
}


function initVisualEditor(mapText) {
  const lines = typeof mapText === "string" ? mapText.split("\n").filter(Boolean) : mapText;
  editorGrid = normalizeEditorGrid(lines);
  renderPalette();
  renderEditorGrid();
  syncGridToText();

  document.getElementById("resizeSmallBtn").onclick = () => resizeEditorGrid(24, 8);
  document.getElementById("resizeBigBtn").onclick = () => resizeEditorGrid(32, 12);
  document.getElementById("clearEditorBtn").onclick = () => {
    if (!confirm("Clear the visual editor grid?")) return;
    editorGrid = makeBlankEditorGrid(editorGrid[0]?.length || 24, editorGrid.length || 8);
    editorGrid[1][1] = "P";
    editorGrid[1][editorGrid[0].length - 2] = "G";
    renderEditorGrid();
    syncGridToText();
  };
  document.getElementById("syncTextToGridBtn").onclick = () => {
    const lines = document.getElementById("editorMap").value.split("\n").filter(Boolean);
    editorGrid = normalizeEditorGrid(lines);
    renderEditorGrid();
    syncGridToText();
  };

  window.addEventListener("pointerup", () => {
    editorPainting = false;
  });
}

function normalizeEditorGrid(lines) {
  const height = Math.max(3, lines.length || 8);
  const width = Math.max(8, ...lines.map(line => line.length), 24);
  const grid = [];

  for (let y = 0; y < height; y++) {
    const row = [];
    const source = lines[y] || "";
    for (let x = 0; x < width; x++) {
      const ch = source[x] || ".";
      row.push(TILE_TYPES.some(t => t.key === ch) ? ch : ".");
    }
    grid.push(row);
  }

  return grid;
}

function makeBlankEditorGrid(width, height) {
  const grid = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      const border = y === 0 || x === 0 || y === height - 1 || x === width - 1;
      row.push(border ? "#" : ".");
    }
    grid.push(row);
  }
  return grid;
}

function resizeEditorGrid(width, height) {
  const old = editorGrid;
  const next = makeBlankEditorGrid(width, height);

  for (let y = 0; y < Math.min(height, old.length); y++) {
    for (let x = 0; x < Math.min(width, old[y].length); x++) {
      next[y][x] = old[y][x];
    }
  }

  editorGrid = next;
  ensureOneSpecial("P");
  ensureOneSpecial("G");
  renderEditorGrid();
  syncGridToText();
}

function renderPalette() {
  const palette = document.getElementById("tilePalette");
  palette.innerHTML = "";

  TILE_TYPES.forEach(tile => {
    const btn = document.createElement("button");
    btn.className = "tilePick" + (tile.key === selectedEditorTile ? " active" : "");
    btn.innerHTML = `
      <span class="tilePreview ${tile.className}">${tile.icon}</span>
      <span>${tile.name}</span>
    `;
    btn.onclick = () => {
      selectedEditorTile = tile.key;
      document.getElementById("selectedTileName").textContent = tile.name;
      renderPalette();
    };
    palette.appendChild(btn);
  });

  const selected = TILE_TYPES.find(t => t.key === selectedEditorTile);
  document.getElementById("selectedTileName").textContent = selected?.name || "Unknown";
}

function renderEditorGrid() {
  const grid = document.getElementById("visualEditorGrid");
  const height = editorGrid.length;
  const width = editorGrid[0]?.length || 0;

  grid.style.gridTemplateColumns = `repeat(${width}, 30px)`;
  grid.innerHTML = "";
  document.getElementById("gridSizeText").textContent = `${width} × ${height}`;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const ch = editorGrid[y][x];
      const tile = TILE_TYPES.find(t => t.key === ch) || TILE_TYPES[0];
      const cell = document.createElement("div");
      cell.className = `editorCell ${tile.className}`;
      cell.textContent = tile.icon;
      cell.title = `${tile.name} (${x}, ${y})`;

      cell.addEventListener("pointerdown", e => {
        e.preventDefault();
        editorPainting = true;
        paintEditorCell(x, y);
      });

      cell.addEventListener("pointerenter", e => {
        if (!editorPainting) return;
        e.preventDefault();
        paintEditorCell(x, y);
      });

      grid.appendChild(cell);
    }
  }
}

function paintEditorCell(x, y) {
  if (!editorGrid[y] || editorGrid[y][x] === undefined) return;

  if (selectedEditorTile === "P" || selectedEditorTile === "G") {
    removeTileEverywhere(selectedEditorTile);
  }

  editorGrid[y][x] = selectedEditorTile;
  renderEditorGrid();
  syncGridToText();
}

function removeTileEverywhere(tileKey) {
  for (let y = 0; y < editorGrid.length; y++) {
    for (let x = 0; x < editorGrid[y].length; x++) {
      if (editorGrid[y][x] === tileKey) editorGrid[y][x] = ".";
    }
  }
}

function ensureOneSpecial(tileKey) {
  const hasTile = editorGrid.some(row => row.includes(tileKey));
  if (!hasTile && editorGrid[1]) {
    editorGrid[1][tileKey === "P" ? 1 : editorGrid[1].length - 2] = tileKey;
  }
}

function syncGridToText() {
  document.getElementById("editorMap").value = editorGrid.map(row => row.join("")).join("\n");
}

function getEditorMapLines() {
  syncGridToText();
  return editorGrid.map(row => row.join(""));
}


function renderLevels() {
  const box = document.getElementById("levelList");
  box.innerHTML = "";

  CONFIG.levels.forEach(level => {
    const div = document.createElement("div");
    div.className = "levelItem";
    const beaten = save.beaten[level.id] ? "Completed" : "Not completed";

    div.innerHTML = `
      <div>
        <b>${escapeHTML(level.id)} — ${escapeHTML(level.name)}</b>
        <p>${beaten} • Reward: ${level.reward} points</p>
      </div>
      <button>Play</button>
    `;

    div.querySelector("button").onclick = () => startLevel(level);
    box.appendChild(div);
  });
}

function renderCustomLevels() {
  const box = document.getElementById("customList");
  box.innerHTML = "";

  if (customLevels.length === 0) {
    box.innerHTML = `<p class="muted">No custom levels yet. Make one in Level Creator.</p>`;
    return;
  }

  customLevels.forEach((level, index) => {
    const div = document.createElement("div");
    div.className = "levelItem";
    div.innerHTML = `
      <div>
        <b>${escapeHTML(level.name)}</b>
        <p>Custom level • Reward: ${level.reward || 2} points</p>
      </div>
      <div class="buttonRow">
        <button class="playCustom">Play</button>
        <button class="deleteCustom danger">Delete</button>
      </div>
    `;

    div.querySelector(".playCustom").onclick = () => startLevel(level);
    div.querySelector(".deleteCustom").onclick = () => {
      if (!confirm("Delete this custom level?")) return;
      customLevels.splice(index, 1);
      saveCustomLevels();
      refreshUI();
    };
    box.appendChild(div);
  });
}

function renderUpgrades() {
  const box = document.getElementById("upgradeList");
  box.innerHTML = "";

  Object.entries(CONFIG.upgrades).forEach(([id, data]) => {
    const level = save.upgrades[id] || 0;
    const maxed = level >= data.max;
    const div = document.createElement("div");
    div.className = "upgradeItem";
    div.innerHTML = `
      <div>
        <b>${escapeHTML(data.name)} Lv ${level}/${data.max}</b>
        <p>Cost: ${maxed ? "MAX" : data.cost + " points"}</p>
      </div>
      <button ${maxed ? "disabled" : ""}>Upgrade</button>
    `;

    div.querySelector("button").onclick = () => {
      if (maxed) return;
      if (save.points < data.cost) {
        alert("Not enough points.");
        return;
      }

      save.points -= data.cost;
      save.upgrades[id]++;
      saveGame();
      refreshUI();
    };

    box.appendChild(div);
  });
}

function startLevel(level) {
  stopGameLoop();
  showScreen("game");
  resizeCanvas();

  game = {
    level,
    stats: getStats(),
    tiles: [],
    enemies: [],
    particles: [],
    camera: { x: 0, y: 0 },
    idleTimer: CONFIG.idleExplodeTime,
    complete: false,
    dead: false,
    messageTimer: 0,
    message: "",
    player: {
      x: 80, y: 80, w: 28, h: 34,
      vx: 0, vy: 0,
      onGround: false,
      facing: 1,
      dashCooldown: 0,
      swordTimer: 0,
      jumpHeld: false
    }
  };

  parseMap(level.map);
  document.getElementById("levelNameHud").textContent = level.name;
  startGameLoop();
}

function parseMap(map) {
  game.tiles = [];
  game.enemies = [];

  map.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const tx = x * CONFIG.tile;
      const ty = y * CONFIG.tile;

      if (ch === "#") game.tiles.push({ x: tx, y: ty, w: CONFIG.tile, h: CONFIG.tile, type: "solid" });
      if (ch === "X") game.tiles.push({ x: tx, y: ty, w: CONFIG.tile, h: CONFIG.tile, type: "breakable" });
      if (ch === "^") game.tiles.push({ x: tx, y: ty + 12, w: CONFIG.tile, h: CONFIG.tile - 12, type: "spike" });
      if (ch === "P") {
        game.player.x = tx + 6;
        game.player.y = ty + 2;
      }
      if (ch === "G") game.goal = { x: tx, y: ty, w: CONFIG.tile, h: CONFIG.tile };
      if (ch === "C") {
        game.enemies.push({ type: "chaser", x: tx + 5, y: ty + 4, w: 30, h: 34, vx: 0, vy: 0, hp: 2, onGround: false });
      }
    });
  });
}

function loop(now) {
  if (!gameLoopRunning || !game) return;

  let dt = (now - lastTime) / 1000;
  lastTime = now;

  // Stops huge speed jumps after tabbing away.
  dt = Math.min(dt, 1 / 30);

  update(dt);
  draw();

  animationId = requestAnimationFrame(loop);
}

function update(dt) {
  const p = game.player;
  const inputX = (keys.ArrowRight || keys.KeyD || mobile.right ? 1 : 0) - (keys.ArrowLeft || keys.KeyA || mobile.left ? 1 : 0);
  const jumpPressed = !!(keys.ArrowUp || keys.KeyW || keys.Space || mobile.jump);
  const dashing = keys.ShiftLeft || keys.ShiftRight || keys.KeyE || mobile.dash;

  if (!game.dead && !game.complete) {
    if (inputX !== 0) {
      p.vx += inputX * game.stats.speed * dt;
      p.vx = clamp(p.vx, -game.stats.maxRun, game.stats.maxRun);
      p.facing = inputX;
      game.idleTimer = CONFIG.idleExplodeTime;
    } else if (Math.abs(p.vx) < 18 && p.onGround) {
      game.idleTimer -= dt;
    } else {
      game.idleTimer = Math.max(game.idleTimer - dt * 0.2, 0);
    }

    if (jumpPressed && !p.jumpHeld && p.onGround) {
      p.vy = -game.stats.jump;
      p.onGround = false;
      game.idleTimer = CONFIG.idleExplodeTime;
    }
    p.jumpHeld = jumpPressed;

    if (dashing && p.dashCooldown <= 0) {
      p.vx = p.facing * game.stats.dash;
      p.dashCooldown = 0.8;
      burst(p.x + p.w / 2, p.y + p.h / 2, 10);
      game.idleTimer = CONFIG.idleExplodeTime;
    }

    if (keys.MouseDown && p.swordTimer <= 0) {
      swingSword();
    }

    if (game.idleTimer <= 0) {
      explodePlayer("You stopped moving.");
    }
  }

  p.dashCooldown -= dt;
  p.swordTimer -= dt;

  p.vy += CONFIG.gravity * dt;
  p.vx *= p.onGround ? CONFIG.frictionGround : CONFIG.frictionAir;

  moveEntity(p, p.vx * dt, 0);
  moveEntity(p, 0, p.vy * dt);

  updateEnemies(dt);
  updateParticles(dt);

  if (!game.dead && game.goal && rectsTouch(p, game.goal)) {
    completeLevel();
  }

  game.camera.x = clamp(p.x - canvas.width / 2 + p.w / 2, 0, Math.max(0, getLevelWidth() - canvas.width));
  game.camera.y = clamp(p.y - canvas.height / 2 + p.h / 2, 0, Math.max(0, getLevelHeight() - canvas.height));

  document.getElementById("idleHud").textContent = Math.max(0, game.idleTimer).toFixed(1);
  document.getElementById("gamePointsHud").textContent = save.points;

  if (game.messageTimer > 0) game.messageTimer -= dt;
}

function updateEnemies(dt) {
  const p = game.player;

  for (const e of game.enemies) {
    if (e.dead) continue;

    const dir = Math.sign((p.x + p.w / 2) - (e.x + e.w / 2)) || 1;
    e.vx += dir * 450 * dt;
    e.vx = clamp(e.vx, -150, 150);
    e.vy += CONFIG.gravity * dt;
    e.vx *= e.onGround ? 0.88 : 0.97;

    moveEntity(e, e.vx * dt, 0);
    moveEntity(e, 0, e.vy * dt);

    if (!game.dead && rectsTouch(p, e)) {
      explodePlayer("A chaser touched you.");
    }
  }
}

function moveEntity(entity, dx, dy) {
  entity.x += dx;
  entity.y += dy;

  if (dy !== 0) entity.onGround = false;

  for (const t of game.tiles) {
    if (!rectsTouch(entity, t)) continue;

    if (t.type === "spike" && entity === game.player) {
      explodePlayer("Spikes are rude.");
      continue;
    }

    if (t.type !== "solid" && t.type !== "breakable") continue;

    if (dx > 0) {
      entity.x = t.x - entity.w;
      entity.vx = 0;
    }
    if (dx < 0) {
      entity.x = t.x + t.w;
      entity.vx = 0;
    }
    if (dy > 0) {
      entity.y = t.y - entity.h;
      entity.vy = 0;
      entity.onGround = true;
    }
    if (dy < 0) {
      entity.y = t.y + t.h;
      entity.vy = 0;
    }
  }
}

function swingSword() {
  const p = game.player;
  p.swordTimer = 0.22;
  game.idleTimer = CONFIG.idleExplodeTime;

  const reach = 46;
  const sword = {
    x: p.facing > 0 ? p.x + p.w : p.x - reach,
    y: p.y + 4,
    w: reach,
    h: p.h
  };

  for (const e of game.enemies) {
    if (e.dead) continue;
    if (rectsTouch(sword, e)) {
      e.hp -= game.stats.swordDamage;
      e.vx += p.facing * 260;
      burst(e.x + e.w / 2, e.y + e.h / 2, 8);
      if (e.hp <= 0) {
        e.dead = true;
        burst(e.x + e.w / 2, e.y + e.h / 2, 18);
      }
    }
  }

  for (let i = game.tiles.length - 1; i >= 0; i--) {
    const t = game.tiles[i];
    if (t.type === "breakable" && rectsTouch(sword, t)) {
      burst(t.x + t.w / 2, t.y + t.h / 2, 12);
      game.tiles.splice(i, 1);
    }
  }
}

function explodePlayer(reason) {
  if (game.dead || game.complete) return;
  game.dead = true;
  game.message = reason + " Press R to retry.";
  game.messageTimer = 999;
  burst(game.player.x + game.player.w / 2, game.player.y + game.player.h / 2, 50);
}

function completeLevel() {
  if (game.complete || game.dead) return;

  game.complete = true;
  const id = game.level.id;
  if (!save.beaten[id]) {
    save.beaten[id] = true;
    save.points += game.level.reward || 2;
    saveGame();
  }

  game.message = "Level complete! Press Enter for level select.";
  game.messageTimer = 999;
  burst(game.goal.x + game.goal.w / 2, game.goal.y + game.goal.h / 2, 30);
  refreshUI();
}

function burst(x, y, amount) {
  for (let i = 0; i < amount; i++) {
    game.particles.push({
      x, y,
      vx: (Math.random() * 2 - 1) * 260,
      vy: (Math.random() * 2 - 1) * 260,
      life: 0.5 + Math.random() * 0.6,
      size: 3 + Math.random() * 6
    });
  }
}

function updateParticles(dt) {
  for (const p of game.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 600 * dt;
    p.life -= dt;
  }
  game.particles = game.particles.filter(p => p.life > 0);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(-game.camera.x, -game.camera.y);

  drawBackground();
  drawTiles();
  drawGoal();
  drawEnemies();
  drawPlayer();
  drawParticles();

  ctx.restore();

  if (game.messageTimer > 0) {
    ctx.fillStyle = "rgba(0,0,0,0.76)";
    ctx.fillRect(0, canvas.height / 2 - 55, canvas.width, 110);
    ctx.strokeStyle = "#fff";
    ctx.strokeRect(20, canvas.height / 2 - 45, canvas.width - 40, 90);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 30px Arial";
    ctx.textAlign = "center";
    ctx.fillText(game.message, canvas.width / 2, canvas.height / 2 + 10);
    ctx.textAlign = "left";
  }
}

function drawBackground() {
  const w = getLevelWidth();
  const h = getLevelHeight();

  ctx.fillStyle = "#080808";
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "#1c1c1c";
  ctx.lineWidth = 1;

  for (let x = 0; x < w; x += CONFIG.tile) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  for (let y = 0; y < h; y += CONFIG.tile) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

function drawTiles() {
  for (const t of game.tiles) {
    if (t.type === "solid") {
      ctx.fillStyle = "#d8d8d8";
      ctx.fillRect(t.x, t.y, t.w, t.h);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 4;
      ctx.strokeRect(t.x, t.y, t.w, t.h);
    }

    if (t.type === "breakable") {
      ctx.fillStyle = "#7d7d7d";
      ctx.fillRect(t.x, t.y, t.w, t.h);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.strokeRect(t.x + 3, t.y + 3, t.w - 6, t.h - 6);
    }

    if (t.type === "spike") {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.moveTo(t.x, t.y + t.h);
      ctx.lineTo(t.x + t.w / 2, t.y);
      ctx.lineTo(t.x + t.w, t.y + t.h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#000";
      ctx.stroke();
    }
  }
}

function drawGoal() {
  if (!game.goal) return;
  const g = game.goal;
  ctx.fillStyle = "#000";
  ctx.fillRect(g.x + 8, g.y + 4, 8, g.h);
  ctx.fillStyle = "#fff";
  ctx.fillRect(g.x + 16, g.y + 6, 24, 18);
  ctx.strokeStyle = "#000";
  ctx.strokeRect(g.x + 16, g.y + 6, 24, 18);
}

function drawPlayer() {
  const p = game.player;
  if (!game.dead) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 4;
    ctx.strokeRect(p.x, p.y, p.w, p.h);

    ctx.fillStyle = "#000";
    ctx.fillRect(p.x + (p.facing > 0 ? 18 : 6), p.y + 9, 5, 5);
  }

  if (p.swordTimer > 0) {
    ctx.fillStyle = "#fff";
    const reach = 48;
    const sx = p.facing > 0 ? p.x + p.w : p.x - reach;
    ctx.fillRect(sx, p.y + 10, reach, 8);
    ctx.strokeStyle = "#000";
    ctx.strokeRect(sx, p.y + 10, reach, 8);
  }
}

function drawEnemies() {
  for (const e of game.enemies) {
    if (e.dead) continue;

    ctx.fillStyle = "#111";
    ctx.fillRect(e.x, e.y, e.w, e.h);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.strokeRect(e.x, e.y, e.w, e.h);

    ctx.fillStyle = "#fff";
    ctx.fillRect(e.x + 7, e.y + 10, 5, 5);
    ctx.fillRect(e.x + 18, e.y + 10, 5, 5);
  }
}

function drawParticles() {
  for (const p of game.particles) {
    ctx.fillStyle = p.life > 0.35 ? "#fff" : "#777";
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }
}

function getLevelWidth() {
  return Math.max(...game.level.map.map(row => row.length)) * CONFIG.tile;
}

function getLevelHeight() {
  return game.level.map.length * CONFIG.tile;
}

function rectsTouch(a, b) {
  return a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function escapeHTML(text) {
  return String(text).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);

window.addEventListener("keydown", event => {
  keys[event.code] = true;

  if (screens.game.classList.contains("active")) {
    if (event.code === "KeyR" && game) startLevel(game.level);
    if (event.code === "Enter" && game?.complete) showScreen(game.level.custom ? "custom" : "levels");
    if (event.code === "Escape") showScreen("main");
  }
});

window.addEventListener("keyup", event => {
  keys[event.code] = false;
});

canvas.addEventListener("mousedown", () => {
  keys.MouseDown = true;
});

window.addEventListener("mouseup", () => {
  keys.MouseDown = false;
});

canvas.addEventListener("touchstart", () => {
  keys.MouseDown = true;
}, { passive: true });

canvas.addEventListener("touchend", () => {
  keys.MouseDown = false;
}, { passive: true });

document.getElementById("exitGameBtn").onclick = () => showScreen("main");

function bindMobile(id, prop) {
  const btn = document.getElementById(id);
  btn.addEventListener("pointerdown", e => {
    e.preventDefault();
    mobile[prop] = true;
  });
  btn.addEventListener("pointerup", e => {
    e.preventDefault();
    mobile[prop] = false;
  });
  btn.addEventListener("pointerleave", () => {
    mobile[prop] = false;
  });
  btn.addEventListener("pointercancel", () => {
    mobile[prop] = false;
  });
}

bindMobile("leftBtn", "left");
bindMobile("rightBtn", "right");
bindMobile("jumpBtn", "jump");
bindMobile("dashBtn", "dash");

refreshUI();
showScreen("start");
