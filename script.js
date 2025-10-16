const totalCursos = document.querySelectorAll('#contenedor-malla li[data-id]').length;
const barraProgreso = document.getElementById('barra-interna');
const textoProgreso = document.getElementById('porcentaje-progreso');

function actualizarProgreso() {
  const cursosAprobados = document.querySelectorAll('.completado').length;
  const porcentaje = totalCursos > 0 ? (cursosAprobados / totalCursos) * 100 : 0;
  
  barraProgreso.style.width = porcentaje + '%';
  textoProgreso.textContent = Math.round(porcentaje) + '%';
}

document.addEventListener('DOMContentLoaded', () => {
    cargarEstadoCursos();
});

function toggleCurso(cursoElemento) {
    cursoElemento.classList.toggle('completado');
    guardarEstadoCursos(); // Guarda el cambio en la memoria
    actualizarProgreso(); // Actualiza la barra visualmente
}

function guardarEstadoCursos() {
    const cursosCompletados = document.querySelectorAll('.completado');
    const idsDeCursosCompletados = [];
    cursosCompletados.forEach(curso => {
        idsDeCursosCompletados.push(curso.dataset.id);
    });
    // Guardamos la lista de IDs en localStorage
    localStorage.setItem('cursosCompletadosMalla', JSON.stringify(idsDeCursosCompletados));
}

function cargarEstadoCursos() {
    const idsGuardados = localStorage.getItem('cursosCompletadosMalla');
    if (idsGuardados) {
        const idsDeCursosCompletados = JSON.parse(idsGuardados);
        idsDeCursosCompletados.forEach(id => {
            const cursoElemento = document.querySelector(`li[data-id="${id}"]`);
            if (cursoElemento) {
                cursoElemento.classList.add('completado');
            }
        });
    }
    actualizarProgreso();
}

function actualizarProgreso() {
    const totalCursos = document.querySelectorAll('#contenedor-malla li[data-id]').length;
    const barraProgreso = document.getElementById('barra-interna');
    const textoProgreso = document.getElementById('porcentaje-progreso');

    const cursosCompletados = document.querySelectorAll('.completado').length;
    const porcentaje = totalCursos > 0 ? (cursosCompletados / totalCursos) * 100 : 0;

    if (barraProgreso && textoProgreso) {
        barraProgreso.style.width = `${porcentaje}%`;
        textoProgreso.textContent = `${Math.round(porcentaje)}%`;
    }
}

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