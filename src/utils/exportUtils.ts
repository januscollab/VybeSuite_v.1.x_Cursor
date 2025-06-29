import { Sprint, Story, ExportData, SearchFilters } from '../types';

export function exportToJSON(data: ExportData): string {
  return JSON.stringify(data, null, 2);
}

export function exportToCSV(stories: Story[]): string {
  const headers = [
    'Number',
    'Title', 
    'Description',
    'Status',
    'Sprint',
    'Tags',
    'Created Date',
    'Updated Date',
    'Archived Date'
  ];

  const rows = stories.map(story => [
    story.number,
    `"${story.title.replace(/"/g, '""')}"`,
    `"${(story.description || '').replace(/"/g, '""')}"`,
    story.completed ? 'Completed' : 'Todo',
    story.sprintId,
    `"${story.tags.join(', ')}"`,
    new Date(story.createdAt).toLocaleDateString(),
    new Date(story.updatedAt).toLocaleDateString(),
    story.archivedAt ? new Date(story.archivedAt).toLocaleDateString() : ''
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export function generateExportFilename(format: 'json' | 'csv', filters?: SearchFilters): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const hasFilters = filters && (
    filters.query.trim() !== '' ||
    filters.tags.length > 0 ||
    filters.status !== 'all' ||
    filters.sprints.length > 0 ||
    filters.dateRange.start !== null ||
    filters.dateRange.end !== null
  );
  
  const suffix = hasFilters ? '-filtered' : '';
  return `sprint-board-export${suffix}-${timestamp}.${format}`;
}

export function createExportData(
  sprints: Sprint[], 
  stories: Story[], 
  filters?: SearchFilters
): ExportData {
  return {
    sprints,
    stories,
    exportedAt: new Date().toISOString(),
    filters
  };
}