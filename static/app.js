const lienzo = document.querySelector("#lienzo");
const nav = document.querySelector(".nav");

const estado = {
  datos: null,
  vista: "proyectos",
  proyectoId: 1,
  filtro: "",
  modal: null,
  aviso: null,
  ocupado: false,
};

const ESTADOS_OBRA = ["Planificada", "En ejecución", "En revisión", "En pausa", "Finalizada"];
const ESTADOS_INMUEBLE = [
  "En remodelación",
  "En obra",
  "En adecuación",
  "Ocupado",
  "Fuera de servicio",
];
const ESTADOS_PROYECTO = ["Activo", "En revisión", "En pausa", "Finalizado"];
const ESPECIALIDADES = [
  "Estructura",
  "Impermeabilización",
  "Electricidad",
  "Plomería",
  "Arquitectura",
  "Otro",
];

const titulos = {
  proyectos: [
    "Proyectos",
    "Cada ficha es un proyecto con un inmueble principal. Al elegirla se ven las obras y las afectaciones de sus áreas.",
  ],
  obras: [
    "Obras",
    "Trabajos concretos. Cada obra pertenece a un proyecto, ocurre en un espacio y se carga a un área.",
  ],
  inmuebles: [
    "Inmuebles",
    "Propiedades vinculadas a una obra. Un proyecto toma una como inmueble principal.",
  ],
  zonas: [
    "Áreas y espacios",
    "Un área agrupa espacios y también recibe las afectaciones. Las obras trabajan sobre un área y un espacio.",
  ],
  afectaciones: [
    "Afectaciones",
    "Hallazgos por área, con la especialidad que los atiende.",
  ],
};

function esc(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, (caracter) =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[caracter]
  );
}

function tono(texto) {
  const valor = (texto || "").toLowerCase();
  if (
    ["activo", "en ejecución", "en remodelación", "en obra", "en adecuación"].includes(
      valor
    )
  ) {
    return "vivo";
  }
  if (["en revisión", "planificada", "ocupado"].includes(valor)) return "espera";
  if (["en pausa", "fuera de servicio", "finalizada"].includes(valor)) return "pausa";
  return "pausa";
}

function pill(texto) {
  return `<span class="pill ${tono(texto)}">${esc(texto)}</span>`;
}

function tituloProyecto(proyecto) {
  const texto = proyecto.descripcion || "";
  const corte = texto.split(":")[0].trim();
  return corte.endsWith(".") ? corte.slice(0, -1) : corte;
}

function porId(lista, campo, id) {
  return lista.find((fila) => fila[campo] === id);
}

function coincide(...partes) {
  const consulta = estado.filtro.trim().toLowerCase();
  if (!consulta) return true;
  return partes.join(" ").toLowerCase().includes(consulta);
}

async function api(metodo, ruta, cuerpo) {
  const opciones = {
    method: metodo,
    headers: { Accept: "application/json" },
  };
  if (cuerpo !== undefined) {
    opciones.headers["Content-Type"] = "application/json";
    opciones.body = JSON.stringify(cuerpo);
  }
  const respuesta = await fetch(ruta, opciones);
  const texto = await respuesta.text();
  let datos = null;
  if (texto) {
    try {
      datos = JSON.parse(texto);
    } catch {
      datos = { error: texto };
    }
  }
  if (!respuesta.ok) {
    throw new Error(datos?.error || `Error ${respuesta.status}`);
  }
  return datos;
}

async function recargarDatos() {
  estado.datos = await api("GET", "/api/datos");
}

function mostrarAviso(texto, tipo = "ok") {
  estado.aviso = { texto, tipo };
  pintar();
  window.clearTimeout(mostrarAviso._t);
  mostrarAviso._t = window.setTimeout(() => {
    estado.aviso = null;
    pintar();
  }, 3200);
}

function cerrarModal() {
  estado.modal = null;
  pintar();
}

function abrirModal(modal) {
  estado.modal = modal;
  pintar();
  const primerCampo = document.querySelector("#modal-formulario [name]");
  if (primerCampo) primerCampo.focus();
}

function encabezado(vista) {
  const [titulo, intro] = titulos[vista];
  const datos = estado.datos;
  return `
    <p class="kicker">Datos vivos · API Node</p>
    <h1>${titulo}</h1>
    <p class="intro">${intro}</p>
    <div class="resumen">
      <span><strong>${datos.proyecto.length}</strong>proyectos</span>
      <span><strong>${datos.obra.length}</strong>obras</span>
      <span><strong>${datos.inmuebles.length}</strong>inmuebles</span>
      <span><strong>${datos.espacio.length}</strong>espacios</span>
      <span><strong>${datos.afectacion.length}</strong>afectaciones</span>
    </div>
  `;
}

function busqueda(placeholder) {
  return `<input class="busqueda" type="search" value="${esc(estado.filtro)}" placeholder="${esc(placeholder)}" aria-label="${esc(placeholder)}">`;
}

function barraAcciones(botones) {
  return `<div class="barra-acciones">${botones}</div>`;
}

function botonCrear(accion, etiqueta) {
  return `<button type="button" class="btn primario" data-accion="${esc(accion)}">${esc(etiqueta)}</button>`;
}

