export const swaggerConfig = {
  openapi: '3.0.0',
  info: {
    title: 'Equipment Management API',
    version: '2.0.0',
    description: 'API documentation for Equipment Management System',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
  ],
  tags: [
    { name: 'Masters', description: 'Master data (read-only)' },
    { name: 'Projects', description: 'Project management' },
    { name: 'MHESI', description: 'MHESI number management' },
    { name: 'Equipment', description: 'Equipment management' },
    { name: 'Equipment Status', description: 'Equipment status tracking' },
    { name: 'Attachments', description: 'File attachment management' },
    { name: 'Health', description: 'Health check' },
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

    // ==================== MASTERS (GET ONLY) ====================

    '/api/masters/departments': {
      get: { tags: ['Masters'], summary: 'Get all departments', responses: { '200': { description: 'Success' } } },
    },
    '/api/masters/departments/{id}': {
      get: { tags: ['Masters'], summary: 'Get department by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } } },
    },
    '/api/masters/activities': {
      get: { tags: ['Masters'], summary: 'Get all activities', responses: { '200': { description: 'Success' } } },
    },
    '/api/masters/activities/{id}': {
      get: { tags: ['Masters'], summary: 'Get activity by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } } },
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
      get: { tags: ['Masters'], summary: 'Get building by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } } },
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
      get: { tags: ['Masters'], summary: 'Get rooms by building', parameters: [{ name: 'buildingId', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Success' } } },
    },
    '/api/masters/support-units': {
      get: { tags: ['Masters'], summary: 'Get all support units', responses: { '200': { description: 'Success' } } },
    },
    '/api/masters/support-units/{id}': {
      get: { tags: ['Masters'], summary: 'Get support unit by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } } },
    },
    '/api/masters/plan-sections': {
      get: { tags: ['Masters'], summary: 'Get all plan sections', responses: { '200': { description: 'Success' } } },
    },
    '/api/masters/plan-sections/{id}': {
      get: { tags: ['Masters'], summary: 'Get plan section by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } } },
    },
    '/api/masters/project-types': {
      get: { tags: ['Masters'], summary: 'Get all project types', responses: { '200': { description: 'Success' } } },
    },
    '/api/masters/project-types/{id}': {
      get: { tags: ['Masters'], summary: 'Get project type by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } } },
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
                  projectName: { type: 'string' },
                  projectTypeId: { type: 'integer' },
                  projectDate: { type: 'string', format: 'date' },
                  budget: { type: 'number' },
                  status: { type: 'string' },
                  acquisitionSourceId: { type: 'integer' },
                  note: { type: 'string' },
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
    '/api/projects/{id}': {
      get: { tags: ['Projects'], summary: 'Get project by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } } },
      put: { tags: ['Projects'], summary: 'Update project', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Updated' }, '404': { description: 'Not found' } } },
      delete: { tags: ['Projects'], summary: 'Delete project (soft delete)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' }, '404': { description: 'Not found' } } },
    },

    // ==================== MHESI ====================

    '/api/mhesi': {
      get: {
        tags: ['MHESI'],
        summary: 'Get all MHESI numbers',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by mhesiNumber or activityName' },
          { name: 'projectId', in: 'query', schema: { type: 'integer' } },
          { name: 'departmentId', in: 'query', schema: { type: 'integer' } },
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
                  mhesiNumber: { type: 'string', maxLength: 16 },
                  departmentId: { type: 'integer' },
                  supportUnitId: { type: 'integer' },
                  planId: { type: 'integer' },
                  projectId: { type: 'integer' },
                  activityName: { type: 'string' },
                  date: { type: 'string', format: 'date' },
                  amount: { type: 'number' },
                  note: { type: 'string' },
                  attachmentId: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/api/mhesi/{id}': {
      get: { tags: ['MHESI'], summary: 'Get MHESI number by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } } },
      put: { tags: ['MHESI'], summary: 'Update MHESI number', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Updated' }, '404': { description: 'Not found' } } },
      delete: { tags: ['MHESI'], summary: 'Delete MHESI number (soft delete)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' }, '404': { description: 'Not found' } } },
    },
    '/api/mhesi/project/{projectId}': {
      get: { tags: ['MHESI'], summary: 'Get MHESI numbers by project', parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } },
    },

    // ==================== EQUIPMENT ====================

    '/api/equipment': {
      get: {
        tags: ['Equipment'],
        summary: 'Get all equipment',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['normal', 'borrowed', 'repair', 'unavailable', 'disposed'] } },
          { name: 'departmentId', in: 'query', schema: { type: 'integer' } },
          { name: 'equipmentTypeId', in: 'query', schema: { type: 'integer' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: { '200': { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } } } },
      },
      post: {
        tags: ['Equipment'],
        summary: 'Create equipment (single or batch)',
        description: [
          'สร้าง 1 รายการ: ส่ง start ไม่มี end',
          'สร้างชุด: ส่ง start + end (max 100)',
          '',
          'ตัวอย่าง numberPrefix="545-36-5436", start=1, end=3',
          '→ equipmentNumber: 545-36-5436-001, 545-36-5436-002, 545-36-5436-003',
        ].join('\n'),
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['equipmentCode', 'numberPrefix', 'start', 'equipmentName', 'userUuid'],
                properties: {
                  equipmentCode: { type: 'string', example: '545365436', description: 'รหัสครุภัณฑ์' },
                  userUuid: { type: 'string', format: 'uuid', description: 'UUID ของผู้ใช้ที่สร้าง' },
                  numberPrefix: { type: 'string', example: '545-36-5436', description: 'prefix สำหรับ equipmentNumber' },
                  start: { type: 'integer', example: 1, description: 'ลำดับเริ่มต้น' },
                  end: { type: 'integer', example: 3, description: 'ลำดับสิ้นสุด (ไม่ส่ง = สร้างแค่ start รายการเดียว)' },
                  padLength: { type: 'integer', example: 3, default: 3, description: 'ความยาว padding (default 3)' },
                  equipmentName: { type: 'string' },
                  equipmentTypeId: { type: 'integer' },
                  departmentId: { type: 'integer' },
                  activityId: { type: 'integer' },
                  fundId: { type: 'integer' },
                  fiscalYear: { type: 'integer' },
                  price: { type: 'number' },
                  unit: { type: 'string', example: 'เครื่อง' },
                  acquisitionSourceId: { type: 'integer' },
                  acquisitionMethodId: { type: 'integer' },
                  acquisitionDate: { type: 'string', format: 'date' },
                  company: { type: 'string' },
                  sizeDetail: { type: 'string' },
                  buildingId: { type: 'integer' },
                  roomId: { type: 'integer' },
                  projectId: { type: 'integer' },
                  status: { type: 'string', enum: ['normal', 'borrowed', 'repair', 'unavailable', 'disposed'], default: 'normal' },
                  note: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Created — returns array of created equipment' },
          '400': { description: 'Bad request / duplicate equipmentNumber', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/equipment/stats': {
      get: { tags: ['Equipment'], summary: 'Get equipment statistics', responses: { '200': { description: 'Success' } } },
    },
    '/api/equipment/code/{code}': {
      get: { tags: ['Equipment'], summary: 'Get equipment by code', parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } } },
    },
    '/api/equipment/{id}': {
      get: { tags: ['Equipment'], summary: 'Get equipment by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } } },
      put: { tags: ['Equipment'], summary: 'Update equipment', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Updated' }, '404': { description: 'Not found' } } },
      delete: { tags: ['Equipment'], summary: 'Delete equipment (soft delete)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' }, '404': { description: 'Not found' } } },
    },

    // ==================== EQUIPMENT STATUS ====================

    // Change Status — เส้นหลักสำหรับเปลี่ยนสถานะ
    '/api/equipment-status/change': {
      post: {
        tags: ['Equipment Status'],
        summary: '⭐ Change equipment status (main endpoint)',
        description: [
          'เปลี่ยนสถานะครุภัณฑ์หลายรายการพร้อมกัน',
          'ระบบจะ: ปิด record เก่า → สร้าง record ใหม่ → อัปเดต status → บันทึก log',
          'ทุกอย่างทำใน transaction เดียว ถ้า error จะ rollback ทั้งหมด',
          '',
          'field บังคับใน data ตาม newStatus:',
          '- normal     : ไม่มี',
          '- borrowed   : borrowerName, borrowDate',
          '- repair     : repairReason, startDate',
          '- unavailable: reason',
          '- disposed   : disposalDate',
        ].join('\n'),
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['equipmentIds', 'newStatus', 'userUuid'],
                properties: {
                  equipmentIds: {
                    type: 'array',
                    items: { type: 'integer' },
                    example: [1, 2, 3],
                    description: 'ID ครุภัณฑ์ที่ต้องการเปลี่ยนสถานะ',
                  },
                  newStatus: {
                    type: 'string',
                    enum: ['normal', 'borrowed', 'repair', 'unavailable', 'disposed'],
                  },
                  data: {
                    type: 'object',
                    description: 'ข้อมูลตามสถานะ',
                    properties: {
                      reason: { type: 'string', description: 'เหตุผล (normal / unavailable)' },
                      borrowerName: { type: 'string' },
                      borrowerDepartmentId: { type: 'integer' },
                      borrowDate: { type: 'string', format: 'date' },
                      expectedReturnDate: { type: 'string', format: 'date' },
                      repairReason: { type: 'string' },
                      repairCompany: { type: 'string' },
                      cost: { type: 'number' },
                      startDate: { type: 'string', format: 'date' },
                      endDate: { type: 'string', format: 'date', description: 'วันคาดการณ์ซ่อมเสร็จ' },
                      attachmentId: { type: 'integer' },
                      disposalDate: { type: 'string', format: 'date' },
                      disposalMethod: { type: 'string' },
                      approvedBy: { type: 'string' },
                      remark: { type: 'string', description: 'หมายเหตุใน log' },
                    },
                  },
                  userUuid: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Changed successfully' },
          '400': { description: 'Validation error / blocked transition', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    // Normals — GET / PUT / DELETE เท่านั้น
    '/api/equipment-status/normals': {
      get: { tags: ['Equipment Status'], summary: 'Get all normal records', responses: { '200': { description: 'Success' } } },
    },
    '/api/equipment-status/normals/{id}': {
      get: { tags: ['Equipment Status'], summary: 'Get normal record by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } } },
      put: { tags: ['Equipment Status'], summary: 'Update normal record', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Equipment Status'], summary: 'Delete normal record', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' } } },
    },
    '/api/equipment-status/normals/equipment/{equipmentId}': {
      get: { tags: ['Equipment Status'], summary: 'Get normal records by equipment', parameters: [{ name: 'equipmentId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } },
    },

    // Borrows — GET / PUT / DELETE เท่านั้น
    '/api/equipment-status/borrows': {
      get: { tags: ['Equipment Status'], summary: 'Get all borrow records', responses: { '200': { description: 'Success' } } },
    },
    '/api/equipment-status/borrows/{id}': {
      get: { tags: ['Equipment Status'], summary: 'Get borrow by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } } },
      put: { tags: ['Equipment Status'], summary: 'Update borrow', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Equipment Status'], summary: 'Delete borrow', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' } } },
    },
    '/api/equipment-status/borrows/equipment/{equipmentId}': {
      get: { tags: ['Equipment Status'], summary: 'Get borrows by equipment', parameters: [{ name: 'equipmentId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } },
    },

    // Repairs — GET / PUT / DELETE เท่านั้น
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
                  repairReason: { type: 'string' },
                  repairCompany: { type: 'string' },
                  cost: { type: 'number' },
                  startDate: { type: 'string', format: 'date' },
                  endDate: { type: 'string', format: 'date', description: 'วันคาดการณ์ซ่อมเสร็จ' },
                  actualEndDate: { type: 'string', format: 'date', description: 'วันที่ซ่อมเสร็จจริง' },
                  attachmentId: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Updated' } },
      },
      delete: { tags: ['Equipment Status'], summary: 'Delete repair', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' } } },
    },
    '/api/equipment-status/repairs/equipment/{equipmentId}': {
      get: { tags: ['Equipment Status'], summary: 'Get repairs by equipment', parameters: [{ name: 'equipmentId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } },
    },

    // Unavailable — GET / PUT / DELETE เท่านั้น
    '/api/equipment-status/unavailable': {
      get: { tags: ['Equipment Status'], summary: 'Get all unavailable records', responses: { '200': { description: 'Success' } } },
    },
    '/api/equipment-status/unavailable/{id}': {
      get: { tags: ['Equipment Status'], summary: 'Get unavailable by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } } },
      put: { tags: ['Equipment Status'], summary: 'Update unavailable', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Equipment Status'], summary: 'Delete unavailable', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' } } },
    },
    '/api/equipment-status/unavailable/equipment/{equipmentId}': {
      get: { tags: ['Equipment Status'], summary: 'Get unavailable records by equipment', parameters: [{ name: 'equipmentId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } },
    },

    // Disposals — GET / PUT / DELETE เท่านั้น
    '/api/equipment-status/disposals': {
      get: { tags: ['Equipment Status'], summary: 'Get all disposal records', responses: { '200': { description: 'Success' } } },
    },
    '/api/equipment-status/disposals/{id}': {
      get: { tags: ['Equipment Status'], summary: 'Get disposal by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } } },
      put: { tags: ['Equipment Status'], summary: 'Update disposal', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Equipment Status'], summary: 'Delete disposal', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' } } },
    },
    '/api/equipment-status/disposals/equipment/{equipmentId}': {
      get: { tags: ['Equipment Status'], summary: 'Get disposals by equipment', parameters: [{ name: 'equipmentId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } },
    },

    // Status Logs — GET เท่านั้น (สร้างอัตโนมัติผ่าน /change)
    '/api/equipment-status/logs': {
      get: { tags: ['Equipment Status'], summary: 'Get all status logs', responses: { '200': { description: 'Success' } } },
    },
    '/api/equipment-status/logs/equipment/{equipmentId}': {
      get: { tags: ['Equipment Status'], summary: 'Get status logs by equipment (timeline)', parameters: [{ name: 'equipmentId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } },
    },

    // ==================== ATTACHMENTS ====================

    '/api/attachments': {
      get: { tags: ['Attachments'], summary: 'Get all attachments', responses: { '200': { description: 'Success' } } },
      post: {
        tags: ['Attachments'],
        summary: 'Create attachment',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fileName', 'filePath'],
                properties: {
                  fileName: { type: 'string' },
                  filePath: { type: 'string' },
                  fileType: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/api/attachments/{id}': {
      get: { tags: ['Attachments'], summary: 'Get attachment by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' }, '404': { description: 'Not found' } } },
      put: { tags: ['Attachments'], summary: 'Update attachment', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Attachments'], summary: 'Delete attachment', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' } } },
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
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' },
                    environment: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};