// src/types/forms.ts
export interface BaseFormProps<T> {
  data: T;
  onSave: (data: T) => void;
  onCancel: () => void;
  metadata?: Record<string, any>; 
}