export const swaggerConfig = {
  openapi: '3.0.0',
  info: {
    title: 'Asset Management API',
    version: '1.0.0',
    description: 'API documentation for Asset Management System',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
  ],
  tags: [
    { name: 'Masters', description: 'Master data endpoints' },
    { name: 'Projects', description: 'Project management endpoints' },
    { name: 'MHESI', description: 'MHESI number management endpoints' },
    { name: 'Assets', description: 'Asset management endpoints' },
    { name: 'Asset Status', description: 'Asset status tracking endpoints' },
    { name: 'Attachments', description: 'File attachment endpoints' },
  ],
  components: {
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          errors: { type: 'object' },
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
    // ==================== MASTERS ====================
    '/api/masters/departments': {
      get: {
        tags: ['Masters'],
        summary: 'Get all departments',
        responses: {
          '200': { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
        },
      },
      post: {
        tags: ['Masters'],
        summary: 'Create department',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } } } },
        },
        responses: {
          '201': { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
        },
      },
    },
    '/api/masters/departments/{id}': {
      get: {
        tags: ['Masters'],
        summary: 'Get department by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
          '404': { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      put: {
        tags: ['Masters'],
        summary: 'Update department',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } },
        },
        responses: {
          '200': { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
        },
      },
      delete: {
        tags: ['Masters'],
        summary: 'Delete department',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } },
        },
      },
    },

    '/api/masters/activities': {
      get: { tags: ['Masters'], summary: 'Get all activities', responses: { '200': { description: 'Success' } } },
      post: { tags: ['Masters'], summary: 'Create activity', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } } } } }, responses: { '201': { description: 'Created' } } },
    },
    '/api/masters/activities/{id}': {
      get: { tags: ['Masters'], summary: 'Get activity by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } },
      put: { tags: ['Masters'], summary: 'Update activity', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Masters'], summary: 'Delete activity', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' } } },
    },

    '/api/masters/funds': {
      get: { tags: ['Masters'], summary: 'Get all funds', responses: { '200': { description: 'Success' } } },
      post: { tags: ['Masters'], summary: 'Create fund', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } } } } }, responses: { '201': { description: 'Created' } } },
    },
    '/api/masters/funds/{id}': {
      get: { tags: ['Masters'], summary: 'Get fund by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } },
      put: { tags: ['Masters'], summary: 'Update fund', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Masters'], summary: 'Delete fund', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' } } },
    },

    '/api/masters/asset-types': {
      get: { tags: ['Masters'], summary: 'Get all asset types', responses: { '200': { description: 'Success' } } },
      post: { tags: ['Masters'], summary: 'Create asset type', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } } } } }, responses: { '201': { description: 'Created' } } },
    },
    '/api/masters/asset-types/{id}': {
      get: { tags: ['Masters'], summary: 'Get asset type by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } },
      put: { tags: ['Masters'], summary: 'Update asset type', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Masters'], summary: 'Delete asset type', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' } } },
    },

    '/api/masters/acquisition-sources': {
      get: { tags: ['Masters'], summary: 'Get all acquisition sources', responses: { '200': { description: 'Success' } } },
      post: { tags: ['Masters'], summary: 'Create acquisition source', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } } } } }, responses: { '201': { description: 'Created' } } },
    },
    '/api/masters/acquisition-sources/{id}': {
      get: { tags: ['Masters'], summary: 'Get acquisition source by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } },
      put: { tags: ['Masters'], summary: 'Update acquisition source', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Masters'], summary: 'Delete acquisition source', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' } } },
    },

    '/api/masters/acquisition-methods': {
      get: { tags: ['Masters'], summary: 'Get all acquisition methods', responses: { '200': { description: 'Success' } } },
      post: { tags: ['Masters'], summary: 'Create acquisition method', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } } } } }, responses: { '201': { description: 'Created' } } },
    },
    '/api/masters/acquisition-methods/{id}': {
      get: { tags: ['Masters'], summary: 'Get acquisition method by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } },
      put: { tags: ['Masters'], summary: 'Update acquisition method', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Masters'], summary: 'Delete acquisition method', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' } } },
    },

    '/api/masters/buildings': {
      get: { tags: ['Masters'], summary: 'Get all buildings', responses: { '200': { description: 'Success' } } },
      post: { tags: ['Masters'], summary: 'Create building', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } } } } }, responses: { '201': { description: 'Created' } } },
    },
    '/api/masters/buildings/{id}': {
      get: { tags: ['Masters'], summary: 'Get building by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } },
      put: { tags: ['Masters'], summary: 'Update building', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Masters'], summary: 'Delete building', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' } } },
    },

    '/api/masters/rooms': {
      get: { tags: ['Masters'], summary: 'Get all rooms', responses: { '200': { description: 'Success' } } },
      post: { tags: ['Masters'], summary: 'Create room', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name', 'buildingId'], properties: { name: { type: 'string' }, buildingId: { type: 'integer' } } } } } }, responses: { '201': { description: 'Created' } } },
    },
    '/api/masters/rooms/{id}': {
      get: { tags: ['Masters'], summary: 'Get room by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } },
      put: { tags: ['Masters'], summary: 'Update room', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, buildingId: { type: 'integer' } } } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Masters'], summary: 'Delete room', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' } } },
    },
    '/api/masters/rooms/building/{buildingId}': {
      get: { tags: ['Masters'], summary: 'Get rooms by building', parameters: [{ name: 'buildingId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } },
    },

    '/api/masters/faculties': {
      get: { tags: ['Masters'], summary: 'Get all faculties', responses: { '200': { description: 'Success' } } },
      post: { tags: ['Masters'], summary: 'Create faculty', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } } } } }, responses: { '201': { description: 'Created' } } },
    },
    '/api/masters/faculties/{id}': {
      get: { tags: ['Masters'], summary: 'Get faculty by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } },
      put: { tags: ['Masters'], summary: 'Update faculty', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Masters'], summary: 'Delete faculty', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' } } },
    },

    '/api/masters/support-units': {
      get: { tags: ['Masters'], summary: 'Get all support units', responses: { '200': { description: 'Success' } } },
      post: { tags: ['Masters'], summary: 'Create support unit', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } } } } }, responses: { '201': { description: 'Created' } } },
    },
    '/api/masters/support-units/{id}': {
      get: { tags: ['Masters'], summary: 'Get support unit by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } },
      put: { tags: ['Masters'], summary: 'Update support unit', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Masters'], summary: 'Delete support unit', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' } } },
    },

    '/api/masters/plans': {
      get: { tags: ['Masters'], summary: 'Get all plans', responses: { '200': { description: 'Success' } } },
      post: { tags: ['Masters'], summary: 'Create plan', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } } } } }, responses: { '201': { description: 'Created' } } },
    },
    '/api/masters/plans/{id}': {
      get: { tags: ['Masters'], summary: 'Get plan by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } },
      put: { tags: ['Masters'], summary: 'Update plan', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Masters'], summary: 'Delete plan', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' } } },
    },

    // ==================== PROJECTS ====================
    '/api/projects': {
      get: {
        tags: ['Projects'],
        summary: 'Get all projects',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by project name' },
          { name: 'status', in: 'query', schema: { type: 'string' }, description: 'Filter by status' },
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
                  projectType: { type: 'string' },
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
      get: { tags: ['Projects'], summary: 'Get project by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } },
      put: { tags: ['Projects'], summary: 'Update project', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Projects'], summary: 'Delete project', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' } } },
    },

    // ==================== MHESI ====================
    '/api/mhesi': {
      get: {
        tags: ['MHESI'],
        summary: 'Get all MHESI numbers',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by MHESI number' },
          { name: 'projectId', in: 'query', schema: { type: 'integer' }, description: 'Filter by project' },
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
                  mhesiNumber: { type: 'string' },
                  facultyId: { type: 'integer' },
                  supportUnitId: { type: 'integer' },
                  planId: { type: 'integer' },
                  projectId: { type: 'integer' },
                  activityName: { type: 'string' },
                  date: { type: 'string', format: 'date' },
                  amount: { type: 'number' },
                  note: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/api/mhesi/{id}': {
      get: { tags: ['MHESI'], summary: 'Get MHESI number by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } },
      put: { tags: ['MHESI'], summary: 'Update MHESI number', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['MHESI'], summary: 'Delete MHESI number', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' } } },
    },
    '/api/mhesi/project/{projectId}': {
      get: { tags: ['MHESI'], summary: 'Get MHESI numbers by project', parameters: [{ name: 'projectId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } },
    },

    // ==================== ASSETS ====================
    '/api/assets': {
      get: {
        tags: ['Assets'],
        summary: 'Get all assets',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by code, name, or number' },
          { name: 'status', in: 'query', schema: { type: 'string' }, description: 'Filter by status' },
          { name: 'departmentId', in: 'query', schema: { type: 'integer' }, description: 'Filter by department' },
          { name: 'assetTypeId', in: 'query', schema: { type: 'integer' }, description: 'Filter by asset type' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          '200': { description: 'Success', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } } },
        },
      },
      post: {
        tags: ['Assets'],
        summary: 'Create asset',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['assetCode', 'assetName'],
                properties: {
                  assetCode: { type: 'string' },
                  assetName: { type: 'string' },
                  assetNumber: { type: 'string' },
                  assetTypeId: { type: 'integer' },
                  departmentId: { type: 'integer' },
                  activityId: { type: 'integer' },
                  fundId: { type: 'integer' },
                  price: { type: 'number' },
                  acquisitionSourceId: { type: 'integer' },
                  acquisitionMethodId: { type: 'integer' },
                  acquisitionDate: { type: 'string', format: 'date' },
                  company: { type: 'string' },
                  buildingId: { type: 'integer' },
                  roomId: { type: 'integer' },
                  projectId: { type: 'integer' },
                  status: { type: 'string', default: 'available' },
                  note: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/api/assets/stats': {
      get: { tags: ['Assets'], summary: 'Get asset statistics', responses: { '200': { description: 'Success' } } },
    },
    '/api/assets/{id}': {
      get: { tags: ['Assets'], summary: 'Get asset by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } },
      put: { tags: ['Assets'], summary: 'Update asset', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Assets'], summary: 'Delete asset', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' } } },
    },
    '/api/assets/{id}/status': {
      patch: {
        tags: ['Assets'],
        summary: 'Update asset status',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['status'], properties: { status: { type: 'string' } } } } },
        },
        responses: { '200': { description: 'Status updated' } },
      },
    },
    '/api/assets/code/{code}': {
      get: { tags: ['Assets'], summary: 'Get asset by code', parameters: [{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Success' } } },
    },

    // ==================== ASSET STATUS ====================
    '/api/asset-status/borrows': {
      get: { tags: ['Asset Status'], summary: 'Get all asset borrows', responses: { '200': { description: 'Success' } } },
      post: {
        tags: ['Asset Status'],
        summary: 'Create asset borrow',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['assetId', 'borrowerName', 'borrowDate'],
                properties: {
                  assetId: { type: 'integer' },
                  borrowerName: { type: 'string' },
                  borrowerDepartment: { type: 'string' },
                  borrowDate: { type: 'string', format: 'date' },
                  expectedReturnDate: { type: 'string', format: 'date' },
                  reason: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/api/asset-status/borrows/{id}': {
      get: { tags: ['Asset Status'], summary: 'Get borrow by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } },
      put: { tags: ['Asset Status'], summary: 'Update borrow', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Asset Status'], summary: 'Delete borrow', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' } } },
    },
    '/api/asset-status/borrows/{id}/return': {
      patch: {
        tags: ['Asset Status'],
        summary: 'Return borrowed asset',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['actualReturnDate'], properties: { actualReturnDate: { type: 'string', format: 'date' } } } } },
        },
        responses: { '200': { description: 'Asset returned' } },
      },
    },
    '/api/asset-status/borrows/asset/{assetId}': {
      get: { tags: ['Asset Status'], summary: 'Get borrows by asset', parameters: [{ name: 'assetId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } },
    },

    '/api/asset-status/repairs': {
      get: { tags: ['Asset Status'], summary: 'Get all asset repairs', responses: { '200': { description: 'Success' } } },
      post: {
        tags: ['Asset Status'],
        summary: 'Create asset repair',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['assetId', 'repairReason', 'startDate'],
                properties: {
                  assetId: { type: 'integer' },
                  repairReason: { type: 'string' },
                  repairCompany: { type: 'string' },
                  cost: { type: 'number' },
                  startDate: { type: 'string', format: 'date' },
                  endDate: { type: 'string', format: 'date' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/api/asset-status/repairs/{id}': {
      get: { tags: ['Asset Status'], summary: 'Get repair by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } },
      put: { tags: ['Asset Status'], summary: 'Update repair', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Asset Status'], summary: 'Delete repair', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' } } },
    },
    '/api/asset-status/repairs/asset/{assetId}': {
      get: { tags: ['Asset Status'], summary: 'Get repairs by asset', parameters: [{ name: 'assetId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } },
    },

    '/api/asset-status/unavailable': {
      get: { tags: ['Asset Status'], summary: 'Get all unavailable assets', responses: { '200': { description: 'Success' } } },
      post: {
        tags: ['Asset Status'],
        summary: 'Create unavailable asset record',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['assetId', 'reason', 'startDate'],
                properties: {
                  assetId: { type: 'integer' },
                  reason: { type: 'string' },
                  startDate: { type: 'string', format: 'date' },
                  endDate: { type: 'string', format: 'date' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/api/asset-status/unavailable/{id}': {
      get: { tags: ['Asset Status'], summary: 'Get unavailable by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } },
      put: { tags: ['Asset Status'], summary: 'Update unavailable', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Asset Status'], summary: 'Delete unavailable', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' } } },
    },
    '/api/asset-status/unavailable/asset/{assetId}': {
      get: { tags: ['Asset Status'], summary: 'Get unavailable records by asset', parameters: [{ name: 'assetId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } },
    },

    '/api/asset-status/disposals': {
      get: { tags: ['Asset Status'], summary: 'Get all asset disposals', responses: { '200': { description: 'Success' } } },
      post: {
        tags: ['Asset Status'],
        summary: 'Create asset disposal',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['assetId', 'disposalDate'],
                properties: {
                  assetId: { type: 'integer' },
                  disposalDate: { type: 'string', format: 'date' },
                  disposalMethod: { type: 'string' },
                  disposalReason: { type: 'string' },
                  approvedBy: { type: 'string' },
                  documentNo: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/api/asset-status/disposals/{id}': {
      get: { tags: ['Asset Status'], summary: 'Get disposal by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } },
      put: { tags: ['Asset Status'], summary: 'Update disposal', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Asset Status'], summary: 'Delete disposal', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' } } },
    },
    '/api/asset-status/disposals/asset/{assetId}': {
      get: { tags: ['Asset Status'], summary: 'Get disposals by asset', parameters: [{ name: 'assetId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } },
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
                required: ['refType', 'refId', 'fileName', 'filePath'],
                properties: {
                  refType: { type: 'string' },
                  refId: { type: 'integer' },
                  fileName: { type: 'string' },
                  filePath: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
    '/api/attachments/{id}': {
      get: { tags: ['Attachments'], summary: 'Get attachment by ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Success' } } },
      put: { tags: ['Attachments'], summary: 'Update attachment', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Attachments'], summary: 'Delete attachment', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Deleted' } } },
    },
    '/api/attachments/{refType}/{refId}': {
      get: {
        tags: ['Attachments'],
        summary: 'Get attachments by reference',
        parameters: [
          { name: 'refType', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'refId', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'Success' } },
      },
      delete: {
        tags: ['Attachments'],
        summary: 'Delete attachments by reference',
        parameters: [
          { name: 'refType', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'refId', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'Deleted' } },
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