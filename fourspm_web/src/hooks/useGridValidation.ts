import { Properties } from 'devextreme/ui/data_grid';

export interface ValidationRule {
  field: string;
  required?: boolean;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
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
        
        // Check min and max values for numeric fields
        if (value !== undefined && value !== null) {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            if (rule.min !== undefined && numValue < rule.min) {
              e.isValid = false;
              e.errorText = rule.errorText || `${rule.field} must be at least ${rule.min}`;
              return;
            }
            
            if (rule.max !== undefined && numValue > rule.max) {
              e.isValid = false;
              e.errorText = rule.errorText || `${rule.field} must be at most ${rule.max}`;
              return;
            }
          }
        }
      }
    }
  };

  return handleRowValidating;
};
