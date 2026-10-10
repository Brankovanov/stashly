const PROJECT_STATUSES = new Set(['planned', 'in_progress', 'completed']);

export function validateProjectInput(values) {
  const errors = {};
  const title = values.title.trim();
  const status = values.status;

  if (!title) errors.title = 'Enter a project title.';
  if (!PROJECT_STATUSES.has(status)) errors.status = 'Choose a valid project status.';

  return {
    errors,
    value: {
      title,
      description: values.description.trim() || null,
      status,
    },
  };
}
