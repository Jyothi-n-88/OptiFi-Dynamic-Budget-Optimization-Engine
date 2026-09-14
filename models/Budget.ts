import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBudget extends Document {
  financialYear: string;
  totalBudget: number;
  departmentAllocations: {
    department: Types.ObjectId;
    allocatedAmount: number;
  }[];
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
}

const BudgetSchema: Schema = new Schema({
  financialYear: { 
    type: String, 
    required: true 
  },
  totalBudget: { 
    type: Number, 
    required: true 
  },
  departmentAllocations: [{
    department: { 
      type: Schema.Types.ObjectId, 
      ref: 'Department', 
      required: true 
    },
    allocatedAmount: { 
      type: Number, 
      required: true 
    }
  }],
  status: { 
    type: String, 
    enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'], 
    default: 'DRAFT' 
  }
}, { timestamps: true });

export default mongoose.models.Budget || mongoose.model<IBudget>('Budget', BudgetSchema);
