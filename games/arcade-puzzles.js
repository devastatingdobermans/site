(function () {
  "use strict";

  var arcade = window.DobermanArcade;
  if (!arcade) return;
  var C = { ink: "#3b211b", rust: "#ae5433", red: "#6f3026", gold: "#e6b85b", pale: "#fff6e6", cream: "#f0dec2", muted: "#866451", green: "#56744b" };

  function rounded(ctx, x, y, w, h, r, fill, stroke) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
  }

  function label(ctx, text, x, y, size, color, align) {
    ctx.font = "700 " + (size || 18) + "px system-ui, sans-serif";
    ctx.fillStyle = color || C.ink;
    ctx.textAlign = align || "left";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
  }

  function scene(api, title, subtitle) {
    var ctx = api.ctx;
    ctx.fillStyle = C.pale;
    ctx.fillRect(0, 0, api.W, api.H);
    ctx.fillStyle = C.red;
    ctx.fillRect(0, 0, api.W, 60);
    label(ctx, title, 28, 30, 24, C.pale);
    label(ctx, subtitle, 774, 30, 14, C.cream, "right");
  }

  function shuffle(array) {
    for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var item = array[i]; array[i] = array[j]; array[j] = item;
    }
    return array;
  }

  function paw(ctx, x, y, size, color) {
    ctx.fillStyle = color || C.rust;
    ctx.beginPath(); ctx.ellipse(x, y + size * 0.15, size * 0.25, size * 0.21, 0, 0, Math.PI * 2); ctx.fill();
    [[-0.28, -0.1], [-0.11, -0.29], [0.11, -0.29], [0.28, -0.1]].forEach(function (p) {
      ctx.beginPath(); ctx.ellipse(x + p[0] * size, y + p[1] * size, size * 0.105, size * 0.135, p[0], 0, Math.PI * 2); ctx.fill();
    });
  }

  function cursorBorder(ctx, x, y, w, h) {
    ctx.save(); ctx.lineWidth = 4; ctx.strokeStyle = C.gold;
    ctx.strokeRect(x - 3, y - 3, w + 6, h + 6); ctx.restore();
  }

  function icon(api, type, x, y, size) {
    var ctx = api.ctx;
    if (type === 0) api.bone(ctx, x, y, size);
    else if (type === 1) api.toy(ctx, x, y, size);
    else if (type === 2) api.dog(ctx, x, y, size);
    else if (type === 3) paw(ctx, x, y, size, C.rust);
    else if (type === 4) {
      rounded(ctx, x - size * 0.44, y - size * 0.05, size * 0.88, size * 0.38, 5, C.rust);
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.ellipse(x, y - size * 0.05, size * 0.44, size * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    } else if (type === 5) {
      ctx.fillStyle = C.rust; ctx.beginPath(); ctx.moveTo(x - size * 0.48, y); ctx.lineTo(x, y - size * 0.43); ctx.lineTo(x + size * 0.48, y); ctx.closePath(); ctx.fill();
      rounded(ctx, x - size * 0.32, y - 2, size * 0.64, size * 0.42, 3, C.red);
      rounded(ctx, x - size * 0.12, y + size * 0.1, size * 0.24, size * 0.3, 6, C.pale);
    } else if (type === 6) {
      ctx.fillStyle = C.rust; ctx.beginPath(); ctx.moveTo(x, y + size * 0.4);
      ctx.bezierCurveTo(x - size * 0.85, y - size * 0.15, x - size * 0.3, y - size * 0.7, x, y - size * 0.25);
      ctx.bezierCurveTo(x + size * 0.3, y - size * 0.7, x + size * 0.85, y - size * 0.15, x, y + size * 0.4); ctx.fill();
    } else {
      rounded(ctx, x - size * 0.4, y - size * 0.25, size * 0.8, size * 0.5, 10, C.gold, C.rust);
      paw(ctx, x, y, size * 0.55, C.red);
    }
  }

  arcade.register({
    id: "memory-paws", title: "Memory Paws", eyebrow: "Match & remember",
    help: "Tap two cards to find a matching pair. Match all eight pairs. Arrow keys choose a card; Space flips it. Fewer turns earn more points.",
    buttons: [{ id: "flip", label: "Flip card" }],
    setup: function (api) {
      var cards, matched, face, turns, pairs, cursor, wait, finished;
      var bx = 64, by = 89, cw = 87, ch = 78, gap = 12;
      var names = ["Bone", "Ball", "Louis", "Paw", "Bowl", "Home", "Love", "Treat"];
      function points() { return Math.max(0, pairs * 200 - turns * 20 + (finished ? 400 : 0)); }
      function reset() {
        cards = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7]);
        matched = Array(16).fill(false); face = []; turns = 0; pairs = 0; cursor = 0; wait = 0; finished = false;
        api.score(0); api.status("Find Louis's eight matching pairs.");
      }
      function flip(index) {
        if (finished || wait > 0 || matched[index] || face.indexOf(index) !== -1) return;
        cursor = index; face.push(index);
        if (face.length === 2) {
          turns++;
          if (cards[face[0]] === cards[face[1]]) {
            matched[face[0]] = matched[face[1]] = true; face = []; pairs++;
            if (pairs === 8) { finished = true; api.score(points()); api.end("All eight pairs found in " + turns + " turns!", true); }
            else { api.score(points()); api.status("A match! " + pairs + " of 8 pairs found."); }
          } else { wait = 0.85; api.score(points()); api.status("Remember those cards and try another pair."); }
        }
      }
      return {
        reset: reset,
        update: function (dt) { if (wait > 0) { wait -= dt; if (wait <= 0) { wait = 0; face = []; } } },
        draw: function () {
          var ctx = api.ctx; scene(api, "MEMORY PAWS", "8 pairs / 16 cards");
          for (var i = 0; i < 16; i++) {
            var x = bx + (i % 4) * (cw + gap), y = by + Math.floor(i / 4) * (ch + gap);
            var shown = matched[i] || face.indexOf(i) !== -1;
            rounded(ctx, x, y, cw, ch, 11, shown ? (matched[i] ? "#e1e7cd" : "#fffdf7") : C.red, matched[i] ? C.green : C.cream);
            if (shown) { icon(api, cards[i], x + cw / 2, y + 28, 38); label(ctx, names[cards[i]], x + cw / 2, y + 61, 12, C.ink, "center"); }
            else { paw(ctx, x + cw / 2, y + ch / 2, 45, C.gold); }
            if (cursor === i) cursorBorder(ctx, x, y, cw, ch);
          }
          rounded(ctx, 496, 89, 256, 348, 18, C.cream);
          api.dog(ctx, 624, 174, 106);
          label(ctx, pairs + " / 8", 624, 256, 37, C.red, "center");
          label(ctx, "pairs found", 624, 292, 18, C.muted, "center");
          label(ctx, turns + " turns", 624, 339, 23, C.ink, "center");
          label(ctx, "A sharp nose remembers!", 624, 395, 15, C.muted, "center");
        },
        key: function (code, down) {
          if (!down) return;
          if (code === "ArrowLeft") cursor = (cursor + 15) % 16;
          else if (code === "ArrowRight") cursor = (cursor + 1) % 16;
          else if (code === "ArrowUp") cursor = (cursor + 12) % 16;
          else if (code === "ArrowDown") cursor = (cursor + 4) % 16;
          else if (code === "Space" || code === "Enter") flip(cursor);
        },
        pointer: function (kind, x, y) {
          if (kind !== "down") return;
          var col = Math.floor((x - bx) / (cw + gap)), row = Math.floor((y - by) / (ch + gap));
          if (col >= 0 && col < 4 && row >= 0 && row < 4 && x - bx - col * (cw + gap) < cw && y - by - row * (ch + gap) < ch) flip(row * 4 + col);
        },
        action: function (id) { if (id === "flip") flip(cursor); },
        inspect: function () { return { cards: cards.slice(), matched: matched.slice(), face: face.slice(), pairs: pairs, turns: turns, cursor: cursor, wait: wait, finished: finished }; }
      };
    }
  });

  arcade.register({
    id: "maze-fetch", title: "Maze Fetch", eyebrow: "Find the way home",
    help: "Guide red-and-rust Louis through the maze. Pick up the bone, then reach the doghouse. Use arrows, WASD, direction buttons, or swipe the maze.",
    buttons: [{ id: "up", label: "Up" }, { id: "left", label: "Left" }, { id: "down", label: "Down" }, { id: "right", label: "Right" }],
    setup: function (api) {
      var cols = 11, rows = 9, cell = 40, bx = 48, by = 84;
      var cells, player, boneAt, goal, hasBone, steps, done, trail, pointerStart;
      var directions = [[0, -1], [1, 0], [0, 1], [-1, 0]];
      function reset() {
        cells = Array.from({ length: cols * rows }, function () { return [true, true, true, true]; });
        var seen = new Set([0]), stack = [0], parents = Array(cols * rows).fill(-1), distance = Array(cols * rows).fill(0);
        while (stack.length) {
          var current = stack[stack.length - 1], cx = current % cols, cy = Math.floor(current / cols), choices = [];
          directions.forEach(function (d, direction) {
            var nx = cx + d[0], ny = cy + d[1], next = ny * cols + nx;
            if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !seen.has(next)) choices.push({ index: next, direction: direction });
          });
          if (!choices.length) { stack.pop(); continue; }
          var pick = choices[Math.floor(Math.random() * choices.length)];
          cells[current][pick.direction] = false; cells[pick.index][(pick.direction + 2) % 4] = false;
          parents[pick.index] = current; distance[pick.index] = distance[current] + 1;
          seen.add(pick.index); stack.push(pick.index);
        }
        goal = distance.indexOf(Math.max.apply(null, distance));
        var route = [goal]; while (parents[route[route.length - 1]] !== -1) route.push(parents[route[route.length - 1]]);
        route.reverse(); boneAt = route[Math.max(1, Math.floor(route.length * 0.52))];
        player = 0; hasBone = false; steps = 0; done = false; trail = new Set([0]); pointerStart = null;
        api.score(0); api.status("Find the bone, then take Louis home.");
      }
      function move(direction) {
        if (done || cells[player][direction]) return;
        var d = directions[direction]; player += d[0] + d[1] * cols; steps++; trail.add(player);
        if (player === boneAt && !hasBone) { hasBone = true; api.score(300); api.status("Bone collected! Follow the maze to the doghouse."); }
        if (player === goal) {
          if (hasBone) { done = true; api.score(Math.max(400, 2200 - steps * 12)); api.end("Louis brought his bone home in " + steps + " steps!", true); }
          else api.status("Louis needs his bone before heading home.");
        }
      }
      function action(id) { var direction = { up: 0, right: 1, down: 2, left: 3 }[id]; if (direction !== undefined) move(direction); }
      return {
        reset: reset, update: function () {},
        draw: function () {
          var ctx = api.ctx; scene(api, "MAZE FETCH", "Bone first. Doghouse next.");
          rounded(ctx, bx - 9, by - 9, cols * cell + 18, rows * cell + 18, 10, C.cream);
          ctx.fillStyle = "#fffdf5"; ctx.fillRect(bx, by, cols * cell, rows * cell);
          trail.forEach(function (index) { ctx.fillStyle = "#ebdbbf"; ctx.beginPath(); ctx.arc(bx + (index % cols + 0.5) * cell, by + (Math.floor(index / cols) + 0.5) * cell, 3, 0, Math.PI * 2); ctx.fill(); });
          var gx = bx + (goal % cols + 0.5) * cell, gy = by + (Math.floor(goal / cols) + 0.5) * cell;
          icon(api, 5, gx, gy - 1, 30);
          if (!hasBone) api.bone(ctx, bx + (boneAt % cols + 0.5) * cell, by + (Math.floor(boneAt / cols) + 0.5) * cell, 27);
          ctx.strokeStyle = C.red; ctx.lineWidth = 3; ctx.lineCap = "round";
          cells.forEach(function (walls, index) {
            var x = bx + index % cols * cell, y = by + Math.floor(index / cols) * cell;
            ctx.beginPath();
            if (walls[0]) { ctx.moveTo(x, y); ctx.lineTo(x + cell, y); }
            if (walls[3]) { ctx.moveTo(x, y); ctx.lineTo(x, y + cell); }
            if (index % cols === cols - 1 && walls[1]) { ctx.moveTo(x + cell, y); ctx.lineTo(x + cell, y + cell); }
            if (index >= cols * (rows - 1) && walls[2]) { ctx.moveTo(x, y + cell); ctx.lineTo(x + cell, y + cell); }
            ctx.stroke();
          });
          api.dog(ctx, bx + (player % cols + 0.5) * cell, by + (Math.floor(player / cols) + 0.5) * cell, 31);
          rounded(ctx, 530, 84, 224, 360, 18, C.cream);
          api.dog(ctx, 642, 163, 86);
          label(ctx, steps + " steps", 642, 242, 27, C.red, "center");
          api.bone(ctx, 642, 296, 49);
          label(ctx, hasBone ? "Bone collected!" : "Find the bone", 642, 338, 19, C.ink, "center");
          label(ctx, "Swipe or use arrows", 642, 392, 15, C.muted, "center");
          label(ctx, "Every maze has a way home.", 642, 418, 13, C.muted, "center");
        },
        key: function (code, down) {
          if (!down) return;
          var map = { ArrowUp: 0, KeyW: 0, ArrowRight: 1, KeyD: 1, ArrowDown: 2, KeyS: 2, ArrowLeft: 3, KeyA: 3 };
          if (map[code] !== undefined) move(map[code]);
        },
        pointer: function (kind, x, y) {
          if (kind === "down") { pointerStart = { x: x, y: y }; return; }
          if (kind !== "up" || !pointerStart) return;
          var dx = x - pointerStart.x, dy = y - pointerStart.y; pointerStart = null;
          if (Math.max(Math.abs(dx), Math.abs(dy)) > 16) { move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0)); return; }
          var tx = Math.floor((x - bx) / cell), ty = Math.floor((y - by) / cell), px = player % cols, py = Math.floor(player / cols);
          if (tx < 0 || tx >= cols || ty < 0 || ty >= rows) return;
          if (tx === px && Math.abs(ty - py) === 1) move(ty > py ? 2 : 0);
          else if (ty === py && Math.abs(tx - px) === 1) move(tx > px ? 1 : 3);
        },
        action: action,
        inspect: function () { return { cols: cols, rows: rows, walls: cells.map(function (w) { return w.slice(); }), player: player, bone: boneAt, goal: goal, hasBone: hasBone, steps: steps, finished: done }; }
      };
    }
  });

  arcade.register({
    id: "paw-lights", title: "Paw Lights", eyebrow: "A bright little puzzle",
    help: "Turn every paw light off. Tapping a square switches that square and its up, down, left, and right neighbors. Arrows select; Space switches. Hint points to one useful move.",
    buttons: [{ id: "toggle", label: "Switch light" }, { id: "hint", label: "Hint" }],
    setup: function (api) {
      var board, solution, cursor, moves, hints, done, hinted;
      var side = 5, cell = 62, gap = 8, bx = 66, by = 86;
      function toggle(index) {
        var x = index % side, y = Math.floor(index / side);
        [[x, y], [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].forEach(function (p) {
          if (p[0] >= 0 && p[0] < side && p[1] >= 0 && p[1] < side) { var k = p[1] * side + p[0]; board[k] = !board[k]; }
        });
      }
      function reset() {
        board = Array(25).fill(false); solution = Array(25).fill(false);
        var scramble = shuffle(Array.from({ length: 25 }, function (_, i) { return i; })).slice(0, 10);
        scramble.forEach(function (i) { toggle(i); solution[i] = true; });
        if (!board.some(Boolean)) { toggle(12); solution[12] = !solution[12]; }
        cursor = 12; moves = 0; hints = 0; done = false; hinted = -1;
        api.score(0); api.status("Switch all 25 paw lights off.");
      }
      function choose(index) {
        if (done) return;
        cursor = index; hinted = -1; moves++; toggle(index); solution[index] = !solution[index];
        if (!board.some(Boolean)) { done = true; api.score(Math.max(200, 2500 - moves * 45 - hints * 90)); api.end("Lights out! Louis can sleep after " + moves + " moves.", true); }
        else api.status(board.filter(Boolean).length + " lights still on. Every switch changes its neighbors.");
      }
      function hint() {
        if (done) return;
        hinted = solution.indexOf(true);
        if (hinted >= 0) { cursor = hinted; hints++; api.status("Try the outlined paw. Hint cost: 90 points."); }
      }
      return {
        reset: reset, update: function () {},
        draw: function () {
          var ctx = api.ctx; scene(api, "PAW LIGHTS", "Make a cozy night for Louis");
          rounded(ctx, bx - 12, by - 12, side * (cell + gap) - gap + 24, side * (cell + gap) - gap + 24, 16, C.cream);
          board.forEach(function (on, i) {
            var x = bx + i % side * (cell + gap), y = by + Math.floor(i / side) * (cell + gap);
            rounded(ctx, x, y, cell, cell, 10, on ? C.gold : C.red, on ? "#bc7b2f" : "#51251f");
            paw(ctx, x + cell / 2, y + cell / 2 + 2, 40, on ? C.red : "#ab7256");
            if (i === cursor) cursorBorder(ctx, x, y, cell, cell);
            if (i === hinted) { ctx.strokeStyle = C.green; ctx.lineWidth = 3; ctx.strokeRect(x + 5, y + 5, cell - 10, cell - 10); }
          });
          rounded(ctx, 466, 86, 288, 342, 18, C.cream);
          api.dog(ctx, 610, 173, 105);
          label(ctx, board.filter(Boolean).length + " lights on", 610, 257, 29, C.red, "center");
          label(ctx, moves + " moves / " + hints + " hints", 610, 303, 18, C.ink, "center");
          label(ctx, "Each switch changes a +", 610, 359, 17, C.muted, "center");
          label(ctx, "The starting puzzle is solvable.", 610, 394, 14, C.muted, "center");
        },
        key: function (code, down) {
          if (!down) return;
          if (code === "ArrowLeft") cursor = cursor % 5 === 0 ? cursor + 4 : cursor - 1;
          else if (code === "ArrowRight") cursor = cursor % 5 === 4 ? cursor - 4 : cursor + 1;
          else if (code === "ArrowUp") cursor = (cursor + 20) % 25;
          else if (code === "ArrowDown") cursor = (cursor + 5) % 25;
          else if (code === "Space" || code === "Enter") choose(cursor);
          else if (code === "KeyH") hint();
        },
        pointer: function (kind, x, y) {
          if (kind !== "down") return;
          var col = Math.floor((x - bx) / (cell + gap)), row = Math.floor((y - by) / (cell + gap));
          if (col >= 0 && col < side && row >= 0 && row < side && x - bx - col * (cell + gap) < cell && y - by - row * (cell + gap) < cell) choose(row * side + col);
        },
        action: function (id) { if (id === "toggle") choose(cursor); else if (id === "hint") hint(); },
        inspect: function () { return { board: board.slice(), solution: solution.slice(), cursor: cursor, moves: moves, hints: hints, finished: done }; }
      };
    }
  });

  arcade.register({
    id: "bone-slider", title: "Bone Slider", eyebrow: "Slide into place",
    help: "Put the bone tiles in order from 1 to 8, with the empty space last. Tap a tile beside the empty space. Arrows or direction buttons move the empty space.",
    buttons: [{ id: "up", label: "Up" }, { id: "left", label: "Left" }, { id: "down", label: "Down" }, { id: "right", label: "Right" }],
    setup: function (api) {
      var board, blank, moves, done;
      var bx = 68, by = 86, cell = 109, gap = 10;
      function solved() { return board.every(function (value, i) { return value === (i + 1) % 9; }); }
      function swap(index) { board[blank] = board[index]; board[index] = 0; blank = index; }
      function neighbors(index) {
        var result = [], x = index % 3, y = Math.floor(index / 3);
        if (x > 0) result.push(index - 1); if (x < 2) result.push(index + 1);
        if (y > 0) result.push(index - 3); if (y < 2) result.push(index + 3);
        return result;
      }
      function reset() {
        board = [1, 2, 3, 4, 5, 6, 7, 8, 0]; blank = 8;
        var previous = -1;
        for (var step = 0; step < 64; step++) {
          var options = neighbors(blank).filter(function (i) { return i !== previous; }), next = options[Math.floor(Math.random() * options.length)];
          previous = blank; swap(next);
        }
        if (solved()) swap(neighbors(blank)[0]);
        moves = 0; done = false; api.score(0); api.status("Slide the bones into order: 1 to 8, then the empty space.");
      }
      function moveTile(index) {
        if (done || neighbors(blank).indexOf(index) === -1) return;
        swap(index); moves++;
        if (solved()) { done = true; api.score(Math.max(200, 3600 - moves * 30)); api.end("All the bones are in order! Solved in " + moves + " moves.", true); }
      }
      function direction(id) {
        var x = blank % 3, y = Math.floor(blank / 3);
        if (id === "up" && y > 0) moveTile(blank - 3);
        else if (id === "down" && y < 2) moveTile(blank + 3);
        else if (id === "left" && x > 0) moveTile(blank - 1);
        else if (id === "right" && x < 2) moveTile(blank + 1);
      }
      return {
        reset: reset, update: function () {},
        draw: function () {
          var ctx = api.ctx; scene(api, "BONE SLIDER", "Eight bones. One empty space.");
          rounded(ctx, bx - 12, by - 12, 3 * (cell + gap) - gap + 24, 3 * (cell + gap) - gap + 24, 16, C.cream);
          board.forEach(function (value, i) {
            var x = bx + i % 3 * (cell + gap), y = by + Math.floor(i / 3) * (cell + gap);
            rounded(ctx, x, y, cell, cell, 13, value ? (i === value - 1 ? "#9c4b31" : C.red) : "#d9c5a8", value ? C.rust : null);
            if (value) { api.bone(ctx, x + cell / 2, y + 30, 43); label(ctx, String(value), x + cell / 2, y + 77, 35, C.pale, "center"); }
            else paw(ctx, x + cell / 2, y + cell / 2, 48, "#ba9e7d");
          });
          rounded(ctx, 475, 86, 279, 347, 18, C.cream);
          label(ctx, moves + " moves", 615, 128, 28, C.red, "center");
          label(ctx, "Your goal", 615, 179, 18, C.muted, "center");
          for (var n = 0; n < 9; n++) {
            var tx = 541 + n % 3 * 51, ty = 211 + Math.floor(n / 3) * 51;
            rounded(ctx, tx, ty, 45, 45, 6, n === 8 ? "#d9c5a8" : C.red);
            if (n < 8) label(ctx, String(n + 1), tx + 22, ty + 22, 23, C.pale, "center");
          }
          label(ctx, "Tap a bone beside the gap.", 615, 395, 16, C.muted, "center");
        },
        key: function (code, down) {
          if (!down) return;
          var map = { ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right" };
          if (map[code]) direction(map[code]);
        },
        pointer: function (kind, x, y) {
          if (kind !== "down") return;
          var col = Math.floor((x - bx) / (cell + gap)), row = Math.floor((y - by) / (cell + gap));
          if (col >= 0 && col < 3 && row >= 0 && row < 3 && x - bx - col * (cell + gap) < cell && y - by - row * (cell + gap) < cell) moveTile(row * 3 + col);
        },
        action: direction,
        inspect: function () { return { board: board.slice(), blank: blank, moves: moves, finished: done }; }
      };
    }
  });

  arcade.register({
    id: "four-paws", title: "Four Paws", eyebrow: "Connect four against Louis",
    help: "Drop your red-rust paw into a column. Connect four horizontally, vertically, or diagonally before Louis connects his gold toys. Tap a column, or select with Left/Right and drop with Space.",
    buttons: [{ id: "left", label: "Left column" }, { id: "drop", label: "Drop paw" }, { id: "right", label: "Right column" }],
    setup: function (api) {
      var board, selected, turn, delay, moves, done, winner, winning;
      var cols = 7, rows = 6, cell = 57, bx = 49, by = 117;
      function reset() {
        board = Array(42).fill(0); selected = 3; turn = 1; delay = 0; moves = 0; done = false; winner = 0; winning = [];
        api.score(0); api.status("Your red-rust paws go first. Choose a column.");
      }
      function landing(col) { for (var row = rows - 1; row >= 0; row--) if (!board[row * cols + col]) return row * cols + col; return -1; }
      function lineFor(token) {
        for (var row = 0; row < rows; row++) for (var col = 0; col < cols; col++) {
          if (board[row * cols + col] !== token) continue;
          var directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
          for (var d = 0; d < directions.length; d++) {
            var dx = directions[d][0], dy = directions[d][1], result = [];
            for (var n = 0; n < 4; n++) {
              var nx = col + dx * n, ny = row + dy * n;
              if (nx < 0 || nx >= cols || ny < 0 || ny >= rows || board[ny * cols + nx] !== token) break;
              result.push(ny * cols + nx);
            }
            if (result.length === 4) return result;
          }
        }
        return [];
      }
      function finishIfNeeded(token) {
        var line = lineFor(token);
        if (line.length) {
          done = true; winner = token; winning = line;
          if (token === 1) { api.score(Math.max(300, 1800 - moves * 40)); api.end("Four paws in a row! You beat Louis.", true); }
          else api.end("Louis connected four toys. Try another round!");
          return true;
        }
        if (board.every(Boolean)) { done = true; api.score(250); api.end("A full board! You and Louis tied."); return true; }
        return false;
      }
      function drop(col, token) {
        var index = landing(col); if (index < 0) return false;
        board[index] = token; if (token === 1) moves++;
        if (!finishIfNeeded(token)) {
          turn = token === 1 ? 2 : 1;
          if (turn === 2) { delay = 0.48; api.status("Louis is sniffing out his next move..."); }
          else api.status("Your turn. Connect four red-rust paws.");
        }
        return true;
      }
      function immediate(token, options) {
        for (var n = 0; n < options.length; n++) {
          var index = landing(options[n]); board[index] = token;
          var win = lineFor(token).length > 0; board[index] = 0;
          if (win) return options[n];
        }
        return -1;
      }
      function computer() {
        var options = [3, 2, 4, 1, 5, 0, 6].filter(function (col) { return landing(col) !== -1; });
        var choice = immediate(2, options);
        if (choice === -1) choice = immediate(1, options);
        if (choice === -1) {
          var best = -Infinity;
          options.forEach(function (col) {
            var index = landing(col); board[index] = 2;
            var nextOptions = options.filter(function (c) { return landing(c) !== -1; });
            var value = 12 - Math.abs(3 - col) * 2;
            if (immediate(1, nextOptions) !== -1) value -= 1000;
            var x = index % cols, y = Math.floor(index / cols);
            [[1, 0], [0, 1], [1, 1], [1, -1]].forEach(function (d) {
              for (var offset = -3; offset <= 0; offset++) {
                var count = 0, valid = true;
                for (var n = 0; n < 4; n++) {
                  var nx = x + (n + offset) * d[0], ny = y + (n + offset) * d[1];
                  if (nx < 0 || nx >= cols || ny < 0 || ny >= rows || board[ny * cols + nx] === 1) { valid = false; break; }
                  if (board[ny * cols + nx] === 2) count++;
                }
                if (valid) value += count * count;
              }
            });
            board[index] = 0;
            if (value > best) { best = value; choice = col; }
          });
        }
        if (choice >= 0) drop(choice, 2);
      }
      function playerDrop() {
        if (done || turn !== 1) return;
        if (!drop(selected, 1)) api.status("That column is full. Pick another one.");
      }
      function action(id) {
        if (done || turn !== 1) return;
        if (id === "left") selected = (selected + cols - 1) % cols;
        else if (id === "right") selected = (selected + 1) % cols;
        else if (id === "drop") playerDrop();
      }
      return {
        reset: reset,
        update: function (dt) { if (!done && turn === 2) { delay -= dt; if (delay <= 0) computer(); } },
        draw: function () {
          var ctx = api.ctx; scene(api, "FOUR PAWS", "You: rust paws / Louis: gold toys");
          rounded(ctx, bx - 10, by - 9, cols * cell + 20, rows * cell + 18, 16, C.red);
          if (!done && turn === 1) {
            var sx = bx + (selected + 0.5) * cell;
            ctx.fillStyle = C.rust; ctx.beginPath(); ctx.moveTo(sx - 11, by - 28); ctx.lineTo(sx + 11, by - 28); ctx.lineTo(sx, by - 15); ctx.closePath(); ctx.fill();
          }
          board.forEach(function (token, i) {
            var x = bx + (i % cols + 0.5) * cell, y = by + (Math.floor(i / cols) + 0.5) * cell;
            ctx.fillStyle = token === 1 ? C.rust : token === 2 ? C.gold : C.pale;
            ctx.beginPath(); ctx.arc(x, y, 23, 0, Math.PI * 2); ctx.fill();
            if (token === 1) paw(ctx, x, y + 1, 36, C.pale);
            else if (token === 2) api.toy(ctx, x, y, 30);
            if (winning.indexOf(i) !== -1) { ctx.lineWidth = 4; ctx.strokeStyle = "#fff6b2"; ctx.beginPath(); ctx.arc(x, y, 25, 0, Math.PI * 2); ctx.stroke(); }
          });
          rounded(ctx, 505, 86, 249, 365, 18, C.cream);
          api.dog(ctx, 630, 171, 105);
          label(ctx, done ? (winner === 1 ? "You win!" : winner === 2 ? "Louis wins!" : "A tie!") : turn === 1 ? "Your turn" : "Louis's turn", 630, 258, 28, C.red, "center");
          label(ctx, moves + " paws dropped", 630, 304, 19, C.ink, "center");
          label(ctx, "Four across, up, or diagonal.", 630, 360, 15, C.muted, "center");
          label(ctx, "Tap any column to drop.", 630, 401, 15, C.muted, "center");
        },
        key: function (code, down) {
          if (!down) return;
          if (code === "ArrowLeft" || code === "KeyA") action("left");
          else if (code === "ArrowRight" || code === "KeyD") action("right");
          else if (code === "Space" || code === "Enter" || code === "ArrowDown") action("drop");
        },
        pointer: function (kind, x, y) {
          if (kind !== "down" || done || turn !== 1 || x < bx || x >= bx + cols * cell || y < by - 45 || y >= by + rows * cell) return;
          selected = Math.floor((x - bx) / cell); playerDrop();
        },
        action: action,
        inspect: function () { return { board: board.slice(), cols: cols, rows: rows, selected: selected, turn: turn, delay: delay, moves: moves, winner: winner, winning: winning.slice(), finished: done }; }
      };
    }
  });
})();
