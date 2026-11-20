/* ================================================================
 * views/products.js —— 产品目录（互动游戏原型）视图
 * 通过 window.NDViews.products(ctx) 注册，由 app.js 传入依赖。
 * ================================================================ */
(function () {
  window.NDViews = window.NDViews || {};

  window.NDViews.products = function (ctx) {
    var state = ctx.state;
    var esc = ctx.esc;
    var T = ctx.T;
    var unsavedScores = new Map();

    function leaderboard(game, t) {
      var aqua = game === 'aqua';
      var section = document.createElement('section');
      section.className = 'game-leaderboard';
      section.setAttribute('aria-labelledby', 'gameLeaderboardTitle');
      section.innerHTML =
        '<div class="game-leaderboard-head"><h2 id="gameLeaderboardTitle">' + esc(t.gameLeaderboard) + '</h2>' +
        '<label>' + esc(t.level) + ' <select></select></label></div>' +
        '<p>' + esc(aqua ? t.gameAquaScoring : t.gamePyroScoring) + '</p>' +
        '<div class="game-leaderboard-results"></div>';
      var select = section.querySelector('select');
      var results = section.querySelector('.game-leaderboard-results');
      for (var level = 1; level <= 7; level++) select.add(new Option(level, level));

      function key() { return 'ndw-game-scores-v1-' + game + '-' + select.value; }
      function entries() {
        var id = key();
        if (unsavedScores.has(id)) return unsavedScores.get(id);
        var saved;
        try { saved = JSON.parse(localStorage.getItem(id)); } catch (_) { /* Storage may be unavailable. */ }
        return Array.isArray(saved) ? saved.filter(function (entry) {
          return entry && Number.isInteger(entry.points) && entry.points >= 0 && entry.points <= 1000 &&
            Number.isInteger(entry.measure) && entry.measure >= 0 && Number.isFinite(entry.time) && entry.time >= 0;
        }).slice(0, 10) : [];
      }

      function renderScores() {
        var rows = entries();
        if (!rows.length) {
          results.textContent = t.gameNoScores;
          return;
        }
        results.innerHTML =
          '<table aria-labelledby="gameLeaderboardTitle"><thead><tr>' +
          [t.gameRank, t.gamePoints, aqua ? t.progress : t.steps, t.timeUsed].map(function (label) {
            return '<th scope="col">' + esc(label) + '</th>';
          }).join('') + '</tr></thead><tbody>' +
          rows.map(function (entry, index) {
            return '<tr><th scope="row">' + (index + 1) + '</th><td><strong>' + entry.points + '</strong></td><td>' +
              entry.measure + (aqua ? '%' : '') + '</td><td>' + entry.time.toFixed(1) + 's</td></tr>';
          }).join('') + '</tbody></table>';
      }

      select.addEventListener('change', renderScores);
      renderScores();
      return {
        element: section,
        record: function (result) {
          select.value = result.level;
          var rows = entries();
          rows.push(result);
          rows.sort(function (a, b) {
            return b.points - a.points || (aqua ? b.measure - a.measure : a.measure - b.measure) || a.time - b.time;
          });
          if (rows.length > 10) rows.length = 10;
          try {
            localStorage.setItem(key(), JSON.stringify(rows));
            unsavedScores.delete(key());
          } catch (_) {
            unsavedScores.set(key(), rows);
          }
          renderScores();
        }
      };
    }

    function renderGameView() {
      var t = T();
      var g = state.game;
      var name = g === 'aqua' ? t.gameAquaName : t.gamePyroName;
      var how = g === 'aqua' ? t.gameAquaHow : t.gamePyroHow;
      ctx.viewEl.innerHTML =
        '<section class="section"><div class="container">' +
          '<a class="btn btn-outline" href="#/products">' + esc(t.backToProducts) + '</a>' +
          '<div class="game-frame">' +
            '<div class="game-title"><h1>' + esc(name) + '</h1><p>' + esc(how) + '</p></div>' +
            '<div class="game-hud" id="gameHUD"></div>' +
            '<canvas id="gameCanvas" class="game-canvas"></canvas>' +
            '<button class="game-help-btn" id="gameHelpBtn" type="button" aria-label="' + esc(how) + '">?</button>' +
            '<div class="game-help-panel" id="gameHelpPanel">' +
              '<button class="game-help-close" id="gameHelpClose" type="button" aria-label="' + esc(t.close) + '">×</button>' +
              '<div class="game-help-body">' + esc(how) + '</div>' +
            '</div>' +
          '</div>' +
        '</div></section>';
      ctx.setTitle(name);
      ctx.explainView();
      var helpBtn = document.getElementById('gameHelpBtn');
      var helpPanel = document.getElementById('gameHelpPanel');
      var helpClose = document.getElementById('gameHelpClose');
      if (helpBtn && helpPanel) {
        helpBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          helpPanel.hidden = !helpPanel.hidden;
        });
        helpPanel.addEventListener('click', function (e) { e.stopPropagation(); });
      }
      if (helpClose && helpPanel) {
        helpClose.addEventListener('click', function (e) {
          e.stopPropagation();
          helpPanel.hidden = true;
        });
      }
      var cv = document.getElementById('gameCanvas');
      if (window.NDGames && cv) {
        var board = leaderboard(g, t);
        cv.parentElement.after(board.element);
        window.NDGames.start(cv, g, t, board.record);
      }
    }

    function render() {
      var t = T();
      if (state.game) {
        renderGameView();
        return;
      }
      var cards = [
        {
          type: 'aqua',
          name: t.gameAquaName,
          desc: t.gameAquaDesc
        },
        {
          type: 'pyro',
          name: t.gamePyroName,
          desc: t.gamePyroDesc
        }
      ];
      var html =
        '<section class="section"><div class="container">' +
          '<div class="page-head">' +
            '<h1>' + esc(t.productsTitle) + '</h1>' +
            '<p>' + esc(t.productsSubtitle) + '</p>' +
          '</div>' +
          '<div class="product-grid">';
      cards.forEach(function (c) {
        html +=
          '<a class="product-card detail-card-link" href="#/products?game=' + c.type + '">' +
            '<img class="game-preview" src="assets/game-' + c.type + '.webp" width="683" height="500" alt="">' +
            '<h3>' + esc(c.name) + '</h3>' +
            '<p>' + esc(c.desc) + '</p>' +
            '<span class="btn btn-green">' + esc(t.startDemo) + ' <span aria-hidden="true">→</span></span>' +
          '</a>';
      });
      html += '</div></div></section>';
      ctx.viewEl.innerHTML = html;
      ctx.setTitle(t.productsTitle);
      ctx.explainView();
    }

    return { render: render };
  };
})();
