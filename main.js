/*
  EL SPEEDRUNNIO - clean main.js replacement
  Plain HTML/CSS/JS. GitHub Pages friendly.

  Controls:
  A/D or arrows = move
  W / Up / Space = jump
  Q = dash
  Click / tap game area = sword
  R = retry
  Escape = menu

  Map keys:
  # = solid
  . = empty
  P = player spawn
  G = goal
  B = touch boost
  C = chaser
  L = laser enemy
  N = cannon enemy
  X = breakable block
  ^ = spike
*/

const CONFIG = {
  tile: 34,
  stillLimit: 5,

  physics: {
    gravity: 2350,

    // EDIT THESE FOR SLIDING / FRICTION:
    // Higher number = less friction / more sliding.
    // Good chaos values: 0.90, 0.93, 0.96
    groundFriction: 0.93,
    airFriction: 0.98
  },

  player: {
    accel: 1900,
    maxSpeed: 570,
    jump: 690,
    dash: 820,
    dashCooldown: 0.45,
    swordTime: 0.16
  },

  upgrades: {
    speed: { name: "Speed", cost: 2, max: 8, add: 45 },
    jump: { name: "Jump", cost: 2, max: 8, add: 32 },
    dash: { name: "Dash", cost: 2, max: 8, add: 45 }
  },

  editor: {
    width: 32,
    height: 16
  },

  levels: [
    {
      id: "1-1",
      name: "Clutter Hallway",
      reward: 2,
      map: [
        "################################",
        "#P....#......B.....#.........G#",
        "#.##..#.#########..#.####.#####",
        "#..#..#.....C......#....#.....#",
        "##.#.#####.#####.######.#####.#",
        "#..#.....#.....#......#.....#.#",
        "#.#####.#####.###.##.#####.#..#",
        "#.....#.....#.....#L#.....#...#",
        "#####.###.#.#######.#####.###.#",
        "#.....#...#.....B.......#.....#",
        "#.#####.#######.#####.#.#####.#",
        "#.....#.....C...#...#.#.....#.#",
        "#.###.#####.#####.#.#.#####.#.#",
        "#...#.......#.....#.....N...#.#",
        "#X#X#XXXXXXX#XXXXX#XXXXX#XXX#.#",
        "################################"
      ]
    },
    {
      id: "1-2",
      name: "Maze of Bad Decisions",
      reward: 2,
      map: [
        "####################################",
        "#P.....#.......#......B....#.....G#",
        "#####.#.#####.#.##########.#.######",
        "#.....#.....#.#....C.......#......#",
        "#.#########.#.###############.##..#",
        "#.....B.....#.......#.........#...#",
        "###.###########.###.#.#########.###",
        "#...#.....L.....#...#.....C.....#.#",
        "#.###.###########.###########.###.#",
        "#.....#.........#.....B.....#.....#",
        "#####.#.#######.###########.#####.#",
        "#...#.#.....N...#.....#.....#.....#",
        "#.#.#.###########.###.#.#####.###.#",
        "#.#.......B.......#...#.......#...#",
        "#.#################.###########.#X#",
        "#.............C.................#X#",
        "####################################"
      ]
    },
    {
      id: "1-3",
      name: "Cannon Clutter Factory",
      reward: 2,
      map: [
        "########################################",
        "#P....#.......#.......#.......#.......G#",
        "#.##.###.###.#.#####.#.#####.#.########",
        "#..#.....#...#...C...#...B...#........#",
        "##.#######.#####.###########.########.#",
        "#..B......#.....#.....L.....#......#..#",
        "#.#########.###.###########.####.#.#.##",
        "#.....C.....#...#.....N.....#....#.#..#",
        "#####.#######.###.###########.####.##.#",
        "#.....#.....#.....#.....B.....#.......#",
        "#.###.#.###.#######.###########.#####.#",
        "#...#.#...#.....C...#.........#.....#.#",
        "###.#.###.###########.###.###.#####.#.#",
        "#...#.....#.....B.....#...#.........#.#",
        "#.#########.###########.#############.#",
        "#......N..........L........C..........#",
        "#XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.#",
        "########################################"
      ]
    }
  ]
};

const TILE_TYPES = [
  { key: ".", name: "Empty", cls: "empty", icon: "" },
  { key: "#", name: "Solid", cls: "solid", icon: "#" },
  { key: "P", name: "Player", cls: "player", icon: "P" },
  { key: "G", name: "Goal", cls: "goal", icon: "G" },
  { key: "B", name: "Touch Boost", cls: "boost", icon: "B" },
  { key: "C", name: "Chaser", cls: "chaser", icon: "C" },
  { key: "L", name: "Laser", cls: "laser", icon: "L" },
  { key: "N", name: "Cannon", cls: "cannon", icon: "N" },
  { key: "X", name: "Breakable", cls: "breakable", icon: "X" },
  { key: "^", name: "Spike", cls: "spike", icon: "^" }
];

const SAVE_KEY = "el_speedrunnio_v3_save";
const CUSTOM_KEY = "el_speedrunnio_v3_custom";

function byId(id) {
  return document.getElementById(id);
}

function loadJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function saveJSON() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(customLevels));
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function rectsTouch(a, b) {
  return a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y;
}

let save = loadJSON(SAVE_KEY, {
  points: 0,
  beaten: {},
  bests: {},
  upgrades: { speed: 0, jump: 0, dash: 0 },
  settings: {
    shake: true,
    sound: true,
    fx: true,
    break: true,
    death: true
  }
});

let customLevels = loadJSON(CUSTOM_KEY, []);

const screens = {
  start: byId("startScreen"),
  difficulty: byId("difficultyScreen"),
  rick: byId("rickScreen"),
  menu: byId("menuScreen"),
  levels: byId("levelsScreen"),
  custom: byId("customScreen"),
  upgrades: byId("upgradesScreen"),
  settings: byId("settingsScreen"),
  editor: byId("editorScreen"),
  game: byId("gameScreen")
};

const canvas = byId("gameCanvas");
const ctx = canvas.getContext("2d");

let keys = {};
let touch = { left: false, right: false, jump: false, dash: false };
let game = null;
let rafId = null;
let running = false;
let lastTime = 0;

let editorGrid = [];
let selectedTile = "#";
let painting = false;

let playlist = [];
let audio = null;
let playlistLoaded = false;
let currentTrack = 0;

function showScreen(name) {
  Object.values(screens).forEach(screen => {
    if (screen) screen.classList.remove("active");
  });

  if (screens[name]) {
    screens[name].classList.add("active");
  }

  if (name !== "game") {
    stopLoop();
  }

  refreshUI();
}

