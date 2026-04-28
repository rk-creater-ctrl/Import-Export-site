// script.js

function openContactForm() {
  window.location.href = "contact.html";
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("products-container");
  const modal = document.getElementById("productModal");
  const closeBtn = document.querySelector(".close-modal");

  async function loadProducts() {
    if (!container) return;

    try {
      const res = await fetch("/api/products");
      const products = await res.json();

      container.innerHTML = "";

      if (!Array.isArray(products) || products.length === 0) {
        container.innerHTML = "<div class='theme-card'>No products yet.</div>";
        return;
      }

      products.forEach((prod, index) => {
        const card = document.createElement("div");
        card.className = "theme-card cursor-pointer flex flex-col";
        card.dataset.id = prod.id;

        const shortDesc =
          prod.description && prod.description.length > 100
            ? prod.description.slice(0, 100) + "..."
            : prod.description || "Click to view full details.";

        card.innerHTML = `
          <div class="w-full h-40 mb-3 rounded-lg overflow-hidden border border-yellow-300 bg-gray-100">
            <img
              src="${prod.image || "https://via.placeholder.com/400x300?text=Product"}"
              alt="${prod.title}"
              class="w-full h-full object-cover"
            />
          </div>

          <h3 class="section-title text-lg mb-1">${prod.title}</h3>
          <p class="text-xs font-semibold text-red-700 mb-1">
            ${prod.category || "Category"}
          </p>
          <p class="text-sm text-gray-700 mb-3">
            ${shortDesc}
          </p>

          <button class="btn btn-primary mt-auto open-modal">
            View Details
          </button>
        `;

        container.appendChild(card);
      });

      attachModalEvents(products);
    } catch (err) {
      console.error(err);
      container.innerHTML =
        "<div class='theme-card'>Error loading products. Please try again.</div>";
    }
  }

  function attachModalEvents(products) {
    const buttons = document.querySelectorAll(".open-modal");

    buttons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const card = btn.closest(".theme-card");
        const id = Number(card.dataset.id);
        const prod = products.find((p) => p.id === id);
        if (!prod) return;

        document.getElementById("productTitle").textContent = prod.title;
        document
          .getElementById("productCategory")
          .querySelector("span").textContent = prod.category || "";
        document
          .getElementById("productDescription")
          .querySelector("span").textContent = prod.description || "";
        document
          .getElementById("productOrigin")
          .querySelector("span").textContent = prod.origin || "";
        document
          .getElementById("productPacking")
          .querySelector("span").textContent = prod.packing || "";
        document
          .getElementById("productCert")
          .querySelector("span").textContent = prod.certification || "";
        document.getElementById("productImage").src =
          prod.image ||
          "https://via.placeholder.com/400x300?text=Product";

        modal.style.display = "flex";
      });
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    });
  }

  loadProducts();
});