function accionesFila(editar, eliminar) {
  return `
    <div class="acciones-fila">
      <button type="button" class="btn fantasma" data-accion="${esc(editar)}">Editar</button>
      <button type="button" class="btn peligro" data-accion="${esc(eliminar)}">Eliminar</button>
    </div>
  `;
}

function opcionesSelect(lista, valorCampo, textoCampo, seleccionado, vacio) {
  const opciones = lista
    .map((fila) => {
      const valor = fila[valorCampo];
      const marca = Number(seleccionado) === Number(valor) ? " selected" : "";
      return `<option value="${valor}"${marca}>${esc(fila[textoCampo])}</option>`;
    })
    .join("");
  const placeholder = vacio
    ? `<option value="">${esc(vacio)}</option>`
    : "";
  return placeholder + opciones;
}

function opcionesTexto(lista, seleccionado) {
  return lista
    .map((item) => {
      const marca = seleccionado === item ? " selected" : "";
      return `<option value="${esc(item)}"${marca}>${esc(item)}</option>`;
    })
    .join("");
}

function campo(etiqueta, control) {
  return `<label class="campo"><span>${esc(etiqueta)}</span>${control}</label>`;
}

function renderAviso() {
  if (!estado.aviso) return "";
  return `<div class="aviso ${estado.aviso.tipo}" role="status">${esc(estado.aviso.texto)}</div>`;
}

