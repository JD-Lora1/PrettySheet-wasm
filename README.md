# PrettySheet-wasm 🚀

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Deploy PrettySheet wasm](https://github.com/JD-Lora1/PrettySheet-WASM/actions/workflows/deploy.yml/badge.svg)](https://github.com/JD-Lora1/PrettySheet-WASM/actions)

Optimización y formateo automático de archivos Excel utilizando la potencia de **Rust (WebAssembly)** en el backend y la agilidad de **React + Vite** en el frontend.

## Arquitectura
Este proyecto es un **monorepo** diseñado para procesar archivos pesados directamente en el navegador del cliente, sin enviar datos a un servidor:

- **`/engine`**: Motor lógico en Rust. Utiliza `calamine` para lectura y `rust_xlsxwriter` para generación de archivos.
- **`/client`**: Aplicación React (TypeScript) que consume el módulo WASM y gestiona la UI con Tailwind CSS.

---

## Configuración de Desarrollo

### 1. Requisitos previos
* [Rust & Cargo](https://rustup.rs/)
* [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)
* [Node.js & npm](https://nodejs.org/)

### 2. Preparar el Motor (Rust)
Desde la raíz del proyecto, compila los bindings de WebAssembly:
```bash
cd engine
wasm-pack build --target web
```

3. Sincronizar y Lanzar el Cliente (React)

Debes copiar los archivos generados en engine/pkg hacia la carpeta de fuentes del cliente:
```bash
# Crear directorio si no existe y copiar
mkdir -p client/src/wasm
cp -r engine/pkg/* client/src/wasm/

# Iniciar React
cd client
npm install
npm run dev
```

## Script de "One-Shot" (WSL/Linux)

Copia y pega este comando en tu terminal de WSL para limpiar, compilar y ejecutar todo el flujo automáticamente:
```bash
cd engine && cargo clean && wasm-pack build --target web && \
rm -rf ../client/src/wasm && mkdir -p ../client/src/wasm && \
cp -r pkg/* ../client/src/wasm/ && cd ../client && npm run dev
```

## Producción (Build)

Compilar Rust en modo Release:
```bash

cd engine
wasm-pack build --target web --release
```
Compilar Frontend:
```bash
cd client
npm run build
```

## Troubleshooting (Errores Comunes)
### RuntimeError: unreachable executed

Si ves este error acompañado de un mensaje sobre time not implemented:

Asegúrate de que el Cargo.toml tenga la feature js-sys activada para rust_xlsxwriter.

En el código de Rust, utiliza workbook.set_creation_time(0); para evitar llamadas al reloj del sistema.

Limpia el cache del navegador o abre una pestaña de incógnito para asegurar que se cargue el nuevo binario .wasm.

## 📄 Licence
Apache 2.0