(function () {
  "use strict";

  const SUITS = ["♠", "♥", "♦", "♣"];
  const RANKS = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

  /** Черва ♥ (1) та бубна ♦ (2) — «червоні» масті; піка ♠ (0) та трефа ♣ (3) — чорні */
  function isRed(suit) {
    return suit === 1 || suit === 2;
  }

  function shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = deck[i];
      deck[i] = deck[j];
      deck[j] = t;
    }
    return deck;
  }

  function createDeck() {
    const deck = [];
    for (let s = 0; s < 4; s++) {
      for (let r = 1; r <= 13; r++) {
        deck.push({ suit: s, rank: r, faceUp: false });
      }
    }
    return deck;
  }

  function validRun(pile, fromIdx) {
    for (let i = fromIdx; i < pile.length - 1; i++) {
      const a = pile[i];
      const b = pile[i + 1];
      if (!a.faceUp || !b.faceUp) {
        return false;
      }
      if (b.rank !== a.rank - 1) {
        return false;
      }
      if (isRed(a.suit) === isRed(b.suit)) {
        return false;
      }
    }
    return true;
  }

  function canDropOnTableau(dest, stackBottom) {
    if (dest.length === 0) {
      return stackBottom.rank === 13;
    }
    const top = dest[dest.length - 1];
    if (!top.faceUp) {
      return false;
    }
    return top.rank === stackBottom.rank + 1 && isRed(top.suit) !== isRed(stackBottom.suit);
  }

  function canDropOnFoundation(top, card) {
    if (!top) {
      return card.rank === 1;
    }
    return top.suit === card.suit && card.rank === top.rank + 1;
  }

  let state = {
    tableau: [[], [], [], [], [], [], []],
    foundations: [[], [], [], []],
    stock: [],
    waste: [],
  };

  let selected = null;
  let rootEl = null;
  let winEl = null;
  let boardEventsBound = false;

  function clearSelection() {
    selected = null;
  }

  function flipTableauTop(pile) {
    const n = pile.length;
    if (n > 0 && !pile[n - 1].faceUp) {
      pile[n - 1].faceUp = true;
    }
  }

  function deal() {
    const deck = shuffle(createDeck());
    let idx = 0;
    const tableau = [[], [], [], [], [], [], []];
    for (let p = 0; p < 7; p++) {
      for (let i = 0; i <= p; i++) {
        const c = deck[idx++];
        c.faceUp = i === p;
        tableau[p].push(c);
      }
    }
    state = {
      tableau,
      foundations: [[], [], [], []],
      stock: deck.slice(idx),
      waste: [],
    };
    clearSelection();
  }

  function topWaste() {
    const w = state.waste;
    return w.length ? w[w.length - 1] : null;
  }

  function moveWasteToFoundation() {
    if (state.waste.length === 0) {
      return false;
    }
    const card = state.waste[state.waste.length - 1];
    for (let f = 0; f < 4; f++) {
      const pile = state.foundations[f];
      const top = pile.length ? pile[pile.length - 1] : null;
      if (canDropOnFoundation(top, card)) {
        pile.push(state.waste.pop());
        clearSelection();
        return true;
      }
    }
    return false;
  }

  function moveTableauTopToFoundation(p) {
    const pile = state.tableau[p];
    if (pile.length === 0) {
      return false;
    }
    const card = pile[pile.length - 1];
    if (!card.faceUp) {
      return false;
    }
    for (let f = 0; f < 4; f++) {
      const fp = state.foundations[f];
      const top = fp.length ? fp[fp.length - 1] : null;
      if (canDropOnFoundation(top, card)) {
        fp.push(pile.pop());
        flipTableauTop(pile);
        clearSelection();
        return true;
      }
    }
    return false;
  }

  function drawStock() {
    if (state.stock.length > 0) {
      const c = state.stock.pop();
      c.faceUp = true;
      state.waste.push(c);
      clearSelection();
      return;
    }
    if (state.waste.length > 0) {
      while (state.waste.length) {
        const c = state.waste.pop();
        c.faceUp = false;
        state.stock.push(c);
      }
      clearSelection();
    }
  }

  function moveSelectionToTableau(destP) {
    if (!selected) {
      return false;
    }
    if (selected.type === "tableau" && selected.pile === destP) {
      return false;
    }
    const dest = state.tableau[destP];

    if (selected.type === "waste") {
      const card = topWaste();
      if (!card || !canDropOnTableau(dest, card)) {
        return false;
      }
      dest.push(state.waste.pop());
      clearSelection();
      return true;
    }

    if (selected.type === "tableau") {
      const src = state.tableau[selected.pile];
      const from = selected.fromIdx;
      const stack = src.slice(from);
      if (stack.length === 0 || !canDropOnTableau(dest, stack[0])) {
        return false;
      }
      src.splice(from, stack.length);
      for (let i = 0; i < stack.length; i++) {
        dest.push(stack[i]);
      }
      flipTableauTop(src);
      clearSelection();
      return true;
    }

    return false;
  }

  function moveSelectionToFoundation(f) {
    if (!selected) {
      return false;
    }
    const fp = state.foundations[f];
    const top = fp.length ? fp[fp.length - 1] : null;

    if (selected.type === "waste") {
      const card = topWaste();
      if (!card || !canDropOnFoundation(top, card)) {
        return false;
      }
      fp.push(state.waste.pop());
      clearSelection();
      return true;
    }

    if (selected.type === "tableau") {
      const src = state.tableau[selected.pile];
      const from = selected.fromIdx;
      if (from !== src.length - 1) {
        return false;
      }
      const card = src[src.length - 1];
      if (!canDropOnFoundation(top, card)) {
        return false;
      }
      fp.push(src.pop());
      flipTableauTop(src);
      clearSelection();
      return true;
    }

    return false;
  }

  function isWin() {
    return state.foundations.every(function (f) {
      return f.length === 13;
    });
  }

  function flashInvalid() {
    if (!rootEl) {
      return;
    }
    const b = rootEl.querySelector(".solitaire-board");
    if (!b) {
      return;
    }
    b.classList.remove("solitaire-board--invalid");
    void b.offsetWidth;
    b.classList.add("solitaire-board--invalid");
    window.setTimeout(function () {
      b.classList.remove("solitaire-board--invalid");
    }, 420);
  }

  function handleTableauClick(p, cardIdx) {
    const pile = state.tableau[p];
    const c = pile[cardIdx];
    if (!c.faceUp) {
      return;
    }

    if (
      selected &&
      selected.type === "tableau" &&
      selected.pile === p &&
      selected.fromIdx === cardIdx &&
      cardIdx === pile.length - 1
    ) {
      if (moveTableauTopToFoundation(p)) {
        render();
        checkWinRender();
        return;
      }
      clearSelection();
      render();
      return;
    }

    if (
      selected &&
      selected.type === "tableau" &&
      selected.pile === p &&
      cardIdx >= selected.fromIdx
    ) {
      clearSelection();
      render();
      return;
    }

    if (selected) {
      if (pile.length > 0 && cardIdx !== pile.length - 1) {
        clearSelection();
        if (validRun(pile, cardIdx)) {
          selected = { type: "tableau", pile: p, fromIdx: cardIdx };
        }
        render();
        return;
      }
      if (moveSelectionToTableau(p)) {
        render();
        checkWinRender();
      } else {
        flashInvalid();
        clearSelection();
        render();
      }
      return;
    }

    if (!validRun(pile, cardIdx)) {
      return;
    }

    selected = { type: "tableau", pile: p, fromIdx: cardIdx };
    render();
  }

  function handleWasteClick() {
    if (!topWaste()) {
      return;
    }
    if (selected && selected.type === "waste") {
      if (moveWasteToFoundation()) {
        render();
        checkWinRender();
        return;
      }
      clearSelection();
    } else {
      selected = { type: "waste" };
    }
    render();
  }

  function handleFoundationClick(f) {
    if (!selected) {
      return;
    }
    if (moveSelectionToFoundation(f)) {
      render();
      checkWinRender();
    } else {
      flashInvalid();
      clearSelection();
      render();
    }
  }

  function handleEmptyTableauClick(p) {
    if (!selected || state.tableau[p].length !== 0) {
      return;
    }
    if (moveSelectionToTableau(p)) {
      render();
      checkWinRender();
    } else {
      flashInvalid();
      clearSelection();
      render();
    }
  }

  function checkWinRender() {
    if (!winEl) {
      return;
    }
    if (isWin()) {
      winEl.hidden = false;
      winEl.textContent = "Усі карти в домі — ти чарівниця. ♥";
    } else {
      winEl.hidden = true;
    }
  }

  function inSelectedTableauStack(p, idx) {
    return (
      selected &&
      selected.type === "tableau" &&
      selected.pile === p &&
      idx >= selected.fromIdx
    );
  }

  function isSelWaste() {
    return selected && selected.type === "waste" && state.waste.length > 0;
  }

  function faceCardContent(c) {
    const rank = RANKS[c.rank];
    const suit = SUITS[c.suit];
    return (
      '<span class="solitaire-card__corner solitaire-card__corner--tl">' +
      '<span class="solitaire-card__corner-rank">' +
      rank +
      '</span><span class="solitaire-card__corner-suit">' +
      suit +
      "</span></span>" +
      '<span class="solitaire-card__center-suit" aria-hidden="true">' +
      suit +
      "</span>" +
      '<span class="solitaire-card__corner solitaire-card__corner--br">' +
      '<span class="solitaire-card__corner-rank">' +
      rank +
      '</span><span class="solitaire-card__corner-suit">' +
      suit +
      "</span></span>"
    );
  }

  function render() {
    if (!rootEl) {
      return;
    }

    const narrow =
      typeof window !== "undefined" && window.matchMedia("(max-width: 520px)").matches;
    const step = narrow ? 17 : 22;
    let html = '<div class="solitaire-board-wrap"><div class="solitaire-board" id="solitaireBoard">';

    html += '<div class="solitaire-row solitaire-row--top">';
    html += '<div class="solitaire-stockwaste">';
    const stockShowsPile = state.stock.length > 0 || state.waste.length > 0;
    const w = state.waste;
    html +=
      '<div class="solitaire-slot' + (stockShowsPile ? "" : " solitaire-slot--empty") + '">';
    if (stockShowsPile) {
      html +=
        '<div class="solitaire-card solitaire-card--back" data-action="stock" style="top:0;z-index:1" role="button" tabindex="0" aria-label="Колода"></div>';
    }
    html += "</div>";
    html +=
      '<div class="solitaire-slot solitaire-slot--waste' +
      (w.length > 0 ? "" : " solitaire-slot--empty") +
      '">';
    if (w.length > 0) {
      const c = w[w.length - 1];
      const sel = isSelWaste()
        ? ' solitaire-card--selected'
        : "";
      const suitTone = isRed(c.suit) ? " solitaire-card--pink" : " solitaire-card--black";
      html +=
        '<div class="solitaire-card solitaire-card--face' +
        suitTone +
        sel +
        '" style="top:0;z-index:2" data-action="waste" role="button" tabindex="0" aria-label="Відкрита карта з колоди">' +
        faceCardContent(c) +
        "</div>";
    }
    html += "</div></div>";

    html += '<div class="solitaire-spacer" aria-hidden="true"></div>';

    html += '<div class="solitaire-foundations">';
    for (let f = 0; f < 4; f++) {
      const fp = state.foundations[f];
      html +=
        '<div class="solitaire-slot solitaire-slot--foundation' +
        (fp.length === 0 ? " solitaire-slot--empty" : "") +
        '" data-f="' +
        f +
        '">';
      if (fp.length > 0) {
        const c = fp[fp.length - 1];
        const suitTone = isRed(c.suit) ? " solitaire-card--pink" : " solitaire-card--black";
        html +=
          '<div class="solitaire-card solitaire-card--face' +
          suitTone +
          '" style="top:0;z-index:1" data-action="foundation-top" data-f="' +
          f +
          '" role="button" tabindex="0">' +
          faceCardContent(c) +
          "</div>";
      }
      html += "</div>";
    }
    html += "</div></div>";

    html += '<div class="solitaire-tableau-row">';
    for (let p = 0; p < 7; p++) {
      const pile = state.tableau[p];
      html += '<div class="solitaire-tableau" data-p="' + p + '">';
      let topPx = 0;
      for (let i = 0; i < pile.length; i++) {
        const c = pile[i];
        let z = i + 1;
        if (!c.faceUp) {
          html +=
            '<div class="solitaire-card solitaire-card--back" style="top:' +
            topPx +
            "px;z-index:" +
            z +
            '" data-p="' +
            p +
            '" data-i="' +
            i +
            '" aria-hidden="true"></div>';
          topPx += Math.round(step * 0.45);
        } else {
          const sel = inSelectedTableauStack(p, i) ? " solitaire-card--selected" : "";
          const suitTone = isRed(c.suit) ? " solitaire-card--pink" : " solitaire-card--black";
          if (inSelectedTableauStack(p, i)) {
            z = 35 + i;
          }
          html +=
            '<div class="solitaire-card solitaire-card--face' +
            suitTone +
            sel +
            '" style="top:' +
            topPx +
            "px;z-index:" +
            z +
            '" data-p="' +
            p +
            '" data-i="' +
            i +
            '" role="button" tabindex="0">' +
            faceCardContent(c) +
            "</div>";
          topPx += step;
        }
      }
      if (pile.length === 0) {
        html +=
          '<div class="solitaire-tableau-empty solitaire-drop-cell" data-empty-p="' +
          p +
          '" role="button" tabindex="0" aria-label="Порожня колона — місце для карти"></div>';
      }
      html += "</div>";
    }
    html += "</div>";

    html += "</div></div>";
    html += '<div class="solitaire-win" id="solitaireWinBanner" hidden></div>';
    rootEl.innerHTML = html;

    winEl = document.getElementById("solitaireWinBanner");
    checkWinRender();
  }

  function onBoardClick(e) {
    if (!rootEl || !rootEl.contains(e.target)) {
      return;
    }

    const stockEl = e.target.closest("[data-action='stock']");
    if (stockEl) {
      drawStock();
      render();
      checkWinRender();
      return;
    }

    const wasteEl = e.target.closest("[data-action='waste']");
    if (wasteEl) {
      handleWasteClick();
      return;
    }

    const fTop = e.target.closest("[data-action='foundation-top']");
    if (fTop) {
      handleFoundationClick(parseInt(fTop.getAttribute("data-f"), 10));
      return;
    }

    const emptyT = e.target.closest(".solitaire-tableau-empty");
    if (emptyT) {
      handleEmptyTableauClick(parseInt(emptyT.getAttribute("data-empty-p"), 10));
      return;
    }

    const fSlot = e.target.closest(".solitaire-slot--foundation");
    if (fSlot && !e.target.closest("[data-action='foundation-top']")) {
      const fi = parseInt(fSlot.getAttribute("data-f"), 10);
      if (state.foundations[fi].length === 0) {
        handleFoundationClick(fi);
      }
      return;
    }

    const tabCard = e.target.closest(".solitaire-card[data-p][data-i]");
    if (tabCard && !tabCard.classList.contains("solitaire-card--back")) {
      const p = parseInt(tabCard.getAttribute("data-p"), 10);
      const i = parseInt(tabCard.getAttribute("data-i"), 10);
      handleTableauClick(p, i);
      return;
    }
  }

  function onBoardDblClick(e) {
    if (!rootEl || !rootEl.contains(e.target)) {
      return;
    }
    e.preventDefault();

    const wasteEl = e.target.closest("[data-action='waste']");
    if (wasteEl) {
      if (moveWasteToFoundation()) {
        render();
        checkWinRender();
      } else {
        clearSelection();
        render();
      }
      return;
    }

    const tabCard = e.target.closest(".solitaire-card--face[data-p][data-i]");
    if (tabCard && !tabCard.hasAttribute("data-action")) {
      const p = parseInt(tabCard.getAttribute("data-p"), 10);
      const i = parseInt(tabCard.getAttribute("data-i"), 10);
      const pile = state.tableau[p];
      if (i === pile.length - 1 && pile[i] && pile[i].faceUp) {
        clearSelection();
        if (moveTableauTopToFoundation(p)) {
          render();
          checkWinRender();
        } else {
          render();
        }
      }
    }
  }

  function onBoardKeydown(e) {
    if (e.key !== "Enter" && e.key !== " ") {
      return;
    }
    const t = e.target;
    if (t.classList && t.classList.contains("solitaire-tableau-empty")) {
      e.preventDefault();
      handleEmptyTableauClick(parseInt(t.getAttribute("data-empty-p"), 10));
      return;
    }
    if (!t.classList || !t.classList.contains("solitaire-card")) {
      return;
    }
    e.preventDefault();
    t.click();
  }

  function mount(root) {
    rootEl = root;
    if (!boardEventsBound) {
      boardEventsBound = true;
      rootEl.addEventListener("click", onBoardClick);
      rootEl.addEventListener("dblclick", onBoardDblClick);
      rootEl.addEventListener("keydown", onBoardKeydown);
    }
    deal();
    render();
  }

  function newGame() {
    deal();
    render();
  }

  function openOverlay(overlay) {
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("solitaire-active");
  }

  function closeOverlay(overlay) {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("solitaire-active");
    clearSelection();
  }

  function init() {
    const overlay = document.getElementById("solitaireOverlay");
    const openBtn = document.getElementById("solitaireOpen");
    const closeBtn = document.getElementById("solitaireClose");
    const newBtn = document.getElementById("solitaireNew");
    const root = document.getElementById("solitaireRoot");

    if (!overlay || !openBtn || !root) {
      return;
    }

    let mounted = false;

    openBtn.addEventListener("click", function () {
      openOverlay(overlay);
      if (!mounted) {
        mount(root);
        mounted = true;
      } else {
        render();
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        closeOverlay(overlay);
      });
    }

    if (newBtn) {
      newBtn.addEventListener("click", function () {
        if (mounted) {
          newGame();
        }
      });
    }

    let resizeTimer = null;
    function onViewportChange() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        if (mounted && overlay.classList.contains("is-open")) {
          render();
        }
      }, 120);
    }
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("orientationchange", onViewportChange);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
