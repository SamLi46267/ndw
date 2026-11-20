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
        window.NDGames.start(cv, g, T());
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
