document.addEventListener("DOMContentLoaded", () => {
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

  // Registro del Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js')
        .then(reg => {
          console.log('✅ ServiceWorker registrado:', reg.scope);
        })
        .catch(err => {
          console.error('❌ Error al registrar ServiceWorker:', err);
        });
    });
  }

  // Botón para instalar la app
  let deferredPrompt;
  const installButton = document.createElement('div');
  installButton.id = 'installPrompt';
  installButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #4ecdc4;
    color: white;
    padding: 12px 16px;
    border-radius: 10px;
    font-weight: bold;
    display: none;
    cursor: pointer;
    z-index: 1000;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  `;
  installButton.innerHTML = `📱 Instalar App`;
  document.body.appendChild(installButton);

  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('📲 beforeinstallprompt detectado');
    if (localStorage.getItem("instalacionMostrada") !== "true") {
      e.preventDefault();
      deferredPrompt = e;
      installButton.style.display = 'block';
    }
  });

  installButton.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    installButton.style.display = 'none';
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    console.log('Resultado de instalación:', outcome);

    if (outcome === 'accepted') {
      console.log('✅ Usuario aceptó la instalación');
    } else {
      console.log('❌ Usuario canceló la instalación');
    }

    localStorage.setItem("instalacionMostrada", "true");
    deferredPrompt = null;
  });

  window.addEventListener('appinstalled', () => {
    console.log('✅ Aplicación instalada');
    installButton.style.display = 'none';
    deferredPrompt = null;
    localStorage.setItem("instalacionMostrada", "true");
  });
});
