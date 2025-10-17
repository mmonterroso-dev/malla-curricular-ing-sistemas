const totalCursos = document.querySelectorAll('#contenedor-malla li[data-id]').length;
const barraProgreso = document.getElementById('barra-interna');
const textoProgreso = document.getElementById('porcentaje-progreso');
const menuBorrar = document.createElement('div');
menuBorrar.id = 'menu-borrar';
menuBorrar.innerHTML = `<button>Borrar</button>`;
document.body.appendChild(menuBorrar);
let pressTimer;
let dataMallaCompleta = [];

document.addEventListener('DOMContentLoaded', async () => {
    await generarMallaDesdeJSON();
    cargarEstadoCursos();
    cargarEstadoElectivos();
    
    // --- LÓGICA PARA CERRAR EL MODAL ---
    const modal = document.getElementById('modal-info');
    const btnCerrar = document.querySelector('.cerrar-modal');

    if (btnCerrar) {
        btnCerrar.onclick = () => {
            modal.style.display = 'none';
        }
    }
    // Cierra el modal si se hace clic fuera del contenido
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }

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

    const btnReiniciar = document.getElementById('btn-reiniciar');
    if (btnReiniciar) {
        btnReiniciar.addEventListener('click', () => {
            
            const confirmacion = confirm('¿Estás seguro de que quieres borrar todo tu progreso y los electivos seleccionados? Esta acción no se puede deshacer.');

            if (confirmacion) {
                localStorage.removeItem('cursosCompletadosMalla');
                localStorage.removeItem('electivosColocados');
                location.reload();
            }
        });
    }

    const todosLosCursosLi = document.querySelectorAll('#contenedor-malla li[data-id]');
    todosLosCursosLi.forEach(curso => {
        curso.addEventListener('contextmenu', handleContextMenu);
    });

    todosLosCursosLi.forEach(cursoLi => {
        cursoLi.addEventListener('mouseover', handleMouseOver);
        cursoLi.addEventListener('mouseout', handleMouseOut);
    });

    const cursosFijosLi = document.querySelectorAll('#contenedor-malla li[data-id]:not(.slot-electivo)');
    cursosFijosLi.forEach(curso => {
        curso.addEventListener('touchstart', handleTouchStart);
        curso.addEventListener('touchend', handleTouchEnd);
        curso.addEventListener('touchmove', handleTouchEnd); // Cancela si el dedo se mueve
    });
});

function toggleCurso(cursoElemento) {
    if (cursoElemento.classList.contains('bloqueado')) {
        return; 
    }
    cursoElemento.classList.toggle('completado');
    guardarEstadoCursos();
    actualizarProgreso();
    actualizarEstadoDeBloqueo(); 
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
    actualizarEstadoDeBloqueo();
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
    slot.addEventListener('contextmenu', handleContextMenu);
    slot.addEventListener('touchstart', handleTouchStart);
    slot.addEventListener('touchend', handleTouchEnd);
    slot.addEventListener('touchmove', handleTouchEnd);
    slot.addEventListener('mouseover', handleMouseOver);
    slot.addEventListener('mouseout', handleMouseOut);
}