function renderModal() {
  const modal = estado.modal;
  if (!modal) return "";

  const deshabilitado = estado.ocupado ? " disabled" : "";
  return `
    <div class="modal-fondo">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
        <header class="modal-cabecera">
          <h2 id="modal-titulo">${esc(modal.titulo)}</h2>
          <button type="button" class="btn fantasma" data-accion="cerrar-modal"${deshabilitado}>Cerrar</button>
        </header>
        <p class="modal-ayuda">${esc(modal.ayuda)}</p>
        <form id="modal-formulario" class="formulario" data-form="${esc(modal.form)}">
          ${modal.cuerpo}
          <div class="form-acciones">
            <button type="button" class="btn fantasma" data-accion="cerrar-modal"${deshabilitado}>Cancelar</button>
            <button type="submit" class="btn primario"${deshabilitado}>${esc(modal.enviar)}</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

/* ——— Proyectos ——— */

function formularioProyecto(proyecto = null) {
  const datos = estado.datos;
  return `
    ${campo(
      "Contacto",
      `<input name="name_contact" required maxlength="120" value="${esc(proyecto?.name_contact || "")}" placeholder="Nombre del contacto">`
    )}
    ${campo(
      "Estatus",
      `<select name="check_estatus" required>${opcionesTexto(ESTADOS_PROYECTO, proyecto?.check_estatus || "Activo")}</select>`
    )}
    ${campo(
      "Inmueble principal",
      `<select name="id_inmueble" required>${opcionesSelect(
        datos.inmuebles.map((i) => ({
          id_inmueble: i.id_inmueble,
          etiqueta: `${i.name_inmueble} · ${i.name_propietario}`,
        })),
        "id_inmueble",
        "etiqueta",
        proyecto?.id_inmueble,
        datos.inmuebles.length ? "Elegir inmueble" : "No hay inmuebles — créalo primero"
      )}</select>`
    )}
    ${campo(
      "Ubicación",
      `<input name="ubicacion" required maxlength="200" value="${esc(proyecto?.ubicacion || "")}" placeholder="Piso 2, Torre Sur, Condominio Mirador">`
    )}
    ${campo(
      "Descripción",
      `<textarea name="descripcion" rows="3" maxlength="500" placeholder="Resumen del proyecto">${esc(proyecto?.descripcion || "")}</textarea>`
    )}
  `;
}

function abrirProyecto(proyecto = null) {
  if (!proyecto && estado.datos.inmuebles.length === 0) {
    mostrarAviso(
      "Primero crea un inmueble en Inmuebles: el proyecto necesita un id_inmueble principal.",
      "error"
    );
    return;
  }
  abrirModal({
    form: proyecto ? "editar-proyecto" : "crear-proyecto",
    titulo: proyecto ? "Editar proyecto" : "Crear proyecto",
    ayuda:
      "POST/PUT /api/proyectos — requiere un inmueble existente como principal (id_inmueble).",
    enviar: proyecto ? "Guardar cambios" : "Crear proyecto",
    id: proyecto?.id_proyecto,
    cuerpo: formularioProyecto(proyecto),
  });
}

function renderProyectos() {
  const { proyecto, obra } = estado.datos;
  const fichas = proyecto
    .map((fila) => {
      const cantidad = obra.filter((item) => item.id_proyecto === fila.id_proyecto).length;
      const activa = fila.id_proyecto === estado.proyectoId ? " activa" : "";
      return `
      <article class="ficha-wrap">
        <button class="ficha${activa}" type="button" data-proyecto="${fila.id_proyecto}">
          <span class="numero">Proyecto 0${fila.id_proyecto}</span>
          <h2>${esc(tituloProyecto(fila))}</h2>
          <p>${esc(fila.name_contact)} · ${cantidad} ${cantidad === 1 ? "obra" : "obras"}</p>
          ${pill(fila.check_estatus)}
        </button>
        <div class="acciones-fila ficha-acciones">
          <button type="button" class="btn fantasma" data-accion="editar-proyecto:${fila.id_proyecto}">Editar</button>
          <button type="button" class="btn peligro" data-accion="eliminar-proyecto:${fila.id_proyecto}">Eliminar</button>
        </div>
      </article>
    `;
    })
    .join("");

  lienzo.innerHTML = `
    ${encabezado("proyectos")}
    ${renderAviso()}
    ${barraAcciones(botonCrear("crear-proyecto", "Crear proyecto"))}
    <div class="rejilla">${fichas || `<p class="vacio">No hay proyectos. Crea el primero.</p>`}</div>
    ${dossier(estado.proyectoId)}
    ${renderModal()}
  `;
}

function dossier(id) {
  const datos = estado.datos;
  const proyecto = porId(datos.proyecto, "id_proyecto", id);
  if (!proyecto) return "";

  const principal = porId(datos.inmuebles, "id_inmueble", proyecto.id_inmueble);
  const obras = datos.obra.filter((fila) => fila.id_proyecto === id);
  const areasVistas = new Set();

  const filasObra = obras
    .map((fila) => {
      const espacio = porId(datos.espacio, "id_espacio", fila.id_espacio);
      const area = porId(datos.area, "id_area", fila.id_area_trabajo);
      areasVistas.add(fila.id_area_trabajo);
      const otros = datos.inmuebles.filter(
        (inmueble) =>
          inmueble.id_obra_proyecto === fila.id_obra_proyecto &&
          inmueble.id_inmueble !== proyecto.id_inmueble
      );
      const extra = otros.length
        ? `<p class="otros">También vincula a ${otros.map((item) => esc(item.name_inmueble)).join(", ")}.</p>`
        : "";
      const nota = fila.notas_obra ? `<p class="nota">${esc(fila.notas_obra)}</p>` : "";
      return `
      <article class="obra-fila">
        <div class="obra-tope">
          <h3>${esc(fila.name_obra_proyecto)}</h3>
          ${pill(fila.estado_obra_proyecto)}
        </div>
        <p class="cadena">${esc(espacio?.name_espacio)} · ${esc(area?.name_area)}</p>
        <p class="nota">${esc(fila.descripcion_obra)}</p>
        ${nota}
        ${extra}
      </article>
    `;
    })
    .join("");

  const hallazgos = datos.afectacion
    .filter((fila) => areasVistas.has(fila.id_area))
    .map((fila) => {
      const area = porId(datos.area, "id_area", fila.id_area);
      return `
        <li>
          <span>${esc(fila.name_afectacion)} <span class="especialidad">· ${esc(area?.name_area)}</span></span>
          <span class="especialidad">${esc(fila.name_especialidad)}</span>
        </li>
      `;
    })
    .join("");

  return `
    <article class="dossier">
      <header class="dossier-cabecera">
        <div>
          <p class="etiqueta">Proyecto 0${proyecto.id_proyecto}</p>
          <h2>${esc(tituloProyecto(proyecto))}</h2>
          <p class="nota">${esc(proyecto.ubicacion)}</p>
        </div>
        <div class="dossier-acciones">
          ${pill(proyecto.check_estatus)}
          <div class="acciones-fila">
            <button type="button" class="btn fantasma" data-accion="editar-proyecto:${proyecto.id_proyecto}">Editar</button>
            <button type="button" class="btn peligro" data-accion="eliminar-proyecto:${proyecto.id_proyecto}">Eliminar</button>
          </div>
        </div>
      </header>
      <div class="cuerpo-dossier">
        <section class="bloque">
          <p class="etiqueta">Inmueble principal</p>
          <h3>${esc(principal?.name_inmueble)}</h3>
          <p class="meta">${esc(principal?.name_propietario)}</p>
          <p class="meta">${esc(principal?.name_condominio)} · ${esc(principal?.name_residencia)}</p>
          <p class="nota">${principal ? pill(principal.estado_inmueble) : ""}</p>
          <p class="nota">Contacto del proyecto: ${esc(proyecto.name_contact)}.</p>
        </section>
        <section class="bloque">
          <p class="etiqueta">Obras</p>
          ${filasObra || `<p class="vacio">Sin obras en este proyecto.</p>`}
        </section>
      </div>
      <section class="hallazgos">
        <p class="etiqueta">Afectaciones en estas áreas</p>
        <ul>${hallazgos || `<li><span class="especialidad">Sin afectaciones registradas.</span></li>`}</ul>
      </section>
    </article>
  `;
}

/* ——— Obras ——— */

function formularioObra(obra = null) {
  const datos = estado.datos;
  const idArea = obra?.id_area_trabajo ?? datos.area[0]?.id_area ?? "";
  const espaciosArea = datos.espacio.filter(
    (espacio) => Number(espacio.id_area) === Number(idArea)
  );
  const idEspacio =
    obra?.id_espacio && espaciosArea.some((e) => e.id_espacio === obra.id_espacio)
      ? obra.id_espacio
      : espaciosArea[0]?.id_espacio ?? "";

  return `
    ${campo(
      "Nombre de la obra",
      `<input name="name_obra_proyecto" required maxlength="120" value="${esc(obra?.name_obra_proyecto || "")}" placeholder="Remodelación de sala">`
    )}
    ${campo(
      "Estado",
      `<select name="estado_obra_proyecto" required>${opcionesTexto(ESTADOS_OBRA, obra?.estado_obra_proyecto || "Planificada")}</select>`
    )}
    ${campo(
      "Proyecto",
      `<select name="id_proyecto" required>${opcionesSelect(
        datos.proyecto.map((p) => ({
          id_proyecto: p.id_proyecto,
          etiqueta: `Proyecto 0${p.id_proyecto} · ${tituloProyecto(p)}`,
        })),
        "id_proyecto",
        "etiqueta",
        obra?.id_proyecto ?? estado.proyectoId,
        "Elegir proyecto"
      )}</select>`
    )}
    ${campo(
      "Área de trabajo",
      `<select name="id_area_trabajo" required data-sincroniza="espacios-obra">${opcionesSelect(
        datos.area,
        "id_area",
        "name_area",
        idArea,
        "Elegir área"
      )}</select>`
    )}
    ${campo(
      "Espacio (del área elegida)",
      `<select name="id_espacio" required id="select-espacio-obra">${opcionesSelect(
        espaciosArea,
        "id_espacio",
        "name_espacio",
        idEspacio,
        espaciosArea.length ? "Elegir espacio" : "Sin espacios en esta área"
      )}</select>`
    )}
    ${campo(
      "Descripción",
      `<textarea name="descripcion_obra" rows="3" maxlength="400" placeholder="Qué se hará en la obra">${esc(obra?.descripcion_obra || "")}</textarea>`
    )}
    ${campo(
      "Notas",
      `<textarea name="notas_obra" rows="2" maxlength="300" placeholder="Notas operativas">${esc(obra?.notas_obra || "")}</textarea>`
    )}
  `;
}

function abrirObra(obra = null) {
  abrirModal({
    form: obra ? "editar-obra" : "crear-obra",
    titulo: obra ? "Editar obra" : "Crear obra",
    ayuda: "POST/PUT /api/obras — requiere proyecto, área de trabajo y un espacio de esa área.",
    enviar: obra ? "Guardar cambios" : "Crear obra",
    id: obra?.id_obra_proyecto,
    cuerpo: formularioObra(obra),
  });
}

function renderObras() {
  const datos = estado.datos;
  const filas = datos.obra
    .filter((fila) => {
      const proyecto = porId(datos.proyecto, "id_proyecto", fila.id_proyecto);
      const espacio = porId(datos.espacio, "id_espacio", fila.id_espacio);
      const area = porId(datos.area, "id_area", fila.id_area_trabajo);
      return coincide(
        fila.name_obra_proyecto,
        fila.estado_obra_proyecto,
        fila.descripcion_obra,
        proyecto?.name_contact,
        espacio?.name_espacio,
        area?.name_area
      );
    })
    .map((fila) => {
      const proyecto = porId(datos.proyecto, "id_proyecto", fila.id_proyecto);
      const espacio = porId(datos.espacio, "id_espacio", fila.id_espacio);
      const area = porId(datos.area, "id_area", fila.id_area_trabajo);
      return `
      <tr>
        <td>${esc(fila.name_obra_proyecto)}<br><span class="especialidad">${esc(fila.descripcion_obra)}</span></td>
        <td>${pill(fila.estado_obra_proyecto)}</td>
        <td>${esc(proyecto?.name_contact)}</td>
        <td>${esc(espacio?.name_espacio)}</td>
        <td>${esc(area?.name_area)}</td>
        <td>${accionesFila(`editar-obra:${fila.id_obra_proyecto}`, `eliminar-obra:${fila.id_obra_proyecto}`)}</td>
      </tr>
    `;
    })
    .join("");

  lienzo.innerHTML = `
    ${encabezado("obras")}
    ${renderAviso()}
    ${barraAcciones(botonCrear("crear-obra", "Crear obra"))}
    ${busqueda("Buscar obra, contacto, espacio o área")}
    <div class="tabla-wrap">
      <table>
        <thead>
          <tr><th>Obra</th><th>Estado</th><th>Contacto</th><th>Espacio</th><th>Área de trabajo</th><th>Acciones</th></tr>
        </thead>
        <tbody>${filas || `<tr><td colspan="6">Ninguna obra coincide con esa búsqueda.</td></tr>`}</tbody>
      </table>
    </div>
    ${renderModal()}
  `;
}

/* ——— Inmuebles ——— */

function formularioInmueble(inmueble = null) {
  const datos = estado.datos;
  return `
    ${campo(
      "Nombre del inmueble",
      `<input name="name_inmueble" required maxlength="120" value="${esc(inmueble?.name_inmueble || "")}" placeholder="Apartamento 2C">`
    )}
    ${campo(
      "Estado",
      `<select name="estado_inmueble" required>${opcionesTexto(ESTADOS_INMUEBLE, inmueble?.estado_inmueble || "En remodelación")}</select>`
    )}
    ${campo(
      "Obra vinculada",
      `<select name="id_obra_proyecto" required>${opcionesSelect(
        datos.obra.map((o) => ({
          id_obra_proyecto: o.id_obra_proyecto,
          etiqueta: o.name_obra_proyecto,
        })),
        "id_obra_proyecto",
        "etiqueta",
        inmueble?.id_obra_proyecto,
        "Elegir obra"
      )}</select>`
    )}
    ${campo(
      "Propietario",
      `<input name="name_propietario" required maxlength="120" value="${esc(inmueble?.name_propietario || "")}" placeholder="Nombre del propietario">`
    )}
    ${campo(
      "Condominio",
      `<input name="name_condominio" maxlength="120" value="${esc(inmueble?.name_condominio || "")}" placeholder="Condominio Mirador">`
    )}
    ${campo(
      "Residencia",
      `<input name="name_residencia" maxlength="120" value="${esc(inmueble?.name_residencia || "")}" placeholder="Residencia Torre Sur">`
    )}
  `;
}

function abrirInmueble(inmueble = null) {
  abrirModal({
    form: inmueble ? "editar-inmueble" : "crear-inmueble",
    titulo: inmueble ? "Editar inmueble" : "Crear inmueble",
    ayuda: "POST/PUT /api/inmuebles — cada inmueble debe apuntar a una obra existente (id_obra_proyecto).",
    enviar: inmueble ? "Guardar cambios" : "Crear inmueble",
    id: inmueble?.id_inmueble,
    cuerpo: formularioInmueble(inmueble),
  });
}

function renderInmuebles() {
  const datos = estado.datos;
  const filas = datos.inmuebles
    .filter((fila) => {
      const obra = porId(datos.obra, "id_obra_proyecto", fila.id_obra_proyecto);
      return coincide(
        fila.name_inmueble,
        fila.estado_inmueble,
        fila.name_propietario,
        fila.name_condominio,
        fila.name_residencia,
        obra?.name_obra_proyecto
      );
    })
    .map((fila) => {
      const obra = porId(datos.obra, "id_obra_proyecto", fila.id_obra_proyecto);
      const proyecto = obra
        ? porId(datos.proyecto, "id_proyecto", obra.id_proyecto)
        : null;
      const esPrincipal =
        proyecto && proyecto.id_inmueble === fila.id_inmueble
          ? "Inmueble del proyecto"
          : "Vinculado a la obra";
      return `
      <tr>
        <td>${esc(fila.name_inmueble)}<br><span class="especialidad">${esc(esPrincipal)}</span></td>
        <td>${pill(fila.estado_inmueble)}</td>
        <td>${esc(fila.name_propietario)}</td>
        <td>${esc(fila.name_condominio)}<br><span class="especialidad">${esc(fila.name_residencia)}</span></td>
        <td>${esc(obra?.name_obra_proyecto)}</td>
        <td>${accionesFila(`editar-inmueble:${fila.id_inmueble}`, `eliminar-inmueble:${fila.id_inmueble}`)}</td>
      </tr>
    `;
    })
    .join("");

  lienzo.innerHTML = `
    ${encabezado("inmuebles")}
    ${renderAviso()}
    ${barraAcciones(botonCrear("crear-inmueble", "Crear inmueble"))}
    ${busqueda("Buscar inmueble, propietario o condominio")}
    <div class="tabla-wrap">
      <table>
        <thead>
          <tr><th>Inmueble</th><th>Estado</th><th>Propietario</th><th>Condominio</th><th>Obra</th><th>Acciones</th></tr>
        </thead>
        <tbody>${filas || `<tr><td colspan="6">Ningún inmueble coincide con esa búsqueda.</td></tr>`}</tbody>
      </table>
    </div>
    ${renderModal()}
  `;
}

/* ——— Áreas y espacios ——— */

function formularioArea(area = null) {
  return `
    ${campo(
      "Nombre del área",
      `<input name="name_area" required maxlength="120" value="${esc(area?.name_area || "")}" placeholder="Piso 2 - Torre Sur">`
    )}
    ${campo(
      "Descripción",
      `<textarea name="descripcion_area" rows="3" maxlength="400" placeholder="Qué zona cubre">${esc(area?.descripcion_area || "")}</textarea>`
    )}
    ${campo(
      "Notas",
      `<textarea name="notas_area" rows="2" maxlength="300" placeholder="Accesos, horarios, restricciones">${esc(area?.notas_area || "")}</textarea>`
    )}
  `;
}

function formularioEspacio(espacio = null, areaFija = null) {
  const datos = estado.datos;
  const idArea = espacio?.id_area ?? areaFija ?? datos.area[0]?.id_area ?? "";
  return `
    ${campo(
      "Nombre del espacio",
      `<input name="name_espacio" required maxlength="120" value="${esc(espacio?.name_espacio || "")}" placeholder="Sala principal">`
    )}
    ${campo(
      "Área",
      `<select name="id_area" required>${opcionesSelect(
        datos.area,
        "id_area",
        "name_area",
        idArea,
        "Elegir área"
      )}</select>`
    )}
  `;
}

function abrirArea(area = null) {
  abrirModal({
    form: area ? "editar-area" : "crear-area",
    titulo: area ? "Editar área" : "Crear área",
    ayuda: "POST/PUT /api/areas — las áreas agrupan espacios y reciben afectaciones.",
    enviar: area ? "Guardar cambios" : "Crear área",
    id: area?.id_area,
    cuerpo: formularioArea(area),
  });
}

function abrirEspacio(espacio = null, areaFija = null) {
  abrirModal({
    form: espacio ? "editar-espacio" : "crear-espacio",
    titulo: espacio ? "Editar espacio" : "Crear espacio",
    ayuda: "POST/PUT /api/espacios — cada espacio pertenece a un área (id_area).",
    enviar: espacio ? "Guardar cambios" : "Crear espacio",
    id: espacio?.id_espacio,
    cuerpo: formularioEspacio(espacio, areaFija),
  });
}

function renderZonas() {
  const datos = estado.datos;
  const zonas = datos.area
    .filter((area) => {
      const espacios = datos.espacio.filter((espacio) => espacio.id_area === area.id_area);
      return coincide(
        area.name_area,
        area.descripcion_area,
        area.notas_area,
        ...espacios.map((espacio) => espacio.name_espacio)
      );
    })
    .map((area) => {
      const espacios = datos.espacio
        .filter((espacio) => espacio.id_area === area.id_area)
        .map(
          (espacio) => `
          <div class="chip-accion">
            <span class="chip">${esc(espacio.name_espacio)}</span>
            <button type="button" class="btn mini fantasma" data-accion="editar-espacio:${espacio.id_espacio}">Editar</button>
            <button type="button" class="btn mini peligro" data-accion="eliminar-espacio:${espacio.id_espacio}">Eliminar</button>
          </div>`
        )
        .join("");
      const afectaciones = datos.afectacion
        .filter((fila) => fila.id_area === area.id_area)
        .map(
          (fila) =>
            `<li><span>${esc(fila.name_afectacion)}</span><span class="especialidad">${esc(fila.name_especialidad)}</span></li>`
        )
        .join("");
      return `
      <article class="zona">
        <div class="zona-cabecera">
          <h2>${esc(area.name_area)}</h2>
          <div class="acciones-fila">
            <button type="button" class="btn fantasma" data-accion="editar-area:${area.id_area}">Editar área</button>
            <button type="button" class="btn peligro" data-accion="eliminar-area:${area.id_area}">Eliminar</button>
          </div>
        </div>
        <p class="nota">${esc(area.descripcion_area)}</p>
        <p class="nota">${esc(area.notas_area)}</p>
        <div class="zona-espacios-cab">
          <span class="especialidad">${datos.espacio.filter((e) => e.id_area === area.id_area).length} espacios</span>
          <button type="button" class="btn mini primario" data-accion="crear-espacio-en:${area.id_area}">Crear espacio</button>
        </div>
        <div class="chips">${espacios || `<p class="vacio">Sin espacios.</p>`}</div>
        <p class="etiqueta">Afectaciones</p>
        <ul class="lista">${afectaciones || `<li><span class="especialidad">Sin afectaciones.</span></li>`}</ul>
      </article>
    `;
    })
    .join("");

  lienzo.innerHTML = `
    ${encabezado("zonas")}
    ${renderAviso()}
    ${barraAcciones(`
      ${botonCrear("crear-area", "Crear área")}
      ${botonCrear("crear-espacio", "Crear espacio")}
    `)}
    ${busqueda("Buscar área o espacio")}
    <div class="zonas">${zonas || `<p class="vacio">Ninguna área coincide con esa búsqueda.</p>`}</div>
    ${renderModal()}
  `;
}

/* ——— Afectaciones ——— */

function formularioAfectacion(afectacion = null) {
  const datos = estado.datos;
  const especialidadActual = afectacion?.name_especialidad || "Impermeabilización";
  const especialidades = ESPECIALIDADES.includes(especialidadActual)
    ? ESPECIALIDADES
    : [...ESPECIALIDADES, especialidadActual];

  return `
    ${campo(
      "Afectación",
      `<input name="name_afectacion" required maxlength="180" value="${esc(afectacion?.name_afectacion || "")}" placeholder="Humedad en muro divisorio">`
    )}
    ${campo(
      "Especialidad",
      `<select name="name_especialidad" required>${opcionesTexto(especialidades, especialidadActual)}</select>`
    )}
    ${campo(
      "Área",
      `<select name="id_area" required>${opcionesSelect(
        datos.area,
        "id_area",
        "name_area",
        afectacion?.id_area,
        "Elegir área"
      )}</select>`
    )}
  `;
}

function abrirAfectacion(afectacion = null) {
  abrirModal({
    form: afectacion ? "editar-afectacion" : "crear-afectacion",
    titulo: afectacion ? "Editar afectación" : "Registrar afectación",
    ayuda: "POST/PUT /api/afectaciones — cada hallazgo se registra sobre un área (id_area).",
    enviar: afectacion ? "Guardar cambios" : "Registrar afectación",
    id: afectacion?.id_afectacion,
    cuerpo: formularioAfectacion(afectacion),
  });
}

function renderAfectaciones() {
  const datos = estado.datos;
  const filas = datos.afectacion
    .filter((fila) => {
      const area = porId(datos.area, "id_area", fila.id_area);
      return coincide(fila.name_afectacion, fila.name_especialidad, area?.name_area);
    })
    .map((fila) => {
      const area = porId(datos.area, "id_area", fila.id_area);
      return `
      <tr>
        <td>${esc(fila.name_afectacion)}</td>
        <td>${esc(fila.name_especialidad)}</td>
        <td>${esc(area?.name_area)}</td>
        <td>${accionesFila(`editar-afectacion:${fila.id_afectacion}`, `eliminar-afectacion:${fila.id_afectacion}`)}</td>
      </tr>
    `;
    })
    .join("");

  lienzo.innerHTML = `
    ${encabezado("afectaciones")}
    ${renderAviso()}
    ${barraAcciones(botonCrear("crear-afectacion", "Registrar afectación"))}
    ${busqueda("Buscar afectación, especialidad o área")}
    <div class="tabla-wrap">
      <table>
        <thead>
          <tr><th>Afectación</th><th>Especialidad</th><th>Área</th><th>Acciones</th></tr>
        </thead>
        <tbody>${filas || `<tr><td colspan="4">Ninguna afectación coincide con esa búsqueda.</td></tr>`}</tbody>
      </table>
    </div>
    ${renderModal()}
  `;
}

/* ——— Render y eventos ——— */

const renderizadores = {
  proyectos: renderProyectos,
  obras: renderObras,
  inmuebles: renderInmuebles,
  zonas: renderZonas,
  afectaciones: renderAfectaciones,
};

function pintar(opciones = {}) {
  nav.querySelectorAll("button").forEach((boton) => {
    if (boton.dataset.vista === estado.vista) boton.setAttribute("aria-current", "page");
    else boton.removeAttribute("aria-current");
  });
  renderizadores[estado.vista]();
  const campoBusqueda = lienzo.querySelector(".busqueda");
  if (campoBusqueda && opciones.enfocarBusqueda) campoBusqueda.focus();
  if (campoBusqueda && Number.isInteger(opciones.cursor)) {
    campoBusqueda.focus();
    campoBusqueda.setSelectionRange(opciones.cursor, opciones.cursor);
  }
}

function leerFormulario(form) {
  const datos = Object.fromEntries(new FormData(form).entries());
  for (const clave of Object.keys(datos)) {
    if (clave.startsWith("id_")) datos[clave] = Number(datos[clave]);
    if (datos[clave] === "") datos[clave] = null;
  }
  return datos;
}

function sincronizarEspaciosObra(selectArea) {
  const idArea = Number(selectArea.value);
  const selectEspacio = document.querySelector("#select-espacio-obra");
  if (!selectEspacio) return;
  const espacios = estado.datos.espacio.filter((e) => e.id_area === idArea);
  selectEspacio.innerHTML = opcionesSelect(
    espacios,
    "id_espacio",
    "name_espacio",
    espacios[0]?.id_espacio,
    espacios.length ? "Elegir espacio" : "Sin espacios en esta área"
  );
}

async function conOcupado(fn) {
  if (estado.ocupado) return;
  estado.ocupado = true;
  const botones = document.querySelectorAll("#modal-formulario button, .modal-cabecera button");
  botones.forEach((b) => {
    b.disabled = true;
  });
  try {
    await fn();
  } finally {
    estado.ocupado = false;
  }
}

async function eliminarConfirmado(mensaje, ejecutar) {
  if (!window.confirm(mensaje)) return;
  await conOcupado(async () => {
    try {
      await ejecutar();
      await recargarDatos();
      estado.modal = null;
      mostrarAviso("Registro eliminado.");
    } catch (error) {
      mostrarAviso(error.message, "error");
    }
  });
}

async function manejarAccion(accion) {
  if (!accion) return;
  const [tipo, idRaw] = accion.split(":");
  const id = idRaw ? Number(idRaw) : null;
  const datos = estado.datos;

  switch (tipo) {
    case "cerrar-modal":
      cerrarModal();
      break;
    case "crear-proyecto":
      abrirProyecto();
      break;
    case "editar-proyecto":
      abrirProyecto(porId(datos.proyecto, "id_proyecto", id));
      break;
    case "eliminar-proyecto":
      await eliminarConfirmado(
        "¿Eliminar este proyecto? Fallará si tiene obras vinculadas.",
        async () => {
          await api("DELETE", `/api/proyectos/${id}`);
          if (estado.proyectoId === id) {
            const resto = estado.datos.proyecto.filter((p) => p.id_proyecto !== id);
            estado.proyectoId = resto[0]?.id_proyecto ?? null;
          }
        }
      );
      break;
    case "crear-obra":
      abrirObra();
      break;
    case "editar-obra":
      abrirObra(porId(datos.obra, "id_obra_proyecto", id));
      break;
    case "eliminar-obra":
      await eliminarConfirmado(
        "¿Eliminar esta obra? Fallará si tiene inmuebles vinculados.",
        () => api("DELETE", `/api/obras/${id}`)
      );
      break;
    case "crear-inmueble":
      abrirInmueble();
      break;
    case "editar-inmueble":
      abrirInmueble(porId(datos.inmuebles, "id_inmueble", id));
      break;
    case "eliminar-inmueble":
      await eliminarConfirmado(
        "¿Eliminar este inmueble? Fallará si algún proyecto lo usa como principal.",
        () => api("DELETE", `/api/inmuebles/${id}`)
      );
      break;
    case "crear-area":
      abrirArea();
      break;
    case "editar-area":
      abrirArea(porId(datos.area, "id_area", id));
      break;
    case "eliminar-area":
      await eliminarConfirmado(
        "¿Eliminar esta área? Fallará si tiene espacios, obras o afectaciones.",
        () => api("DELETE", `/api/areas/${id}`)
      );
      break;
    case "crear-espacio":
      abrirEspacio();
      break;
    case "crear-espacio-en":
      abrirEspacio(null, id);
      break;
    case "editar-espacio":
      abrirEspacio(porId(datos.espacio, "id_espacio", id));
      break;
    case "eliminar-espacio":
      await eliminarConfirmado(
        "¿Eliminar este espacio? Fallará si hay obras que lo usan.",
        () => api("DELETE", `/api/espacios/${id}`)
      );
      break;
    case "crear-afectacion":
      abrirAfectacion();
      break;
    case "editar-afectacion":
      abrirAfectacion(porId(datos.afectacion, "id_afectacion", id));
      break;
    case "eliminar-afectacion":
      await eliminarConfirmado("¿Eliminar esta afectación?", () =>
        api("DELETE", `/api/afectaciones/${id}`)
      );
      break;
    default:
      break;
  }
}

async function manejarSubmit(form) {
  const tipo = form.dataset.form;
  const cuerpo = leerFormulario(form);
  const id = estado.modal?.id;

  await conOcupado(async () => {
    try {
      switch (tipo) {
        case "crear-proyecto": {
          const creado = await api("POST", "/api/proyectos", cuerpo);
          if (creado?.id_proyecto) estado.proyectoId = creado.id_proyecto;
          mostrarAviso("Proyecto creado.");
          break;
        }
        case "editar-proyecto":
          await api("PUT", `/api/proyectos/${id}`, cuerpo);
          mostrarAviso("Proyecto actualizado.");
          break;
        case "crear-obra":
          await api("POST", "/api/obras", cuerpo);
          mostrarAviso("Obra creada.");
          break;
        case "editar-obra":
          await api("PUT", `/api/obras/${id}`, cuerpo);
          mostrarAviso("Obra actualizada.");
          break;
        case "crear-inmueble":
          await api("POST", "/api/inmuebles", cuerpo);
          mostrarAviso("Inmueble creado.");
          break;
        case "editar-inmueble":
          await api("PUT", `/api/inmuebles/${id}`, cuerpo);
          mostrarAviso("Inmueble actualizado.");
          break;
        case "crear-area":
          await api("POST", "/api/areas", cuerpo);
          mostrarAviso("Área creada.");
          break;
        case "editar-area":
          await api("PUT", `/api/areas/${id}`, cuerpo);
          mostrarAviso("Área actualizada.");
          break;
        case "crear-espacio":
          await api("POST", "/api/espacios", cuerpo);
          mostrarAviso("Espacio creado.");
          break;
        case "editar-espacio":
          await api("PUT", `/api/espacios/${id}`, cuerpo);
          mostrarAviso("Espacio actualizado.");
          break;
        case "crear-afectacion":
          await api("POST", "/api/afectaciones", cuerpo);
          mostrarAviso("Afectación registrada.");
          break;
        case "editar-afectacion":
          await api("PUT", `/api/afectaciones/${id}`, cuerpo);
          mostrarAviso("Afectación actualizada.");
          break;
        default:
          break;
      }
      await recargarDatos();
      estado.modal = null;
      pintar();
    } catch (error) {
      mostrarAviso(error.message, "error");
    }
  });
}

nav.addEventListener("click", (evento) => {
  const boton = evento.target.closest("button[data-vista]");
  if (!boton) return;
  estado.vista = boton.dataset.vista;
  estado.filtro = "";
  estado.modal = null;
  pintar();
});

lienzo.addEventListener("click", async (evento) => {
  if (evento.target.classList.contains("modal-fondo")) {
    cerrarModal();
    return;
  }

  const ficha = evento.target.closest("[data-proyecto]");
  if (ficha && !evento.target.closest("[data-accion]")) {
    estado.proyectoId = Number(ficha.dataset.proyecto);
    pintar();
    return;
  }

  const accionEl = evento.target.closest("[data-accion]");
  if (!accionEl || accionEl.classList.contains("modal-fondo")) return;

  evento.preventDefault();
  evento.stopPropagation();
  await manejarAccion(accionEl.dataset.accion);
});

lienzo.addEventListener("change", (evento) => {
  if (evento.target.matches('[data-sincroniza="espacios-obra"]')) {
    sincronizarEspaciosObra(evento.target);
  }
});

lienzo.addEventListener("submit", async (evento) => {
  const form = evento.target.closest("#modal-formulario");
  if (!form) return;
  evento.preventDefault();
  await manejarSubmit(form);
});

lienzo.addEventListener("input", (evento) => {
  if (!evento.target.classList.contains("busqueda")) return;
  estado.filtro = evento.target.value;
  pintar({ cursor: evento.target.selectionStart });
});

document.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape" && estado.modal) cerrarModal();
});

recargarDatos()
  .then(() => pintar())
  .catch((error) => {
    lienzo.innerHTML = `<p class="error">${esc(error.message)}</p>`;
  });
