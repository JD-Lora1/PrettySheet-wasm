cd ~/projects/PrettySheet-wasm/engine/
rm -rf ../client/src/wasm
mkdir -p ../client/src/wasm
cargo clean
wasm-pack build --target web --release
cp -r pkg/* ../client/src/wasm/
cd ..
cd client/
rm -rf node_modules/.vite
npm run dev -- --force