function stopLoop() {
  running = false;

  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

function startLoop() {
  stopLoop();
  running = true;
  lastTime = performance.now();
  rafId = requestAnimationFrame(loop);
}

function getPlayerStats() {
  return {
    accel: CONFIG.player.accel + save.upgrades.speed * 100,
    maxSpeed: CONFIG.player.maxSpeed + save.upgrades.speed * CONFIG.upgrades.speed.add,
    jump: CONFIG.player.jump + save.upgrades.jump * CONFIG.upgrades.jump.add,
    dash: CONFIG.player.dash + save.upgrades.dash * CONFIG.upgrades.dash.add
  };
}

function refreshUI() {
  if (byId("pointsText")) byId("pointsText").textContent = save.points;
  if (byId("upgradePointsText")) byId("upgradePointsText").textContent = save.points;

  renderLevels();
  renderCustomLevels();
  renderUpgrades();
  refreshSettingsToggles();
}

function refreshSettingsToggles() {
  const pairs = [
    ["shakeToggle", "shake"],
    ["soundToggle", "sound"],
    ["effectsToggle", "fx"],
    ["breakShakeToggle", "break"],
    ["deathShakeToggle", "death"]
  ];

  for (const [id, key] of pairs) {
    const el = byId(id);
    if (el) el.checked = !!save.settings[key];
  }
}

/* MENUS */

if (byId("startBtn")) byId("startBtn").onclick = () => showScreen("difficulty");
if (byId("pureBtn")) byId("pureBtn").onclick = () => showScreen("menu");
if (byId("rickBackBtn")) byId("rickBackBtn").onclick = () => showScreen("difficulty");

if (byId("levelsBtn")) byId("levelsBtn").onclick = () => showScreen("levels");
if (byId("upgradesBtn")) byId("upgradesBtn").onclick = () => showScreen("upgrades");
if (byId("editorBtn")) byId("editorBtn").onclick = () => showScreen("editor");
if (byId("customBtn")) byId("customBtn").onclick = () => showScreen("custom");
if (byId("settingsBtn")) byId("settingsBtn").onclick = () => showScreen("settings");

document.querySelectorAll(".backStart").forEach(button => {
  button.onclick = () => showScreen("start");
});

document.querySelectorAll(".menuBack").forEach(button => {
  button.onclick = () => showScreen("menu");
});

document.querySelectorAll(".fakeDiff").forEach(button => {
  button.onclick = () => {
    const title = byId("rickTitle");
    if (title) title.textContent = `${button.dataset.name || "This"} was a trap`;
    showScreen("rick");
  };
});

if (byId("wipeBtn")) {
  byId("wipeBtn").onclick = () => {
    if (!confirm("Wipe save data?")) return;

    save = {
      points: 0,
      beaten: {},
      bests: {},
      upgrades: { speed: 0, jump: 0, dash: 0 },
      settings: {
        shake: true,
        sound: true,
        fx: true,
        break: true,
        death: true
      }
    };

    customLevels = [];
    saveJSON();
    refreshUI();
  };
}

/* SETTINGS */

const settingMap = [
  ["shakeToggle", "shake"],
  ["soundToggle", "sound"],
  ["effectsToggle", "fx"],
  ["breakShakeToggle", "break"],
  ["deathShakeToggle", "death"]
];

for (const [id, key] of settingMap) {
  const el = byId(id);
  if (!el) continue;

  el.onchange = event => {
    save.settings[key] = event.target.checked;
    saveJSON();

    if (key === "sound" && !save.settings.sound) {
      stopMusic();
    }

    if (key === "sound" && save.settings.sound) {
      startMusic();
    }
  };
}

/* LISTS */

function renderLevels() {
  const box = byId("levelList");
  if (!box) return;

  box.innerHTML = "";

  for (const level of CONFIG.levels) {
    box.appendChild(makeLevelRow(level));
  }
}

function renderCustomLevels() {
  const box = byId("customList");
  if (!box) return;

  box.innerHTML = "";

  if (customLevels.length === 0) {
    box.innerHTML = `<p class="muted">No custom levels yet. Make one in the grid editor.</p>`;
    return;
  }

  customLevels.forEach((level, index) => {
    const row = makeLevelRow(level);

    const del = document.createElement("button");
    del.className = "inverted";
    del.textContent = "Delete";
    del.onclick = () => {
      if (!confirm("Delete this custom level?")) return;
      customLevels.splice(index, 1);
      saveJSON();
      refreshUI();
    };

    row.appendChild(del);
    box.appendChild(row);
  });
}

function makeLevelRow(level) {
  const row = document.createElement("div");
  row.className = "item";

  const bestText = save.bests[level.id]
    ? `${save.bests[level.id].toFixed(2)}s`
    : "--";

  row.innerHTML = `
    <div>
      <b>${escapeHTML(level.name)}</b>
      <p>Reward: ${level.reward || 2} points • Best: ${bestText}</p>
    </div>
    <button>Play</button>
  `;

  row.querySelector("button").onclick = () => startLevel(level);
  return row;
}

function renderUpgrades() {
  const box = byId("upgradeList");
  if (!box) return;

  box.innerHTML = "";

  for (const [key, upgrade] of Object.entries(CONFIG.upgrades)) {
    const level = save.upgrades[key] || 0;
    const maxed = level >= upgrade.max;

    const row = document.createElement("div");
    row.className = "item";
    row.innerHTML = `
      <div>
        <b>${upgrade.name} Lv ${level}/${upgrade.max}</b>
        <p>Cost: ${maxed ? "MAX" : `${upgrade.cost} points`}</p>
      </div>
      <button ${maxed ? "disabled" : ""}>Upgrade</button>
    `;

    row.querySelector("button").onclick = () => {
      if (maxed) return;

      if (save.points < upgrade.cost) {
        alert("Not enough points.");
        return;
      }

      save.points -= upgrade.cost;
      save.upgrades[key]++;
      saveJSON();
      refreshUI();
    };

    box.appendChild(row);
  }
}

/* GRID EDITOR */

function initEditor() {
  editorGrid = makeMazeGrid(CONFIG.editor.width, CONFIG.editor.height);
  renderPalette();
  renderEditorGrid();
  syncGridToText();
}

function blankGrid(width, height) {
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

function makeMazeGrid(width, height) {
  const grid = blankGrid(width, height);

  for (let y = 2; y < height - 2; y += 2) {
    for (let x = 2; x < width - 2; x += 4) {
      grid[y][x] = "#";

      if (x + 1 < width - 1) {
        grid[y][x + 1] = "#";
      }
    }
  }

  grid[1][1] = "P";
  grid[height - 2][width - 2] = "G";

  if (grid[3]) grid[3][5] = "B";
  if (grid[4]) grid[4][9] = "C";
  if (grid[6]) grid[6][14] = "L";
  if (grid[8]) grid[8][20] = "N";

  return grid;
}

function renderPalette() {
  const box = byId("paletteButtons");
  if (!box) return;

  box.innerHTML = "";

  for (const tile of TILE_TYPES) {
    const button = document.createElement("button");
    button.className = "tileButton" + (selectedTile === tile.key ? " active" : "");
    button.innerHTML = `<span class="swatch ${tile.cls}">${tile.icon}</span><span>${tile.name}</span>`;

    button.onclick = () => {
      selectedTile = tile.key;

      const selectedText = byId("selectedTileText");
      if (selectedText) selectedText.textContent = tile.name;

      renderPalette();
    };

    box.appendChild(button);
  }
}

function renderEditorGrid() {
  const box = byId("editorGrid");
  if (!box || editorGrid.length === 0) return;

  const height = editorGrid.length;
  const width = editorGrid[0].length;

  const sizeText = byId("gridSizeText");
  if (sizeText) sizeText.textContent = `${width} × ${height}`;

  box.style.gridTemplateColumns = `repeat(${width}, 28px)`;
  box.innerHTML = "";

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const key = editorGrid[y][x];
      const tile = TILE_TYPES.find(t => t.key === key) || TILE_TYPES[0];

      const cell = document.createElement("div");
      cell.className = `cell ${tile.cls}`;
      cell.textContent = tile.icon;

      cell.onpointerdown = event => {
        event.preventDefault();
        painting = true;
        paintCell(x, y);
      };

      cell.onpointerenter = () => {
        if (painting) {
          paintCell(x, y);
        }
      };

      box.appendChild(cell);
    }
  }
}

window.addEventListener("pointerup", () => {
  painting = false;
});

