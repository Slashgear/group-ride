function transformMermaid(tree) {
  if (!tree.children) return
  for (let i = 0; i < tree.children.length; i++) {
    const child = tree.children[i]
    if (child.type === "code" && child.lang === "mermaid") {
      tree.children[i] = {
        type: "html",
        value: `<div class="mermaid-diagram"><pre class="mermaid">${child.value}</pre></div>`,
      }
    } else {
      transformMermaid(child)
    }
  }
}

export function remarkMermaid() {
  return transformMermaid
}
