export const swaggerConfig = {
  openapi: '3.0.0',
  info: {
    title: 'Equipment Management API',
    version: '3.0.0',
    description: 'API documentation for Equipment Management System\n\n**Auth:** Cookie-based (httpOnly)\n- ทุก request ต้องใช้ `withCredentials: true` (axios) หรือ `credentials: "include"` (fetch)\n- เมื่อได้ 401 → ยิง `POST /api/auth/refresh` แล้ว retry\n\n**Permission:**\n- Admin / Department 1: เข้าถึงได้ทุก department\n- User ทั่วไป: เข้าถึงได้เฉพาะ department ตัวเอง',
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
          data: { type: 'object' },
        },
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'array', items: { type: 'object' } },
          pagination: {
            type: 'object',
            properties: {
              total: { type: 'number' },
              page: { type: 'number' },
              limit: { type: 'number' },
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
    '/api/masters/activities': {
      get: { tags: ['Masters'], summary: 'Get all activities', responses: { '200': { description: 'Success' } } },
    },
    '/api/masters/funds': {
      get: { tags: ['Masters'], summary: 'Get all funds', responses: { '200': { description: 'Success' } } },
    },
    '/api/masters/equipment-types': {
      get: { tags: ['Masters'], summary: 'Get all equipment types', responses: { '200': { description: 'Success' } } },
    },
    '/api/masters/acquisition-sources': {
      get: { tags: ['Masters'], summary: 'Get all acquisition sources', responses: { '200': { description: 'Success' } } },
    },
    '/api/masters/acquisition-methods': {
      get: { tags: ['Masters'], summary: 'Get all acquisition methods', responses: { '200': { description: 'Success' } } },
    },
    '/api/masters/buildings': {
      get: { tags: ['Masters'], summary: 'Get all buildings', responses: { '200': { description: 'Success' } } },
    },
    '/api/masters/rooms': {
      get: { tags: ['Masters'], summary: 'Get all rooms', responses: { '200': { description: 'Success' } } },
    },
    '/api/masters/rooms/building/{buildingId}': {
      get: { tags: ['Masters'], summary: 'Get rooms by building', parameters: [{ name: 'buildingId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } },
    },
    '/api/masters/support-units': {
      get: { tags: ['Masters'], summary: 'Get all support units', responses: { '200': { description: 'Success' } } },
    },
    '/api/masters/plan-sections': {
      get: { tags: ['Masters'], summary: 'Get all plan sections', responses: { '200': { description: 'Success' } } },
    },
    '/api/masters/project-types': {
      get: { tags: ['Masters'], summary: 'Get all project types', responses: { '200': { description: 'Success' } } },
    },

    // ==================== EQUIPMENT ====================

    '/api/equipment': {
      get: {
        tags: ['Equipment'],
        summary: 'Get all equipment',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['normal', 'borrowed', 'repair', 'unavailable', 'disposed'] } },
          { name: 'departmentId', in: 'query', schema: { type: 'integer' }, description: 'admin/dept.1 เท่านั้น' },
          { name: 'equipmentTypeId', in: 'query', schema: { type: 'integer' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: { '200': { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } } } },
      },
      post: {
        tags: ['Equipment'],
        summary: 'Create equipment (single or batch)',
        description: 'สร้าง 1 รายการ: ส่ง start ไม่มี end\nสร้างชุด: ส่ง start + end (max 100)\n\nตัวอย่าง numberPrefix="545-36-5436", start=1, end=3\n→ equipmentNumber: 545-36-5436-001, 545-36-5436-002, 545-36-5436-003\n\n**หมายเหตุ:** userUuid ดึงจาก token อัตโนมัติ ไม่ต้องส่งมา',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['equipmentCode', 'numberPrefix', 'start', 'equipmentName'],
                properties: {
                  equipmentCode:      { type: 'string', example: '545365436' },
                  numberPrefix:       { type: 'string', example: '545-36-5436' },
                  start:              { type: 'integer', example: 1 },
                  end:                { type: 'integer', example: 3 },
                  padLength:          { type: 'integer', example: 3, default: 3 },
                  equipmentName:      { type: 'string', example: 'คอมพิวเตอร์ตั้งโต๊ะ' },
                  equipmentTypeId:    { type: 'integer' },
                  departmentId:       { type: 'integer' },
                  activity:           { type: 'string', description: 'กิจกรรม (text)' },
                  fundId:             { type: 'integer' },
                  fiscalYear:         { type: 'integer', example: 2568 },
                  price:              { type: 'number', example: 25000 },
                  unit:               { type: 'string', example: 'เครื่อง' },
                  acquisitionSourceId:{ type: 'integer' },
                  acquisitionMethodId:{ type: 'integer' },
                  acquisitionDate:    { type: 'string', format: 'date' },
                  company:            { type: 'string' },
                  sizeDetail:         { type: 'string' },
                  buildingId:         { type: 'integer' },
                  roomId:             { type: 'integer' },
                  projectId:          { type: 'integer' },
                  note:               { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Created — returns array of created equipment' },
          '400': { description: 'Bad request / duplicate equipmentNumber' },
          '403': { description: 'ไม่มีสิทธิ์สร้างใน department อื่น' },
        },
      },
    },
    '/api/equipment/stats': {
      get: {
        tags: ['Equipment'],
        summary: 'Get equipment statistics',
        description: 'ดึงสถิติครุภัณฑ์ — byStatus แสดงครบ 5 สถานะเสมอ (count = 0 ถ้าไม่มี)',
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: {
                    total: 21,
                    byStatus: [
                      { status: 'normal',      count: 20 },
                      { status: 'borrowed',    count: 0  },
                      { status: 'repair',      count: 1  },
                      { status: 'unavailable', count: 0  },
                      { status: 'disposed',    count: 0  },
                    ],
                    byDepartment: [
                      { departmentId: 1, count: 3  },
                      { departmentId: 2, count: 6  },
                      { departmentId: 5, count: 12 },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/equipment/code/{code}': {
      get: { tags: ['Equipment'], summary: 'Get equipment by equipmentCode', parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Success' }, '403': { description: 'ไม่มีสิทธิ์' }, '404': { description: 'Not found' } } },
    },
    '/api/equipment/{uuid}/history': {
      get: {
        tags: ['Equipment'],
        summary: 'Get equipment history (timeline)',
        description: 'ดึงประวัติการเปลี่ยนสถานะของครุภัณฑ์ทั้งหมด ไม่ว่าใครจะเป็นคนแก้\nเรียงจากล่าสุดไปเก่าสุด',
        parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: [
                    { id: 3, status: 'normal',   remark: 'นำมาคืนเรียบร้อย',       createdAt: '2024-03-16T09:30:00.000Z', createdBy: 'ธีรพล ใจดี' },
                    { id: 2, status: 'borrowed', remark: 'ภาคเมดีดำเนินการยืม',    createdAt: '2024-03-15T15:05:00.000Z', createdBy: 'ธีรพล ใจดี' },
                    { id: 1, status: 'normal',   remark: 'ลงทะเบียน',              createdAt: '2024-03-15T10:00:00.000Z', createdBy: 'ธีรพล ใจดี' },
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
        summary: 'Get equipment by UUID',
        parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Success' }, '403': { description: 'ไม่มีสิทธิ์' }, '404': { description: 'Not found' } },
      },
      put: {
        tags: ['Equipment'],
        summary: 'Update equipment',
        parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { '200': { description: 'Updated' }, '403': { description: 'ไม่มีสิทธิ์' }, '404': { description: 'Not found' } },
      },
      delete: {
        tags: ['Equipment'],
        summary: 'Delete equipment (soft delete)',
        parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Deleted' }, '403': { description: 'ไม่มีสิทธิ์' }, '404': { description: 'Not found' } },
      },
    },
    '/api/equipment/{uuid}/attachments': {
      post: {
        tags: ['Equipment'],
        summary: 'Upload attachment(s) to equipment',
        description: 'รองรับทั้งไฟล์เดียว (field: `file`) และหลายไฟล์พร้อมกัน (field: `files`)\nรองรับ: jpg, png, webp · ขนาดสูงสุด 10 MB',
        parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file:  { type: 'string', format: 'binary', description: 'ไฟล์เดียว' },
                  files: { type: 'array', items: { type: 'string', format: 'binary' }, description: 'หลายไฟล์' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Uploaded — returns array of attachment objects' },
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
        parameters: [
          { name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
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
          'ระบบจะ: ปิด record เก่า → สร้าง record ใหม่ → อัปเดต status → บันทึก log (transaction)',
          '**userUuid ดึงจาก token อัตโนมัติ ไม่ต้องส่งมา**',
          '',
          '**Blocked transitions:**',
          '- FROM disposed → ทุกสถานะ (403)',
          '- TO สถานะเดิม (400)',
          '',
          '---',
          '**normal** — คืนสภาพปกติ:',
          '```json',
          '{',
          '  "equipmentUuids": ["3fa85f64-...", "b1c2d3e4-...", "c5d6e7f8-..."],',
          '  "newStatus": "normal",',
          '  "data": { "reason": "ซ่อมเสร็จแล้ว" }',
          '}',
          '```',
          '',
          '**borrowed** — ยืม:',
          '```json',
          '{',
          '  "equipmentUuids": ["3fa85f64-...", "b1c2d3e4-..."],',
          '  "newStatus": "borrowed",',
          '  "data": {',
          '    "borrowerName": "สมชาย ใจดี",',
          '    "borrowDate": "2026-02-25",',
          '    "borrowerDepartmentId": 3,',
          '    "expectedReturnDate": "2026-03-10",',
          '    "reason": "ใช้ในงานสัมมนา"',
          '  }',
          '}',
          '```',
          '',
          '**repair** — ส่งซ่อม:',
          '```json',
          '{',
          '  "equipmentUuids": ["3fa85f64-..."],',
          '  "newStatus": "repair",',
          '  "data": {',
          '    "repairReason": "จอแตก",',
          '    "startDate": "2026-02-25",',
          '    "repairCompany": "บริษัทซ่อมดี",',
          '    "cost": 3500,',
          '    "endDate": "2026-03-10",',
          '    "attachmentId": 5',
          '  }',
          '}',
          '```',
          '',
          '**unavailable** — ไม่สามารถใช้งานได้:',
          '```json',
          '{',
          '  "equipmentUuids": ["3fa85f64-..."],',
          '  "newStatus": "unavailable",',
          '  "data": { "reason": "ชำรุดรอการพิจารณาจำหน่าย" }',
          '}',
          '```',
          '',
          '**disposed** — จำหน่าย:',
          '```json',
          '{',
          '  "equipmentUuids": ["3fa85f64-..."],',
          '  "newStatus": "disposed",',
          '  "data": {',
          '    "disposalDate": "2026-02-25",',
          '    "disposalMethod": "ขายทอดตลาด",',
          '    "approvedBy": "ผศ.ดร.สมศักดิ์",',
          '    "cost": 500,',
          '    "reason": "หมดอายุการใช้งาน",',
          '    "attachmentId": 6',
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
                  equipmentUuids: { type: 'array', items: { type: 'string', format: 'uuid' }, example: ['3fa85f64-...', 'b1c2d3e4-...'] },
                  newStatus: { type: 'string', enum: ['normal', 'borrowed', 'repair', 'unavailable', 'disposed'] },
                  data: {
                    type: 'object',
                    properties: {
                      reason:              { type: 'string', description: 'normal / unavailable' },
                      borrowerName:        { type: 'string', description: '* borrowed' },
                      borrowerDepartmentId:{ type: 'integer' },
                      borrowDate:          { type: 'string', format: 'date', description: '* borrowed' },
                      expectedReturnDate:  { type: 'string', format: 'date' },
                      repairReason:        { type: 'string', description: '* repair' },
                      repairCompany:       { type: 'string' },
                      cost:                { type: 'number' },
                      startDate:           { type: 'string', format: 'date', description: '* repair' },
                      endDate:             { type: 'string', format: 'date', description: 'วันคาดการณ์ซ่อมเสร็จ' },
                      attachmentId:        { type: 'integer', description: 'repair / disposed — จาก POST /api/attachments/upload' },
                      disposalDate:        { type: 'string', format: 'date', description: '* disposed' },
                      disposalMethod:      { type: 'string' },
                      approvedBy:          { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Changed successfully' },
          '400': { description: 'Validation error / same status / blocked transition' },
          '403': { description: 'ไม่มีสิทธิ์เปลี่ยนสถานะ department อื่น' },
        },
      },
    },

    '/api/equipment-status/normals': {
      get: { tags: ['Equipment Status'], summary: 'Get all normal records', responses: { '200': { description: 'Success' } } },
    },
    '/api/equipment-status/normals/{id}': {
      get:    { tags: ['Equipment Status'], summary: 'Get normal by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } } },
      put:    { tags: ['Equipment Status'], summary: 'Update normal',    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Equipment Status'], summary: 'Delete normal',    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' } } },
    },
    '/api/equipment-status/normals/equipment/{uuid}': {
      get: { tags: ['Equipment Status'], summary: 'Get normals by equipment', parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Success' } } },
    },
    '/api/equipment-status/borrows': {
      get: { tags: ['Equipment Status'], summary: 'Get all borrow records', responses: { '200': { description: 'Success' } } },
    },
    '/api/equipment-status/borrows/{id}': {
      get:    { tags: ['Equipment Status'], summary: 'Get borrow by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } } },
      put:    { tags: ['Equipment Status'], summary: 'Update borrow',    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Equipment Status'], summary: 'Delete borrow',    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' } } },
    },
    '/api/equipment-status/borrows/equipment/{uuid}': {
      get: { tags: ['Equipment Status'], summary: 'Get borrows by equipment', parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Success' } } },
    },
    '/api/equipment-status/repairs': {
      get: { tags: ['Equipment Status'], summary: 'Get all repair records', responses: { '200': { description: 'Success' } } },
    },
    '/api/equipment-status/repairs/{id}': {
      get: { tags: ['Equipment Status'], summary: 'Get repair by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } } },
      put: {
        tags: ['Equipment Status'],
        summary: 'Update repair',
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
      delete: { tags: ['Equipment Status'], summary: 'Delete repair', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' } } },
    },
    '/api/equipment-status/repairs/equipment/{uuid}': {
      get: { tags: ['Equipment Status'], summary: 'Get repairs by equipment', parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Success' } } },
    },
    '/api/equipment-status/unavailable': {
      get: { tags: ['Equipment Status'], summary: 'Get all unavailable records', responses: { '200': { description: 'Success' } } },
    },
    '/api/equipment-status/unavailable/{id}': {
      get:    { tags: ['Equipment Status'], summary: 'Get unavailable by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } } },
      put:    { tags: ['Equipment Status'], summary: 'Update unavailable',    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Equipment Status'], summary: 'Delete unavailable',    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' } } },
    },
    '/api/equipment-status/unavailable/equipment/{uuid}': {
      get: { tags: ['Equipment Status'], summary: 'Get unavailable by equipment', parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Success' } } },
    },
    '/api/equipment-status/disposals': {
      get: { tags: ['Equipment Status'], summary: 'Get all disposal records', responses: { '200': { description: 'Success' } } },
    },
    '/api/equipment-status/disposals/{id}': {
      get:    { tags: ['Equipment Status'], summary: 'Get disposal by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } } },
      put:    { tags: ['Equipment Status'], summary: 'Update disposal',    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Equipment Status'], summary: 'Delete disposal',    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' } } },
    },
    '/api/equipment-status/disposals/equipment/{uuid}': {
      get: { tags: ['Equipment Status'], summary: 'Get disposals by equipment', parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Success' } } },
    },
    '/api/equipment-status/logs': {
      get: { tags: ['Equipment Status'], summary: 'Get all status logs', responses: { '200': { description: 'Success' } } },
    },
    '/api/equipment-status/logs/equipment/{uuid}': {
      get: { tags: ['Equipment Status'], summary: 'Get status logs by equipment (timeline)', parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Success' } } },
    },

    // ==================== ATTACHMENTS ====================

    '/api/attachments/upload': {
      post: {
        tags: ['Attachments'],
        summary: '⭐ Upload file (สำหรับ repair / disposal / mhesi)',
        description: 'อัปโหลดไฟล์ → ได้ attachmentId กลับมา → เอาไปใส่ใน body ของ changeStatus หรือ mhesi\n\n**รองรับ:** jpg, png, webp · ขนาดสูงสุด 10 MB\n\n**สำหรับ equipment:** ใช้ `POST /api/equipment/:uuid/attachments` แทน',
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
                example: { success: true, data: { id: 5, fileName: 'doc.jpg', filePath: '/uploads/repair/2026/03/uuid.jpg', fileType: 'image/jpeg' } },
              },
            },
          },
          '400': { description: 'ไม่มีไฟล์ / ประเภทไม่รองรับ / ขนาดเกิน' },
        },
      },
    },
    '/api/attachments': {
      get: { tags: ['Attachments'], summary: 'Get all attachments', responses: { '200': { description: 'Success' } } },
    },
    '/api/attachments/{id}': {
      get:    { tags: ['Attachments'], summary: 'Get attachment by ID',       parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } } },
      put:    { tags: ['Attachments'], summary: 'Update attachment metadata', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Attachments'], summary: 'Delete attachment (ลบไฟล์ + record)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' }, '404': { description: 'Not found' } } },
    },

    // ==================== PROJECTS ====================

    '/api/projects': {
      get: {
        tags: ['Projects'],
        summary: 'Get all projects',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Success' } },
      },
      post: {
        tags: ['Projects'],
        summary: 'Create project',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['projectName'],
                properties: {
                  projectName:        { type: 'string' },
                  projectTypeId:      { type: 'integer' },
                  projectDate:        { type: 'string', format: 'date' },
                  budget:             { type: 'number' },
                  status:             { type: 'string' },
                  acquisitionSourceId:{ type: 'integer' },
                  note:               { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/api/projects/stats': {
      get: { tags: ['Projects'], summary: 'Get project statistics', responses: { '200': { description: 'Success' } } },
    },
    '/api/projects/{uuid}/history': {
      get: {
        tags: ['Projects'],
        summary: 'Get project edit history',
        description: 'ดึงประวัติการแก้ไขข้อมูล project — แสดง before/after ของ field ที่เปลี่ยน',
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
      get:    { tags: ['Projects'], summary: 'Get project by UUID',        parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } } },
      put:    { tags: ['Projects'], summary: 'Update project',             parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Updated' }, '404': { description: 'Not found' } } },
      delete: { tags: ['Projects'], summary: 'Delete project (soft delete)', parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { '200': { description: 'Deleted' }, '404': { description: 'Not found' } } },
    },

    // ==================== MHESI ====================

    '/api/mhesi': {
      get: {
        tags: ['MHESI'],
        summary: 'Get all MHESI numbers',
        parameters: [
          { name: 'search',       in: 'query', schema: { type: 'string'  }, description: 'ค้นหา mhesiNumber หรือ activityName' },
          { name: 'faculty',      in: 'query', schema: { type: 'string'  }, description: 'ชื่อคณะ/หน่วยงาน' },
          { name: 'departmentId', in: 'query', schema: { type: 'integer' } },
          { name: 'planId',       in: 'query', schema: { type: 'integer' } },
          { name: 'projectId',    in: 'query', schema: { type: 'integer' } },
          { name: 'amountMin',    in: 'query', schema: { type: 'number'  }, description: 'จำนวนเงินขั้นต่ำ' },
          { name: 'amountMax',    in: 'query', schema: { type: 'number'  }, description: 'จำนวนเงินสูงสุด' },
          { name: 'dateFrom',     in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'dateTo',       in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'sortBy',       in: 'query', schema: { type: 'string', enum: ['mhesiNumber', 'activityName', 'date', 'amount', 'project', 'faculty', 'plan'] } },
          { name: 'sortDir',      in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
          { name: 'page',         in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit',        in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: { '200': { description: 'Success' } },
      },
      post: {
        tags: ['MHESI'],
        summary: 'Create MHESI number',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['mhesiNumber'],
                properties: {
                  mhesiNumber:  { type: 'string', maxLength: 16 },
                  faculty:      { type: 'string', description: 'ชื่อคณะ/หน่วยงาน (text)' },
                  departmentId: { type: 'integer' },
                  planId:       { type: 'integer' },
                  projectId:    { type: 'integer' },
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
        responses: { '201': { description: 'Created' } },
      },
    },
    '/api/mhesi/{uuid}/history': {
      get: {
        tags: ['MHESI'],
        summary: 'Get MHESI edit history',
        description: 'ดึงประวัติการแก้ไขข้อมูล MHESI — แสดง before/after ของ field ที่เปลี่ยน',
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
                      before:    { activityName: 'จัดซื้อเก้าอี้', amount: '25000.00' },
                      after:     { activityName: 'จัดซื้อเก้าอี้สำนักงาน', amount: '30000.00' },
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
                    uuid:          '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                    mhesiNumber:   '67-001-002-001',
                    faculty:       'คณะวิทยาศาสตร์',
                    departmentId:  1,
                    planId:        1,
                    projectId:     1,
                    activityName:  'จัดซื้อครุภัณฑ์สำนักงาน',
                    date:          '2024-11-29',
                    amount:        '25000.00',
                    note:          'หมายเหตุ',
                    attachmentId:  null,
                    createdAt:     '2024-11-29T10:00:00.000Z',
                    updatedAt:     '2024-11-29T10:00:00.000Z',
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
                  mhesiNumber:   { type: 'string', maxLength: 16 },
                  faculty:       { type: 'string', description: 'ชื่อคณะ/หน่วยงาน (text)' },
                  departmentId:  { type: 'integer' },
                  planId:        { type: 'integer' },
                  projectId:     { type: 'integer' },
                  activityName:  { type: 'string' },
                  date:          { type: 'string', format: 'date' },
                  amount:        { type: 'number' },
                  note:          { type: 'string' },
                  attachmentId:  { type: 'integer' },
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
          '200': {
            description: 'Deleted',
            content: { 'application/json': { example: { success: true, data: { uuid: '3fa85f64-...' } } } },
          },
          '404': { description: 'Not found' },
        },
      },
    },
    '/api/mhesi/project/{projectId}': {
      get: { tags: ['MHESI'], summary: 'Get MHESI by project', parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } },
    },

    // ==================== REPORTS ====================

    '/api/reports/depreciation': {
      get: {
        tags: ['Reports'],
        summary: 'คำนวณค่าเสื่อมราคาครุภัณฑ์',
        description: [
          'คำนวณค่าเสื่อมราคาแบบ Straight-Line ในช่วงวันที่ที่กำหนด',
          'รองรับหลายปีงบประมาณ เช่น 2024-10-01 ถึง 2027-09-30',
          'ใช้ query 1 ครั้ง — คำนวณ + สรุปในหน่วยความจำ',
          '',
          '**Permission:**',
          '- Admin/dept.1: กรอง departmentId ได้อิสระ',
          '- User ทั่วไป: ดูได้แค่ department ตัวเอง (ส่ง departmentId ของคนอื่น → 403)',
          '',
          '**Response:**',
          '```json',
          '{',
          '  "data": {',
          '    "details": [{',
          '      "equipmentNumber": "545-36-5436-001",',
          '      "equipmentName": "โต๊ะ",',
          '      "acquisitionDate": "2014-03-29",',
          '      "usefulAge": 11.42,',
          '      "usefulLife": 8,',
          '      "price": 5000,',
          '      "acquisitionSource": "งปม",',
          '      "depreciationPerYear": 625,',
          '      "accumulatedBefore": 4999,',
          '      "depreciationThisYear": 0,',
          '      "accumulatedAfter": 4999,',
          '      "bookValueStart": 1,',
          '      "bookValueEnd": 1,',
          '      "departmentName": "ส่วนบริหารงานทั่วไป"',
          '    }],',
          '    "summary": {',
          '      "totalItems": 1,',
          '      "periodStart": "2024-10-01",',
          '      "periodEnd": "2025-09-30",',
          '      "totalPrice": 5000,',
          '      "totalDepreciationPerYear": 625,',
          '      "totalAccumulatedBefore": 4999,',
          '      "totalDepreciationThisYear": 0,',
          '      "totalAccumulatedAfter": 4999,',
          '      "totalBookValueStart": 1,',
          '      "totalBookValueEnd": 1',
          '    }',
          '  }',
          '}',
          '```',
        ].join('\n'),
        parameters: [
          { name: 'startDate', in: 'query', required: true, schema: { type: 'string', format: 'date' }, description: 'วันเริ่มต้น เช่น 2024-10-01' },
          { name: 'endDate',   in: 'query', required: true, schema: { type: 'string', format: 'date' }, description: 'วันสิ้นสุด เช่น 2025-09-30' },
          { name: 'departmentId',       in: 'query', schema: { type: 'integer' }, description: 'admin/dept.1 เท่านั้น' },
          { name: 'fundId',             in: 'query', schema: { type: 'integer' } },
          { name: 'equipmentTypeId',    in: 'query', schema: { type: 'integer' } },
          { name: 'acquisitionMethodId',in: 'query', schema: { type: 'integer' } },
          { name: 'acquisitionSourceId',in: 'query', schema: { type: 'integer' } },
          { name: 'minPrice',           in: 'query', schema: { type: 'number' }, description: 'มูลค่าต่ำสุด' },
        ],
        responses: {
          '200': { description: 'Success — returns { details[], summary }' },
          '400': { description: 'startDate หรือ endDate is required' },
          '403': { description: 'ไม่มีสิทธิ์ดูข้อมูล department อื่น' },
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
          { name: 'search',       in: 'query', schema: { type: 'string'  }, description: 'ค้นหาชื่อหรือ email' },
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
                  data: [
                    {
                      uuid:           '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                      email:          'somchai@kmitl.ac.th',
                      firstName:      'สมชาย',
                      lastName:       'ใจดี',
                      role:           'user',
                      departmentId:   1,
                      departmentName: 'ภาควิชาฟิสิกส์',
                      createdAt:      '2026-03-17T10:00:00.000Z',
                    },
                  ],
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
              schema: {
                type: 'object',
                required: ['email', 'role'],
                properties: {
                  email:        { type: 'string', format: 'email', example: 'somchai@kmitl.ac.th' },
                  firstName:    { type: 'string', example: 'สมชาย' },
                  lastName:     { type: 'string', example: 'ใจดี' },
                  role:         { type: 'string', enum: ['admin', 'manager', 'user'] },
                  departmentId: { type: 'integer', description: 'null = ไม่สังกัด department' },
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
        responses: { '200': { description: 'Success' }, '404': { description: 'Not found' }, '403': { description: 'admin เท่านั้น' } },
      },
      put: {
        tags: ['Users'],
        summary: 'Update user',
        description: '🔒 **admin เท่านั้น** — แก้ได้เฉพาะ firstName, lastName, role, departmentId',
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
        responses: { '200': { description: 'Updated' }, '404': { description: 'Not found' }, '403': { description: 'admin เท่านั้น' } },
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
                example: { status: 'ok', timestamp: '2026-03-02T00:00:00.000Z', environment: 'development' },
              },
            },
          },
        },
      },
    },
  },
};