function paintCell(x, y) {
  if (!editorGrid[y] || editorGrid[y][x] === undefined) return;

  if (selectedTile === "P" || selectedTile === "G") {
    removeTileEverywhere(selectedTile);
  }

  editorGrid[y][x] = selectedTile;
  renderEditorGrid();
  syncGridToText();
}

function removeTileEverywhere(tileKey) {
  for (const row of editorGrid) {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === tileKey) {
        row[x] = ".";
      }
    }
  }
}

function syncGridToText() {
  const mapText = byId("mapText");
  if (!mapText) return;

  mapText.value = editorGrid.map(row => row.join("")).join("\n");
}

function loadTextToGrid() {
  const mapText = byId("mapText");
  if (!mapText) return;

  const lines = mapText.value.split("\n").filter(Boolean);
  const width = Math.max(12, ...lines.map(line => line.length));
  const grid = [];

  for (const line of lines) {
    const row = [];

    for (let x = 0; x < width; x++) {
      const ch = line[x] || ".";
      const allowed = TILE_TYPES.some(t => t.key === ch);
      row.push(allowed ? ch : ".");
    }

    grid.push(row);
  }

  editorGrid = grid;
  renderEditorGrid();
  syncGridToText();
}

function makeEditorLevel() {
  syncGridToText();

  const map = editorGrid.map(row => row.join(""));
  const joined = map.join("");

  if (!joined.includes("P") || !joined.includes("G")) {
    alert("Level needs one P player spawn and one G goal.");
    return null;
  }

  return {
    id: `custom-${Date.now()}`,
    name: byId("editorName")?.value.trim() || "Custom Level",
    reward: 2,
    custom: true,
    map
  };
}

if (byId("smallGridBtn")) {
  byId("smallGridBtn").onclick = () => {
    editorGrid = makeMazeGrid(24, 12);
    renderEditorGrid();
    syncGridToText();
  };
}

if (byId("bigGridBtn")) {
  byId("bigGridBtn").onclick = () => {
    editorGrid = makeMazeGrid(42, 20);
    renderEditorGrid();
    syncGridToText();
  };
}

if (byId("mazeGridBtn")) {
  byId("mazeGridBtn").onclick = () => {
    editorGrid = makeMazeGrid(editorGrid[0].length, editorGrid.length);
    renderEditorGrid();
    syncGridToText();
  };
}

if (byId("clearGridBtn")) {
  byId("clearGridBtn").onclick = () => {
    editorGrid = blankGrid(editorGrid[0].length, editorGrid.length);
    editorGrid[1][1] = "P";
    editorGrid[editorGrid.length - 2][editorGrid[0].length - 2] = "G";
    renderEditorGrid();
    syncGridToText();
  };
}

if (byId("loadTextBtn")) {
  byId("loadTextBtn").onclick = loadTextToGrid;
}

if (byId("saveCustomBtn")) {
  byId("saveCustomBtn").onclick = () => {
    const level = makeEditorLevel();
    if (!level) return;

    customLevels.push(level);
    saveJSON();
    refreshUI();
    alert("Custom level saved.");
  };
}

if (byId("exportBtn")) {
  byId("exportBtn").onclick = () => {
    const level = makeEditorLevel();
    if (!level) return;

    byId("shareBox").value = btoa(unescape(encodeURIComponent(JSON.stringify(level))));
  };
}

if (byId("importBtn")) {
  byId("importBtn").onclick = () => {
    try {
      const code = byId("shareBox").value.trim();
      const level = JSON.parse(decodeURIComponent(escape(atob(code))));

      if (!Array.isArray(level.map)) {
        throw new Error("Missing map.");
      }

      customLevels.push({
        ...level,
        id: `custom-${Date.now()}`,
        custom: true
      });

      saveJSON();
      refreshUI();
      alert("Imported custom level.");
    } catch {
      alert("Import failed. Paste a valid exported code.");
    }
  };
}

/* GAME */

function startLevel(level) {
  resizeCanvas();
  showScreen("game");
  startMusic();

  game = {
    level,
    stats: getPlayerStats(),
    tiles: [],
    boosts: [],
    enemies: [],
    projectiles: [],
    particles: [],
    wind: [],
    camera: { x: 0, y: 0 },
    shake: 0,
    elapsed: 0,
    idle: CONFIG.stillLimit,
    complete: false,
    dead: false,
    message: "",
    blinkTime: rand(1, 3),
    expression: ".",
    expressionTime: 0,

    player: {
      x: 60,
      y: 60,
      w: 24,
      h: 32,
      vx: 0,
      vy: 0,
      onGround: false,
      facing: 1,
      dashCooldown: 0,
      swordTime: 0,
      jumpHeld: false
    }
  };

  parseMap(level.map);

  if (byId("hudLevel")) byId("hudLevel").textContent = level.name;
  if (byId("hudBest")) {
    byId("hudBest").textContent = save.bests[level.id]
      ? `${save.bests[level.id].toFixed(2)}s`
      : "--";
  }

  startLoop();
}

