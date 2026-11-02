// Mario-themed backdrop: blocks, pipes and clouds around the game, plus
// characters that unlock as the score climbs and hop from block to block.
(function () {
  var SCALE = 4;           // each sprite pixel becomes a 4x4 CSS pixel square
  var BLOCK = 40;          // block size in CSS pixels
  var GROUND_HEIGHT = 48;

  var PALETTE = {
    R: "#e52521", G: "#43b047", g: "#2b7a2e", B: "#7a3d0c", b: "#3b1e08",
    S: "#fcc89b", K: "#000000", W: "#ffffff", O: "#2038ec", Y: "#fbd000",
    P: "#ff8fc8", D: "#d1307a", T: "#e7b37a", o: "#f08b2c", H: "#6b3a12"
  };

  // 10x12 pixel sprites. "." is transparent.
  function plumber(cap) {
    return {
      colors: { C: cap },
      rows: [
        "..CCCCC...",
        ".CCCWCCCC.",
        ".CCCCCCCCC",
        ".HSKSSKS..",
        ".SSSSSSSS.",
        ".SHHHHHHS.",
        "..SSSSSS..",
        ".CCOCCOCC.",
        "SCCOOOOCCS",
        "S.OYOOYO.S",
        "..OOOOOO..",
        ".BBB..BBB."
      ]
    };
  }

  var SPRITES = {
    mario: plumber("#e52521"),
    luigi: plumber("#43b047"),
    goomba: { rows: [
      "...BBBB...",
      "..BBBBBB..",
      ".BWKBBKWB.",
      "BBWKBBKWBB",
      "BBBBBBBBBB",
      "BBBBBBBBBB",
      ".BTTTTTTB.",
      "..TTTTTT..",
      "..TTTTTT..",
      ".bb....bb.",
      "bbb....bbb",
      ".........."
    ] },
    toad: { rows: [
      "..WWWWWW..",
      ".WRRWWRRW.",
      "WRRRWWRRRW",
      "WWWWWWWWWW",
      ".WRWWWWRW.",
      "..SSSSSS..",
      "..SKSSKS..",
      "..SSSSSS..",
      ".OOWWWWOO.",
      "SOOWWWWOOS",
      "..WWWWWW..",
      ".BBB..BBB."
    ] },
    yoshi: { rows: [
      "....GGGG..",
      "...GGWKGG.",
      "...GGGGGGG",
      "..RGGWWWWW",
      "..RGG.....",
      ".RWWGG....",
      "RRWWWGG...",
      ".RRWWGGG..",
      "..GWWGGG..",
      "..GGGGGG..",
      "..oo..oo..",
      ".ooo.ooo.."
    ] },
    koopa: { rows: [
      "......YY..",
      ".....YKYY.",
      ".....YYYY.",
      "..GGG.YY..",
      ".GWGWGYY..",
      "GGGWGGWY..",
      "GWGGGWGY..",
      "WWWWWWWY..",
      ".WWWWWW...",
      "..YY..YY..",
      ".ooo.ooo..",
      ".........."
    ] },
    peach: { rows: [
      "...Y.Y.Y..",
      "...YYYYY..",
      "..YYYYYYY.",
      ".YYSKSKSY.",
      ".YSSSSSSY.",
      ".YYSRRSYY.",
      "..PPPPPP..",
      ".SPPDDPPS.",
      "..PPPPPP..",
      ".PPPPPPPP.",
      "PPDPPPPDPP",
      "PPPPPPPPPP"
    ] },
    bowser: { rows: [
      "..W....W..",
      "..WooooW..",
      ".oYYYYYYo.",
      ".YYKYYKYY.",
      ".YYWRRWYY.",
      "WgGYYYYGgW",
      "GWGGYYGGWG",
      "GGWGYYGWGG",
      "GGGGYYGGGG",
      ".GGGYYGGG.",
      "..YYY.YYY.",
      ".YYYY.YYYY"
    ] }
  };

  // Unlock order. Set `img` to a file path (e.g. "meta/sprites/mario.png")
  // to use your own artwork instead of the built-in pixel sprite.
  var CHARACTERS = [
    { id: "mario",  name: "Mario",  score: 100 },
    { id: "luigi",  name: "Luigi",  score: 500 },
    { id: "goomba", name: "Goomba", score: 1000 },
    { id: "toad",   name: "Toad",   score: 2000 },
    { id: "yoshi",  name: "Yoshi",  score: 4000 },
    { id: "koopa",  name: "Koopa",  score: 6000 },
    { id: "peach",  name: "Peach",  score: 10000 },
    { id: "bowser", name: "Bowser", score: 16000 }
  ];

  function renderSprite(sprite) {
    var rows = sprite.rows;
    var canvas = document.createElement("canvas");
    canvas.width = rows[0].length;
    canvas.height = rows.length;
    var ctx = canvas.getContext("2d");

    rows.forEach(function (row, y) {
      for (var x = 0; x < row.length; x++) {
        var key = row[x];
        var color = (sprite.colors && sprite.colors[key]) || PALETTE[key];
        if (key === "." || !color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    });

    return { src: canvas.toDataURL(), width: canvas.width * SCALE, height: canvas.height * SCALE };
  }

  function el(className, parent) {
    var node = document.createElement("div");
    node.className = className;
    parent.appendChild(node);
    return node;
  }

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function MarioWorld() {
    this.root = el("mario-world", document.body);
    this.sky = el("mario-sky", this.root);
    this.stage = el("mario-stage", this.root);
    this.toast = el("mario-toast", document.body);

    this.platforms = [];
    this.actors = {};
    this.initialized = false;

    this.buildSky();
    this.buildLevel();

    var self = this;
    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { self.buildLevel(); }, 200);
    });

    this.tick = this.tick.bind(this);
    window.requestAnimationFrame(this.tick);
  }

  MarioWorld.prototype.buildSky = function () {
    for (var i = 0; i < 6; i++) {
      var cloud = el("mario-cloud", this.sky);
      cloud.style.top = random(4, 45) + "%";
      cloud.style.animationDuration = random(60, 120) + "s";
      cloud.style.animationDelay = -random(0, 120) + "s";
      cloud.style.transform = "scale(" + random(0.7, 1.3).toFixed(2) + ")";
    }
  };

  // Lay out ground, pipes and floating blocks to fit the current window,
  // keeping the floating blocks in the empty space beside the game.
  MarioWorld.prototype.buildLevel = function () {
    var self = this;
    var width = window.innerWidth;
    var height = window.innerHeight;
    var groundTop = height - GROUND_HEIGHT;

    this.stage.innerHTML = "";
    this.platforms = [];

    var ground = el("mario-ground", this.stage);
    ground.style.height = GROUND_HEIGHT + "px";

    // Ground spots every ~60px so characters can hop along the floor too
    for (var gx = 30; gx < width - 30; gx += 60) {
      this.platforms.push({ x: gx, y: groundTop, ground: true });
    }

    // Pipes at each edge, characters can stand on top of them
    [{ x: 24, h: 70 }, { x: width - 24 - 64, h: 100 }].forEach(function (p) {
      if (width < 400) return;
      var pipe = el("mario-pipe", self.stage);
      pipe.style.left = p.x + "px";
      pipe.style.height = p.h + "px";
      pipe.style.bottom = GROUND_HEIGHT + "px";
      self.platforms.push({ x: p.x + 32, y: groundTop - p.h });
    });

    var container = document.querySelector(".container");
    var rect = container.getBoundingClientRect();
    var sides = [
      { from: 110, to: rect.left - 30 },
      { from: rect.right + 30, to: width - 110 }
    ];

    // Floating rows of blocks at a few heights, mixing bricks and ? blocks
    var levels = [groundTop - 120, groundTop - 240, groundTop - 360];
    sides.forEach(function (side) {
      if (side.to - side.from < BLOCK * 2) return;

      levels.forEach(function (top, level) {
        if (top < 100) return;
        var x = side.from + random(0, 40) + (level % 2) * 50;

        while (x + BLOCK * 3 < side.to) {
          var count = 1 + Math.floor(Math.random() * 3);
          for (var i = 0; i < count; i++) {
            var question = Math.random() < 0.4;
            var block = el(question ? "mario-block mario-question" : "mario-block mario-brick", self.stage);
            block.style.left = (x + i * BLOCK) + "px";
            block.style.top = top + "px";
            self.platforms.push({ x: x + i * BLOCK + BLOCK / 2, y: top, el: block, question: question });
          }
          x += count * BLOCK + random(90, 170);
        }
      });
    });

    // Re-seat characters on the new layout
    Object.keys(this.actors).forEach(function (id) {
      var actor = self.actors[id];
      if (actor.leaving) return;
      actor.platform = self.randomPlatform();
      actor.x = actor.platform.x;
      actor.y = actor.platform.y;
      actor.jump = null;
      actor.restUntil = 0;
    });
  };

  MarioWorld.prototype.randomPlatform = function () {
    return this.platforms[Math.floor(Math.random() * this.platforms.length)];
  };

  // Pick a nearby platform that is a sensible jump away
  MarioWorld.prototype.nextPlatform = function (from) {
    var options = this.platforms.filter(function (p) {
      var dx = Math.abs(p.x - from.x);
      var rise = from.y - p.y;
      return p !== from && dx > 20 && dx < 260 && rise < 260;
    });

    if (!options.length) return this.randomPlatform();
    return options[Math.floor(Math.random() * options.length)];
  };

  MarioWorld.prototype.setScore = function (score) {
    var self = this;
    var announce = this.initialized;
    this.initialized = true;

    CHARACTERS.forEach(function (character) {
      var unlocked = score >= character.score;
      var actor = self.actors[character.id];

      if (unlocked && (!actor || actor.leaving)) {
        if (actor) self.removeActor(character.id, true);
        self.spawn(character);
        if (announce) self.announce(character.name + " joined the game!");
      } else if (!unlocked && actor && !actor.leaving) {
        self.removeActor(character.id);
      }
    });
  };

  MarioWorld.prototype.spawn = function (character) {
    var sprite = character.img
      ? { src: character.img, width: 40, height: 48 }
      : renderSprite(SPRITES[character.id]);

    var node = document.createElement("img");
    node.className = "mario-character";
    node.src = sprite.src;
    node.alt = character.name;
    node.style.width = sprite.width + "px";
    node.style.height = sprite.height + "px";
    this.stage.parentNode.appendChild(node);

    var target = this.randomPlatform();
    var actor = {
      node: node,
      width: sprite.width,
      height: sprite.height,
      platform: target,
      x: target.x,
      y: -sprite.height,
      facing: Math.random() < 0.5 ? 1 : -1,
      restUntil: 0,
      jump: null
    };

    // Drop in from the top of the screen
    actor.jump = { from: { x: target.x, y: -sprite.height }, to: target, start: performance.now(), duration: 900, arc: 0 };
    this.actors[character.id] = actor;
  };

  MarioWorld.prototype.removeActor = function (id, immediate) {
    var actor = this.actors[id];
    if (!actor) return;

    if (immediate) {
      actor.node.parentNode.removeChild(actor.node);
      delete this.actors[id];
      return;
    }

    actor.leaving = true;
    actor.node.classList.add("mario-leaving");
    var self = this;
    setTimeout(function () {
      if (self.actors[id] === actor) self.removeActor(id, true);
    }, 500);
  };

  MarioWorld.prototype.announce = function (text) {
    var toast = this.toast;
    toast.textContent = text;
    toast.classList.remove("mario-toast-show");
    void toast.offsetWidth; // restart the animation
    toast.classList.add("mario-toast-show");
  };

  MarioWorld.prototype.land = function (platform) {
    if (!platform.el) return;

    var block = platform.el;
    block.classList.remove("mario-bump");
    void block.offsetWidth;
    block.classList.add("mario-bump");

    if (platform.question && Math.random() < 0.5) {
      var coin = el("mario-coin", this.stage);
      coin.style.left = (platform.x - 8) + "px";
      coin.style.top = (platform.y - 30) + "px";
      setTimeout(function () { coin.parentNode && coin.parentNode.removeChild(coin); }, 700);
    }
  };

  MarioWorld.prototype.tick = function (now) {
    var self = this;

    Object.keys(this.actors).forEach(function (id) {
      var actor = self.actors[id];
      var jump = actor.jump;

      if (jump) {
        var t = Math.min(1, (now - jump.start) / jump.duration);
        actor.x = jump.from.x + (jump.to.x - jump.from.x) * t;
        actor.y = jump.from.y + (jump.to.y - jump.from.y) * t - jump.arc * 4 * t * (1 - t);

        if (t === 1) {
          actor.jump = null;
          actor.platform = jump.to;
          actor.restUntil = now + random(250, 1400);
          self.land(jump.to);
        }
      } else if (now >= actor.restUntil && !actor.leaving) {
        var target = self.nextPlatform(actor.platform);
        var dx = target.x - actor.x;
        var rise = Math.max(0, actor.y - target.y);

        if (Math.abs(dx) > 1) actor.facing = dx > 0 ? 1 : -1;
        actor.jump = {
          from: { x: actor.x, y: actor.y },
          to: target,
          start: now,
          duration: 550 + Math.min(450, Math.abs(dx) * 1.5 + rise),
          arc: 60 + rise
        };
      }

      var airborne = actor.jump ? " mario-airborne" : "";
      actor.node.className = "mario-character" + airborne + (actor.leaving ? " mario-leaving" : "");
      actor.node.style.transform =
        "translate(" + Math.round(actor.x - actor.width / 2) + "px," + Math.round(actor.y - actor.height) + "px)" +
        " scaleX(" + actor.facing + ")";
    });

    window.requestAnimationFrame(this.tick);
  };

  window.marioWorld = new MarioWorld();
})();
