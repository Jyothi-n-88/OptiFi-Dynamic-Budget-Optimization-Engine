import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  minimumBudget: number;
  maximumBudget: number;
  performanceScore: number;
}

const DepartmentSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: true 
  },
  priority: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH'], 
    default: 'MEDIUM' 
  },
  minimumBudget: { 
    type: Number, 
    default: 0 
  },
  maximumBudget: { 
    type: Number, 
    default: 0 
  },
  performanceScore: { 
    type: Number, 
    min: 0, 
    max: 100, 
    default: 50 
  },
}, { timestamps: true });

export default mongoose.models.Department || mongoose.model<IDepartment>('Department', DepartmentSchema);
