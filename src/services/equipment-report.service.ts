import { db } from '../config/database.js';
import {
  equipment, departments, projects, acquisitionSources, equipmentTypes,
} from '../db/schema/index.js';
import { eq, lte, and, isNull } from 'drizzle-orm';
import puppeteer from 'puppeteer';

export const equipmentReportService = {
  generateSurveyPdf: async (params: {
    budgetYear: number;
    departmentId?: number;
  }): Promise<Buffer> => {
    const { budgetYear, departmentId } = params;

    // 1. departments
    const deptList = departmentId
      ? await db.select().from(departments).where(eq(departments.id, departmentId))
      : await db.select().from(departments);

    // 2. equipment ที่ fiscalYear <= budgetYear
    const conditions: any[] = [
      isNull(equipment.deletedAt),
      lte(equipment.fiscalYear, budgetYear),
    ];
    if (departmentId) conditions.push(eq(equipment.departmentId, departmentId));

    const equipList = await db
      .select({
        equipmentNumber:     equipment.equipmentNumber,
        equipmentName:       equipment.equipmentName,
        status:              equipment.status,
        fiscalYear:          equipment.fiscalYear,
        departmentId:        equipment.departmentId,
        projectId:           equipment.projectId,
        acquisitionSourceId: equipment.acquisitionSourceId,
        acquisitionDate:     equipment.acquisitionDate,
        sizeDetail:          equipment.sizeDetail,
        equipmentTypeId:     equipment.equipmentTypeId,
      })
      .from(equipment)
      .where(and(...conditions));

    // 3. master data
    const [projectList, sourceList, typeList] = await Promise.all([
      db.select().from(projects).where(isNull(projects.deletedAt)),
      db.select().from(acquisitionSources),
      db.select().from(equipmentTypes),
    ]);

    const projectMap = Object.fromEntries(projectList.map(p => [p.id, p]));
    const sourceMap  = Object.fromEntries(sourceList.map(s => [s.id, s.name]));
    const typeMap    = Object.fromEntries(typeList.map(t => [t.id, t]));

    const today = new Date();
    const grouped: any[] = [];

    for (const dept of deptList) {
      const deptEquips = equipList.filter(e => e.departmentId === dept.id);
      if (!deptEquips.length) continue;

      // ✅ group ตาม fiscalYear → sourceName → projectId
      // โดย sourceName ดึงจาก project ไม่ใช่ equipment (เพื่อกัน split)
      const yearMap = new Map<number, Map<string, Map<number | null, any[]>>>();

      for (const eq_ of deptEquips) {
        const proj       = eq_.projectId ? projectMap[eq_.projectId] : null;
        // ใช้ acquisitionSource ของ project ถ้ามี ไม่งั้นใช้ของ equipment
        const srcId      = proj?.acquisitionSourceId ?? eq_.acquisitionSourceId;
        const sourceName = srcId ? (sourceMap[srcId] ?? 'ไม่ระบุ') : 'ไม่ระบุ';
        // ใช้ fiscalYear ของ project ถ้ามี ไม่งั้นใช้ของ equipment
        const year       = proj?.fiscalYear ?? eq_.fiscalYear ?? 0;
        const projId     = eq_.projectId ?? null;

        if (!yearMap.has(year)) yearMap.set(year, new Map());
        const srcMap = yearMap.get(year)!;
        if (!srcMap.has(sourceName)) srcMap.set(sourceName, new Map());
        const pMap = srcMap.get(sourceName)!;
        if (!pMap.has(projId)) pMap.set(projId, []);

        const type       = eq_.equipmentTypeId ? typeMap[eq_.equipmentTypeId] : null;
        const usefulLife = type?.usefulLife ?? 8;
        const acqDate    = eq_.acquisitionDate ? new Date(eq_.acquisitionDate) : null;
        const netAge     = acqDate
          ? parseFloat(((today.getTime() - acqDate.getTime()) / (1000 * 60 * 60 * 24 * 365)).toFixed(2))
          : 0;

        pMap.get(projId)!.push({ ...eq_, usefulLife, netAge });
      }

      const years: any[] = [];
      for (const [year, srcMap] of Array.from(yearMap.entries()).sort((a, b) => a[0] - b[0])) {
        const sources: any[] = [];
        for (const [sourceName, pMap] of srcMap) {
          const projs: any[] = [];
          for (const [projId, equips] of pMap) {
            const proj = projId ? projectMap[projId] : null;

            // ✅ Group ครุภัณฑ์ที่ชื่อ+ขนาดเหมือนกัน เป็น row เดียว นับ count แต่ละสถานะ
            const eqGroupMap = new Map<string, any[]>();
            for (const e of equips) {
              const key = `${e.equipmentName}||${e.sizeDetail ?? ''}`;
              if (!eqGroupMap.has(key)) eqGroupMap.set(key, []);
              eqGroupMap.get(key)!.push(e);
            }

            const equipGroups: any[] = [];
            for (const [key, items] of eqGroupMap) {
              const [name, size] = key.split('||');
              const cnt = { pending: 0, normal: 0, repair: 0, unavailable: 0, disposed: 0 };
              for (const item of items) {
                const s = item.status ?? 'normal';
                if (s === 'borrowed') { cnt.normal++; continue; }
                if (s in cnt) cnt[s as keyof typeof cnt]++;
              }
              const nums = items.map((e: any) => e.equipmentNumber).sort();
              const numRange = nums.length === 1
                ? nums[0]
                : `${nums[0]}<br/>ถึง ${nums[nums.length - 1].split('-').pop()}`;

              equipGroups.push({
                name,
                size:        size || '',
                numRange,
                pending:     cnt.pending,
                normal:      cnt.normal,
                repair:      cnt.repair,
                unavailable: cnt.unavailable,
                disposed:    cnt.disposed,
                usefulLife:  items[0].usefulLife,
                netAge:      items[0].netAge,
              });
            }

            projs.push({
              projectName: proj?.projectName ?? 'ไม่ระบุโครงการ',
              equipGroups,
            });
          }
          sources.push({ sourceName, projects: projs });
        }
        years.push({ fiscalYear: year, sources });
      }
      grouped.push({ deptName: dept.name, years });
    }

    // 4. HTML → PDF
    const html    = buildHTML({ budgetYear, grouped });
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const pg = await browser.newPage();
    await pg.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await pg.pdf({
      format:          'A4',
      landscape:       true,
      printBackground: true,
      margin:          { top: '1.5cm', bottom: '1.5cm', left: '1.5cm', right: '1.5cm' },
    });
    await browser.close();

    return pdf as Buffer;
  },
};