function parseMap(map) {
  for (let y = 0; y < map.length; y++) {
    const row = map[y];

    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      const px = x * CONFIG.tile;
      const py = y * CONFIG.tile;

      if (ch === "#" || ch === "X" || ch === "^") {
        game.tiles.push({
          x: px,
          y: py,
          w: CONFIG.tile,
          h: CONFIG.tile,
          type: ch
        });
      }

      if (ch === "B") {
        game.boosts.push({
          x: px + 5,
          y: py + 5,
          w: 24,
          h: 24,
          used: false
        });
      }

      if (ch === "P") {
        game.player.x = px + 5;
        game.player.y = py;
      }

      if (ch === "G") {
        game.goal = {
          x: px,
          y: py,
          w: CONFIG.tile,
          h: CONFIG.tile
        };
      }

      if (ch === "C" || ch === "L" || ch === "N") {
        game.enemies.push({
          kind: ch,
          x: px + 4,
          y: py + 2,
          w: 26,
          h: 32,
          vx: 0,
          vy: 0,
          hp: ch === "N" ? 3 : 2,
          cooldown: rand(0.4, 1.3),
          onGround: false,
          dead: false
        });
      }
    }
  }
}

function loop(now) {
  if (!running || !game) return;

  let dt = (now - lastTime) / 1000;
  lastTime = now;
  dt = Math.min(dt, 1 / 30);

  updateGame(dt);
  drawGame();

  rafId = requestAnimationFrame(loop);
}

function updateGame(dt) {
  const p = game.player;

  const inputX =
    (keys.KeyD || keys.ArrowRight || touch.right ? 1 : 0) -
    (keys.KeyA || keys.ArrowLeft || touch.left ? 1 : 0);

  const jumpPressed = !!(keys.KeyW || keys.ArrowUp || keys.Space || touch.jump);
  const dashPressed = !!(keys.KeyQ || keys.ShiftLeft || keys.ShiftRight || touch.dash);

  if (!game.dead && !game.complete) {
    game.elapsed += dt;

    if (inputX !== 0) {
      p.vx += inputX * game.stats.accel * dt;
      p.vx = clamp(p.vx, -game.stats.maxSpeed, game.stats.maxSpeed);
      p.facing = inputX;
      game.idle = CONFIG.stillLimit;
    } else if (Math.abs(p.vx) < 25 && p.onGround) {
      game.idle -= dt;
    } else {
      game.idle = Math.max(0, game.idle - dt * 0.15);
    }

    if (jumpPressed && !p.jumpHeld && p.onGround) {
      p.vy = -game.stats.jump;
      p.onGround = false;
      game.idle = CONFIG.stillLimit;
      makeParticles(p.x + p.w / 2, p.y + p.h, 12);
    }

    p.jumpHeld = jumpPressed;

    if (dashPressed && p.dashCooldown <= 0) {
      p.vx = p.facing * game.stats.dash;
      p.dashCooldown = CONFIG.player.dashCooldown;
      setExpression(p.facing > 0 ? ">" : "<", 0.18);
      addShake(5);
      makeParticles(p.x + p.w / 2, p.y + p.h / 2, 25);
    }

    if (keys.MouseDown && p.swordTime <= 0) {
      swingSword();
    }

    if (game.idle <= 0) {
      killPlayer("You stopped moving.");
    }
  }

  p.dashCooldown -= dt;
  p.swordTime -= dt;

  game.blinkTime -= dt;
  game.expressionTime -= dt;

  if (game.expressionTime <= 0 && !game.dead && !game.complete) {
    game.expression = ".";
  }

  if (game.blinkTime <= 0 && !game.dead && !game.complete) {
    setExpression("-", 0.12);
    game.blinkTime = rand(1.5, 4);
  }

  p.vy += CONFIG.physics.gravity * dt;
  p.vx *= p.onGround ? CONFIG.physics.groundFriction : CONFIG.physics.airFriction;

  moveEntity(p, p.vx * dt, 0);
  moveEntity(p, 0, p.vy * dt);

  updateBoosts();
  updateEnemies(dt);
  updateProjectiles(dt);
  updateParticles(dt);
  updateWind(dt);

  if (!game.dead && game.goal && rectsTouch(p, game.goal)) {
    completeLevel();
  }

  game.camera.x = clamp(
    p.x - canvas.width / 2,
    0,
    Math.max(0, getLevelWidth() - canvas.width)
  );

  game.camera.y = clamp(
    p.y - canvas.height / 2,
    0,
    Math.max(0, getLevelHeight() - canvas.height)
  );

  if (game.shake > 0) {
    game.shake -= dt * 24;
  }

  if (byId("hudTime")) byId("hudTime").textContent = game.elapsed.toFixed(2);
  if (byId("hudIdle")) byId("hudIdle").textContent = Math.max(0, game.idle).toFixed(1);
}

function updateBoosts() {
  const p = game.player;

  for (const boost of game.boosts) {
    if (boost.used) continue;

    if (rectsTouch(p, boost)) {
      boost.used = true;
      p.vy = -850;
      game.idle = CONFIG.stillLimit;
      setExpression("O", 0.25);
      makeParticles(boost.x + boost.w / 2, boost.y + boost.h / 2, 35);
      addShake(7);
      beep(740, 0.08);
    }
  }
}

