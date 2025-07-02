import { debug } from '../utils/debug';
import React, { useState } from 'react';
import { X, Download, FileText, Database } from 'lucide-react';
import { Sprint, Story, SearchFilters } from '../types';
import { exportToJSON, exportToCSV, downloadFile, generateExportFilename, createExportData } from '../utils/exportUtils';
interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    sprints: Sprint[];
    stories: Story[];
    filters?: SearchFilters;
}
export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, sprints, stories, filters }) => {
    const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
    const [includeArchived, setIncludeArchived] = useState(true);
    const [exporting, setExporting] = useState(false);
    const handleExport = async () => {
        try {
            setExporting(true);
            let exportStories = stories;
            // Filter out archived stories if not including them
            if (!includeArchived) {
                exportStories = stories.filter(story => !story.archivedAt);
            }
            const filename = generateExportFilename(exportFormat, filters);
            if (exportFormat === 'json') {
                const exportData = createExportData(sprints, exportStories, filters);
                const content = exportToJSON(exportData);
                downloadFile(content, filename, 'application/json');
            }
            else {
                const content = exportToCSV(exportStories);
                downloadFile(content, filename, 'text/csv');
            }
            onClose();
        }
        catch (error) {
            debug.error("ExportModal", "Export failed", { error  });
            alert('Export failed. Please try again.');
        }
        finally {
            setExporting(false);
        }
    };
    if (!isOpen)
        return null;
    const hasArchivedItems = stories.some(story => story.archivedAt) || sprints.some(sprint => sprint.archivedAt);
    return (<div className="fixed inset-0 bg-bg-overlay z-50 flex items-center justify-center p-5" onClick={(e) => {
            if (e.target === e.currentTarget) {
                onClose();
            }
        }}>
      <div className="bg-bg-primary rounded-xl shadow-devsuite-modal border border-border-default w-full max-w-[500px]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border-default relative">
          <h1 className="text-2xl font-bold text-text-primary mb-0">Export Data</h1>
          <p className="text-base text-text-tertiary leading-6">
            Export {stories.length} stories from {sprints.length} sprints
          </p>
          <button onClick={onClose} className="absolute top-3 right-5 w-8 h-8 border-none bg-transparent cursor-pointer rounded-md flex items-center justify-center text-text-quaternary hover:bg-bg-canvas hover:text-text-secondary transition-all">
            <X className="w-6 h-6"/>
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4">
          <div className="space-y-4">
            {/* Export Format */}
            <div>
              <label className="block font-semibold text-sm mb-3 text-text-primary">
                Export Format
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${exportFormat === 'json'
            ? 'border-devsuite-primary bg-devsuite-primary-subtle'
            : 'border-border-default bg-bg-primary hover:border-border-interactive'}`}>
                  <input type="radio" name="exportFormat" value="json" checked={exportFormat === 'json'} onChange={(e) => setExportFormat(e.target.value as 'json')} className="sr-only"/>
                  <div className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${exportFormat === 'json'
            ? 'border-devsuite-primary bg-devsuite-primary'
            : 'border-border-strong'}`}>
                    {exportFormat === 'json' && (<div className="w-2.5 h-2.5 bg-text-inverse rounded-full"></div>)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Database className="w-4 h-4 text-devsuite-primary"/>
                      <span className="font-medium text-text-primary">JSON</span>
                    </div>
                    <p className="text-xs text-text-tertiary">
                      Complete data with metadata, perfect for backup or migration
                    </p>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${exportFormat === 'csv'
            ? 'border-devsuite-primary bg-devsuite-primary-subtle'
            : 'border-border-default bg-bg-primary hover:border-border-interactive'}`}>
                  <input type="radio" name="exportFormat" value="csv" checked={exportFormat === 'csv'} onChange={(e) => setExportFormat(e.target.value as 'csv')} className="sr-only"/>
                  <div className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${exportFormat === 'csv'
            ? 'border-devsuite-primary bg-devsuite-primary'
            : 'border-border-strong'}`}>
                    {exportFormat === 'csv' && (<div className="w-2.5 h-2.5 bg-text-inverse rounded-full"></div>)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-devsuite-primary"/>
                      <span className="font-medium text-text-primary">CSV</span>
                    </div>
                    <p className="text-xs text-text-tertiary">
                      Spreadsheet format, great for analysis and reporting
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Options */}
            {hasArchivedItems && (<div>
                <label className="block font-semibold text-sm mb-3 text-text-primary">
                  Options
                </label>
                <label className="flex items-center gap-3 p-3 border border-border-default rounded-lg cursor-pointer hover:bg-bg-muted transition-all">
                  <input type="checkbox" checked={includeArchived} onChange={(e) => setIncludeArchived(e.target.checked)} className="w-4 h-4 text-devsuite-primary border-border-strong rounded focus:ring-devsuite-primary focus:ring-2"/>
                  <div className="flex-1">
                    <span className="font-medium text-text-primary">Include archived items</span>
                    <p className="text-xs text-text-tertiary mt-1">
                      Export both active and archived stories and sprints
                    </p>
                  </div>
                </label>
              </div>)}

            {/* Applied Filters Info */}
            {filters && (<div className="bg-info-light border border-info rounded-lg p-3">
                <h4 className="font-medium text-info-dark text-sm mb-1">Applied Filters</h4>
                <p className="text-xs text-info-dark">
                  This export will include the current search and filter settings.
                </p>
              </div>)}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-border-default flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={exporting} className="flex items-center gap-1.5 px-4 py-2 bg-transparent text-text-secondary text-sm font-medium cursor-pointer border border-border-default rounded-lg transition-all hover:bg-bg-muted hover:text-text-primary disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleExport} disabled={exporting} className="flex items-center gap-1.5 px-4 py-2 bg-devsuite-primary text-text-inverse text-sm font-medium cursor-pointer border border-devsuite-primary rounded-lg transition-all hover:bg-devsuite-primary-hover disabled:opacity-50">
            <Download className="w-4 h-4"/>
            {exporting ? 'Exporting...' : `Export ${exportFormat.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>);
};
