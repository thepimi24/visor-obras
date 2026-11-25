-- Esquema y datos de ejemplo a partir del diagrama E/R
-- (Proyecto, Obra, Inmuebles, Espacio, Area, Afectacion).
--
-- Motor: SQLite 3
-- Ejecutar:
--   sqlite3 proyecto_demo.db < esquema_proyecto.sql
--
-- Lectura del diagrama:
--   * Un proyecto tiene varias obras.          obra.id_proyecto
--   * Una obra pertenece a un espacio y a un   obra.id_espacio
--     área de trabajo.                         obra.id_area_trabajo
--   * Un área agrupa varios espacios.          espacio.id_area
--   * Una obra puede vincular varios inmuebles. inmuebles.id_obra_proyecto
--   * Un proyecto apunta a un inmueble.        proyecto.id_inmueble
--   * Un área tiene varias afectaciones.       afectacion.id_area
--
-- Columnas que el dibujo relaciona con una línea y no lista
-- dentro de la entidad. Se agregan para poder ejecutar el modelo:
--   * obra.id_proyecto
--   * afectacion.id_area
--
-- proyecto → inmuebles → obra → proyecto es un ciclo.
-- La clave proyecto.id_inmueble queda diferida y se valida al COMMIT.

PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS afectacion;
DROP TABLE IF EXISTS inmuebles;
DROP TABLE IF EXISTS obra;
DROP TABLE IF EXISTS proyecto;
DROP TABLE IF EXISTS espacio;
DROP TABLE IF EXISTS area;

PRAGMA foreign_keys = ON;

CREATE TABLE area (
    id_area          INTEGER PRIMARY KEY,
    name_area        TEXT NOT NULL,
    descripcion_area TEXT,
    notas_area       TEXT
);

CREATE TABLE espacio (
    id_espacio   INTEGER PRIMARY KEY,
    name_espacio TEXT NOT NULL,
    id_area      INTEGER NOT NULL REFERENCES area (id_area)
);

