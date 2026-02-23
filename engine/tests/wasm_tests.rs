use wasm_bindgen_test::*;
use engine::process_excel;

// wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
fn test_full_pipeline() {
    let data = include_bytes!("../tests/fixtures/valid_excel.xlsx");

    let result = process_excel(
        data,
        Some("#2563eb".to_string()),
        Some(25.0),
    );

    assert!(result.is_ok());
}