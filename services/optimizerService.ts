export const calculateOptimalBudget = (
  departments: any[], 
  expenses: any[], 
  activeBudget: any, 
  scenarioOverrides?: { totalBudget?: number, priorityOverrides?: Record<string, string> }
) => {
  const now = new Date();
  
  // 1. Determine baseline total budget
  const totalBudget = (scenarioOverrides?.totalBudget !== undefined && scenarioOverrides?.totalBudget !== null)
    ? Number(scenarioOverrides.totalBudget)
    : (activeBudget?.totalBudget || 0);

  // 2. Map current allocations from the active budget
  const currentAllocationMap: Record<string, number> = {};
  if (activeBudget && activeBudget.departmentAllocations) {
    activeBudget.departmentAllocations.forEach((alloc: any) => {
      let deptId = alloc.department;
      // Handle populated vs unpopulated
      if (typeof alloc.department === 'object' && alloc.department._id) {
        deptId = alloc.department._id.toString();
      } else {
        deptId = alloc.department.toString();
      }
      currentAllocationMap[deptId] = alloc.allocatedAmount || 0;
    });
  }

  const PRIORITY_FACTORS: Record<string, number> = { 'HIGH': 1.5, 'MEDIUM': 1.0, 'LOW': 0.7 };

  // 3. Process departments to calculate composite weights
  const processedDepts = departments.map(dept => {
    const deptId = dept._id.toString();
    const deptExpenses = expenses.filter(e => {
      const eDeptId = typeof e.department === 'object' ? e.department._id.toString() : e.department?.toString();
      return eDeptId === deptId;
    });

    let totalSpend = 0;
    let earliestDate = now;

    deptExpenses.forEach(exp => {
      totalSpend += (exp.amount || 0);
      const expDate = new Date(exp.date);
      if (expDate < earliestDate) earliestDate = expDate;
    });

    // Historical Utilization
    const historicalBudget = currentAllocationMap[deptId] || 0;
    const historicalUtilization = historicalBudget > 0 ? (totalSpend / historicalBudget) * 100 : 0;

    // Quarterly Forecast (Run-rate * 3)
    const diffDays = Math.ceil(Math.abs(now.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24));
    const months = Math.max(diffDays / 30, 1);
    const currentRunRate = totalSpend / months;
    const quarterlyForecast = currentRunRate * 3;

    // Composite Weight Calculation
    const overridePriority = scenarioOverrides?.priorityOverrides?.[deptId];
    const effectivePriority = overridePriority && overridePriority !== 'NO CHANGE' ? overridePriority : (dept.priority || 'MEDIUM');
    const priorityFactor = PRIORITY_FACTORS[effectivePriority] || 1.0;
    
    const performanceScore = dept.performanceScore ?? 50;
    const performanceFactor = 0.5 + (performanceScore / 200); // 0 to 100 normalizes to 0.5 to 1.0
    
    // Fallback if no forecast history
    const forecastDemandWeight = quarterlyForecast > 0 ? quarterlyForecast : 10000; 

    const baseWeight = priorityFactor * performanceFactor * forecastDemandWeight;

    return {
      id: deptId,
      name: dept.name,
      currentAllocation: historicalBudget,
      minBudget: dept.minimumBudget || 0,
      maxBudget: dept.maximumBudget || 0,
      weight: baseWeight,
      factors: {
        priority: dept.priority || 'MEDIUM',
        performanceScore,
        historicalUtilization,
        quarterlyForecast
      }
    };
  });

  // 4. Constrained Allocation Algorithm
  const recommendedAllocations: Record<string, number> = {};
  const totalMin = processedDepts.reduce((sum, d) => sum + d.minBudget, 0);
  const distributablePool = totalBudget - totalMin;

  if (distributablePool <= 0) {
    // Edge Case: If available budget is less than sum of minimums, strictly scale down
    processedDepts.forEach(d => {
      recommendedAllocations[d.id] = totalMin > 0 ? totalBudget * (d.minBudget / totalMin) : (totalBudget / processedDepts.length);
    });
  } else {
    // Normal Case: Grant minimums, distribute the rest proportionally to weights
    processedDepts.forEach(d => recommendedAllocations[d.id] = d.minBudget);
    
    let unallocated = distributablePool;
    let eligibleDepts = [...processedDepts];

    // Iterative clamping to enforce Maximum Budgets
    let iteration = 0;
    while (unallocated > 0.01 && eligibleDepts.length > 0 && iteration < 100) {
      iteration++;
      const totalWeight = eligibleDepts.reduce((sum, d) => sum + d.weight, 0);
      if (totalWeight === 0) break;

      let nextUnallocated = 0;
      const nextEligible = [];

      for (const d of eligibleDepts) {
        const share = unallocated * (d.weight / totalWeight);
        const proposed = recommendedAllocations[d.id] + share;
        
        if (d.maxBudget > 0 && proposed > d.maxBudget) {
          nextUnallocated += (proposed - d.maxBudget);
          recommendedAllocations[d.id] = d.maxBudget; // Clamp to max
        } else {
          recommendedAllocations[d.id] = proposed;
          nextEligible.push(d); // Keep in eligible pool for redistributed overflow
        }
      }
      unallocated = nextUnallocated;
      eligibleDepts = nextEligible;
    }
  }

  // 5. Format returning variance data
  return processedDepts.map(d => {
    const recommended = Math.round(recommendedAllocations[d.id] || 0);
    const difference = recommended - d.currentAllocation;
    const percentChange = d.currentAllocation > 0 ? (difference / d.currentAllocation) * 100 : (recommended > 0 ? 100 : 0);

    return {
      departmentId: d.id,
      departmentName: d.name,
      currentAllocation: d.currentAllocation,
      recommendedAllocation: recommended,
      difference,
      percentChange,
      factors: d.factors
    };
  });
};
