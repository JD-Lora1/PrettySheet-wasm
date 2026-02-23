use wasm_bindgen_test::*;
use engine::extract_preview;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
fn preview_returns_value() {
    let data: Vec<u8> = include_bytes!("fixtures/valid_excel.xlsx").to_vec();

    let result = extract_preview(&data, 5);

    assert!(result.is_ok());
}

#[wasm_bindgen_test]
fn preview_limit_rows() {
    let data: Vec<u8> = include_bytes!("fixtures/valid_excel.xlsx").to_vec();

    let result = extract_preview(&data, 1).unwrap();

    let obj = js_sys::Object::from(result);
    let rows = js_sys::Reflect::get(&obj, &"rows".into()).unwrap();

    let length = js_sys::Array::from(&rows).length();
    assert!(length <= 1);
}