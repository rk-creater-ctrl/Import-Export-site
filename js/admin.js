// admin.js

document.addEventListener("DOMContentLoaded", () => {
  // ================== PRODUCT ADMIN ==================
  const inputTitle = document.getElementById("inputTitle");
  const inputCategory = document.getElementById("inputCategory");
  const inputDesc = document.getElementById("inputDesc");
  const inputOrigin = document.getElementById("inputOrigin");
  const inputPacking = document.getElementById("inputPacking");
  const inputCert = document.getElementById("inputCert");
  const inputImageUpload = document.getElementById("inputImageUpload");
  const inputImageUrl = document.getElementById("inputImageUrl");
  const previewImage = document.getElementById("previewImage");

  const btnCreate = document.getElementById("btnCreate");
  const btnUpdate = document.getElementById("btnUpdate");
  const btnCancelEdit = document.getElementById("btnCancelEdit");
  const productList = document.getElementById("productList");

  let products = [];
  let editingProductId = null;

  async function loadProducts() {
    if (!productList) return;
    productList.innerHTML = "<li>Loading…</li>";

    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      products = Array.isArray(data) ? data : [];

      if (!products.length) {
        productList.innerHTML = "<li>No products yet.</li>";
        return;
      }

      productList.innerHTML = "";
      products.forEach((p) => {
        const li = document.createElement("li");
        li.className = "admin-item";

        li.innerHTML = `
          <div class="admin-item-main">
            <strong>${p.title}</strong>
            <span class="text-xs text-gray-600 ml-2">
              (${p.category || "Uncategorized"})
            </span>
          </div>
          <div class="admin-item-actions">
            <button class="btn btn-primary btn-edit" data-id="${p.id}">Edit</button>
            <button class="btn btn-danger btn-delete" data-id="${p.id}">Delete</button>
          </div>
        `;

        productList.appendChild(li);
      });

      attachProductActionEvents();
    } catch (err) {
      console.error(err);
      productList.innerHTML = "<li>Error loading products.</li>";
    }
  }

  function resetProductForm() {
    editingProductId = null;
    inputTitle.value = "";
    inputCategory.value = "";
    inputDesc.value = "";
    inputOrigin.value = "";
    inputPacking.value = "";
    inputCert.value = "";
    inputImageUpload.value = "";
    inputImageUrl.value = "";
    previewImage.src = "";
    previewImage.style.display = "none";

    btnCreate.style.display = "inline-block";
    btnUpdate.style.display = "none";
    btnCancelEdit.style.display = "none";
  }

  function setProductEditMode(product) {
    editingProductId = product.id;
    inputTitle.value = product.title || "";
    inputCategory.value = product.category || "";
    inputDesc.value = product.description || "";
    inputOrigin.value = product.origin || "";
    inputPacking.value = product.packing || "";
    inputCert.value = product.certification || "";
    inputImageUrl.value = product.image || "";

    if (product.image) {
      previewImage.src = product.image;
      previewImage.style.display = "block";
    } else {
      previewImage.src = "";
      previewImage.style.display = "none";
    }

    btnCreate.style.display = "none";
    btnUpdate.style.display = "inline-block";
    btnCancelEdit.style.display = "inline-block";
  }

  function attachProductActionEvents() {
    const editBtns = document.querySelectorAll(".btn-edit");
    const deleteBtns = document.querySelectorAll(".btn-delete");

    editBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        const product = products.find((p) => p.id === id);
        if (product) setProductEditMode(product);
      });
    });

    deleteBtns.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = Number(btn.dataset.id);
        if (!confirm("Delete this product?")) return;

        try {
          const res = await fetch(`/api/products/${id}`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (!res.ok) {
            console.error(data);
            alert(data.error || "Failed to delete product.");
            return;
          }
          alert("Product deleted.");
          loadProducts();
          resetProductForm();
        } catch (err) {
          console.error(err);
          alert("Error deleting product.");
        }
      });
    });
  }

  // Preview product image when selecting a file
  if (inputImageUpload) {
    inputImageUpload.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) {
        previewImage.style.display = "none";
        previewImage.src = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        previewImage.src = ev.target.result;
        previewImage.style.display = "block";
      };
      reader.readAsDataURL(file);
    });
  }

  async function uploadProductImageIfNeeded() {
    const file = inputImageUpload.files[0];
    if (!file) return null; // no file selected

    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      console.error(data);
      throw new Error(data.error || "Failed to upload image");
    }
    return data.imageUrl;
  }

  async function createOrUpdateProduct(isUpdate = false) {
    const title = inputTitle.value.trim();
    const category = inputCategory.value.trim();
    const description = inputDesc.value.trim();

    if (!title || !category || !description) {
      alert("Title, Category and Description are required.");
      return;
    }

    try {
      let imageUrl = inputImageUrl.value.trim();

      // If a new file is chosen, upload it
      if (inputImageUpload.files[0]) {
        const uploadedPath = await uploadProductImageIfNeeded();
        if (uploadedPath) imageUrl = uploadedPath;
      }

      if (!imageUrl) {
        alert("Please upload an image or paste an image URL.");
        return;
      }

      const payload = {
        title,
        category,
        description,
        origin: inputOrigin.value.trim(),
        packing: inputPacking.value.trim(),
        certification: inputCert.value.trim(),
        image: imageUrl,
      };

      let url = "/api/products";
      let method = "POST";

      if (isUpdate && editingProductId != null) {
        url = `/api/products/${editingProductId}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error(data);
        alert(data.error || "Failed to save product.");
        return;
      }

      alert(isUpdate ? "Product updated successfully!" : "Product added successfully!");
      resetProductForm();
      loadProducts();
    } catch (err) {
      console.error(err);
      alert("Something went wrong while saving product.");
    }
  }

  if (btnCreate) {
    btnCreate.addEventListener("click", () => createOrUpdateProduct(false));
  }
  if (btnUpdate) {
    btnUpdate.addEventListener("click", () => createOrUpdateProduct(true));
  }
  if (btnCancelEdit) {
    btnCancelEdit.addEventListener("click", () => resetProductForm());
  }

  loadProducts();

  // ================== GALLERY ADMIN ==================
  const galleryTitleInput = document.getElementById("galleryTitle");
  const galleryImageInput = document.getElementById("galleryImageUpload");
  const galleryPreview = document.getElementById("galleryPreview");
  const btnGalleryAdd = document.getElementById("btnGalleryAdd");
  const galleryList = document.getElementById("galleryList");

  let galleryItems = [];
  let editingGalleryId = null;

  async function loadGallery() {
    if (!galleryList) return;
    galleryList.innerHTML = "<li>Loading…</li>";

    try {
      const res = await fetch("/api/gallery");
      const data = await res.json();
      galleryItems = Array.isArray(data) ? data : [];

      if (!galleryItems.length) {
        galleryList.innerHTML = "<li>No gallery images yet.</li>";
        return;
      }

      galleryList.innerHTML = "";
      galleryItems.forEach((g) => {
        const li = document.createElement("li");
        li.className = "admin-item";

        li.innerHTML = `
          <div class="flex items-center gap-3">
            <img src="${g.image}" alt="${g.title || ""}" style="width:60px; height:60px; object-fit:cover; border-radius:8px;" />
            <div>
              <strong>${g.title || "(No title)"}</strong><br />
              <span style="font-size:12px; color:#666;">ID: ${g.id}</span>
            </div>
          </div>
          <div class="admin-item-actions">
            <button class="btn btn-primary btn-gallery-edit" data-id="${g.id}">Edit</button>
            <button class="btn btn-danger btn-gallery-delete" data-id="${g.id}">Delete</button>
          </div>
        `;

        galleryList.appendChild(li);
      });

      attachGalleryActionEvents();
    } catch (err) {
      console.error(err);
      galleryList.innerHTML = "<li>Error loading gallery.</li>";
    }
  }

  function resetGalleryForm() {
    editingGalleryId = null;
    if (galleryTitleInput) galleryTitleInput.value = "";
    if (galleryImageInput) galleryImageInput.value = "";
    if (galleryPreview) {
      galleryPreview.src = "";
      galleryPreview.style.display = "none";
    }
    if (btnGalleryAdd) btnGalleryAdd.textContent = "Add to Gallery";
  }

  // Preview selected gallery image
  if (galleryImageInput && galleryPreview) {
    galleryImageInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) {
        galleryPreview.style.display = "none";
        galleryPreview.src = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        galleryPreview.src = ev.target.result;
        galleryPreview.style.display = "block";
      };
      reader.readAsDataURL(file);
    });
  }

  function attachGalleryActionEvents() {
    const editBtns = document.querySelectorAll(".btn-gallery-edit");
    const deleteBtns = document.querySelectorAll(".btn-gallery-delete");

    editBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        const item = galleryItems.find((g) => g.id === id);
        if (!item) return;

        editingGalleryId = id;
        if (galleryTitleInput) galleryTitleInput.value = item.title || "";
        if (galleryPreview) {
          galleryPreview.src = item.image;
          galleryPreview.style.display = "block";
        }
        if (galleryImageInput) galleryImageInput.value = "";
        if (btnGalleryAdd) btnGalleryAdd.textContent = "Update Gallery Item";
      });
    });

    deleteBtns.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = Number(btn.dataset.id);
        if (!confirm("Delete this gallery image?")) return;

        try {
          const res = await fetch(`/api/gallery/${id}`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (!res.ok) {
            console.error(data);
            alert(data.error || "Failed to delete gallery item.");
            return;
          }
          alert("Gallery image deleted.");
          resetGalleryForm();
          loadGallery();
        } catch (err) {
          console.error(err);
          alert("Error deleting gallery item.");
        }
      });
    });
  }

  if (btnGalleryAdd) {
    btnGalleryAdd.addEventListener("click", async () => {
      // If editing: only update title
      if (editingGalleryId != null) {
        try {
          const title = (galleryTitleInput?.value || "").trim();
          const res = await fetch(`/api/gallery/${editingGalleryId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title }),
          });
          const data = await res.json();
          if (!res.ok) {
            console.error(data);
            alert(data.error || "Failed to update gallery item.");
            return;
          }
          alert("Gallery item updated.");
          resetGalleryForm();
          loadGallery();
        } catch (err) {
          console.error(err);
          alert("Error updating gallery item.");
        }
        return;
      }

      // Else: Add new gallery item
      const file = galleryImageInput?.files[0];
      if (!file) {
        alert("Please select an image for gallery.");
        return;
      }

      try {
        const formData = new FormData();
        formData.append("image", file);

        const uploadRes = await fetch("/api/gallery/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          console.error(uploadData);
          alert(uploadData.error || "Failed to upload gallery image.");
          return;
        }

        const imageUrl = uploadData.imageUrl;
        const title = (galleryTitleInput?.value || "").trim();

        const createRes = await fetch("/api/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, image: imageUrl }),
        });
        const newItem = await createRes.json();
        if (!createRes.ok) {
          console.error(newItem);
          alert(newItem.error || "Failed to save gallery item.");
          return;
        }

        alert("Gallery image added successfully!");
        resetGalleryForm();
        loadGallery();
      } catch (err) {
        console.error(err);
        alert("Something went wrong while adding gallery image.");
      }
    });
  }

  loadGallery();
});