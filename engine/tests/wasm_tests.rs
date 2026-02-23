use wasm_bindgen_test::*;
use engine::{process_excel, PipelineConfig};

// wasm_bindgen_test_configure!(run_in_browser);

fn sample_excel() -> Vec<u8> {
    use rust_xlsxwriter::Workbook;

    let mut wb = Workbook::new();
    let ws = wb.add_worksheet();

    ws.write_string(0, 0, "Name").unwrap();
    ws.write_string(1, 0, "Juan").unwrap();

    wb.save_to_buffer().unwrap()
}

#[wasm_bindgen_test]
fn test_pipeline_ok() {
    let data = sample_excel();
    let config = PipelineConfig::new(true, true, true);

    let result = process_excel(&data, config);
    assert!(result.is_ok());
}

#[wasm_bindgen_test]
fn test_no_features() {
    let data = sample_excel();
    let config = PipelineConfig::new(false, false, false);

    assert!(process_excel(&data, config).is_ok());
}

#[wasm_bindgen_test]
fn test_header_only() {
    let data = sample_excel();
    let config = PipelineConfig::new(true, false, false);

    assert!(process_excel(&data, config).is_ok());
}

#[wasm_bindgen_test]
fn test_autofit_only() {
    let data = sample_excel();
    let config = PipelineConfig::new(false, true, false);

    assert!(process_excel(&data, config).is_ok());
}

#[wasm_bindgen_test]
fn test_freeze_only() {
    let data = sample_excel();
    let config = PipelineConfig::new(false, false, true);

    assert!(process_excel(&data, config).is_ok());
}