function updateEnemies(dt) {
  const p = game.player;

  for (const enemy of game.enemies) {
    if (enemy.dead) continue;

    if (enemy.kind === "C") {
      const dir = Math.sign(p.x - enemy.x) || 1;
      enemy.vx += dir * 520 * dt;
      enemy.vx = clamp(enemy.vx, -210, 210);
    }

    if (enemy.kind === "L") {
      enemy.cooldown -= dt;

      if (enemy.cooldown <= 0 && Math.abs(p.y - enemy.y) < 90) {
        const dir = Math.sign(p.x - enemy.x) || 1;

        game.projectiles.push({
          kind: "laser",
          x: enemy.x + enemy.w / 2,
          y: enemy.y + 12,
          w: 28,
          h: 6,
          vx: dir * 620,
          vy: 0,
          life: 1.8
        });

        enemy.cooldown = 1.1;
        makeParticles(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, 8);
      }
    }

    if (enemy.kind === "N") {
      enemy.cooldown -= dt;

      if (enemy.cooldown <= 0) {
        const dir = Math.sign(p.x - enemy.x) || 1;

        game.projectiles.push({
          kind: "cannon",
          x: enemy.x + enemy.w / 2,
          y: enemy.y + 10,
          w: 16,
          h: 16,
          vx: dir * 360,
          vy: -120,
          life: 2.7
        });

        enemy.cooldown = 1.6;
        addShake(3);
      }
    }

    enemy.vy += CONFIG.physics.gravity * dt;
    enemy.vx *= enemy.onGround ? 0.88 : 0.98;

    moveEntity(enemy, enemy.vx * dt, 0);
    moveEntity(enemy, 0, enemy.vy * dt);

    if (!game.dead && rectsTouch(p, enemy)) {
      setExpression("O", 0.12);
      killPlayer("Enemy bonk.");
    }
  }
}

function updateProjectiles(dt) {
  const p = game.player;

  for (const projectile of game.projectiles) {
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;

    if (projectile.kind === "cannon") {
      projectile.vy += 500 * dt;
    }

    projectile.life -= dt;

    if (!game.dead && rectsTouch(p, projectile)) {
      killPlayer(projectile.kind === "laser" ? "Lasered." : "Cannoned.");
    }

    if (projectile.kind === "cannon") {
      for (let i = game.tiles.length - 1; i >= 0; i--) {
        const tile = game.tiles[i];

        if (tile.type === "X" && rectsTouch(projectile, tile)) {
          game.tiles.splice(i, 1);
          projectile.life = 0;
          makeParticles(tile.x + tile.w / 2, tile.y + tile.h / 2, 30);

          if (save.settings.break) {
            addShake(8);
          }
        }
      }
    }
  }

  game.projectiles = game.projectiles.filter(projectile => projectile.life > 0);
}

function moveEntity(entity, dx, dy) {
  entity.x += dx;
  entity.y += dy;

  if (dy !== 0) {
    entity.onGround = false;
  }

  for (const tile of game.tiles) {
    if (!rectsTouch(entity, tile)) continue;

    if (tile.type === "^" && entity === game.player) {
      killPlayer("Spiked.");
      continue;
    }

    if (tile.type !== "#" && tile.type !== "X") continue;

    if (dx > 0) {
      entity.x = tile.x - entity.w;
      entity.vx = 0;
    }

    if (dx < 0) {
      entity.x = tile.x + tile.w;
      entity.vx = 0;
    }

    if (dy > 0) {
      entity.y = tile.y - entity.h;
      entity.vy = 0;
      entity.onGround = true;
    }

    if (dy < 0) {
      entity.y = tile.y + tile.h;
      entity.vy = 0;
    }
  }
}

function swingSword() {
  const p = game.player;

  p.swordTime = CONFIG.player.swordTime;
  game.idle = CONFIG.stillLimit;

  const hitbox = {
    x: p.facing > 0 ? p.x + p.w : p.x - 48,
    y: p.y + 4,
    w: 48,
    h: 28
  };

  makeParticles(hitbox.x + hitbox.w / 2, hitbox.y + hitbox.h / 2, 10);
  beep(320, 0.04);

  for (const enemy of game.enemies) {
    if (enemy.dead) continue;

    if (rectsTouch(hitbox, enemy)) {
      enemy.hp--;
      enemy.vx += p.facing * 330;
      setExpression("O", 0.15);
      makeParticles(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, 20);

      if (enemy.hp <= 0) {
        enemy.dead = true;
        makeParticles(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, 35);
      }
    }
  }

  for (let i = game.tiles.length - 1; i >= 0; i--) {
    const tile = game.tiles[i];

    if (tile.type === "X" && rectsTouch(hitbox, tile)) {
      game.tiles.splice(i, 1);
      makeParticles(tile.x + tile.w / 2, tile.y + tile.h / 2, 25);

      if (save.settings.break) {
        addShake(6);
      }
    }
  }
}