CREATE TABLE proyecto (
    id_proyecto   INTEGER PRIMARY KEY,
    check_estatus TEXT NOT NULL,
    name_contact  TEXT NOT NULL,
    descripcion   TEXT,
    id_inmueble   INTEGER NOT NULL,
    ubicacion     TEXT NOT NULL,
    FOREIGN KEY (id_inmueble) REFERENCES inmuebles (id_inmueble)
        DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE obra (
    id_obra_proyecto     INTEGER PRIMARY KEY,
    name_obra_proyecto   TEXT NOT NULL,
    estado_obra_proyecto TEXT NOT NULL,
    descripcion_obra     TEXT,
    id_area_trabajo      INTEGER NOT NULL REFERENCES area (id_area),
    notas_obra           TEXT,
    id_espacio           INTEGER NOT NULL REFERENCES espacio (id_espacio),
    id_proyecto          INTEGER NOT NULL REFERENCES proyecto (id_proyecto)
);

CREATE TABLE inmuebles (
    id_inmueble       INTEGER PRIMARY KEY,
    name_inmueble     TEXT NOT NULL,
    id_obra_proyecto  INTEGER NOT NULL REFERENCES obra (id_obra_proyecto),
    estado_inmueble   TEXT NOT NULL,
    name_propietario  TEXT NOT NULL,
    name_condominio   TEXT,
    name_residencia   TEXT
);

CREATE TABLE afectacion (
    id_afectacion     INTEGER PRIMARY KEY,
    name_afectacion   TEXT NOT NULL,
    name_especialidad TEXT NOT NULL,
    id_area           INTEGER NOT NULL REFERENCES area (id_area)
);

CREATE INDEX idx_espacio_area ON espacio (id_area);
CREATE INDEX idx_proyecto_inmueble ON proyecto (id_inmueble);
CREATE INDEX idx_obra_area ON obra (id_area_trabajo);
CREATE INDEX idx_obra_espacio ON obra (id_espacio);
CREATE INDEX idx_obra_proyecto ON obra (id_proyecto);
CREATE INDEX idx_inmuebles_obra ON inmuebles (id_obra_proyecto);
CREATE INDEX idx_afectacion_area ON afectacion (id_area);

BEGIN;

INSERT INTO area (id_area, name_area, descripcion_area, notas_area) VALUES
    (1, 'Piso 4 - Torre Norte',
        'Zona residencial en remodelación, apartamentos 4A a 4D.',
        'Acceso de materiales por el ascensor de servicio.'),
    (2, 'Azotea - Torre Norte',
        'Cubierta principal y cuartos técnicos.',
        'Coordinar con administración cualquier corte de agua.'),
    (3, 'Planta baja',
        'Locales comerciales y acceso principal.',
        'Horario de trabajo de 8:00 a 17:00 para no cerrar el lobby.'),
    (4, 'Sótano 1',
        'Estacionamientos y rampa de acceso.',
        'Hay iluminación provisional en el eje central.');

INSERT INTO espacio (id_espacio, name_espacio, id_area) VALUES
    (1, 'Sala-comedor',           1),
    (2, 'Cocina',                 1),
    (3, 'Baño principal',         1),
    (4, 'Dormitorio principal',   1),
    (5, 'Losa de cubierta',       2),
    (6, 'Cuarto de máquinas',     2),
    (7, 'Local comercial 2',      3),
    (8, 'Lobby',                  3),
    (9, 'Estacionamiento 18',     4),
    (10, 'Rampa de acceso',       4);

INSERT INTO proyecto (
    id_proyecto, check_estatus, name_contact, descripcion, id_inmueble, ubicacion
) VALUES
    (1, 'Activo', 'Ana Rivas',
        'Remodelación integral del apartamento 4B: redistribución de la sala, baño y acabados.',
        1, 'Piso 4, Torre Norte, Condominio Los Robles'),
    (2, 'Activo', 'Carlos Mendoza',
        'Impermeabilización de la cubierta y sellado del cuarto de máquinas.',
        2, 'Azotea, Torre Norte, Condominio Los Robles'),
    (3, 'En revisión', 'María Fernanda López',
        'Adecuación del local comercial 2 para una oficina de arquitectura.',
        3, 'Planta baja, Residencia Plaza del Este'),
    (4, 'En pausa', 'Junta de condominio',
        'Reparación de filtraciones en la losa del estacionamiento.',
        4, 'Sótano 1, Condominio Los Robles');

INSERT INTO obra (
    id_obra_proyecto, name_obra_proyecto, estado_obra_proyecto,
    descripcion_obra, id_area_trabajo, notas_obra, id_espacio, id_proyecto
) VALUES
    (1, 'Adecuación de espacios interiores', 'En ejecución',
        'Demolición del tabique entre sala y cocina, y recomposición de pisos.',
        1, 'El mobiliario quedó protegido en el dormitorio de servicio.', 1, 1),
    (2, 'Renovación sanitaria del baño', 'Planificada',
        'Cambio de la red de desagüe y de los aparatos sanitarios.',
        1, 'Los sanitarios llegan la próxima semana.', 3, 1),
    (3, 'Acabados del dormitorio', 'Planificada',
        'Estuco, pintura y guardaescobas.',
        1, 'La propietaria eligió blanco hueso.', 4, 1),
    (4, 'Reemplazo de membrana de cubierta', 'En ejecución',
        'Retiro de la membrana asfáltica y colocación de impermeabilizante líquido.',
        2, 'Avanzar por tramos para no dejar la losa expuesta.', 5, 2),
    (5, 'Sellado del cuarto de máquinas', 'Planificada',
        'Tratamiento de juntas y media caña perimetral.',
        2, NULL, 6, 2),
    (6, 'Redistribución eléctrica del local', 'En revisión',
        'Tablero nuevo y circuitos para ocho puestos de trabajo.',
        3, 'Falta el dictamen de la especialidad eléctrica.', 7, 3),
    (7, 'Tratamiento de filtración en losa', 'En pausa',
        'Inyección de fisuras y reposición de la canaleta de drenaje.',
        4, 'Detenida por la temporada de lluvia.', 9, 4);

INSERT INTO inmuebles (
    id_inmueble, name_inmueble, id_obra_proyecto, estado_inmueble,
    name_propietario, name_condominio, name_residencia
) VALUES
    (1, 'Apartamento 4B', 1, 'En remodelación',
        'Ana Rivas', 'Condominio Los Robles', 'Residencia Torre Norte'),
    (2, 'Azotea y cuartos técnicos', 4, 'En obra',
        'Condominio Los Robles', 'Condominio Los Robles', 'Residencia Torre Norte'),
    (3, 'Local comercial 2', 6, 'En adecuación',
        'María Fernanda López', 'Condominio Plaza del Este', 'Residencia Plaza del Este'),
    (4, 'Estacionamiento 18', 7, 'Fuera de servicio',
        'Condominio Los Robles', 'Condominio Los Robles', 'Residencia Torre Norte'),
    (5, 'Apartamento 12A', 4, 'Ocupado',
        'Jorge Paredes', 'Condominio Los Robles', 'Residencia Torre Norte');

INSERT INTO afectacion (id_afectacion, name_afectacion, name_especialidad, id_area) VALUES
    (1, 'Fisura longitudinal en la losa de entrepiso', 'Estructura', 1),
    (2, 'Humedad en el muro del baño', 'Impermeabilización', 1),
    (3, 'Membrana asfáltica agrietada', 'Impermeabilización', 2),
    (4, 'Junta dilatada abierta en el cuarto de máquinas', 'Impermeabilización', 2),
    (5, 'Tablero eléctrico sin capacidad disponible', 'Electricidad', 3),
    (6, 'Filtración activa en la losa del estacionamiento', 'Plomería', 4),
    (7, 'Canaleta de drenaje obstruida', 'Plomería', 4);

COMMIT;
