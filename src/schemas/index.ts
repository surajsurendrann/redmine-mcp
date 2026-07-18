import { z } from 'zod';

export const GetIssuesSchema = z.object({
  project_id: z.string().optional(),
  status_id: z.string().optional(),
  assigned_to_id: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

export const GetIssueSchema = z.object({
  id: z.number(),
});

export const CreateIssueSchema = z.object({
  project_id: z.string(),
  subject: z.string(),
  description: z.string().optional(),
  assigned_to_id: z.number().optional(),
  priority_id: z.number().optional(),
  tracker_id: z.number().optional(),
});

export const UpdateIssueSchema = z.object({
  id: z.number(),
  subject: z.string().optional(),
  description: z.string().optional(),
  status_id: z.number().optional(),
  assigned_to_id: z.number().optional(),
  priority_id: z.number().optional(),
});

export const GetTimeEntriesSchema = z.object({
  from: z.string().optional().describe('Start date (YYYY-MM-DD)'),
  to: z.string().optional().describe('End date (YYYY-MM-DD)'),
  project_id: z.string().optional().describe('Filter by project ID or identifier'),
  limit: z.number().optional().describe('Max results to return (max 100)'),
  offset: z.number().optional().describe('Offset for pagination'),
});

export const CreateTimeEntrySchema = z.object({
  issue_id: z.number().optional().describe('ID of the issue to log time on'),
  project_id: z.number().optional().describe('ID of the project to log time on'),
  hours: z.number().positive().describe('Number of hours spent'),
  activity_id: z.number().optional().describe('ID of the time activity (e.g. Design, Development)'),
  comments: z.string().max(255).optional().describe('Description of the work done (max 255 characters)'),
  spent_on: z.string().optional().describe('Date when the time was spent (YYYY-MM-DD), defaults to today'),
  user_id: z.number().optional().describe('User ID to log time on behalf of (requires admin permissions)'),
}).refine(data => data.issue_id !== undefined || data.project_id !== undefined, {
  message: "Either issue_id or project_id must be provided",
  path: ["issue_id"]
});



