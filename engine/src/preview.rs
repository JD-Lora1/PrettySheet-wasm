use wasm_bindgen::prelude::*;
use serde::Serialize;
use serde_wasm_bindgen::to_value;
use calamine::{Reader, Xlsx};
use std::io::Cursor;

#[derive(Serialize)]
pub struct PreviewData {
    headers: Vec<String>,
    rows: Vec<Vec<String>>,
}

#[wasm_bindgen]
pub fn extract_preview(data: &[u8], max_rows: usize) -> Result<JsValue, JsValue> {
    let cursor = Cursor::new(data.to_vec());

    let mut workbook: Xlsx<_> =
        Xlsx::new(cursor).map_err(|e| JsValue::from_str(&e.to_string()))?;

    let sheet_name = workbook
        .sheet_names()
        .get(0)
        .ok_or_else(|| JsValue::from_str("No sheets found"))?
        .clone();

    let range = workbook
        .worksheet_range(&sheet_name)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let mut rows_iter = range.rows();

    // ✅ headers
    let headers: Vec<String> = if let Some(header_row) = rows_iter.next() {
        header_row.iter().map(|c| c.to_string()).collect()
    } else {
        vec![]
    };

    // ✅ rows
    let rows: Vec<Vec<String>> = rows_iter
        .take(max_rows)
        .map(|row| {
            row.iter()
                .map(|c| c.to_string())
                .collect::<Vec<String>>()
        })
        .collect();

    let preview = PreviewData { headers, rows };

    to_value(&preview).map_err(|e| JsValue::from_str(&e.to_string()))
}