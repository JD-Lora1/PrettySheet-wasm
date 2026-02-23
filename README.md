PrettySheet-wasm 🚀

Optimización de Excel mediante Rust (WASM) + React.
🛠️ Desarrollo (Modo Dev)

    Motor (Rust):
    Entra a la carpeta del motor y compila los bindings:
    Bash

    cd engine
    wasm-pack build --target web

    Cliente (React):
    En otra terminal, instala las dependencias e inicia Vite:
    Bash

    cd client
    npm install
    npm run dev

📦 Producción (Build)

    Compilar Rust (Optimizado):
    Bash

    cd engine
    wasm-pack build --target web --release

    Compilar React:
    Bash

    cd client
    npm run build

    Probar Build:
    Bash

    npx serve dist

cd ~/projects/PrettySheet-wasm/engine/
rm -rf ../client/src/wasm
mkdir -p ../client/src/wasm
cargo clean
wasm-pack build --target web
cp -r pkg/* ../client/src/wasm/
cd ..
cd client
npm run dev