function completeLevel() {
  if (game.complete || game.dead) return;

  game.complete = true;
  setExpression("^", 999);

  const oldBest = save.bests[game.level.id];

  if (!oldBest || game.elapsed < oldBest) {
    save.bests[game.level.id] = game.elapsed;
  }

  if (!save.beaten[game.level.id]) {
    save.beaten[game.level.id] = true;
    save.points += game.level.reward || 2;
  }

  saveJSON();

  game.message = "Completed! Press Enter.";
  makeParticles(game.goal.x + 15, game.goal.y + 15, 70);
  addShake(10);
  refreshUI();
}

function killPlayer(message) {
  if (game.dead || game.complete) return;

  game.dead = true;
  setExpression("X", 999);
  game.message = `${message} Press R.`;

  makeParticles(game.player.x + 12, game.player.y + 15, 90);

  if (save.settings.death) {
    addShake(18);
  }

  beep(90, 0.2);
}

function setExpression(expression, time) {
  game.expression = expression;
  game.expressionTime = time;
}

function addShake(amount) {
  if (!save.settings.shake) return;
  game.shake = Math.max(game.shake, amount);
}

function makeParticles(x, y, amount) {
  if (!save.settings.fx) return;

  for (let i = 0; i < amount; i++) {
    game.particles.push({
      x,
      y,
      vx: rand(-360, 360),
      vy: rand(-360, 360),
      life: rand(0.25, 0.8),
      size: rand(2, 7)
    });
  }
}

function updateParticles(dt) {
  for (const particle of game.particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 780 * dt;
    particle.life -= dt;
  }

  game.particles = game.particles.filter(particle => particle.life > 0);
}

function updateWind(dt) {
  if (!save.settings.fx) return;

  if (Math.random() < 12 * dt) {
    game.wind.push({
      x: game.camera.x + canvas.width + 20,
      y: game.camera.y + rand(0, canvas.height),
      vx: rand(-900, -500),
      life: rand(0.2, 0.6),
      len: rand(30, 90)
    });
  }

  for (const wind of game.wind) {
    wind.x += wind.vx * dt;
    wind.life -= dt;
  }

  game.wind = game.wind.filter(wind => wind.life > 0);
}

/* DRAWING */

function drawGame() {
  const shakeX = game.shake > 0 ? rand(-game.shake, game.shake) : 0;
  const shakeY = game.shake > 0 ? rand(-game.shake, game.shake) : 0;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(-game.camera.x + shakeX, -game.camera.y + shakeY);

  drawBackground();
  drawTiles();
  drawBoosts();
  drawGoal();
  drawEnemies();
  drawProjectiles();
  drawPlayer();
  drawParticles();
  drawWind();

  ctx.restore();

  if (game.dead || game.complete) {
    drawMessage();
  }
}

function drawBackground() {
  ctx.fillStyle = "#070707";
  ctx.fillRect(0, 0, getLevelWidth(), getLevelHeight());

  ctx.strokeStyle = "#181818";
  ctx.lineWidth = 1;

  for (let x = 0; x < getLevelWidth(); x += CONFIG.tile) {
    drawLine(x, 0, x, getLevelHeight());
  }

  for (let y = 0; y < getLevelHeight(); y += CONFIG.tile) {
    drawLine(0, y, getLevelWidth(), y);
  }
}

