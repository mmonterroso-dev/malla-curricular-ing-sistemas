function toggleCurso(element) {
  const id = element.getAttribute("data-id");
  element.classList.toggle("completado");

  // Guardar estado en localStorage
  const estadoActual = localStorage.getItem("cursosCompletados");
  const cursos = estadoActual ? JSON.parse(estadoActual) : {};

  cursos[id] = element.classList.contains("completado");
  localStorage.setItem("cursosCompletados", JSON.stringify(cursos));
}

window.onload = function () {
  const estadoGuardado = localStorage.getItem("cursosCompletados");
  if (!estadoGuardado) return;

  const cursos = JSON.parse(estadoGuardado);
  for (const id in cursos) {
    if (cursos[id]) {
      const elemento = document.querySelector(`[data-id="${id}"]`);
      if (elemento) {
        elemento.classList.add("completado");
      }
    }
  }
};

function filtrarElectivos(tipo) {
  const electivos = document.querySelectorAll("#lista-electivos li");
  electivos.forEach((el) => {
    if (tipo === "todos") {
      el.style.display = "list-item";
    } else {
      el.style.display = el.getAttribute("data-tipo") === tipo ? "list-item" : "none";
    }
  });
}



function arrastrarCurso(event) {
  const nombre = event.target.getAttribute("data-nombre");
  const creditos = event.target.getAttribute("data-creditos");
  event.dataTransfer.setData("text/plain", JSON.stringify({ nombre, creditos }));
}

function permitirSoltar(event) {
  event.preventDefault(); // necesario para permitir el drop
  event.currentTarget.classList.add("drag-over");
}

function soltarCurso(event) {
  event.preventDefault();
  event.currentTarget.classList.remove("drag-over");
  const data = JSON.parse(event.dataTransfer.getData("text/plain"));
  
  const nuevoCurso = document.createElement("li");
  nuevoCurso.textContent = `${data.nombre} `;
  
  const spanCreditos = document.createElement("span");
  spanCreditos.classList.add("creditos");
  spanCreditos.textContent = data.creditos;
  
  nuevoCurso.appendChild(spanCreditos);
  event.currentTarget.querySelector("ul.lista-cursos").appendChild(nuevoCurso);

}
