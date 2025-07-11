import { createCanvas, loadImage, registerFont } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import { findProjectRoot } from './tools.js';

// تسجيل الخطوط
const fontFilePath = path.join(findProjectRoot(), 'fonts', 'NotoSansJP-Bold.ttf');
const secondFontFilePath = path.join(findProjectRoot(), 'fonts', 'boldGG.ttf');

// التأكد من وجود ملفات الخط
console.log(fs.existsSync(fontFilePath) ? '✅ Font file found:' : '❌ Font file not found:', fontFilePath);
console.log(fs.existsSync(secondFontFilePath) ? '✅ Second font file found:' : '❌ Second font file not found:', secondFontFilePath);

// تسجيل الخطوط
registerFont(secondFontFilePath, { family: 'ggsansmonobold' });
registerFont(fontFilePath, { family: 'NotoSansJPBold' });


// دالة التحقق من دعم الخط
function isFontSupportingText(ctx: any, font: string, text: string): boolean {
  ctx.font = `20px ${font}`;
  const widthWithFont = ctx.measureText(text).width;

  ctx.font = `20px serif`; // fallback baseline
  const widthWithFallback = ctx.measureText(text).width;
  console.log(`🔍 Measuring text "${text}" with font "${font}": ${widthWithFont}px vs fallback: ${widthWithFallback}px`);

  // إذا الفرق كبير، الخط يدعم النص
  return Math.abs(widthWithFont - widthWithFallback) < 5;
}
//renderCanvas("https://cdn.discordapp.com/clan-badges/1369993100570923039/80e5e6bdbdd81e95b650670b2afba2cc.png", "ＳＮＱ")
function hasUniqueUnicode(str: string): boolean {
  // Check if any character has code point > 127 (non-ASCII)
  return [...str].some(char => char.charCodeAt(0) > 127);
}
// دالة الرسم
export async function renderCanvas(iconUrl: string, text: string = 'Ａｕｒａ') {
  const width = 256;
  const height = width / 2.87640449438;
  const cornerRadius = Math.min(width, height) * 0.20;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // رسم الخلفية بزوايا دائرية
  ctx.fillStyle = '#2F2F34';
  drawRoundedRect(ctx, 0, 0, width, height, cornerRadius);

  // إعدادات الأيقونة والخط

  const boost = hasUniqueUnicode(text) ? 0.62 : 0.7; // زيادة حجم الأيقونة إذا كان النص يحتوي على رموز فريدة
  const marginBoost = hasUniqueUnicode(text) ? 0.12 : 0.08; // زيادة الهامش إذا كان النص يحتوي على رموز فريدة
  const iconSize = height * 0.65 - (text.length >= 4 && hasUniqueUnicode(text) ? text.length*2 : 0) // زيادة حجم الخط بناءً على طول النص)
  const iconPadding = width * 0.05;
  const marginIcon = width * marginBoost; // هامش بين الأيقونة وال
  const fontSize = height * (boost) - (text.length >= 4 && hasUniqueUnicode(text) ? text.length*2 : 0) // زيادة حجم الخط بناءً على طول النص

  // تحميل الأيقونة
  const icon = await loadImage(iconUrl);
  const iconX = iconPadding;
  const iconY = (height - iconSize) / 2;
  ctx.drawImage(icon, iconX, iconY, iconSize, iconSize);

  // تحديد الخط بناءً على دعم الرموز
  const fontPrimary = 'ggsansmonobold';
  const fontFallback = 'NotoSansJPBold';
  let finalFont = fontPrimary;

  if (!isFontSupportingText(ctx, fontPrimary, text)) {
    finalFont = fontFallback;
  }

  // إعداد النص
  ctx.font = `${fontSize}px ${finalFont}`;
 

  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // مركز النص
  const textX = width / 2 + marginIcon
  const textY = height / 2 - (fontSize / 12)
  ctx.fillText(text, textX, textY);

  // حفظ الصورة
 
  const buffer = canvas.toBuffer('image/png');
 // fs.writeFileSync(path.join(findProjectRoot(), 'tag.png'), buffer);
  return  splitImageByWidth(buffer, path.join(findProjectRoot(), 'output'));
}
async function splitImageByWidth(imageInput: string | Buffer, outputDir: string): Promise<Buffer[]> {
  const image = await loadImage(imageInput);
  const partWidth = 128;
  const parts = Math.ceil(image.width / partWidth);

  // تأكد من وجود مجلد الإخراج
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const buffers: Buffer[] = [];

  for (let i = 0; i < parts; i++) {
    const canvas = createCanvas(partWidth, image.height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      image,
      i * partWidth, 0,
      partWidth, image.height,
      0, 0,
      partWidth, image.height
    );

    const buffer = canvas.toBuffer('image/png');
    buffers.push(buffer);
    buffers.forEach((buf, index) => {
      //fs.writeFileSync(path.join(findProjectRoot(), `${index}.png`), buf);
    });
  }


  return buffers;
}
// دالة رسم مستطيل بزوايا دائرية
function drawRoundedRect(ctx: any, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}

// Call the function (optional)