function drawTiles() {
  for (const tile of game.tiles) {
    if (tile.type === "#") {
      ctx.fillStyle = "#ddd";
      ctx.fillRect(tile.x, tile.y, tile.w, tile.h);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 4;
      ctx.strokeRect(tile.x, tile.y, tile.w, tile.h);
    }

    if (tile.type === "X") {
      ctx.fillStyle = "#777";
      ctx.fillRect(tile.x, tile.y, tile.w, tile.h);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.strokeRect(tile.x + 5, tile.y + 5, tile.w - 10, tile.h - 10);
    }

    if (tile.type === "^") {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.moveTo(tile.x, tile.y + tile.h);
      ctx.lineTo(tile.x + tile.w / 2, tile.y);
      ctx.lineTo(tile.x + tile.w, tile.y + tile.h);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawBoosts() {
  for (const boost of game.boosts) {
    if (boost.used) continue;

    const pulse = 13 + Math.sin(performance.now() / 90) * 2;

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(boost.x + boost.w / 2, boost.y + boost.h / 2, pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#aaa";
    ctx.beginPath();
    ctx.arc(boost.x + boost.w / 2, boost.y + boost.h / 2, 7, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGoal() {
  if (!game.goal) return;

  const g = game.goal;

  ctx.fillStyle = "#fff";
  ctx.fillRect(g.x + 10, g.y + 5, 22, 20);

  ctx.fillStyle = "#000";
  ctx.fillRect(g.x + 6, g.y + 4, 6, g.h);
}

function drawEnemies() {
  for (const enemy of game.enemies) {
    if (enemy.dead) continue;

    ctx.fillStyle = enemy.kind === "N" ? "#444" : "#111";
    ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.strokeRect(enemy.x, enemy.y, enemy.w, enemy.h);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 15px monospace";
    ctx.fillText(enemy.kind, enemy.x + 8, enemy.y + 21);
  }
}

function drawProjectiles() {
  for (const projectile of game.projectiles) {
    ctx.fillStyle = "#fff";

    if (projectile.kind === "laser") {
      ctx.fillRect(projectile.x, projectile.y, projectile.w, projectile.h);
    } else {
      ctx.beginPath();
      ctx.arc(projectile.x + 8, projectile.y + 8, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawPlayer() {
  const p = game.player;

  if (!game.dead) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(p.x, p.y, p.w, p.h);

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.strokeRect(p.x, p.y, p.w, p.h);
  }

  ctx.fillStyle = "#000";
  ctx.font = "bold 18px monospace";

  const eye = game.expression === "."
    ? (p.facing > 0 ? ">" : "<")
    : game.expression;

  ctx.fillText(eye, p.x + 7, p.y + 21);

  if (p.swordTime > 0) {
    ctx.fillStyle = "#fff";

    const sx = p.facing > 0 ? p.x + p.w : p.x - 48;

    ctx.fillRect(sx, p.y + 9, 48, 8);
    ctx.strokeStyle = "#000";
    ctx.strokeRect(sx, p.y + 9, 48, 8);
  }
}

function drawParticles() {
  for (const particle of game.particles) {
    ctx.fillStyle = particle.life > 0.32 ? "#fff" : "#777";
    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
  }
}

function drawWind() {
  ctx.strokeStyle = "rgba(255,255,255,.55)";
  ctx.lineWidth = 2;

  for (const wind of game.wind) {
    drawLine(wind.x, wind.y, wind.x + wind.len, wind.y);
  }
}

function drawMessage() {
  ctx.fillStyle = "rgba(0,0,0,.76)";
  ctx.fillRect(0, canvas.height / 2 - 54, canvas.width, 108);

  ctx.strokeStyle = "#fff";
  ctx.strokeRect(24, canvas.height / 2 - 42, canvas.width - 48, 84);

  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.font = "bold 30px Arial";
  ctx.fillText(game.message, canvas.width / 2, canvas.height / 2 + 8);
  ctx.textAlign = "left";
}

function drawLine(x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function getLevelWidth() {
  return Math.max(...game.level.map.map(row => row.length)) * CONFIG.tile;
}

function getLevelHeight() {
  return game.level.map.length * CONFIG.tile;
}

/* INPUT */

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);

window.addEventListener("keydown", event => {
  keys[event.code] = true;

  if (screens.game && screens.game.classList.contains("active")) {
    if (event.code === "KeyR" && game) {
      startLevel(game.level);
    }

    if (event.code === "Enter" && game?.complete) {
      showScreen(game.level.custom ? "custom" : "levels");
    }

    if (event.code === "Escape") {
      showScreen("menu");
    }
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

if (byId("exitGameBtn")) {
  byId("exitGameBtn").onclick = () => showScreen("menu");
}

function bindTouchButton(id, key) {
  const button = byId(id);
  if (!button) return;

  button.onpointerdown = event => {
    event.preventDefault();
    touch[key] = true;
  };

  button.onpointerup = event => {
    event.preventDefault();
    touch[key] = false;
  };

  button.onpointerleave = () => {
    touch[key] = false;
  };

  button.onpointercancel = () => {
    touch[key] = false;
  };
}

bindTouchButton("leftTouch", "left");
bindTouchButton("rightTouch", "right");
bindTouchButton("jumpTouch", "jump");
bindTouchButton("dashTouch", "dash");

/* MUSIC / SOUND */

async function loadPlaylist() {
  if (playlistLoaded) return;

  playlistLoaded = true;

  try {
    const response = await fetch("playlist/playlist.json", { cache: "no-store" });

    if (response.ok) {
      const data = await response.json();

      if (Array.isArray(data)) {
        playlist = data;
      }
    }
  } catch {
    // No playlist JSON found. Use fallback filenames.
  }

  if (!Array.isArray(playlist) || playlist.length === 0) {
    playlist = [
      "playlist/track1.mp3",
      "playlist/track2.mp3",
      "playlist/track3.mp3",
      "playlist/music.mp3",
      "playlist/breakcore.mp3",
      "playlist/song.mp3"
    ];
  }
}

async function startMusic() {
  if (!save.settings.sound) return;

  await loadPlaylist();

  if (!playlist.length || audio) return;

  tryTrack(currentTrack);
}

function tryTrack(index) {
  if (!save.settings.sound || !playlist.length || audio) return;

  const src = playlist[index % playlist.length];
  audio = new Audio(src);
  audio.volume = 0.45;

  audio.onended = () => {
    audio = null;
    currentTrack++;
    tryTrack(currentTrack);
  };

  audio.onerror = () => {
    audio = null;
    currentTrack++;

    if (currentTrack < playlist.length) {
      tryTrack(currentTrack);
    }
  };

  audio.play().catch(() => {
    audio = null;
  });
}

function stopMusic() {
  if (!audio) return;

  audio.pause();
  audio = null;
}

function beep(freq, duration) {
  if (!save.settings.sound) return;

  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.frequency.value = freq;
    gain.gain.value = 0.04;

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch {
    // Audio not supported or blocked.
  }
}

/* STARTUP */

resizeCanvas();
initEditor();
refreshUI();
showScreen("start");
