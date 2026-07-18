import { redmineClient } from '../client/redmine.js';
import { RedmineIssue, CreateTimeEntryInput } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class RedmineService {

  async listProjects() {
    logger.info('Fetching list of projects from Redmine');
    try {
      return await redmineClient.getProjects();
    } catch (error) {
      logger.error({ error }, 'Failed to fetch projects');
      throw error;
    }
  }

  async listIssues(params?: Record<string, unknown>) {
    logger.info({ params }, 'Fetching issues from Redmine');
    try {
      return await redmineClient.getIssues(params);
    } catch (error) {
      logger.error({ error }, 'Failed to fetch issues');
      throw error;
    }
  }

  async getIssueDetails(id: number) {
    logger.info({ id }, 'Fetching issue details');
    try {
      return await redmineClient.getIssue(id);
    } catch (error) {
      logger.error({ error }, 'Failed to fetch issue details');
      throw error;
    }
  }

  async createNewIssue(data: Partial<RedmineIssue>) {
    logger.info({ data }, 'Creating new issue');
    try {
      return await redmineClient.createIssue(data);
    } catch (error) {
      logger.error({ error }, 'Failed to create issue');
      throw error;
    }
  }

  async updateExistingIssue(id: number, data: Partial<RedmineIssue>) {
    logger.info({ id, data }, 'Updating issue');
    try {
      await redmineClient.updateIssue(id, data);
      return { success: true };
    } catch (error) {
      logger.error({ error }, 'Failed to update issue');
      throw error;
    }
  }

  async getCurrentUser() {
    logger.info('Fetching current user');
    try {
      return await redmineClient.getCurrentUser();
    } catch (error) {
      logger.error({ error }, 'Failed to fetch current user');
      throw error;
    }
  }

  async getCurrentUserPermissions() {
    logger.info('Fetching current user permissions and memberships');
    try {
      return await redmineClient.getCurrentUserPermissions();
    } catch (error) {
      logger.error({ error }, 'Failed to fetch current user permissions');
      throw error;
    }
  }

  async getTimeSheet(params?: Record<string, unknown>) {
    logger.info({ params }, 'Fetching timesheet (time entries) for current user');
    try {
      const queryParams = { ...params, user_id: 'me' };
      return await redmineClient.getTimeEntries(queryParams);
    } catch (error) {
      logger.error({ error }, 'Failed to fetch timesheet');
      throw error;
    }
  }

  async logTimeOnIssue(data: CreateTimeEntryInput) {
    logger.info({ data }, 'Logging time on issue');
    try {
      return await redmineClient.createTimeEntry(data);
    } catch (error) {
      logger.error({ error }, 'Failed to log time on issue');
      throw error;
    }
  }

  async listTimeEntryActivities() {
    logger.info('Fetching time entry activities from Redmine');
    try {
      return await redmineClient.getTimeEntryActivities();
    } catch (error) {
      logger.error({ error }, 'Failed to fetch time entry activities');
      throw error;
    }
  }
}


export const redmineService = new RedmineService();