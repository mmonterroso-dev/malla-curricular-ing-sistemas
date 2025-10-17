const totalCursos = document.querySelectorAll('#contenedor-malla li[data-id]').length;
const barraProgreso = document.getElementById('barra-interna');
const textoProgreso = document.getElementById('porcentaje-progreso');
const menuBorrar = document.createElement('div');
menuBorrar.id = 'menu-borrar';
menuBorrar.innerHTML = `<button>Borrar</button>`;
document.body.appendChild(menuBorrar);
let pressTimer;

document.addEventListener('DOMContentLoaded', () => {
    cargarEstadoCursos();
    cargarEstadoElectivos();

    const todosLosCursos = document.querySelectorAll('#contenedor-malla li[data-id]:not(.slot-electivo) button');
    todosLosCursos.forEach(curso => {
        curso.addEventListener('click', () => {
            toggleCurso(curso.parentElement); 
        });
    });

    const electivosArrastrables = document.querySelectorAll('.bloque-electivo');
    electivosArrastrables.forEach(electivo => {
        electivo.addEventListener('dragstart', arrastrarCurso);
    });

    const zonasParaSoltar = document.querySelectorAll('.slot-electivo, .grid-electivos');
    zonasParaSoltar.forEach(zona => {
        zona.addEventListener('dragover', permitirSoltar);
        zona.addEventListener('dragleave', () => zona.classList.remove('drag-over'));
        zona.addEventListener('drop', soltarCurso);
    });
});

function toggleCurso(cursoElemento) {
    cursoElemento.classList.toggle('completado');
    guardarEstadoCursos();
    actualizarProgreso();
}

function guardarEstadoCursos() {
    const cursosCompletados = document.querySelectorAll('.completado');
    const ids = Array.from(cursosCompletados).map(c => c.dataset.id);
    localStorage.setItem('cursosCompletadosMalla', JSON.stringify(ids));
}

function cargarEstadoCursos() {
    const idsGuardados = JSON.parse(localStorage.getItem('cursosCompletadosMalla') || '[]');
    idsGuardados.forEach(id => {
        const curso = document.querySelector(`li[data-id="${id}"]`);
        if (curso) curso.classList.add('completado');
    });
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
    const elemento = event.target;
    let cursoId, nombre, creditos;

    if (elemento.classList.contains('bloque-electivo')) { // Desde la lista
        cursoId = elemento.dataset.id;
        creditos = elemento.querySelector('span').textContent.trim();
        const tempClone = elemento.cloneNode(true);
        tempClone.querySelector('span').remove();
        nombre = tempClone.textContent.trim();
    } else if (elemento.classList.contains('slot-electivo')) { // Desde un slot
        cursoId = elemento.dataset.cursoId;
        nombre = elemento.querySelector('span:first-child').textContent;
        creditos = elemento.querySelector('.creditos').textContent;
    }

    if (cursoId) {
        event.dataTransfer.setData("application/json", JSON.stringify({ cursoId, nombre, creditos }));
    }
}

function permitirSoltar(event) {
    event.preventDefault();
    if (event.currentTarget.classList.contains('slot-electivo') && event.currentTarget.classList.contains('lleno')) {
        return;
    }
    event.currentTarget.classList.add("drag-over");
}

function soltarCurso(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    const data = JSON.parse(event.dataTransfer.getData("application/json"));
    const zonaDestino = event.currentTarget;
    
    if (zonaDestino.classList.contains('slot-electivo') && !zonaDestino.classList.contains('lleno')) {
      llenarSlot(zonaDestino, data);
      const cursoOriginalFooter = document.querySelector(`.bloque-electivo[data-id="${data.cursoId}"]`);
      if (cursoOriginalFooter) cursoOriginalFooter.classList.add('escondido');
    }
    else if (zonaDestino.classList.contains('grid-electivos')) {
      if (cursoOriginalFooter) cursoOriginalFooter.classList.remove('escondido');
    }
    guardarEstadoElectivos();
}

