svg.addEventListener("pointerdown", (e) => {
  const g = e.target.closest("g.item");
  const rawId = g?.dataset?.id ?? null;

  const itemByRaw =
    rawId != null ? state.items.find((it) => String(it.id) === String(rawId)) : null;

  const targetId =
    itemByRaw?.id ?? (e.target.classList.contains("grip") ? state.selectedId : null);

  if (!targetId) {
    // 空白クリック → 矩形選択開始など
    state.selectedId = null;
    state.interaction = null;
    return;
  }

  // ★ここを修正：selectedId が null でも選択できるようにする
  if (state.selectedId !== targetId) {
    selectItem(state, targetId, onUpdate);
    render();
    return;
  }

  // 以下は既存の move/resize/rotate 処理
  e.preventDefault();
  const { x, y } = getSvgPoint(e, svg);
  state.interaction = {
    type: "pending",
    id: targetId,
    startTarget: e.target,
    startX: x,
    startY: y,
    lastX: x,
    lastY: y,
    pending: false,
    started: false,
  };
}, { passive: false });
