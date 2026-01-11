import { useState, useCallback } from 'react';
import { Modal, Button, Input } from '@components/common';

/**
 * Props for NewProjectModal component
 */
interface NewProjectModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Called when the modal should close */
  onClose: () => void;
  /** Called when a project is created */
  onCreate: (name: string, templateId?: string) => void;
}

/**
 * Project creation mode
 */
type CreateMode = 'scratch' | 'template';

/**
 * Template option
 */
interface TemplateOption {
  id: string;
  name: string;
  description: string;
  category: string;
}

/**
 * Sample templates
 */
const TEMPLATES: TemplateOption[] = [
  {
    id: 'basic-web',
    name: 'Basic Web Application',
    description: 'Simple web app with API and database',
    category: 'Web Apps',
  },
  {
    id: 'three-tier',
    name: 'Three-Tier Architecture',
    description: 'Classic three-tier web application',
    category: 'Web Apps',
  },
  {
    id: 'microservices',
    name: 'Microservices',
    description: 'Distributed microservices architecture',
    category: 'Microservices',
  },
  {
    id: 'serverless',
    name: 'Serverless API',
    description: 'Serverless functions with API Gateway',
    category: 'Serverless',
  },
];

/**
 * NewProjectModal Component
 *
 * Modal for creating a new project.
 * Allows starting from scratch or using a template.
 *
 * TODO: Fetch templates from API
 * TODO: Add template preview
 * TODO: Add template filtering
 */
export function NewProjectModal({
  isOpen,
  onClose,
  onCreate,
}: NewProjectModalProps): JSX.Element {
  const [mode, setMode] = useState<CreateMode>('scratch');
  const [projectName, setProjectName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle create project
   */
  const handleCreate = useCallback(() => {
    if (!projectName.trim()) {
      setError('Project name is required');
      return;
    }

    if (mode === 'template' && !selectedTemplate) {
      setError('Please select a template');
      return;
    }

    onCreate(projectName.trim(), mode === 'template' ? selectedTemplate ?? undefined : undefined);

    // Reset form
    setProjectName('');
    setSelectedTemplate(null);
    setMode('scratch');
    setError(null);
  }, [projectName, mode, selectedTemplate, onCreate]);

  /**
   * Handle close
   */
  const handleClose = useCallback(() => {
    setProjectName('');
    setSelectedTemplate(null);
    setMode('scratch');
    setError(null);
    onClose();
  }, [onClose]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Project" size="md">
      <div className="p-6 space-y-6">
        {/* Mode Selection */}
        <div>
          <label className="block text-sm font-medium text-white mb-3">
            Start with:
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 bg-[#1E1E1E] border border-[#3A3A3A] rounded-lg cursor-pointer hover:border-[#4A4A4A] transition-colors">
              <input
                type="radio"
                name="mode"
                value="scratch"
                checked={mode === 'scratch'}
                onChange={() => setMode('scratch')}
                className="w-4 h-4 text-primary-600"
              />
              <div>
                <span className="text-white">Start from Scratch</span>
                <p className="text-xs text-[#6A6A6A]">Begin with an empty canvas</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-[#1E1E1E] border border-[#3A3A3A] rounded-lg cursor-pointer hover:border-[#4A4A4A] transition-colors">
              <input
                type="radio"
                name="mode"
                value="template"
                checked={mode === 'template'}
                onChange={() => setMode('template')}
                className="w-4 h-4 text-primary-600"
              />
              <div>
                <span className="text-white">Use Template</span>
                <p className="text-xs text-[#6A6A6A]">Start with a pre-built workflow</p>
              </div>
            </label>
          </div>
        </div>

        {/* Template Selection */}
        {mode === 'template' && (
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Select a Template
            </label>
            <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-3 text-left border rounded-lg transition-colors ${
                    selectedTemplate === template.id
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-[#3A3A3A] bg-[#1E1E1E] hover:border-[#4A4A4A]'
                  }`}
                >
                  <div className="text-sm text-white font-medium">{template.name}</div>
                  <div className="text-xs text-[#6A6A6A] mt-1">{template.category}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Project Name */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Project Name
          </label>
          <Input
            value={projectName}
            onChange={(e) => {
              setProjectName(e.target.value);
              setError(null);
            }}
            placeholder="My Project"
            error={error ?? undefined}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 p-4 border-t border-[#2A2A2A] bg-black">
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleCreate}>
          Create Project
        </Button>
      </div>
    </Modal>
  );
}

export default NewProjectModal;
