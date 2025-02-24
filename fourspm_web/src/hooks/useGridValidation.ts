import { Properties } from 'devextreme/ui/data_grid';

export interface ValidationRule {
  field: string;
  required?: boolean;
  maxLength?: number;
  pattern?: RegExp;
  errorText?: string;
}

export const useGridValidation = (rules: ValidationRule[]) => {
  const handleRowValidating: Properties['onRowValidating'] = (e) => {
    if (e.isValid) {
      const data = e.newData;
      
      if (e.oldData) {
        Object.assign(data, { ...e.oldData, ...data });
      }

      for (const rule of rules) {
        const value = data[rule.field];
        
        if (rule.required && (!value || value.toString().trim() === '')) {
          e.isValid = false;
          e.errorText = rule.errorText || `${rule.field} is required`;
          return;
        }

        if (value && rule.pattern && !rule.pattern.test(value.toString())) {
          e.isValid = false;
          e.errorText = rule.errorText || `${rule.field} format is invalid`;
          return;
        }

        if (rule.maxLength && value && value.toString().length > rule.maxLength) {
          e.isValid = false;
          e.errorText = rule.errorText || `${rule.field} must be at most ${rule.maxLength} characters`;
          return;
        }
      }
    }
  };

  return handleRowValidating;
};
