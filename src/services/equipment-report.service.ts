import { db } from '../config/database.js';
import {
  equipment, departments, projects, acquisitionSources, equipmentTypes,
} from '../db/schema/index.js';
import { eq, lte, and, isNull } from 'drizzle-orm';
import puppeteer from 'puppeteer';

// normalize departmentId ให้เป็น number | null เสมอ
function normDeptId(v: any): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function deptKey(v: any): string {
  const n = normDeptId(v);
  return n == null ? 'null' : String(n);
}

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

    // 3. master data — ดึง projects ทั้งหมด รวม soft-deleted เพื่อ resolve ชื่อได้เสมอ
    const [projectList, sourceList, typeList] = await Promise.all([
      db.select().from(projects),
      db.select().from(acquisitionSources),
      db.select().from(equipmentTypes),
    ]);

    const projectMap = Object.fromEntries(projectList.map(p => [p.id, p]));
    const sourceMap  = Object.fromEntries(sourceList.map(s => [s.id, s.name]));
    const typeMap    = Object.fromEntries(typeList.map(t => [t.id, t]));

    const today = new Date();

    // สร้าง deptNameMap และ deptOrder
    const deptNameMap = new Map<string, string>();
    const deptOrder: string[] = [];

    for (const d of deptList) {
      const key = deptKey(d.id);
      deptNameMap.set(key, d.name);
      deptOrder.push(key);
    }

    // group equipment ตาม deptKey
    const equipByDept = new Map<string, typeof equipList>();
    for (const e of equipList) {
      const dk = deptKey(e.departmentId);
      if (!equipByDept.has(dk)) equipByDept.set(dk, []);
      equipByDept.get(dk)!.push(e);
    }

    // เพิ่ม dept ที่ไม่อยู่ใน deptList (null หรือ orphan id) ไว้ท้ายสุด
    for (const dk of equipByDept.keys()) {
      if (!deptNameMap.has(dk)) {
        deptNameMap.set(dk, 'ไม่ระบุหน่วยงาน');
        deptOrder.push(dk);
      }
    }

    const grouped: any[] = [];

    for (const dk of deptOrder) {
      const deptName   = deptNameMap.get(dk)!;
      const deptEquips = equipByDept.get(dk) ?? [];
      if (!deptEquips.length) continue;

      // ── ขั้นที่ 1: group เป็น flatMap key = "year||sourceName||projectName"
      const flatMap = new Map<string, {
        year: number;
        sourceName: string;
        projectName: string;
        eqGroupMap: Map<string, any[]>;
      }>();

      for (const eq_ of deptEquips) {
        const proj        = eq_.projectId ? projectMap[eq_.projectId] : null;
        const srcId       = proj?.acquisitionSourceId ?? eq_.acquisitionSourceId;
        const sourceName  = srcId ? (sourceMap[srcId] ?? 'ไม่ระบุ') : 'ไม่ระบุ';
        const year        = proj?.fiscalYear ?? eq_.fiscalYear ?? 0;
        const projectName = proj?.projectName ?? 'ไม่ระบุโครงการ';

        const flatKey = `${year}||${sourceName}||${projectName}`;
        if (!flatMap.has(flatKey)) {
          flatMap.set(flatKey, { year, sourceName, projectName, eqGroupMap: new Map() });
        }

        const type       = eq_.equipmentTypeId ? typeMap[eq_.equipmentTypeId] : null;
        const usefulLife = type?.usefulLife ?? 8;
        const acqDate    = eq_.acquisitionDate ? new Date(eq_.acquisitionDate) : null;
        const netAge     = acqDate
          ? parseFloat(((today.getTime() - acqDate.getTime()) / (1000 * 60 * 60 * 24 * 365)).toFixed(2))
          : 0;

        const eqKey = `${eq_.equipmentName}||${eq_.sizeDetail ?? ''}`;
        const entry = flatMap.get(flatKey)!;
        if (!entry.eqGroupMap.has(eqKey)) entry.eqGroupMap.set(eqKey, []);
        entry.eqGroupMap.get(eqKey)!.push({ ...eq_, usefulLife, netAge });
      }

      // ── ขั้นที่ 2: จัด structure year → source → project
      const yearSourceMap = new Map<string, {
        year: number;
        sourceName: string;
        projects: Map<string, any[]>;
      }>();

      for (const { year, sourceName, projectName, eqGroupMap } of flatMap.values()) {
        const ysKey = `${year}||${sourceName}`;
        if (!yearSourceMap.has(ysKey)) {
          yearSourceMap.set(ysKey, { year, sourceName, projects: new Map() });
        }
        const ysEntry = yearSourceMap.get(ysKey)!;

        const equipGroups: any[] = [];
        for (const [k, items] of eqGroupMap) {
          const [name, size] = k.split('||');
          const cnt = { pending: 0, normal: 0, repair: 0, unavailable: 0, disposed: 0 };
          for (const item of items) {
            const s = item.status ?? 'normal';
            if (s === 'borrowed') { cnt.normal++; continue; }
            if (s in cnt) cnt[s as keyof typeof cnt]++;
          }
          const nums = items.map((e: any) => e.equipmentNumber).sort();
          const numRange = nums.length === 1
            ? nums[0]
            : `${nums[0]}\nถึง ${nums[nums.length - 1].split('-').pop()}`;

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

        if (!ysEntry.projects.has(projectName)) {
          ysEntry.projects.set(projectName, equipGroups);
        } else {
          ysEntry.projects.get(projectName)!.push(...equipGroups);
        }
      }

      // ── ขั้นที่ 3: แปลง Map → array จัดเรียงตาม year
      const yearMap = new Map<number, { sourceName: string; projects: any[] }[]>();
      for (const { year, sourceName, projects: projMap } of yearSourceMap.values()) {
        if (!yearMap.has(year)) yearMap.set(year, []);
        yearMap.get(year)!.push({
          sourceName,
          projects: Array.from(projMap.entries()).map(([projectName, equipGroups]) => ({
            projectName,
            equipGroups,
          })),
        });
      }

      const years: any[] = [];
      for (const [year, sources] of Array.from(yearMap.entries()).sort((a, b) => a[0] - b[0])) {
        years.push({ fiscalYear: year, sources });
      }

      grouped.push({ deptName, years });
    }

    // 4. HTML → PDF
    const html    = buildHTML({ budgetYear, grouped });
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const pg = await browser.newPage();

    // ใช้ setContent แบบรอ load เสร็จจริง ไม่ใช้ networkidle0 เพราะไม่มี network request
    await pg.setContent(html, { waitUntil: 'load' });

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
    rows += `
      <tr class="dept-header-row">
        <td colspan="10" class="dept-header">${dept.deptName}</td>
      </tr>`;

    for (const yr of dept.years) {
      for (const src of yr.sources) {
        rows += `
          <tr>
            <td colspan="10" class="source-header">
              ${src.sourceName} (งบประมาณปี ${yr.fiscalYear})
            </td>
          </tr>`;

        for (const proj of src.projects) {
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
            // แปลง \n → <br/> สำหรับ numRange
            const numRangeHtml = String(eq.numRange).replace(/\n/g, '<br/>');
            rows += `
              <tr>
                <td></td>
                <td class="left">
                  &nbsp;&nbsp;${eqSeq++}) ${eq.name}
                  ${eq.size ? `<br/>&nbsp;&nbsp;&nbsp;&nbsp;<span class="size">${eq.size}</span>` : ''}
                </td>
                <td class="center num">${numRangeHtml}</td>
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
  }

  // วันที่ออกเอกสาร
  const now = new Date();
  const thDay   = now.getDate().toString().padStart(2, '0');
  const thMonth = now.toLocaleString('th-TH', { month: 'long' });
  const thYear  = now.getFullYear() + 543;
  const docDate = `${thDay} ${thMonth} พ.ศ. ${thYear}`;

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
    .title-block p {
      font-size: 15px;
      font-weight: bold;
      line-height: 1.6;
    }
    .title-block .doc-date {
      font-size: 13px;
      font-weight: normal;
      margin-top: 2px;
    }

    table { width: 100%; border-collapse: collapse; }
    th, td {
      border: 1px solid #bbb;
      padding: 4px 5px;
      vertical-align: top;
    }

    thead { display: table-header-group; }
    thead th {
      background: #2c3e50;
      color: white;
      font-weight: bold;
      font-size: 12px;
      text-align: center;
    }

    tbody tr:nth-child(even) td { background: #f9f9f9; }

    /* dept-header: ป้องกันสีถูกทับ และให้ขึ้นหน้าใหม่พร้อมกับแถวถัดไป */
    .dept-header {
      background: #34495e !important;
      color: white !important;
      font-weight: bold;
      text-align: left;
      padding: 6px 8px;
      font-size: 13px;
      page-break-after: avoid;  /* ห้าม page break หลัง dept-header */
    }
    tr.dept-header-row { page-break-inside: avoid; }

    .source-header {
      background: #ecf0f1 !important;
      font-weight: bold;
      text-align: left;
      padding: 4px 8px;
      color: #333 !important;
      page-break-after: avoid;
    }
    .proj-row td { background: #fff !important; }
    .center { text-align: center; }
    .left   { text-align: left; }
    .num    { font-size: 11px; line-height: 1.4; white-space: pre-line; }
    .muted  { color: #666; font-size: 11px; }
    .size   { color: #555; font-size: 11px; }
  </style>
</head>
<body>
  <div class="title-block">
    <p>รายงานสำรวจครุภัณฑ์หน่วยงาน ประจำปีงบประมาณ ${budgetYear}</p>
    <p>คณะวิทยาศาสตร์</p>
    <p class="doc-date">ประจำวันที่ ${docDate}</p>
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