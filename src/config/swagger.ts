export const swaggerConfig = {
  openapi: '3.0.0',
  info: {
    title: 'Equipment Management API',
    version: '3.0.0',
    description:
      'API documentation for Equipment Management System\n\n**Auth:** Cookie-based (httpOnly)\n- ทุก request ต้องใช้ `withCredentials: true` (axios) หรือ `credentials: "include"` (fetch)\n- เมื่อได้ 401 → ยิง `POST /api/auth/refresh` แล้ว retry\n\n**Permission:**\n- Admin / Department 1: เข้าถึงได้ทุก department\n- User ทั่วไป: เข้าถึงได้เฉพาะ department ตัวเอง',
  },
  servers: [{ url: 'http://localhost:3000', description: 'Development server' }],
  tags: [
    { name: 'Auth',             description: 'Authentication (Google OAuth + JWT Cookie)' },
    { name: 'Masters',          description: 'Master data — ไม่ต้อง login · ใช้โหลด dropdown' },
    { name: 'Equipment',        description: 'Equipment management — ใช้ UUID' },
    { name: 'Equipment Status', description: 'Equipment status tracking' },
    { name: 'Attachments',      description: 'File upload management' },
    { name: 'Projects',         description: 'Project management' },
    { name: 'MHESI',            description: 'MHESI number management' },
    { name: 'Reports',          description: 'Reports & depreciation calculation' },
    { name: 'Users',            description: 'User management — admin only' },
    { name: 'Health',           description: 'Health check' },
  ],
  components: {
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
        },
      },
      Success: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data:    { type: 'object' },
        },
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data:    { type: 'array', items: { type: 'object' } },
          pagination: {
            type: 'object',
            properties: {
              total:      { type: 'number' },
              page:       { type: 'number' },
              limit:      { type: 'number' },
              totalPages: { type: 'number' },
            },
          },
        },
      },
    },
  },
  paths: {

    // ==================== AUTH ====================

    '/api/auth/google': {
      get: {
        tags: ['Auth'],
        summary: 'Login ด้วย Google OAuth',
        description: 'Redirect browser ไปหน้า Google Login\n```js\nwindow.location.href = "http://localhost:3000/api/auth/google"\n```',
        responses: { '302': { description: 'Redirect to Google' } },
      },
    },
    '/api/auth/google/callback': {
      get: {
        tags: ['Auth'],
        summary: 'Google OAuth callback (ระบบจัดการเอง)',
        description: 'Google redirect กลับมาที่นี่ → set cookie access_token + refresh_token → redirect ไป FRONTEND_URL',
        responses: { '302': { description: 'Redirect to frontend' } },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'ดูข้อมูล user ปัจจุบัน',
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    uuid:           '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                    email:          'somchai@kmitl.ac.th',
                    firstName:      'สมชาย',
                    lastName:       'ใจดี',
                    role:           'user',
                    departmentId:   2,
                    departmentName: 'ส่วนบริหารงานทั่วไป',
                    createdAt:      '2026-01-01T00:00:00.000Z',
                  },
                },
              },
            },
          },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        description: 'ใช้เมื่อได้รับ 401 — ออก access_token ใหม่โดยใช้ refresh_token จาก cookie',
        responses: {
          '200': { description: 'Token refreshed — set access_token cookie ใหม่' },
          '401': { description: 'Refresh token หมดอายุ → ต้อง login ใหม่' },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout',
        description: 'ลบ cookie ทั้งสองตัว และลบ refresh token ออกจาก database',
        responses: { '200': { description: 'Logged out' } },
      },
    },

    // ==================== MASTERS ====================

    '/api/masters/departments': {
      get: { tags: ['Masters'], summary: 'Get all departments', responses: { '200': { description: 'Success' } } },
    },
    '/api/masters/departments/{id}': {
      get: { tags: ['Masters'], summary: 'Get department by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } } },
    },
    '/api/masters/funds': {
      get: { tags: ['Masters'], summary: 'Get all funds', responses: { '200': { description: 'Success' } } },
    },
    '/api/masters/funds/{id}': {
      get: { tags: ['Masters'], summary: 'Get fund by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } } },
    },
    '/api/masters/equipment-types': {
      get: { tags: ['Masters'], summary: 'Get all equipment types', responses: { '200': { description: 'Success' } } },
    },
    '/api/masters/equipment-types/{id}': {
      get: { tags: ['Masters'], summary: 'Get equipment type by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } } },
    },
    '/api/masters/acquisition-sources': {
      get: { tags: ['Masters'], summary: 'Get all acquisition sources', responses: { '200': { description: 'Success' } } },
    },
    '/api/masters/acquisition-sources/{id}': {
      get: { tags: ['Masters'], summary: 'Get acquisition source by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } } },
    },
    '/api/masters/acquisition-methods': {
      get: { tags: ['Masters'], summary: 'Get all acquisition methods', responses: { '200': { description: 'Success' } } },
    },
    '/api/masters/acquisition-methods/{id}': {
      get: { tags: ['Masters'], summary: 'Get acquisition method by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } } },
    },
    '/api/masters/buildings': {
      get: { tags: ['Masters'], summary: 'Get all buildings', responses: { '200': { description: 'Success' } } },
    },
    '/api/masters/buildings/{id}': {
      get: { tags: ['Masters'], summary: 'Get building by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } } },
    },
    '/api/masters/room-types': {
      get: { tags: ['Masters'], summary: 'Get all room types', responses: { '200': { description: 'Success' } } },
    },
    '/api/masters/room-types/{id}': {
      get: { tags: ['Masters'], summary: 'Get room type by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } } },
    },
    '/api/masters/rooms': {
      get: { tags: ['Masters'], summary: 'Get all rooms', responses: { '200': { description: 'Success' } } },
    },
    '/api/masters/rooms/{id}': {
      get: { tags: ['Masters'], summary: 'Get room by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } } },
    },
    '/api/masters/rooms/building/{buildingId}': {
      get: { tags: ['Masters'], summary: 'Get rooms by building', parameters: [{ name: 'buildingId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } },
    },
    '/api/masters/plan-sections': {
      get: { tags: ['Masters'], summary: 'Get all plan sections', responses: { '200': { description: 'Success' } } },
    },
    '/api/masters/plan-sections/{id}': {
      get: { tags: ['Masters'], summary: 'Get plan section by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } } },
    },

    // ==================== EQUIPMENT ====================

    '/api/equipment': {
      get: {
        tags: ['Equipment'],
        summary: 'Get all equipment',
        parameters: [
          { name: 'search',          in: 'query', schema: { type: 'string' }, description: 'ค้นหา equipmentNumber, equipmentCode, equipmentName' },
          { name: 'status',          in: 'query', schema: { type: 'string', enum: ['pending', 'normal', 'borrowed', 'repair', 'unavailable', 'disposed'] } },
          { name: 'departmentId',    in: 'query', schema: { type: 'integer' }, description: 'admin/dept.1 เท่านั้น' },
          { name: 'equipmentTypeId', in: 'query', schema: { type: 'integer' } },
          { name: 'projectId',       in: 'query', schema: { type: 'integer' }, description: 'กรองตาม project' },
          { name: 'sortBy',          in: 'query', schema: { type: 'string', enum: ['equipmentNumber', 'equipmentName', 'status', 'acquisitionDate', 'price'] } },
          { name: 'sortDir',         in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
          { name: 'page',            in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit',           in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: { '200': { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } } } },
      },
      post: {
        tags: ['Equipment'],
        summary: 'Create equipment (single or batch)',
        description: 'สร้าง 1 รายการ: ส่ง start ไม่มี end\nสร้างชุด: ส่ง start + end (max 100)\n\nตัวอย่าง numberPrefix="545-36-5436", start=1, end=3\n→ equipmentNumber: 545-36-5436-001, 545-36-5436-002, 545-36-5436-003\n\n**หมายเหตุ:**\n- userUuid ดึงจาก token อัตโนมัติ ไม่ต้องส่งมา\n- status default = **pending** (รอเบิกจ่าย)\n- ต้องเบิกจ่ายผ่าน `POST /api/equipment-status/change` จึงจะเป็น normal',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: {
                equipmentCode:       '545365436',
                numberPrefix:        '545-36-5436',
                start:               1,
                end:                 3,
                padLength:           3,
                equipmentName:       'คอมพิวเตอร์ตั้งโต๊ะ',
                equipmentTypeId:     2,
                departmentId:        3,
                activity:            'กิจกรรมพัฒนาคุณภาพการศึกษา',
                fundId:              1,
                fiscalYear:          2568,
                price:               25000,
                unit:                'เครื่อง',
                acquisitionSourceId: 1,
                acquisitionMethodId: 2,
                acquisitionDate:     '2026-03-01',
                company:             'บริษัทคอมพิวเตอร์ดี จำกัด',
                buildingId:          1,
                roomId:              5,
                projectId:           1,
                receivingMhesiId:    3,
                note:                'หมายเหตุ',
              },
              schema: {
                type: 'object',
                required: ['equipmentCode', 'numberPrefix', 'start', 'equipmentName'],
                properties: {
                  equipmentCode:       { type: 'string' },
                  numberPrefix:        { type: 'string' },
                  start:               { type: 'integer' },
                  end:                 { type: 'integer' },
                  padLength:           { type: 'integer', default: 3 },
                  equipmentName:       { type: 'string' },
                  equipmentTypeId:     { type: 'integer' },
                  departmentId:        { type: 'integer' },
                  activity:            { type: 'string' },
                  fundId:              { type: 'integer' },
                  fiscalYear:          { type: 'integer' },
                  price:               { type: 'number' },
                  unit:                { type: 'string' },
                  acquisitionSourceId: { type: 'integer' },
                  acquisitionMethodId: { type: 'integer' },
                  acquisitionDate:     { type: 'string', format: 'date' },
                  company:             { type: 'string' },
                  sizeDetail:          { type: 'string' },
                  buildingId:           { type: 'integer' },
                  roomId:               { type: 'integer' },
                  floor:                { type: 'string',  description: 'ชั้นที่ตั้ง เช่น 3, B1' },
                  warrantyYears:        { type: 'integer', description: 'ระยะเวลาประกัน (ปี)' },
                  warrantyMonths:       { type: 'integer', description: 'ระยะเวลาประกัน (เดือน)' },
                  warrantyEnd:          { type: 'string',  format: 'date', description: 'วันหมดประกัน' },
                  warrantyAttachmentId: { type: 'integer', description: 'ไฟล์ใบประกัน — จาก POST /api/attachments/upload' },
                  projectId:            { type: 'integer', description: 'project ที่ซื้อมา' },
                  receivingMhesiId:     { type: 'string',  format: 'uuid', description: 'UUID ของ MHESI receiving (backend resolve เป็น id ให้)' },
                  note:                { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created — returns array of created equipment (status = pending)',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'สร้างครุภัณฑ์สำเร็จ 3 รายการ',
                  data: [
                    { uuid: '3fa85f64-...', equipmentNumber: '545-36-5436-001', status: 'pending', projectId: 1, receivingMhesiId: 3 },
                    { uuid: 'b1c2d3e4-...', equipmentNumber: '545-36-5436-002', status: 'pending', projectId: 1, receivingMhesiId: 3 },
                    { uuid: 'c5d6e7f8-...', equipmentNumber: '545-36-5436-003', status: 'pending', projectId: 1, receivingMhesiId: 3 },
                  ],
                },
              },
            },
          },
          '400': { description: 'Bad request / duplicate equipmentNumber' },
          '403': { description: 'ไม่มีสิทธิ์สร้างใน department อื่น' },
        },
      },
    },

    '/api/equipment/stats': {
      get: {
        tags: ['Equipment'],
        summary: 'Get equipment statistics',
        description: 'ดึงสถิติครุภัณฑ์ — byStatus แสดงครบ 6 สถานะเสมอ (count = 0 ถ้าไม่มี)',
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    total: 22,
                    byStatus: [
                      { status: 'pending',     count: 2  },
                      { status: 'normal',      count: 18 },
                      { status: 'borrowed',    count: 0  },
                      { status: 'repair',      count: 1  },
                      { status: 'unavailable', count: 1  },
                    ],
                    byDepartment: [
                      { departmentId: 1, count: 3  },
                      { departmentId: 2, count: 6  },
                      { departmentId: 5, count: 13 },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    },

    '/api/equipment/stats/activity': {
      get: {
        tags: ['Equipment'],
        summary: 'สถิติการใช้งานครุภัณฑ์สำหรับ Dashboard',
        description: [
          'ดึงข้อมูลสถิติการเปลี่ยนสถานะครุภัณฑ์ สำหรับแสดงกราฟใน Dashboard',
          '',
          '**period:**',
          '- `week` — 7 วันย้อนหลัง (แกน X = วัน จ-อา)',
          '- `month` — 4 สัปดาห์ย้อนหลัง (แกน X = สัปดาห์ที่ 1-4)',
          '- `fiscal` — ปีงบประมาณปัจจุบัน ต.ค.-ก.ย. (แกน X = 12 เดือน)',
          '',
          '**สิทธิ์:** user ทั่วไปเห็นเฉพาะ department ตัวเอง, admin เห็นทั้งหมด',
        ].join('\n'),
        parameters: [
          {
            name: 'period', in: 'query', required: false,
            schema: { type: 'string', enum: ['week', 'month', 'fiscal'], default: 'week' },
            description: 'ช่วงเวลาที่ต้องการดูสถิติ',
          },
        ],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                examples: {
                  week: {
                    summary: 'period=week (7 วันย้อนหลัง)',
                    value: {
                      success: true,
                      message: 'Activity stats retrieved successfully',
                      data: {
                        labels: ['จ 22/3','อ 23/3','พ 24/3','พฤ 25/3','ศ 26/3','ส 27/3','อา 28/3'],
                        datasets: [
                          { label: 'เบิกจ่าย',       data: [3,1,5,2,4,0,1], color: '#27ae60' },
                          { label: 'ยืม',            data: [1,0,2,0,1,0,0], color: '#2980b9' },
                          { label: 'ซ่อม',           data: [0,1,0,1,0,0,0], color: '#f39c12' },
                          { label: 'ไม่พร้อมใช้งาน', data: [0,0,0,0,0,0,0], color: '#e74c3c' },
                          { label: 'จำหน่าย',        data: [0,0,0,0,0,0,0], color: '#95a5a6' },
                        ],
                      },
                    },
                  },
                  month: {
                    summary: 'period=month (4 สัปดาห์ย้อนหลัง)',
                    value: {
                      success: true,
                      message: 'Activity stats retrieved successfully',
                      data: {
                        labels: ['สัปดาห์ที่ 1','สัปดาห์ที่ 2','สัปดาห์ที่ 3','สัปดาห์ที่ 4'],
                        datasets: [
                          { label: 'เบิกจ่าย',       data: [12,8,15,6],  color: '#27ae60' },
                          { label: 'ยืม',            data: [3,2,5,1],    color: '#2980b9' },
                          { label: 'ซ่อม',           data: [1,0,2,1],    color: '#f39c12' },
                          { label: 'ไม่พร้อมใช้งาน', data: [0,0,0,0],    color: '#e74c3c' },
                          { label: 'จำหน่าย',        data: [0,0,0,0],    color: '#95a5a6' },
                        ],
                      },
                    },
                  },
                  fiscal: {
                    summary: 'period=fiscal (ปีงบประมาณ ต.ค.-ก.ย.)',
                    value: {
                      success: true,
                      message: 'Activity stats retrieved successfully',
                      data: {
                        labels: ['ต.ค.','พ.ย.','ธ.ค.','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.'],
                        datasets: [
                          { label: 'เบิกจ่าย',       data: [20,15,10,8,12,18,0,0,0,0,0,0], color: '#27ae60' },
                          { label: 'ยืม',            data: [5,3,4,2,6,8,0,0,0,0,0,0],      color: '#2980b9' },
                          { label: 'ซ่อม',           data: [2,1,0,3,1,2,0,0,0,0,0,0],      color: '#f39c12' },
                          { label: 'ไม่พร้อมใช้งาน', data: [0,0,1,0,0,0,0,0,0,0,0,0],      color: '#e74c3c' },
                          { label: 'จำหน่าย',        data: [0,0,0,0,0,0,0,0,0,0,0,0],      color: '#95a5a6' },
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { description: 'period must be week, month or fiscal' },
          '401': { description: 'Unauthorized' },
        },
      },
    },

    '/api/equipment/code/{code}': {
      get: {
        tags: ['Equipment'],
        summary: 'Get equipment by equipmentCode',
        parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Success' }, '403': { description: 'ไม่มีสิทธิ์' }, '404': { description: 'Not found' } },
      },
    },

    '/api/equipment/{uuid}/history': {
      get: {
        tags: ['Equipment'],
        summary: 'Get equipment history (timeline)',
        description: 'ดึงประวัติทั้งหมดจาก audit_logs — action: create, status_change, update, delete รวมเป็น timeline เดียว เรียงล่าสุดก่อน',
        parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: [
                    {
                      type:      'disbursement',
                      createdAt: '2026-03-20T09:00:00.000Z',
                      createdBy: 'สมชาย ใจดี',
                      detail:    { disbursedTo: 'อ.สมหญิง', disbursedDate: '2026-03-20', roomId: 5, reason: 'เบิกจ่ายประจำปี' },
                    },
                    {
                      type:      'status_change',
                      status:    'normal',
                      remark:    'เบิกจ่ายครุภัณฑ์',
                      createdAt: '2026-03-20T09:00:00.000Z',
                      createdBy: 'สมชาย ใจดี',
                    },
                    {
                      type:      'status_change',
                      status:    'pending',
                      remark:    'สร้างครุภัณฑ์ใหม่',
                      createdAt: '2026-03-01T10:00:00.000Z',
                      createdBy: 'ธีรพล ใจดี',
                    },
                  ],
                },
              },
            },
          },
          '403': { description: 'ไม่มีสิทธิ์' },
          '404': { description: 'Equipment not found' },
        },
      },
    },

    '/api/equipment/{uuid}': {
      get: {
        tags: ['Equipment'],
        summary: 'Get equipment by UUID (พร้อม trace กลับ)',
        description: 'ดึงข้อมูลครุภัณฑ์ พร้อม trace กลับหา project, เอกสาร MHESI ทุกฉบับ, ใบตรวจรับที่เครื่องนี้มา และข้อมูลเบิกจ่าย',
        parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    uuid:                'c5d6e7f8-...',
                    equipmentCode:       '545365436',
                    equipmentNumber:     '545-36-5436-003',
                    equipmentName:       'คอมพิวเตอร์ตั้งโต๊ะ',
                    status:              'normal',
                    projectId:           1,
                    receivingMhesiId:    3,
                    floor:               'ชั้น 3',
                    warrantyYears:       3,
                    warrantyMonths:      0,
                    warrantyEnd:         '2029-03-01',
                    warrantyAttachmentId: 5,
                    price:               '25000.00',
                    departmentId:        3,
                    acquisitionDate:     '2026-03-01',
                    // --- trace fields ---
                    project: {
                      uuid:          '9a8b7c6d-...',
                      projectNumber: '2026030101',
                      projectName:   'จัดซื้อโน้ตบุ๊กประจำปี 2568',
                      qtyOrdered:    5,
                      budget:        '150000.00',
                      status:        'active',
                    },
                    mhesiList: [
                      { uuid: 'aaa-...', mhesiNumber: 'อว 67/001', role: 'planning',     date: '2025-11-01', amount: '150000.00' },
                      { uuid: 'bbb-...', mhesiNumber: 'อว 67/025', role: 'procurement',  date: '2025-12-01', amount: null },
                      { uuid: 'ccc-...', mhesiNumber: 'อว 67/089', role: 'contract',     date: '2026-01-15', amount: '145000.00' },
                      { uuid: 'ddd-...', mhesiNumber: 'อว 67/120', role: 'receiving',    date: '2026-03-01', amount: null },
                    ],
                    receivingMhesi: {
                      uuid:        'ddd-...',
                      mhesiNumber: 'อว 67/120',
                      role:        'receiving',
                      date:        '2026-03-01',
                    },
                    disbursement: {
                      id:            7,
                      disbursedTo:   'อ.สมหญิง รักดี',
                      disbursedDate: '2026-03-20',
                      roomId:        5,
                      reason:        'เบิกจ่ายประจำปี',
                    },
                  },
                },
              },
            },
          },
          '403': { description: 'ไม่มีสิทธิ์' },
          '404': { description: 'Not found' },
        },
      },
      put: {
        tags: ['Equipment'],
        summary: 'Update equipment',
        description: 'แก้ไขข้อมูลครุภัณฑ์ (บันทึก audit log อัตโนมัติ)\n\nสามารถอัปเดต projectId และ receivingMhesiId ได้',
        parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: {
                equipmentName:    'คอมพิวเตอร์ตั้งโต๊ะ (อัปเดต)',
                projectId:        1,
                receivingMhesiId: 3,
                roomId:           6,
                note:             'ย้ายห้อง',
              },
              schema: { type: 'object' },
            },
          },
        },
        responses: { '200': { description: 'Updated' }, '403': { description: 'ไม่มีสิทธิ์' }, '404': { description: 'Not found' } },
      },
      delete: {
        tags: ['Equipment'],
        summary: 'Delete equipment (soft delete)',
        parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Deleted' }, '403': { description: 'ไม่มีสิทธิ์' }, '404': { description: 'Not found' } },
      },
    },

    '/api/equipment/attachments': {
      post: {
        tags: ['Equipment'],
        summary: '⭐ Upload files for multiple equipment (bulk)',
        description: 'อัปโหลดไฟล์ครั้งเดียว ผูกกับทุก uuid — ไฟล์จริงบันทึกแค่ครั้งเดียว\n\n**ใช้ในหน้า: เพิ่มครุภัณฑ์**\n\nส่ง uuids เป็น JSON string เช่น `["uuid-1","uuid-2"]`',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['uuids', 'files'],
                properties: {
                  uuids: { type: 'string', description: 'JSON array ของ uuid เช่น ["uuid-1","uuid-2"]', example: '["3fa85f64-...","b1c2d3e4-..."]' },
                  files: { type: 'array', items: { type: 'string', format: 'binary' }, description: 'ไฟล์ที่ต้องการอัปโหลด (jpg/png/webp/pdf · max 10MB)' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Success',
            content: { 'application/json': { example: { success: true, data: { uploadedFiles: 3, linkedEquipment: 5, totalLinks: 15 } } } },
          },
          '400': { description: 'uuids/files ขาดหาย หรือไฟล์ไม่รองรับ' },
          '404': { description: 'ไม่พบครุภัณฑ์บาง uuid' },
        },
      },
    },

    '/api/equipment/{uuid}/attachments': {
      post: {
        tags: ['Equipment'],
        summary: 'Upload attachment(s) to single equipment',
        description: 'อัปโหลดไฟล์ให้ครุภัณฑ์อันเดียว รองรับหลายไฟล์พร้อมกัน\n\n**ใช้ในหน้า: ข้อมูลครุภัณฑ์**\n\nรองรับ field: `files[]` หรือ `file`',
        parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  files: { type: 'array', items: { type: 'string', format: 'binary' }, description: 'หลายไฟล์' },
                  file:  { type: 'string', format: 'binary', description: 'ไฟล์เดียว' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Uploaded — returns attachment object(s)' },
          '400': { description: 'ไม่มีไฟล์ / ประเภทไฟล์ไม่รองรับ' },
          '404': { description: 'Equipment not found' },
        },
      },
      get: {
        tags: ['Equipment'],
        summary: 'Get all attachments of equipment',
        parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Success' }, '404': { description: 'Equipment not found' } },
      },
    },

    '/api/equipment/{uuid}/attachments/{attachmentId}': {
      delete: {
        tags: ['Equipment'],
        summary: 'Delete attachment from equipment',
        description: 'ลบ junction row — ถ้าไม่มี equipment อื่นใช้ไฟล์นี้อยู่จะลบไฟล์จริงด้วย',
        parameters: [
          { name: 'uuid',         in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'attachmentId', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'Deleted' }, '404': { description: 'Not found' } },
      },
    },

    // ==================== EQUIPMENT STATUS ====================

    '/api/equipment-status/change': {
      post: {
        tags: ['Equipment Status'],
        summary: '⭐ Change equipment status (main endpoint)',
        description: [
          'เปลี่ยนสถานะครุภัณฑ์หลายรายการพร้อมกัน',
          'ระบบจะ: ปิด record เก่า → สร้าง record ใหม่ → อัปเดต status → บันทึก audit_log (transaction)',
          '**userUuid ดึงจาก token อัตโนมัติ ไม่ต้องส่งมา**',
          '',
          '**Blocked transitions:**',
          '- FROM disposed → ทุกสถานะ (error)',
          '- TO สถานะเดิม (error)',
          '',
          '**pending → normal (เบิกจ่าย)** — disbursedTo และ disbursedDate จำเป็น:',
          '```json',
          '{',
          '  "equipmentUuids": ["3fa85f64-..."],',
          '  "newStatus": "normal",',
          '  "data": {',
          '    "disbursedTo":   "อ.สมหญิง รักดี",',
          '    "disbursedDate": "2026-03-20",',
          '    "roomId":        5,',
          '    "reason":        "เบิกจ่ายประจำปี"',
          '  }',
          '}',
          '```',
          '',
          '**normal → borrowed (ยืมชั่วคราว):**',
          '```json',
          '{',
          '  "equipmentUuids": ["3fa85f64-...", "b1c2d3e4-..."],',
          '  "newStatus": "borrowed",',
          '  "data": {',
          '    "borrowerName":        "สมชาย ใจดี",',
          '    "borrowDate":          "2026-03-25",',
          '    "borrowerDepartmentId": 3,',
          '    "expectedReturnDate":  "2026-04-10",',
          '    "borrowingBuildingId": 1,',
          '    "borrowingRoomId":     5,',
          '    "reason":              "ใช้ในงานสัมมนา"',
          '  }',
          '}',
          '```',
          '',
          '**→ repair (ส่งซ่อม):**',
          '```json',
          '{',
          '  "equipmentUuids": ["3fa85f64-..."],',
          '  "newStatus": "repair",',
          '  "data": {',
          '    "repairReason":  "จอแตก",',
          '    "startDate":     "2026-03-20",',
          '    "repairCompany": "บริษัทซ่อมดี จำกัด",',
          '    "cost":          3500,',
          '    "endDate":       "2026-04-05",',
          '    "attachmentId":  5',
          '  }',
          '}',
          '```',
          '',
          '**→ unavailable:**',
          '```json',
          '{',
          '  "equipmentUuids": ["3fa85f64-..."],',
          '  "newStatus": "unavailable",',
          '  "data": { "reason": "ชำรุดรอการพิจารณาจำหน่าย" }',
          '}',
          '```',
          '',
          '**→ disposed (จำหน่าย):**',
          '```json',
          '{',
          '  "equipmentUuids": ["3fa85f64-..."],',
          '  "newStatus": "disposed",',
          '  "data": {',
          '    "disposalDate":   "2026-03-20",',
          '    "disposalMethod": "ขายทอดตลาด",',
          '    "approvedBy":     "ผศ.ดร.สมศักดิ์",',
          '    "cost":           500,',
          '    "reason":         "หมดอายุการใช้งาน",',
          '    "attachmentId":   6',
          '  }',
          '}',
          '```',
        ].join('\n'),
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['equipmentUuids', 'newStatus'],
                properties: {
                  equipmentUuids: { type: 'array', items: { type: 'string', format: 'uuid' } },
                  newStatus: { type: 'string', enum: ['pending', 'normal', 'borrowed', 'repair', 'unavailable', 'disposed'] },
                  data: {
                    type: 'object',
                    properties: {
                      reason:               { type: 'string' },
                      disbursedTo:          { type: 'string',  description: '* pending→normal: ชื่อผู้รับ' },
                      disbursedDate:        { type: 'string',  format: 'date', description: '* pending→normal: วันที่เบิก' },
                      roomId:               { type: 'integer', description: 'pending→normal: ห้องที่ใช้' },
                      borrowerName:         { type: 'string',  description: '* borrowed' },
                      borrowerDepartmentId: { type: 'integer' },
                      borrowDate:           { type: 'string',  format: 'date', description: '* borrowed' },
                      expectedReturnDate:   { type: 'string',  format: 'date' },
                      borrowingBuildingId:  { type: 'integer' },
                      borrowingRoomId:      { type: 'integer' },
                      repairReason:         { type: 'string',  description: '* repair' },
                      repairCompany:        { type: 'string' },
                      cost:                 { type: 'number' },
                      startDate:            { type: 'string',  format: 'date', description: '* repair' },
                      endDate:              { type: 'string',  format: 'date' },
                      attachmentId:         { type: 'integer', description: 'repair/disposed — จาก POST /api/attachments/upload' },
                      disposalDate:         { type: 'string',  format: 'date', description: '* disposed' },
                      disposalMethod:       { type: 'string' },
                      approvedBy:           { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Changed successfully',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'เปลี่ยนสถานะครุภัณฑ์ 1 รายการเป็น "normal" สำเร็จ',
                  data: [{ equipmentUuid: '3fa85f64-...', newStatus: 'normal', referenceId: 7 }],
                },
              },
            },
          },
          '400': { description: 'Validation error / same status / blocked transition' },
          '404': { description: 'ไม่พบครุภัณฑ์บาง uuid' },
        },
      },
    },

    '/api/equipment-status/borrows': {
      get: { tags: ['Equipment Status'], summary: 'Get all borrow records', responses: { '200': { description: 'Success' } } },
    },
    '/api/equipment-status/borrows/equipment/{uuid}': {
      get: { tags: ['Equipment Status'], summary: 'Get borrows by equipment', parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Success' } } },
    },
    '/api/equipment-status/borrows/{id}': {
      get:    { tags: ['Equipment Status'], summary: 'Get borrow by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } } },
      put:    { tags: ['Equipment Status'], summary: 'Update borrow record', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Equipment Status'], summary: 'Delete borrow record', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' } } },
    },
    '/api/equipment-status/repairs': {
      get: { tags: ['Equipment Status'], summary: 'Get all repair records', responses: { '200': { description: 'Success' } } },
    },
    '/api/equipment-status/repairs/equipment/{uuid}': {
      get: { tags: ['Equipment Status'], summary: 'Get repairs by equipment', parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Success' } } },
    },
    '/api/equipment-status/repairs/{id}': {
      get: { tags: ['Equipment Status'], summary: 'Get repair by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } } },
      put: {
        tags: ['Equipment Status'],
        summary: 'Update repair record',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  repairReason:  { type: 'string' },
                  repairCompany: { type: 'string' },
                  cost:          { type: 'number' },
                  startDate:     { type: 'string', format: 'date' },
                  endDate:       { type: 'string', format: 'date', description: 'วันคาดการณ์ซ่อมเสร็จ' },
                  actualEndDate: { type: 'string', format: 'date', description: 'วันที่ซ่อมเสร็จจริง' },
                  attachmentId:  { type: 'integer' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Updated' } },
      },
      delete: { tags: ['Equipment Status'], summary: 'Delete repair record', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' } } },
    },

    '/api/equipment-status/disposals': {
      get: { tags: ['Equipment Status'], summary: 'Get all disposals (archive)', description: 'ครุภัณฑ์ที่จำหน่ายแล้ว — read only archive ไม่สามารถแก้ไขหรือลบได้', responses: { '200': { description: 'Success' } } },
    },
    '/api/equipment-status/disposals/{uuid}': {
      get: { tags: ['Equipment Status'], summary: 'Get disposal by UUID (archive)', description: 'ครุภัณฑ์ที่จำหน่ายแล้ว — read only ไม่สามารถแก้ไขหรือลบได้', parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } } },
    },


    // ==================== ATTACHMENTS ====================

    '/api/attachments/upload': {
      post: {
        tags: ['Attachments'],
        summary: '⭐ Upload file (สำหรับ repair / disposal / mhesi)',
        description: 'อัปโหลดไฟล์ → ได้ attachmentId กลับมา → เอาไปใส่ใน body ของ changeStatus หรือ mhesi\n\n**รองรับ:** jpg, png, webp, pdf · ขนาดสูงสุด 10 MB\n\n**สำหรับ equipment:** ใช้ `POST /api/equipment/:uuid/attachments` แทน',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file:   { type: 'string', format: 'binary' },
                  folder: { type: 'string', enum: ['repair', 'disposal', 'mhesi', 'general'], default: 'general' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Uploaded',
            content: {
              'application/json': {
                example: { success: true, data: { id: 5, fileName: 'doc.pdf', filePath: '/uploads/repair/2026/03/uuid.pdf', fileType: 'application/pdf', uploadedAt: '2026-03-20T09:00:00.000Z' } },
              },
            },
          },
          '400': { description: 'ไม่มีไฟล์ / ประเภทไม่รองรับ / ขนาดเกิน 10MB' },
        },
      },
    },
    '/api/attachments': {
      get: { tags: ['Attachments'], summary: 'Get all attachments', responses: { '200': { description: 'Success' } } },
      post: {
        tags: ['Attachments'],
        summary: 'Create attachment (manual)',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/api/attachments/{id}/file': {
      get: {
        tags: ['Attachments'],
        summary: '⭐ Download / stream ไฟล์จริง',
        description: 'Stream ไฟล์จริงออกมา — ใช้ URL นี้ใน `<img src="">` หรือ `<a href="">` ได้โดยตรง',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'File stream — Content-Type ตรงกับ fileType ของไฟล์' },
          '404': { description: 'Attachment or file not found' },
        },
      },
    },
    '/api/attachments/{id}': {
      get:    { tags: ['Attachments'], summary: 'Get attachment metadata by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success — returns metadata + fileUrl' }, '404': { description: 'Not found' } } },
      put:    { tags: ['Attachments'], summary: 'Update attachment metadata', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Attachments'], summary: 'Delete attachment (ลบไฟล์ + record)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' }, '404': { description: 'Not found' } } },
    },

    // ==================== PROJECTS ====================

    '/api/projects': {
      get: {
        tags: ['Projects'],
        summary: 'Get all projects',
        parameters: [
          { name: 'search',              in: 'query', schema: { type: 'string' } },
          { name: 'status',              in: 'query', schema: { type: 'string' } },
          { name: 'projectTypeId',       in: 'query', schema: { type: 'integer' } },
          { name: 'acquisitionSourceId', in: 'query', schema: { type: 'integer' } },
          { name: 'dateFrom',            in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'dateTo',              in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'budgetMin',           in: 'query', schema: { type: 'number' } },
          { name: 'budgetMax',           in: 'query', schema: { type: 'number' } },
          { name: 'sortBy',              in: 'query', schema: { type: 'string', enum: ['id', 'projectName', 'projectType', 'acquisitionSourceId', 'status', 'projectDate', 'budget'] } },
          { name: 'sortDir',             in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
          { name: 'page',                in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit',               in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: { '200': { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } } } },
      },
      post: {
        tags: ['Projects'],
        summary: 'Create project',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: {
                projectName:        'จัดซื้อโน้ตบุ๊กประจำปี 2568',
                projectTypeId:      1,
                projectDate:        '2025-11-01',
                budget:             150000,
                status:             'active',
                acquisitionSourceId: 1,
                qtyOrdered:         5,
                note:               'หมายเหตุ',
              },
              schema: {
                type: 'object',
                required: ['projectName'],
                properties: {
                  projectName:         { type: 'string' },
                  projectTypeId:       { type: 'integer' },
                  projectDate:         { type: 'string', format: 'date' },
                  budget:              { type: 'number', description: 'วงเงินงบประมาณ' },
                  status:              { type: 'string' },
                  acquisitionSourceId:  { type: 'integer' },
                  acquisitionMethodId:  { type: 'integer', description: 'วิธีการได้มา' },
                  fiscalYear:           { type: 'integer', description: 'ปีงบประมาณ (พ.ศ.) เช่น 2568' },
                  qtyOrdered:           { type: 'integer', description: 'จำนวนที่สั่งซื้อทั้งหมด (ใช้ตรวจสอบว่าลงทะเบียนครบหรือยัง)' },
                  note:                { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Created — projectNumber auto-generated (YYYYMMDDNN)' } },
      },
    },

    '/api/projects/stats': {
      get: { tags: ['Projects'], summary: 'Get project statistics', responses: { '200': { description: 'Success' } } },
    },

    '/api/projects/{uuid}/history': {
      get: {
        tags: ['Projects'],
        summary: 'Get project edit history',
        parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: [
                    {
                      action:    'update',
                      before:    { projectName: 'โครงการเก่า', budget: '50000.00' },
                      after:     { projectName: 'โครงการใหม่', budget: '75000.00' },
                      createdAt: '2026-03-15T10:00:00.000Z',
                      changedBy: 'สมชาย ใจดี',
                    },
                  ],
                },
              },
            },
          },
          '404': { description: 'Not found' },
        },
      },
    },

    '/api/projects/{uuid}': {
      get: {
        tags: ['Projects'],
        summary: 'Get project by UUID (พร้อม summary และ mhesiList)',
        description: 'ดึงข้อมูล project พร้อม:\n- `equipmentSummary` — สรุปจำนวนครุภัณฑ์แยกตาม status\n- `mhesiList` — เอกสาร MHESI ทุกฉบับของ project เรียงตาม flow',
        parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    uuid:          '9a8b7c6d-...',
                    projectNumber: '2026030101',
                    projectName:   'จัดซื้อโน้ตบุ๊กประจำปี 2568',
                    qtyOrdered:    5,
                    budget:        '150000.00',
                    status:        'active',
                    projectDate:   '2025-11-01',
                    equipmentSummary: {
                      qtyOrdered:  5,
                      registered:  5,
                      pending:     2,
                      normal:      2,
                      borrowed:    1,
                      repair:      0,
                      unavailable: 0,
                      disposed:    0,
                    },
                    mhesiList: [
                      { uuid: 'aaa-...', mhesiNumber: 'อว 67/001', role: 'planning',    date: '2025-11-01', amount: '150000.00' },
                      { uuid: 'bbb-...', mhesiNumber: 'อว 67/025', role: 'procurement', date: '2025-12-01', amount: null },
                      { uuid: 'ccc-...', mhesiNumber: 'อว 67/089', role: 'contract',    date: '2026-01-15', amount: '145000.00' },
                      { uuid: 'ddd-...', mhesiNumber: 'อว 67/120', role: 'receiving',   date: '2026-03-01', amount: null },
                    ],
                  },
                },
              },
            },
          },
          '404': { description: 'Not found' },
        },
      },
      put: {
        tags: ['Projects'],
        summary: 'Update project',
        parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Updated' }, '404': { description: 'Not found' } },
      },
      delete: {
        tags: ['Projects'],
        summary: 'Delete project (soft delete)',
        parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Deleted' }, '404': { description: 'Not found' } },
      },
    },

    // ==================== MHESI ====================

    '/api/mhesi': {
      get: {
        tags: ['MHESI'],
        summary: 'Get all MHESI numbers',
        parameters: [
          { name: 'search',       in: 'query', schema: { type: 'string'  }, description: 'ค้นหา mhesiNumber หรือ activityName' },
          { name: 'faculty',      in: 'query', schema: { type: 'string'  } },
          { name: 'departmentId', in: 'query', schema: { type: 'integer' } },
          { name: 'planId',       in: 'query', schema: { type: 'integer' } },
          { name: 'projectId',    in: 'query', schema: { type: 'integer' } },
          { name: 'role',         in: 'query', schema: { type: 'string', enum: ['planning', 'procurement', 'contract', 'receiving', 'other'] } },
          { name: 'amountMin',    in: 'query', schema: { type: 'number'  } },
          { name: 'amountMax',    in: 'query', schema: { type: 'number'  } },
          { name: 'dateFrom',     in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'dateTo',       in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'sortBy',       in: 'query', schema: { type: 'string', enum: ['mhesiNumber', 'activityName', 'date', 'amount', 'project', 'faculty', 'plan'] } },
          { name: 'sortDir',      in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
          { name: 'page',         in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit',        in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: { '200': { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } } } },
      },
      post: {
        tags: ['MHESI'],
        summary: 'Create MHESI number',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: {
                mhesiNumber:  'อว 67/120',
                role:         'receiving',
                faculty:      'คณะวิทยาศาสตร์',
                departmentId: 1,
                planId:       1,
                projectId:    1,
                activityName: 'จัดซื้อโน้ตบุ๊ก',
                date:         '2026-03-01',
                amount:       null,
                note:         'ใบตรวจรับรอบ 1',
                attachmentId: 5,
              },
              schema: {
                type: 'object',
                required: ['mhesiNumber'],
                properties: {
                  mhesiNumber:  { type: 'string', maxLength: 50 },
                  role:         { type: 'string', enum: ['planning', 'procurement', 'contract', 'receiving', 'other'] },
                  faculty:      { type: 'string' },
                  departmentId: { type: 'integer' },
                  planId:       { type: 'integer' },
                  projectId:    { type: 'integer', description: 'project ที่เอกสารนี้สังกัด' },
                  activityName: { type: 'string' },
                  date:         { type: 'string', format: 'date' },
                  amount:       { type: 'number' },
                  note:         { type: 'string' },
                  attachmentId: { type: 'integer', description: 'จาก POST /api/attachments/upload' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Created' }, '400': { description: 'mhesiNumber is required' } },
      },
    },

    '/api/mhesi/{uuid}/attachments': {
      get: {
        tags: ['MHESI'],
        summary: 'Get ไฟล์เพิ่มเติมของ MHESI',
        parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': {
            description: 'Success',
            content: { 'application/json': { example: { success: true, data: [{ id: 8, fileName: 'doc.pdf', fileType: 'application/pdf', fileUrl: '/api/attachments/8/file' }] } } },
          },
          '404': { description: 'MHESI not found' },
        },
      },
      post: {
        tags: ['MHESI'],
        summary: '⭐ อัปโหลดไฟล์เพิ่มเติมให้ MHESI (admin/dept1)',
        description: 'อัปโหลดได้หลายไฟล์พร้อมกัน · บันทึก audit log อัตโนมัติ',
        parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  files: { type: 'array', items: { type: 'string', format: 'binary' }, description: 'หลายไฟล์' },
                  file:  { type: 'string', format: 'binary', description: 'ไฟล์เดียว' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Uploaded' },
          '400': { description: 'ไม่มีไฟล์' },
          '403': { description: 'admin/dept1 เท่านั้น' },
          '404': { description: 'MHESI not found' },
        },
      },
    },
    '/api/mhesi/{uuid}/attachments/{attachmentId}': {
      delete: {
        tags: ['MHESI'],
        summary: 'ลบไฟล์เพิ่มเติมของ MHESI (admin/dept1)',
        description: 'ลบ junction + ไฟล์จริง · บันทึก audit log อัตโนมัติ',
        parameters: [
          { name: 'uuid',         in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'attachmentId', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          '200': { description: 'Deleted' },
          '403': { description: 'admin/dept1 เท่านั้น' },
          '404': { description: 'Not found' },
        },
      },
    },
    '/api/mhesi/project/{projectId}': {
      get: {
        tags: ['MHESI'],
        summary: 'Get all MHESI by project ID',
        description: 'ดูเอกสารทุกฉบับของ project นั้น เรียงตาม createdAt',
        parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: [
                    { uuid: 'aaa-...', mhesiNumber: 'อว 67/001', role: 'planning',    date: '2025-11-01' },
                    { uuid: 'bbb-...', mhesiNumber: 'อว 67/025', role: 'procurement', date: '2025-12-01' },
                    { uuid: 'ccc-...', mhesiNumber: 'อว 67/089', role: 'contract',    date: '2026-01-15' },
                    { uuid: 'ddd-...', mhesiNumber: 'อว 67/120', role: 'receiving',   date: '2026-03-01' },
                  ],
                },
              },
            },
          },
        },
      },
    },

    '/api/mhesi/{uuid}/history': {
      get: {
        tags: ['MHESI'],
        summary: 'Get MHESI edit history',
        parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: [
                    { action: 'update', before: { amount: '25000.00' }, after: { amount: '30000.00' }, createdAt: '2026-03-15T10:00:00.000Z', changedBy: 'สมชาย ใจดี' },
                  ],
                },
              },
            },
          },
          '404': { description: 'Not found' },
        },
      },
    },

    '/api/mhesi/{uuid}': {
      get: {
        tags: ['MHESI'],
        summary: 'Get MHESI by UUID',
        parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    uuid:         'ddd-...',
                    mhesiNumber:  'อว 67/120',
                    role:         'receiving',
                    faculty:      'คณะวิทยาศาสตร์',
                    departmentId: 1,
                    planId:       1,
                    projectId:    1,
                    activityName: 'จัดซื้อโน้ตบุ๊ก',
                    date:         '2026-03-01',
                    amount:       null,
                    note:         'ใบตรวจรับรอบ 1',
                    attachmentId: 5,
                    createdAt:    '2026-03-01T10:00:00.000Z',
                    updatedAt:    '2026-03-01T10:00:00.000Z',
                  },
                },
              },
            },
          },
          '404': { description: 'Not found' },
        },
      },
      put: {
        tags: ['MHESI'],
        summary: 'Update MHESI',
        parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  mhesiNumber:  { type: 'string', maxLength: 50 },
                  role:         { type: 'string', enum: ['planning', 'procurement', 'contract', 'receiving', 'other'] },
                  faculty:      { type: 'string' },
                  departmentId: { type: 'integer' },
                  planId:       { type: 'integer' },
                  projectId:    { type: 'integer' },
                  activityName: { type: 'string' },
                  date:         { type: 'string', format: 'date' },
                  amount:       { type: 'number' },
                  note:         { type: 'string' },
                  attachmentId: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Updated' }, '404': { description: 'Not found' } },
      },
      delete: {
        tags: ['MHESI'],
        summary: 'Delete MHESI (soft delete)',
        parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Deleted', content: { 'application/json': { example: { success: true, data: { uuid: 'ddd-...' } } } } },
          '404': { description: 'Not found' },
        },
      },
    },

    // ==================== REPORTS ====================

    '/api/reports/depreciation': {
      get: {
        tags: ['Reports'],
        summary: 'คำนวณค่าเสื่อมราคาครุภัณฑ์ (Straight-Line)',
        description: 'คำนวณค่าเสื่อมราคาแบบ Straight-Line ในช่วงวันที่ที่กำหนด\n\n**Permission:**\n- Admin/dept.1: กรอง departmentId ได้อิสระ\n- User ทั่วไป: ดูได้แค่ department ตัวเอง',
        parameters: [
          { name: 'startDate',            in: 'query', required: true,  schema: { type: 'string', format: 'date' }, description: 'วันเริ่มต้น เช่น 2024-10-01' },
          { name: 'endDate',              in: 'query', required: true,  schema: { type: 'string', format: 'date' }, description: 'วันสิ้นสุด เช่น 2025-09-30' },
          { name: 'departmentId',         in: 'query', required: false, schema: { type: 'integer' } },
          { name: 'fundId',               in: 'query', required: false, schema: { type: 'integer' } },
          { name: 'equipmentTypeId',      in: 'query', required: false, schema: { type: 'integer' } },
          { name: 'acquisitionMethodId',  in: 'query', required: false, schema: { type: 'integer' } },
          { name: 'acquisitionSourceId',  in: 'query', required: false, schema: { type: 'integer' } },
          { name: 'minPrice',             in: 'query', required: false, schema: { type: 'number' } },
        ],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    details: [{
                      equipmentNumber:      '545-36-5436-001',
                      equipmentName:        'โต๊ะ',
                      acquisitionDate:      '2014-03-29',
                      usefulAge:            11.42,
                      usefulLife:           8,
                      price:                5000,
                      acquisitionSource:    'งปม',
                      depreciationPerYear:  625,
                      accumulatedBefore:    4999,
                      depreciationThisYear: 0,
                      accumulatedAfter:     4999,
                      bookValueStart:       1,
                      bookValueEnd:         1,
                      departmentName:       'ส่วนบริหารงานทั่วไป',
                    }],
                    summary: {
                      totalItems:                1,
                      periodStart:               '2024-10-01',
                      periodEnd:                 '2025-09-30',
                      totalPrice:                5000,
                      totalDepreciationPerYear:  625,
                      totalAccumulatedBefore:    4999,
                      totalDepreciationThisYear: 0,
                      totalAccumulatedAfter:     4999,
                      totalBookValueStart:       1,
                      totalBookValueEnd:         1,
                    },
                  },
                },
              },
            },
          },
          '400': { description: 'startDate หรือ endDate is required' },
          '403': { description: 'ไม่มีสิทธิ์ดูข้อมูล department อื่น' },
        },
      },
    },

    // ==================== REPORTS (survey) ====================

    '/api/reports/survey': {
      get: {
        tags: ['Reports'],
        summary: 'ออกรายงานสำรวจครุภัณฑ์หน่วยงาน (PDF)',
        description: [
          'ออกรายงานสำรวจครุภัณฑ์ประจำปีงบประมาณ เป็นไฟล์ PDF',
          '',
          '**การจัดกลุ่มข้อมูล:**',
          '1. แบ่งตาม department',
          '2. แบ่งตาม fiscalYear (ปีงบประมาณที่จัดซื้อ ≤ budgetYear)',
          '3. แบ่งตามแหล่งเงินทุน (acquisitionSource)',
          '4. แบ่งตาม project',
          '',
          '**คอลัมน์ในรายงาน:** ลำดับ, รายการครุภัณฑ์, หมายเลขครุภัณฑ์,',
          'รอเบิกจ่าย, ปกติ, ซ่อม, ไม่พร้อมใช้งาน, จำหน่ายทิ้ง, อายุการใช้งาน, อายุสุทธิ',
        ].join('\n'),
        parameters: [
          { name: 'budgetYear',   in: 'query', required: true,  schema: { type: 'integer' }, description: 'ปีงบประมาณ (พ.ศ.) เช่น 2568 — แสดงครุภัณฑ์ที่ fiscalYear ≤ ค่านี้' },
          { name: 'departmentId', in: 'query', required: false, schema: { type: 'integer' }, description: 'ถ้าไม่ระบุ จะออกรายงานทุก department' },
        ],
        responses: {
          '200': { description: 'PDF file — Content-Type: application/pdf, Content-Disposition: attachment' },
          '400': { description: 'budgetYear is required' },
          '401': { description: 'Unauthorized' },
        },
      },
    },

    // ==================== USERS (admin only) ====================

    '/api/users': {
      get: {
        tags: ['Users'],
        summary: 'Get all users',
        description: '🔒 **admin เท่านั้น**',
        parameters: [
          { name: 'search',       in: 'query', schema: { type: 'string'  } },
          { name: 'role',         in: 'query', schema: { type: 'string', enum: ['admin', 'manager', 'user'] } },
          { name: 'departmentId', in: 'query', schema: { type: 'integer' } },
        ],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: [{
                    uuid:           '3fa85f64-...',
                    email:          'somchai@kmitl.ac.th',
                    firstName:      'สมชาย',
                    lastName:       'ใจดี',
                    role:           'user',
                    departmentId:   1,
                    departmentName: 'ภาควิชาฟิสิกส์',
                    createdAt:      '2026-03-17T10:00:00.000Z',
                  }],
                },
              },
            },
          },
          '403': { description: 'admin เท่านั้น' },
        },
      },
      post: {
        tags: ['Users'],
        summary: 'Create user',
        description: '🔒 **admin เท่านั้น** — user จะ login ด้วย Google OAuth ได้ทันทีที่ email ตรงกัน',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: {
                email:        'somchai@kmitl.ac.th',
                firstName:    'สมชาย',
                lastName:     'ใจดี',
                role:         'user',
                departmentId: 2,
              },
              schema: {
                type: 'object',
                required: ['email', 'role'],
                properties: {
                  email:        { type: 'string', format: 'email' },
                  firstName:    { type: 'string' },
                  lastName:     { type: 'string' },
                  role:         { type: 'string', enum: ['admin', 'manager', 'user'] },
                  departmentId: { type: 'integer', nullable: true },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Created' },
          '400': { description: 'email ซ้ำ หรือ role ไม่ถูกต้อง' },
          '403': { description: 'admin เท่านั้น' },
        },
      },
    },

    '/api/users/{uuid}': {
      get: {
        tags: ['Users'],
        summary: 'Get user by UUID',
        description: '🔒 **admin เท่านั้น**',
        parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Success' }, '403': { description: 'admin เท่านั้น' }, '404': { description: 'Not found' } },
      },
      put: {
        tags: ['Users'],
        summary: 'Update user',
        description: '🔒 **admin เท่านั้น**',
        parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  firstName:    { type: 'string' },
                  lastName:     { type: 'string' },
                  role:         { type: 'string', enum: ['admin', 'manager', 'user'] },
                  departmentId: { type: 'integer', nullable: true },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Updated' }, '403': { description: 'admin เท่านั้น' }, '404': { description: 'Not found' } },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete user (soft delete)',
        description: '🔒 **admin เท่านั้น** — ลบตัวเองไม่ได้',
        parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Deleted', content: { 'application/json': { example: { success: true, data: { uuid: '3fa85f64-...' } } } } },
          '400': { description: 'ไม่สามารถลบ account ตัวเองได้' },
          '403': { description: 'admin เท่านั้น' },
          '404': { description: 'Not found' },
        },
      },
    },

    // ==================== HEALTH ====================

    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                example: { status: 'ok', timestamp: '2026-03-22T00:00:00.000Z', environment: 'development' },
              },
            },
          },
        },
      },
    },
  },
};