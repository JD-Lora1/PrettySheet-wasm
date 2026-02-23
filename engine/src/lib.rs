use wasm_bindgen::prelude::*;
use rust_xlsxwriter::{Workbook, DocProperties, Format, Color};
use calamine::{Reader, Xlsx, DataType};
use std::io::Cursor;

pub mod preview;
pub use preview::extract_preview;

#[wasm_bindgen(start)]
pub fn init() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub struct PipelineConfig {
    pub header_style: bool,
    pub autofit: bool,
    pub freeze_header: bool,
    header_color: String, // privado, para wasm_bindgen
}

#[wasm_bindgen]
impl PipelineConfig {
    #[wasm_bindgen(constructor)]
    pub fn new(header_style: bool, autofit: bool, freeze_header: bool, header_color: String) -> PipelineConfig {
        PipelineConfig {
            header_style,
            autofit,
            freeze_header,
            header_color,
        }
    }

    #[wasm_bindgen(getter)]
    pub fn header_color(&self) -> String {
        self.header_color.clone()
    }
}

#[wasm_bindgen]
pub fn process_excel(data: &[u8], config: &PipelineConfig) -> Result<Vec<u8>, JsValue> {
    if data.is_empty() {
        return Err(JsValue::from_str("Input vacío"));
    }
    
    let mut excel = Xlsx::new(Cursor::new(data))
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let range = excel
        .worksheet_range_at(0)
        .ok_or_else(|| JsValue::from_str("No sheet found"))?
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let mut workbook = Workbook::new();
    workbook.set_properties(&DocProperties::new());

    let worksheet = workbook.add_worksheet();

    // Convertimos color "#RRGGBB" a u32
    let header_rgb = u32::from_str_radix(&config.header_color().trim_start_matches('#'), 16)
        .map_err(|_| JsValue::from_str("Invalid header color format"))?;

    let header_format = Format::new()
        .set_background_color(Color::RGB(header_rgb));

    let mut col_widths: Vec<usize> = vec![];

    for (r, row) in range.rows().enumerate() {
        for (c, cell) in row.iter().enumerate() {

            if col_widths.len() <= c { col_widths.push(0); }

            let text = cell.to_string();
            if text.len() > col_widths[c] { col_widths[c] = text.len(); }

            let row_u32 = r as u32;
            let col_u16 = c as u16;

            if r == 0 && config.header_style {
                worksheet.write_string_with_format(row_u32, col_u16, &text, &header_format)
                    .map_err(|e| JsValue::from_str(&e.to_string()))?;
                continue;
            }

            if let Some(v) = cell.get_float() {
                worksheet.write_number(row_u32, col_u16, v)
                    .map_err(|e| JsValue::from_str(&e.to_string()))?;
            } else if let Some(v) = cell.get_int() {
                worksheet.write_number(row_u32, col_u16, v as f64)
                    .map_err(|e| JsValue::from_str(&e.to_string()))?;
            } else if let Some(s) = cell.get_string() {
                worksheet.write_string(row_u32, col_u16, s)
                    .map_err(|e| JsValue::from_str(&e.to_string()))?;
            } else {
                worksheet.write_string(row_u32, col_u16, &text)
                    .map_err(|e| JsValue::from_str(&e.to_string()))?;
            }
        }
    }

    if config.autofit {
        for (col, width) in col_widths.iter().enumerate() {
            worksheet.set_column_width(col as u16, (*width as f64 * 1.2).min(80.0))
                .map_err(|e| JsValue::from_str(&e.to_string()))?;
        }
    }

    if config.freeze_header {
        worksheet.set_freeze_panes(1, 0)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
    }

    workbook.save_to_buffer().map_err(|e| JsValue::from_str(&e.to_string()))
}