// gallery.js
document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("gallery-grid");
  if (!grid) return;

  try {
    const res = await fetch("/api/gallery");
    const items = await res.json();

    grid.innerHTML = "";

    if (!Array.isArray(items) || items.length === 0) {
      grid.innerHTML = "<p>No gallery images yet.</p>";
      return;
    }

    items.forEach((item) => {
      const div = document.createElement("div");
      div.className = "gallery-item";
      div.style.backgroundImage = `url('${item.image}')`;
      if (item.title) {
        div.title = item.title;
      }
      grid.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    grid.innerHTML = "<p>Error loading gallery.</p>";
  }
});