// ─── HTML Template ────────────────────────────────────────────────────────────
function buildHTML({ budgetYear, grouped }: any): string {
  let rows = '';
  let seq  = 1;

  for (const dept of grouped) {
    // Department header row
    rows += `
      <tr>
        <td colspan="10" class="dept-header">${dept.deptName}</td>
      </tr>`;

    for (const yr of dept.years) {
      for (const src of yr.sources) {
        // Source + Year header
        rows += `
          <tr>
            <td colspan="10" class="source-header">
              ${src.sourceName} (งบประมาณปี ${yr.fiscalYear})
            </td>
          </tr>`;

        for (const proj of src.projects) {
          // Project row
          rows += `
            <tr class="proj-row">
              <td class="center">${seq++}</td>
              <td class="left">
                <b>${proj.projectName}</b><br/>
                <span class="muted">ประกอบด้วย</span>
              </td>
              <td colspan="8"></td>
            </tr>`;

          let eqSeq = 1;
          for (const eq of proj.equipGroups) {
            rows += `
              <tr>
                <td></td>
                <td class="left">
                  &nbsp;&nbsp;${eqSeq++}) ${eq.name}
                  ${eq.size ? `<br/>&nbsp;&nbsp;&nbsp;&nbsp;<span class="size">${eq.size}</span>` : ''}
                </td>
                <td class="center num">${eq.numRange}</td>
                <td class="center">${eq.pending     || 0}</td>
                <td class="center">${eq.normal      || 0}</td>
                <td class="center">${eq.repair      || 0}</td>
                <td class="center">${eq.unavailable || 0}</td>
                <td class="center">${eq.disposed    || 0}</td>
                <td class="center">${eq.usefulLife}</td>
                <td class="center">${eq.netAge}</td>
              </tr>`;
          }
        }
      }
    }

    // spacer between departments
    rows += `<tr><td colspan="10" class="spacer"></td></tr>`;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Tahoma', 'TH Sarabun New', sans-serif;
      font-size: 13px;
      color: #222;
    }
    .title-block { text-align: center; margin-bottom: 14px; }
    .title-block h1 { font-size: 16px; font-weight: bold; }
    .title-block h2 { font-size: 13px; font-weight: normal; margin-top: 2px; }

    table { width: 100%; border-collapse: collapse; }
    th, td {
      border: 1px solid #bbb;
      padding: 4px 5px;
      vertical-align: top;
    }
    thead th {
      background: #2c3e50;
      color: white;
      font-weight: bold;
      font-size: 12px;
      text-align: center;
    }
    tbody tr:nth-child(even) td { background: #f9f9f9; }

    .dept-header {
      background: #34495e;
      color: white;
      font-weight: bold;
      text-align: left;
      padding: 6px 8px;
      font-size: 13px;
    }
    .source-header {
      background: #ecf0f1;
      font-weight: bold;
      text-align: left;
      padding: 4px 8px;
      color: #333;
    }
    .proj-row td { background: #fff !important; }
    .center { text-align: center; }
    .left   { text-align: left; }
    .num    { font-size: 11px; line-height: 1.4; }
    .muted  { color: #666; font-size: 11px; }
    .size   { color: #555; font-size: 11px; }
    .spacer { border: none; height: 10px; background: white !important; }
  </style>
</head>
<body>
  <div class="title-block">
    <h1>รายงานสำรวจครุภัณฑ์หน่วยงาน ประจำปีงบประมาณ ${budgetYear}</h1>
    <h2>คณะวิทยาศาสตร์</h2>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:4%">ลำดับที่</th>
        <th style="width:22%">รายการครุภัณฑ์</th>
        <th style="width:18%">หมายเลขครุภัณฑ์</th>
        <th style="width:6%">รอเบิก<br/>จ่าย</th>
        <th style="width:6%">ปกติ</th>
        <th style="width:6%">ซ่อม</th>
        <th style="width:8%">ไม่พร้อม<br/>ใช้งาน</th>
        <th style="width:8%">จำหน่าย<br/>ทิ้ง</th>
        <th style="width:8%">อายุการ<br/>ใช้งาน</th>
        <th style="width:8%">อายุ<br/>สุทธิ</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>`;
}