import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IExpense extends Document {
  date: Date;
  department: Types.ObjectId;
  category: string;
  amount: number;
  description?: string;
}

const ExpenseSchema: Schema = new Schema({
  date: { 
    type: Date, 
    default: Date.now 
  },
  department: { 
    type: Schema.Types.ObjectId, 
    ref: 'Department', 
    required: true 
  },
  category: { 
    type: String, 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  description: { 
    type: String 
  }
}, { timestamps: true });

export default mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);
