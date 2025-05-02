// script.js
const form = document.getElementById("uploadForm");
const contenedor = document.getElementById("contenedor");
const hamburger = document.getElementById("hamburger");
const formulario = document.getElementById("formulario");
const idxInput = document.getElementById("idx");
const cancelEdit = document.getElementById("cancelEdit");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const closeLB = document.getElementById("closeLightbox");

let datos = JSON.parse(localStorage.getItem("fotos")) || [];

// Mostrar/ocultar formulario
hamburger.addEventListener("click", () => {
  formulario.classList.toggle("open");
});

// Cancelar edición
cancelEdit.addEventListener("click", () => {
  form.reset();
  idxInput.value = "";
});

// Lógica submit (nuevo o edición)
form.addEventListener("submit", async e => {
  e.preventDefault();
  const titulo = document.getElementById("titulo").value;
  const fecha = document.getElementById("fecha").value;
  const descripcion = document.getElementById("descripcion").value;
  const archivo = document.getElementById("imagen").files[0];
  let urlImagen = null;

  // Si sube nueva imagen
  if (archivo) {
    const formData = new FormData();
    formData.append("image", archivo);
    const resp = await fetch("https://api.imgur.com/3/image", {
      method: "POST",
      headers: { Authorization: `Client-ID cb316309426f2fc` },
      body: formData
    });
    const data = await resp.json();
    urlImagen = data.data.link;
  }

  const entrada = { titulo, fecha, descripcion };
  const idx = idxInput.value;
  if (idx !== "") { // edición
    if (urlImagen) entrada.urlImagen = urlImagen;
    datos[idx] = { ...datos[idx], ...entrada };
  } else { // nueva
    entrada.urlImagen = urlImagen;
    datos.push(entrada);
  }

  localStorage.setItem("fotos", JSON.stringify(datos));
  form.reset();
  idxInput.value = "";
  mostrarLineaDeTiempo();
});

// Renderizar tarjetas
function mostrarLineaDeTiempo() {
  contenedor.innerHTML = "";
  datos.sort((a,b)=> new Date(b.fecha) - new Date(a.fecha))
       .forEach((item,i) => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <h3>${item.titulo}</h3>
      <small>${item.fecha}</small>
      <p>${item.descripcion||""}</p>
      <img src="${item.urlImagen}" alt="${item.titulo}" data-idx="${i}" />
      <div class="acciones">
        <button class="edit" data-idx="${i}">Editar</button>
        <button class="delete" data-idx="${i}">Eliminar</button>
      </div>
    `;
    contenedor.appendChild(div);
  });
  agregaEventos();
}

// Botones editar/borrar e imagen
function agregaEventos() {
  // Lightbox
  contenedor.querySelectorAll("img").forEach(img => {
    img.addEventListener("click", () => {
      lightboxImg.src = img.src;
      lightbox.classList.remove("hidden");
    });
  });
  closeLB.addEventListener("click", () => {
    lightbox.classList.add("hidden");
  });
  // Editar
  contenedor.querySelectorAll(".edit").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = btn.dataset.idx;
      const item = datos[i];
      document.getElementById("titulo").value = item.titulo;
      document.getElementById("fecha").value = item.fecha;
      document.getElementById("descripcion").value = item.descripcion;
      idxInput.value = i;
      formulario.classList.add("open");
    });
  });
  // Eliminar
  contenedor.querySelectorAll(".delete").forEach(btn => {
    btn.addEventListener("click", () => {
      if (confirm("¿Eliminar esta entrada?")) {
        datos.splice(btn.dataset.idx,1);
        localStorage.setItem("fotos", JSON.stringify(datos));
        mostrarLineaDeTiempo();
      }
    });
  });
}

// Iniciar
mostrarLineaDeTiempo();