function llenarSlot(slot, data) {
    slot.querySelector('span:first-child').textContent = data.nombre;
    slot.classList.add('lleno');
    slot.setAttribute('draggable', true);
    slot.dataset.cursoId = data.cursoId;
    slot.addEventListener('dragstart', arrastrarCurso);
    slot.addEventListener('click', () => toggleCurso(slot));
    slot.addEventListener('contextmenu', mostrarMenuBorrar);
    slot.addEventListener('touchstart', handleTouchStart);
    slot.addEventListener('touchend', handleTouchEnd);
    slot.addEventListener('touchmove', handleTouchEnd);
}

function limpiarSlot(slot) {
    slot.querySelector('span:first-child').textContent = 'ELECTIVO';
    slot.classList.remove('lleno');
    slot.removeAttribute('draggable');
    delete slot.dataset.cursoId;
    slot.removeEventListener('dragstart', arrastrarCurso);
}

function guardarEstadoElectivos() {
    const slotsLlenos = document.querySelectorAll('.slot-electivo.lleno');
    const estado = {};
    slotsLlenos.forEach(slot => {
        estado[slot.dataset.id] = slot.dataset.cursoId;
    });
    localStorage.setItem('electivosColocados', JSON.stringify(estado));
}

function cargarEstadoElectivos() {
    const estadoGuardado = JSON.parse(localStorage.getItem('electivosColocados') || '{}');
    for (const slotId in estadoGuardado) {
        const cursoId = estadoGuardado[slotId];
        const slot = document.querySelector(`.slot-electivo[data-id="${slotId}"]`);
        const cursoInfo = document.querySelector(`.bloque-electivo[data-id="${cursoId}"]`);

        if (slot && cursoInfo) {
            const creditos = cursoInfo.querySelector('span').textContent.trim();
            const tempClone = cursoInfo.cloneNode(true);
            tempClone.querySelector('span').remove();
            const nombre = tempClone.textContent.trim();
            
            llenarSlot(slot, { cursoId, nombre, creditos });
            cursoInfo.classList.add('escondido');
        }
    }
}

function mostrarMenuBorrar(event) {
    // 1. Previene que aparezca el menú normal del navegador
    event.preventDefault();

    const slotClickeado = event.currentTarget; // El <li> que recibió el clic derecho

    // 2. Posiciona nuestro menú personalizado donde se hizo clic
    menuBorrar.style.display = 'block';
    menuBorrar.style.left = `${event.pageX}px`;
    menuBorrar.style.top = `${event.pageY}px`;

    // 3. Le decimos al botón "Borrar" qué hacer cuando se le haga clic
    menuBorrar.querySelector('button').onclick = () => {
        // Encuentra el curso original en el footer
        const cursoOriginal = document.querySelector(`.bloque-electivo[data-id="${slotClickeado.dataset.cursoId}"]`);
        if (cursoOriginal) {
            cursoOriginal.classList.remove('escondido'); // Lo vuelve a mostrar
        }

        // Limpia el slot para que vuelva a su estado original
        limpiarSlot(slotClickeado);

        // Guarda el nuevo estado (sin el curso borrado)
        guardarEstadoElectivos();

        // Oculta el menú de borrado
        menuBorrar.style.display = 'none';
    };
}

// Oculta el menú si el usuario hace clic en cualquier otro lugar de la página
window.addEventListener('click', () => {
    menuBorrar.style.display = 'none';
});

//Mantener pulsado con el dedo, en celular
function handleTouchStart(event) {
    const slot = event.currentTarget;

    // Inicia un temporizador. Si no se cancela en 500ms, es una pulsación larga.
    pressTimer = setTimeout(() => {
        // Creamos un "evento falso" para pasarle las coordenadas del toque
        const mockEvent = {
            preventDefault: () => event.preventDefault(), // Evita acciones raras del navegador
            pageX: event.touches[0].pageX, // Coordenada X del dedo
            pageY: event.touches[0].pageY, // Coordenada Y del dedo
            currentTarget: slot
        };
        mostrarMenuBorrar(mockEvent);
    }, 500); // 500 milisegundos = medio segundo
}

// Se activa cuando el usuario QUITA el dedo del curso
function handleTouchEnd() {
    // Si el dedo se levanta antes de los 500ms, cancelamos el temporizador
    clearTimeout(pressTimer);
}