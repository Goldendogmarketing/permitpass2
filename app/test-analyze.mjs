import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';

async function createTestPlan() {
  const pdf = PDFDocument.create();
  const doc = await pdf;
  const page = doc.addPage([792, 612]); // 11x8.5 landscape
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Title block
  page.drawText('RESIDENTIAL FLOOR PLAN — SHEET A1', { x: 50, y: 570, size: 16, font: bold });
  page.drawText('Project: 1425 Oceanview Drive, Jacksonville, FL 32250', { x: 50, y: 550, size: 10, font });
  page.drawText('Designer: Coastal Design Group, PE', { x: 50, y: 535, size: 10, font });
  page.drawText('Date: 01/15/2026    Scale: 1/4" = 1\'-0"', { x: 50, y: 520, size: 10, font });
  page.drawText('FBC 8th Edition (2023) — Residential', { x: 50, y: 505, size: 10, font });

  // Room schedule
  page.drawText('ROOM SCHEDULE', { x: 50, y: 475, size: 12, font: bold });
  const rooms = [
    'Master Bedroom: 14\'-0" x 12\'-0" (168 SF)',
    'Bedroom 2: 12\'-0" x 10\'-0" (120 SF)',
    'Bedroom 3: 11\'-0" x 10\'-0" (110 SF)',
    'Living Room: 18\'-0" x 16\'-0" (288 SF)',
    'Kitchen: 14\'-0" x 12\'-0" (168 SF)',
    'Bathroom 1 (Master): 10\'-0" x 8\'-0" (80 SF)',
    'Bathroom 2: 8\'-0" x 6\'-0" (48 SF)',
    'Garage (2-car): 22\'-0" x 22\'-0" (484 SF)',
    'Foyer: 8\'-0" x 6\'-0" (48 SF)',
    'Hallway: 24\'-0" x 3\'-6"',
  ];
  rooms.forEach((r, i) => {
    page.drawText(r, { x: 60, y: 455 - i * 16, size: 9, font });
  });

  // Window schedule
  page.drawText('WINDOW SCHEDULE', { x: 400, y: 475, size: 12, font: bold });
  const windows = [
    'W1 - Master Bedroom: 3050 SH Egress, 30"W x 50"H, Sill 24"',
    'W2 - Bedroom 2: 3040 SH Egress, 30"W x 40"H, Sill 30"',
    'W3 - Bedroom 3: 2840 SH Egress, 28"W x 40"H, Sill 36"',
    'W4 - Living Room: 6050 Fixed, 60"W x 50"H',
    'W5 - Kitchen: 3636 Slider, 36"W x 36"H, Sill 42"',
    'W6 - Bathroom 1: 2424 Obscure, 24"W x 24"H, Sill 48"',
    'All windows: U-factor 0.35, SHGC 0.25',
    'Impact rated for HVHZ per FBC R301.2.1.2',
  ];
  windows.forEach((w, i) => {
    page.drawText(w, { x: 410, y: 455 - i * 16, size: 9, font });
  });

  // Stair details
  page.drawText('STAIR DETAILS', { x: 50, y: 280, size: 12, font: bold });
  const stairs = [
    'Stair A (Main to 2nd Floor):',
    '  Riser Height: 7-5/8" (14 risers)',
    '  Tread Depth: 10"',
    '  Stair Width: 36"',
    '  Headroom: 6\'-10"',
    '  Handrail Height: 36"',
    '  Guardrail at open side: 36" height, 3.5" baluster spacing',
  ];
  stairs.forEach((s, i) => {
    page.drawText(s, { x: 60, y: 260 - i * 14, size: 9, font });
  });

  // Electrical notes
  page.drawText('ELECTRICAL NOTES', { x: 400, y: 280, size: 12, font: bold });
  const electrical = [
    'Outlets per NEC 210.52: max 12\' spacing on all walls',
    'GFCI: Kitchen countertops, all bathrooms, garage, exterior',
    'AFCI: All bedrooms per NEC 210.12',
    'Smoke detectors: Each bedroom + hallway (interconnected)',
    'CO detectors: Each floor (gas water heater in garage)',
    '200A main panel in garage',
  ];
  electrical.forEach((e, i) => {
    page.drawText(e, { x: 410, y: 260 - i * 14, size: 9, font });
  });

  // Wind / structural
  page.drawText('STRUCTURAL / WIND NOTES', { x: 50, y: 155, size: 12, font: bold });
  const wind = [
    'Design Wind Speed: 150 mph (Ultimate)',
    'Exposure Category: C',
    'Wind-Borne Debris Region: Yes (HVHZ)',
    'Roof-to-wall: Simpson H2.5 hurricane clips at each truss',
    'All openings: Impact-rated or approved shutters',
  ];
  wind.forEach((w, i) => {
    page.drawText(w, { x: 60, y: 135 - i * 14, size: 9, font });
  });

  // Fire separation
  page.drawText('FIRE / ENERGY NOTES', { x: 400, y: 155, size: 12, font: bold });
  const fire = [
    'Garage-to-house wall: 1/2" Type X gypsum board',
    'Garage door to house: 20-min fire-rated, self-closing',
    'No openings from garage to sleeping rooms',
    'Ceiling insulation: R-38 blown fiberglass',
    'Wall insulation: R-13 batt',
    'Floor over unconditioned: R-19',
  ];
  fire.forEach((f, i) => {
    page.drawText(f, { x: 410, y: 135 - i * 14, size: 9, font });
  });

  const pdfBytes = await doc.save();
  fs.writeFileSync('test-plan.pdf', pdfBytes);
  console.log('Test plan PDF created: test-plan.pdf');
}

createTestPlan().catch(console.error);
