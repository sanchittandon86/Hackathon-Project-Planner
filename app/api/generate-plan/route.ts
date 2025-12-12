import { NextResponse } from "next/server";
import { generatePlan, savePlanToDB, type PlanResult } from "@/lib/planningEngine";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { simulatedPlans } = body;

    let plans: PlanResult[];

    // If simulated plans are provided, use them directly (from simulator)
    if (simulatedPlans && Array.isArray(simulatedPlans) && simulatedPlans.length > 0) {
      // Convert simulated plans to PlanResult format
      plans = simulatedPlans.map((sp: any) => ({
        task_id: sp.task_id,
        employee_id: sp.employee_id,
        start_date: sp.start_date,
        end_date: sp.end_date,
        total_hours: sp.total_hours,
        is_overdue: sp.is_overdue || false,
        days_overdue: sp.days_overdue || 0,
      }));
    } else {
      // Otherwise, generate a new plan
      plans = await generatePlan();
    }

    // Save to database
    const success = await savePlanToDB(plans);

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Failed to save plan to database" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      plan: plans,
    });
  } catch (error) {
    console.error("Error generating plan:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate plan" },
      { status: 500 }
    );
  }
}

