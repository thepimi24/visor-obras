#!/usr/bin/env python3
"""Sirve el visor y los datos de ejemplo desde proyecto_demo.db."""

import json
import sqlite3
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
STATIC = ROOT / "static"
DB = ROOT / "proyecto_demo.db"
HOST = "127.0.0.1"
PORT = 8765

TABLAS = ("area", "espacio", "proyecto", "obra", "inmuebles", "afectacion")


def leer_datos():
    conexion = sqlite3.connect(DB)
    conexion.row_factory = sqlite3.Row
    datos = {}
    try:
        for tabla in TABLAS:
            filas = conexion.execute(f"SELECT * FROM {tabla} ORDER BY 1").fetchall()
            datos[tabla] = [dict(fila) for fila in filas]
    finally:
        conexion.close()
    return datos


class Visor(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(STATIC), **kwargs)

    def do_GET(self):
        ruta = urlparse(self.path).path
        if ruta == "/api/datos":
            cuerpo = json.dumps(leer_datos(), ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(cuerpo)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(cuerpo)
            return
        if ruta == "/":
            self.path = "/index.html"
        return super().do_GET()


def main():
    if not DB.exists():
        raise SystemExit(f"No está la base de datos: {DB}")
    servidor = ThreadingHTTPServer((HOST, PORT), Visor)
    print(f"Visor en http://{HOST}:{PORT}")
    servidor.serve_forever()


if __name__ == "__main__":
    main()
