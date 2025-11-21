//PreviewLine.js

export function renderPreviewLine(svg, previewLine, state) {
  if (state.mode === "draw-line" && state.tempLine && state.tempLine.x1 != null && state.tempLine.x2 != null) {
    if (!previewLine) {
      previewLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      previewLine.setAttribute("class", "preview");
      previewLine.setAttribute("stroke", "#999");
      previewLine.setAttribute("stroke-dasharray", "4");
      svg.appendChild(previewLine);
    }
    previewLine.setAttribute("x1", state.tempLine.x1);
    previewLine.setAttribute("y1", state.tempLine.y1);
    previewLine.setAttribute("x2", state.tempLine.x2);
    previewLine.setAttribute("y2", state.tempLine.y2);
  } else {
    if (previewLine) {
      svg.removeChild(previewLine);
      previewLine = null;
    }
  }
  return previewLine;
}
