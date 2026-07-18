import { RedmineService } from '../services/index.js';
import { logger } from '../utils/logger.js';
import {
  CreateIssueSchema,
  GetIssueSchema,
  GetIssuesSchema,
  GetTimeEntriesSchema,
  CreateTimeEntrySchema,
} from '../schemas/index.js';

export const toolsDefinition = [
  {
    name: 'redmine_list_projects',
    description: 'List all visible projects in Redmine',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'redmine_list_issues',
    description: 'List issues in Redmine with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project ID or identifier' },
        status_id: { type: 'string', description: 'Status ID (e.g. open, closed, *)' },
        assigned_to_id: { type: 'string', description: 'Assigned user ID or "me"' },
        limit: { type: 'number', description: 'Max results' },
      },
    },
  },
  {
    name: 'redmine_get_issue',
    description: 'Get details of a specific issue by its ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Issue ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'redmine_create_issue',
    description: 'Create a new issue in Redmine',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Project ID or identifier' },
        subject: { type: 'string', description: 'Issue subject' },
        description: { type: 'string', description: 'Issue description' },
      },
      required: ['project_id', 'subject'],
    },
  },
  {
    name: 'redmine_get_timesheet',
    description: 'Get the timesheet (time entries) for the current authenticated user',
    inputSchema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        to: { type: 'string', description: 'End date (YYYY-MM-DD)' },
        project_id: { type: 'string', description: 'Filter by project ID or identifier' },
        limit: { type: 'number', description: 'Max results to return (max 100)' },
        offset: { type: 'number', description: 'Offset for pagination' },
      },
    },
  },
  {
    name: 'redmine_log_time',
    description: 'Log time spent on an issue or project in Redmine',
    inputSchema: {
      type: 'object',
      properties: {
        issue_id: { type: 'number', description: 'ID of the issue to log time on (either issue_id or project_id must be provided)' },
        project_id: { type: 'number', description: 'ID of the project to log time on (either issue_id or project_id must be provided)' },
        hours: { type: 'number', description: 'Number of spent hours' },
        activity_id: { type: 'number', description: 'ID of the time activity. Required unless a default activity is defined in Redmine.' },
        comments: { type: 'string', description: 'Short description for the entry (max 255 characters)' },
        spent_on: { type: 'string', description: 'Date the time was spent (YYYY-MM-DD), defaults to today' },
        user_id: { type: 'number', description: 'User ID to log time on behalf of another user (requires admin permissions)' },
      },
      required: ['hours'],
    },
  },
  {
    name: 'redmine_list_time_entry_activities',
    description: 'List the available time entry activities (e.g., Development, Design) and their IDs',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'redmine_get_my_permissions',
    description:
      'Get the current authenticated user information along with their project memberships and assigned roles. ' +
      'Use this to understand what projects the user belongs to and what roles (and therefore what actions) they are allowed to perform.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

export async function handleToolCall(name: string, args: any, service: RedmineService) {
  logger.debug({ name, args }, 'Handling tool execution');
  switch (name) {
    case 'redmine_list_projects':
      return {
        content: [{ type: 'text', text: JSON.stringify(await service.listProjects(), null, 2) }],
      };
    case 'redmine_list_issues': {
      const parsed = GetIssuesSchema.parse(args);
      return {
        content: [{ type: 'text', text: JSON.stringify(await service.listIssues(parsed), null, 2) }],
      };
    }
    case 'redmine_get_issue': {
      const parsed = GetIssueSchema.parse(args);
      return {
        content: [{ type: 'text', text: JSON.stringify(await service.getIssueDetails(parsed.id), null, 2) }],
      };
    }
    case 'redmine_create_issue': {
      const parsed = CreateIssueSchema.parse(args);
      return {
        content: [{ type: 'text', text: JSON.stringify(await service.createNewIssue(parsed), null, 2) }],
      };
    }
    case 'redmine_get_timesheet': {
      const parsed = GetTimeEntriesSchema.parse(args);
      return {
        content: [{ type: 'text', text: JSON.stringify(await service.getTimeSheet(parsed), null, 2) }],
      };
    }
    case 'redmine_log_time': {
      const parsed = CreateTimeEntrySchema.parse(args);
      return {
        content: [{ type: 'text', text: JSON.stringify(await service.logTimeOnIssue(parsed), null, 2) }],
      };
    }
    case 'redmine_list_time_entry_activities':
      return {
        content: [{ type: 'text', text: JSON.stringify(await service.listTimeEntryActivities(), null, 2) }],
      };
    case 'redmine_get_my_permissions':
      return {
        content: [{ type: 'text', text: JSON.stringify(await service.getCurrentUserPermissions(), null, 2) }],
      };
    default:
      throw new Error(`Tool not found: ${name}`);
  }
}
