import axios, { AxiosInstance } from 'axios';
import { config } from '../config/index.js';
import { RedmineIssue, RedmineProject, RedmineUser, RedmineTimeEntry, CreateTimeEntryInput, RedmineTimeEntryActivity, RedmineUserPermissions } from '../types/index.js';

export class RedmineClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.REDMINE_URL,
      headers: {
        'X-Redmine-API-Key': config.REDMINE_API_KEY,
        'Content-Type': 'application/json',
      },
    });
  }

  async getProjects(): Promise<RedmineProject[]> {
    const response = await this.client.get<{ projects: RedmineProject[] }>('/projects.json');
    return response.data.projects;
  }

  async getIssues(params?: Record<string, any>): Promise<RedmineIssue[]> {
    const response = await this.client.get<{ issues: RedmineIssue[] }>('/issues.json', { params });
    return response.data.issues;
  }

  async getIssue(id: number): Promise<RedmineIssue> {
    const response = await this.client.get<{ issue: RedmineIssue }>(`/issues/${id}.json`);
    return response.data.issue;
  }

  async createIssue(issue: Partial<RedmineIssue>): Promise<RedmineIssue> {
    const response = await this.client.post<{ issue: RedmineIssue }>('/issues.json', { issue });
    return response.data.issue;
  }

  async updateIssue(id: number, issue: Partial<RedmineIssue>): Promise<void> {
    await this.client.put(`/issues/${id}.json`, { issue });
  }

  async getCurrentUser(): Promise<RedmineUser> {
    const response = await this.client.get<{ user: RedmineUser }>('/users/current.json');
    return response.data.user;
  }

  async getCurrentUserPermissions(): Promise<RedmineUserPermissions> {
    const response = await this.client.get<{ user: RedmineUser }>('/users/current.json', {
      params: { include: 'memberships,groups' },
    });
    const user = response.data.user;
    return {
      user: {
        id: user.id,
        login: user.login,
        name: `${user.firstname} ${user.lastname}`,
        mail: user.mail,
      },
      memberships: (user.memberships ?? []).map((m) => ({
        project: m.project,
        roles: m.roles,
      })),
    };
  }

  async getTimeEntries(params?: Record<string, any>): Promise<RedmineTimeEntry[]> {
    const response = await this.client.get<{ time_entries: RedmineTimeEntry[] }>('/time_entries.json', { params });
    return response.data.time_entries;
  }

  async createTimeEntry(timeEntry: CreateTimeEntryInput): Promise<RedmineTimeEntry> {
    // Older Redmine instances (such as those running on Ruby 1.8.7) return 404 for JSON time entry POST requests.
    // Sending the request in XML format to /time_entries.xml is the most compatible way to create entries.
    let xmlData = '<?xml version="1.0" encoding="UTF-8"?>\n<time_entry>\n';
    if (timeEntry.issue_id !== undefined) {
      xmlData += `  <issue_id>${timeEntry.issue_id}</issue_id>\n`;
    }
    if (timeEntry.project_id !== undefined) {
      xmlData += `  <project_id>${timeEntry.project_id}</project_id>\n`;
    }
    xmlData += `  <hours>${timeEntry.hours}</hours>\n`;
    if (timeEntry.activity_id !== undefined) {
      xmlData += `  <activity_id>${timeEntry.activity_id}</activity_id>\n`;
    }
    if (timeEntry.comments !== undefined) {
      // Escape XML characters in comments
      const escapedComments = timeEntry.comments
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
      xmlData += `  <comments>${escapedComments}</comments>\n`;
    }
    if (timeEntry.spent_on !== undefined) {
      xmlData += `  <spent_on>${timeEntry.spent_on}</spent_on>\n`;
    }
    if (timeEntry.user_id !== undefined) {
      xmlData += `  <user_id>${timeEntry.user_id}</user_id>\n`;
    }
    xmlData += '</time_entry>';

    const response = await this.client.post<string>('/time_entries.xml', xmlData, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });

    return this.parseXmlTimeEntry(response.data);
  }

  private parseXmlTimeEntry(xml: string): RedmineTimeEntry {
    const getValue = (tag: string) => {
      const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
      return match ? match[1] : undefined;
    };

    const getAttr = (tag: string, attr: string) => {
      const match = xml.match(new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`));
      return match ? match[1] : undefined;
    };

    const idVal = getValue('id');
    const hoursVal = getValue('hours');

    return {
      id: idVal ? parseInt(idVal, 10) : 0,
      project: {
        id: parseInt(getAttr('project', 'id') || '0', 10),
        name: getAttr('project', 'name') || '',
      },
      issue: getAttr('issue', 'id') ? { id: parseInt(getAttr('issue', 'id') || '0', 10) } : undefined,
      user: {
        id: parseInt(getAttr('user', 'id') || '0', 10),
        name: getAttr('user', 'name') || '',
      },
      activity: {
        id: parseInt(getAttr('activity', 'id') || '0', 10),
        name: getAttr('activity', 'name') || '',
      },
      hours: hoursVal ? parseFloat(hoursVal) : 0,
      comments: getValue('comments'),
      spent_on: getValue('spent_on') || '',
      created_on: getValue('created_on') || '',
      updated_on: getValue('updated_on') || '',
    };
  }

  async getTimeEntryActivities(): Promise<RedmineTimeEntryActivity[]> {
    const response = await this.client.get<{ time_entry_activities: RedmineTimeEntryActivity[] }>('/enumerations/time_entry_activities.json');
    return response.data.time_entry_activities;
  }
}

export const redmineClient = new RedmineClient();