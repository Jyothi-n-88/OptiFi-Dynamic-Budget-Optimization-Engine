import express from 'express';
import { getDepartments, createDepartment } from '../controllers/departmentController';

const router = express.Router();

router.route('/')
  .get(getDepartments)
  .post(createDepartment);

export default router;
