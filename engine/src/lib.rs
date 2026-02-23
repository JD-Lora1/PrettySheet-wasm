use wasm_bindgen::prelude::*;
use rust_xlsxwriter::*;
use calamine::{Reader, Xlsx};
use std::io::Cursor;
use serde::Serialize;

#[derive(Serialize)]
pub struct ExcelResult {
    pub headers: Vec<String>,
    pub preview: Vec<Vec<String>>,
    pub file_bytes: Vec<u8>,
}

#[wasm_bindgen]
pub fn initialize() {
    // Set panic hook once during initialization
    std::panic::set_hook(Box::new(console_error_panic_hook::hook));
    web_sys::console::log_1(&"Panic hook set successfully".into());
}

#[wasm_bindgen]
pub fn process_excel(data: &[u8], auto_fit: bool, header_color: String) -> Result<JsValue, JsValue> {
    // Log the start of the function
    web_sys::console::log_1(&"Iniciando Rust process_excel...".into());

    // Log input data size
    web_sys::console::log_1(&format!("Input data size: {} bytes", data.len()).into());

    // Validate input data
    if data.is_empty() {
        let err_msg = "Error: Input data is empty";
        web_sys::console::log_1(&err_msg.into());
        return Err(JsValue::from_str(err_msg));
    }

    if !header_color.starts_with('#') || header_color.len() != 7 {
        let err_msg = format!("Error: Invalid header color format: {}", header_color);
        web_sys::console::log_1(&err_msg.clone().into());
        return Err(JsValue::from_str(&err_msg));
    }

    let mut cursor = Cursor::new(data);

    // Log reading the Excel file
    let mut excel = Xlsx::new(cursor).map_err(|e| {
        let err_msg = format!("Error Calamine: {}", e);
        web_sys::console::log_1(&err_msg.clone().into());
        JsValue::from_str(&err_msg)
    })?;

    let sheet_name = excel.sheet_names().get(0).cloned().ok_or_else(|| {
        let err_msg = "No se encontraron hojas en el Excel";
        web_sys::console::log_1(&err_msg.into());
        JsValue::from_str(err_msg)
    })?;

    web_sys::console::log_1(&format!("Sheet name: {}", sheet_name).into());

    let range = excel.worksheet_range(&sheet_name).map_err(|e| {
        let err_msg = format!("Error en rango: {}", e);
        web_sys::console::log_1(&err_msg.clone().into());
        JsValue::from_str(&err_msg)
    })?;

    let headers: Vec<String> = range.rows()
        .next()
        .map(|row| row.iter().map(|c| c.to_string()).collect())
        .unwrap_or_default();

    web_sys::console::log_1(&format!("Headers: {:?}", headers).into());

    let preview: Vec<Vec<String>> = range.rows()
        .skip(1)
        .take(5)
        .map(|row| row.iter().map(|c| c.to_string()).collect())
        .collect();

    web_sys::console::log_1(&format!("Preview data: {:?}", preview).into());

    // Generate Excel file
    let mut workbook = Workbook::new();

    let worksheet = workbook.add_worksheet();

    let hex = header_color.replace("#", "");
    let color_num = match u32::from_str_radix(&hex, 16) {
        Ok(num) => num,
        Err(_) => {
            let err_msg = format!("Error: Invalid color code: {}", header_color);
            web_sys::console::log_1(&err_msg.clone().into());
            return Err(JsValue::from_str(&err_msg));
        }
    };

    let format = Format::new()
        .set_background_color(Color::RGB(color_num))
        .set_font_color(Color::White);

    for (i, h) in headers.iter().enumerate() {
        worksheet.write_with_format(0, i as u16, h, &format).map_err(|e| {
            let err_msg = format!("Xlsxwriter error: {}", e);
            web_sys::console::log_1(&err_msg.clone().into());
            JsValue::from_str(&err_msg)
        })?;
    }

    if auto_fit {
        worksheet.autofit();
    }

    let file_bytes = workbook.save_to_buffer().map_err(|e| {
        let err_msg = format!("Error al guardar buffer: {}", e);
        web_sys::console::log_1(&err_msg.clone().into());
        JsValue::from_str(&err_msg)
    })?;

    web_sys::console::log_1(&format!("Generated file size: {} bytes", file_bytes.len()).into());

    // Return only the binary data as a Uint8Array
    Ok(js_sys::Uint8Array::from(&file_bytes[..]).into())
}