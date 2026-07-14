use image::DynamicImage;
use serde::Serialize;

#[derive(Serialize, Clone)]
pub struct OcrWord {
    pub text: String,
    pub x: i32,
    pub y: i32,
    pub width: i32,
    pub height: i32,
}

#[derive(Serialize, Clone)]
pub struct OcrBlock {
    pub text: String,
    pub x: i32,
    pub y: i32,
    pub width: i32,
    pub height: i32,
    pub words: Vec<OcrWord>,
}

#[derive(Serialize, Clone)]
pub struct OcrResult {
    pub text: String,
    pub blocks: Vec<OcrBlock>,
}

/// Minimum Tesseract confidence for a word to be kept.
const MIN_CONFIDENCE: f32 = 40.0;

/// Runs Tesseract on `image` and groups the recognised words into blocks
/// (one block per detected text line), preserving bounding boxes so the
/// overlay can place pins over the source content.
pub fn recognize(image: &DynamicImage) -> Result<OcrResult, String> {
    let img = rusty_tesseract::Image::from_dynamic_image(image)
        .map_err(|e| format!("image conversion failed: {e}"))?;

    // Empty lang lets Tesseract fall back to the installed default language.
    let args = rusty_tesseract::Args::default();
    let data = rusty_tesseract::image_to_data(&img, &args)
        .map_err(|e| format!("tesseract failed: {e}"))?;

    let mut blocks: Vec<OcrBlock> = Vec::new();
    let mut current_key: Option<(u32, u32, u32)> = None;
    let mut full_text = String::new();

    for d in data.data.iter() {
        // Level 5 entries are individual words.
        if d.level != 5 {
            continue;
        }
        let text = d.text.trim().to_string();
        if text.is_empty() || d.conf < MIN_CONFIDENCE {
            continue;
        }

        let key = (d.block_num as u32, d.par_num as u32, d.line_num as u32);
        let word = OcrWord {
            text: text.clone(),
            x: d.left,
            y: d.top,
            width: d.width,
            height: d.height,
        };

        if current_key != Some(key) {
            current_key = Some(key);
            blocks.push(OcrBlock {
                text: String::new(),
                x: d.left,
                y: d.top,
                width: d.width,
                height: d.height,
                words: Vec::new(),
            });
            if !full_text.is_empty() {
                full_text.push('\n');
            }
        }

        let block = blocks.last_mut().unwrap();
        // Grow the block bounding box to enclose the new word.
        let right = (block.x + block.width).max(word.x + word.width);
        let bottom = (block.y + block.height).max(word.y + word.height);
        block.x = block.x.min(word.x);
        block.y = block.y.min(word.y);
        block.width = right - block.x;
        block.height = bottom - block.y;

        if !block.text.is_empty() {
            block.text.push(' ');
            full_text.push(' ');
        }
        block.text.push_str(&text);
        full_text.push_str(&text);
        block.words.push(word);
    }

    Ok(OcrResult {
        text: full_text,
        blocks,
    })
}