function limpiarSlot(slot) {
    slot.querySelector('span:first-child').textContent = 'ELECTIVO';
    slot.classList.remove('lleno', 'completado');
    slot.removeAttribute('draggable');
    delete slot.dataset.cursoId;
    const nuevoSlot = slot.cloneNode(true);
    slot.parentNode.replaceChild(nuevoSlot, slot);
    nuevoSlot.addEventListener('dragover', permitirSoltar);
    nuevoSlot.addEventListener('dragleave', () => nuevoSlot.classList.remove('drag-over'));
    nuevoSlot.addEventListener('drop', soltarCurso);
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

// Oculta el menú si el usuario hace clic en cualquier otro lugar de la página
window.addEventListener('click', () => {
    menuBorrar.style.display = 'none';
});

//Mantener pulsado con el dedo, en celular
function handleTouchStart(event) {
    const elementoTocado = event.currentTarget;
    pressTimer = setTimeout(() => {
        const mockEvent = {
            preventDefault: () => event.preventDefault(),
            pageX: event.touches[0].pageX,
            pageY: event.touches[0].pageY,
            currentTarget: elementoTocado
        };
        handleContextMenu(mockEvent);
    }, 500);
}

// Se activa cuando el usuario QUITA el dedo del curso
function handleTouchEnd() {
    // Si el dedo se levanta antes de los 500ms, cancelamos el temporizador
    clearTimeout(pressTimer);
}

// PREREQUISITOS
function actualizarEstadoDeBloqueo() {
    const todosLosCursos = document.querySelectorAll('#contenedor-malla li[data-id]');
    
    todosLosCursos.forEach(curso => {
        const prerequisitosString = curso.dataset.prerequisitos;
        
        // Si el curso no tiene prerrequisitos, nos aseguramos de que no esté bloqueado y terminamos.
        if (!prerequisitosString) {
            curso.classList.remove('bloqueado');
            return;
        }

        // Le preguntamos a nuestra función "cerebro" si los prerrequisitos se cumplen.
        const estanCumplidos = validarPrerequisitos(prerequisitosString);

        // Actuamos según la respuesta.
        if (estanCumplidos) {
            curso.classList.remove('bloqueado'); // Se cumplen, quitamos el bloqueo.
        } else {
            curso.classList.add('bloqueado'); // No se cumplen, añadimos el bloqueo.
        }
    });
}

function validarPrerequisitos(prereqs) {
    // Primero, creamos una lista de los IDs de todos los cursos que ya están completados.
    const cursosCompletados = new Set(
        Array.from(document.querySelectorAll('.completado')).map(c => c.dataset.id)
    );

    // Lógica "O" (OR): si la cadena contiene "|", necesitamos que AL MENOS UNO se cumpla.
    if (prereqs.includes('|')) {
        const listaOr = prereqs.split('|');
        // El método .some() devuelve true si al menos un curso de la lista está en nuestros cursosCompletados.
        return listaOr.some(id => cursosCompletados.has(id.trim()));
    } 
    // Lógica "Y" (AND): si no, asumimos que TODOS se deben cumplir (separados por coma).
    else {
        const listaAnd = prereqs.split(',');
        // El método .every() devuelve true solo si TODOS los cursos de la lista están en nuestros cursosCompletados.
        return listaAnd.every(id => cursosCompletados.has(id.trim()));
    }
}

// Malla desde JSON
async function generarMallaDesdeJSON() {
    const contenedorMalla = document.getElementById('contenedor-malla');
    const indicadorCarga = document.getElementById('indicador-carga');
    const mensajeError = document.getElementById('mensaje-error');

    try {
        const response = await fetch('malla.json');
        if (!response.ok) {
            throw new Error(`Error al cargar el archivo: ${response.statusText}`);
        }
        const dataNiveles = await response.json();
        
        dataMallaCompleta = dataNiveles;
        contenedorMalla.innerHTML = '';

        dataNiveles.forEach(nivelInfo => {
            const seccionNivel = document.createElement('section');
            seccionNivel.className = 'nivel';

            const tituloNivel = document.createElement('h3');
            tituloNivel.textContent = `NIVEL ${nivelInfo.nivel}`;
            seccionNivel.appendChild(tituloNivel);

            const listaCursos = document.createElement('ul');

            nivelInfo.cursos.forEach(cursoInfo => {
                const esElectivo = cursoInfo.tipo === 'electivo';
                const itemCurso = document.createElement('li');
                itemCurso.dataset.id = cursoInfo.id;
                if (cursoInfo.creditos) itemCurso.dataset.creditos = cursoInfo.creditos;
                if (cursoInfo.prerequisitos) itemCurso.dataset.prerequisitos = cursoInfo.prerequisitos;
                
                itemCurso.classList.add(cursoInfo.tipo);
                if (esElectivo) itemCurso.classList.add('slot-electivo');
                
                if (esElectivo) {
                    itemCurso.innerHTML = `<span>ELECTIVO</span><span class="creditos">${cursoInfo.creditos}</span>`;
                } else {
                    itemCurso.innerHTML = `<button>${cursoInfo.nombre} <span class="creditos">${cursoInfo.creditos}</span></button>`;
                }

                listaCursos.appendChild(itemCurso);
            });

            seccionNivel.appendChild(listaCursos);

            const totalCreditos = document.createElement('p');
            totalCreditos.className = 'total-creditos';
            totalCreditos.textContent = `Créditos obligatorios: ${nivelInfo.creditos_obligatorios}`;
            seccionNivel.appendChild(totalCreditos);

            contenedorMalla.appendChild(seccionNivel);
        });

    } catch (error) {
        console.error('Falló la carga de la malla:', error);
        if (indicadorCarga) indicadorCarga.style.display = 'none';
        if (mensajeError) mensajeError.style.display = 'block';
    } finally {
        if (indicadorCarga) indicadorCarga.style.display = 'none';
    }
}

// Para prerequisitos al pasar el mouse por encima de un curso
function handleMouseOver(event) {
    const cursoActual = event.currentTarget;
    const cursoId = cursoActual.dataset.id;
    // 1. Resaltar los PRERREQUISITOS de este curso (en azul)
    const prereqsString = cursoActual.dataset.prerequisitos;
    if (prereqsString) {
        // Separa la cadena por comas o barras para obtener todos los IDs
        const prereqIds = prereqsString.split(/[,|]/).map(id => id.trim());
        prereqIds.forEach(id => {
            const prereqElemento = document.querySelector(`li[data-id="${id}"]`);
            if (prereqElemento) {
                prereqElemento.classList.add('prerrequisito-highlight');
            }
        });
    }
    // 2. Resaltar los cursos que ESTE CURSO HABILITA (en verde)
    const todosLosCursos = document.querySelectorAll('#contenedor-malla li[data-id]');
    todosLosCursos.forEach(otroCurso => {
        const otrosPrereqs = otroCurso.dataset.prerequisitos;
        if (otrosPrereqs && otrosPrereqs.split(/[,|]/).map(id => id.trim()).includes(cursoId)) {
            otroCurso.classList.add('habilita-highlight');
        }
    });
}
function handleMouseOut() {
    const cursosResaltados = document.querySelectorAll('.prerrequisito-highlight, .habilita-highlight');
    cursosResaltados.forEach(curso => {
        curso.classList.remove('prerrequisito-highlight', 'habilita-highlight');
    });
}

function abrirModalInfo(cursoElemento) {
    const cursoId = cursoElemento.dataset.id;
    const nombreCurso = cursoElemento.querySelector('button').textContent.replace(cursoElemento.querySelector('.creditos').textContent, '').trim();

    // 1. Encuentra los prerrequisitos
    const prereqs = (cursoElemento.dataset.prerequisitos || "").split(/[,|]/).filter(Boolean);

    // 2. Encuentra los cursos que habilita (POST-requisitos)
    const habilita = [];
    dataMallaCompleta.forEach(nivel => {
        nivel.cursos.forEach(curso => {
            if ((curso.prerequisitos || "").split(/[,|]/).includes(cursoId)) {
                habilita.push(curso.nombre);
            }
        });
    });

    // 3. Rellena el modal
    document.getElementById('modal-titulo').textContent = nombreCurso;

    const listaPrereqs = document.getElementById('modal-prerequisitos-lista');
    listaPrereqs.innerHTML = prereqs.length ? prereqs.map(id => `<li>${document.querySelector(`li[data-id="${id}"] button`).textContent.replace(document.querySelector(`li[data-id="${id}"] .creditos`).textContent, '').trim()}</li>`).join('') : '<li>Ninguno</li>';

    const listaHabilita = document.getElementById('modal-habilita-lista');
    listaHabilita.innerHTML = habilita.length ? habilita.map(nombre => `<li>${nombre}</li>`).join('') : '<li>Ninguno</li>';

    // 4. Muestra el modal
    document.getElementById('modal-info').style.display = 'block';
}

// --- NUEVA FUNCIÓN INTELIGENTE PARA EL MENÚ CONTEXTUAL ---
function handleContextMenu(event) {
    event.preventDefault(); // Siempre previene el menú por defecto
    const cursoElemento = event.currentTarget;
    const botonMenu = menuBorrar.querySelector('button');

    // DECISIÓN: ¿Qué tipo de curso es?
    if (cursoElemento.classList.contains('slot-electivo') && cursoElemento.classList.contains('lleno')) {
        // --- LÓGICA PARA ELECTIVOS: Mostrar "Borrar" ---
        botonMenu.textContent = 'Borrar';
        botonMenu.style.backgroundColor = 'var(--color-rojo-borrar)';

        botonMenu.onclick = () => {
            const cursoOriginal = document.querySelector(`.bloque-electivo[data-id="${cursoElemento.dataset.cursoId}"]`);
            if (cursoOriginal) {
                cursoOriginal.classList.remove('escondido');
            }
            limpiarSlot(cursoElemento);
            guardarEstadoElectivos();
            menuBorrar.style.display = 'none';
        };

    } else if (!cursoElemento.classList.contains('slot-electivo')) {
        botonMenu.textContent = 'Más Info';
        botonMenu.style.backgroundColor = 'var(--color-primario)';

        botonMenu.onclick = () => {
            abrirModalInfo(cursoElemento);
            menuBorrar.style.display = 'none';
        };

    } else {
        return;
    }

    menuBorrar.style.display = 'block';
    menuBorrar.style.left = `${event.pageX}px`;
    menuBorrar.style.top = `${event.pageY}px`;
}