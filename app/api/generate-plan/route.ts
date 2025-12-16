import { NextResponse } from "next/server";
import { generatePlan, savePlanToDB, type PlanResult } from "@/lib/planningEngine";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  console.log("[PLANNER:BE] POST /api/generate-plan - Plan generation requested");
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json().catch(() => ({}));
    const { simulatedPlans, excludeCompleted } = body;

    let plans: PlanResult[];
    const excludeCompletedFlag = excludeCompleted === true;

    console.log("[PLANNER:BE] POST /api/generate-plan - Request parameters", {
      hasSimulatedPlans: !!(simulatedPlans && Array.isArray(simulatedPlans) && simulatedPlans.length > 0),
      simulatedPlansCount: simulatedPlans?.length || 0,
      excludeCompleted: excludeCompletedFlag,
    });

    // If simulated plans are provided, use them directly (from simulator)
    if (simulatedPlans && Array.isArray(simulatedPlans) && simulatedPlans.length > 0) {
      console.log("[PLANNER:BE] POST /api/generate-plan - Using simulated plans", {
        count: simulatedPlans.length,
      });
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
      console.log("[PLANNER:BE] POST /api/generate-plan - Generating new plan", {
        excludeCompleted: excludeCompletedFlag,
      });
      plans = await generatePlan(supabase, excludeCompletedFlag);
      console.log("[PLANNER:BE] POST /api/generate-plan - Plan generated", {
        planCount: plans.length,
      });
    }

    // Save to database
    console.log("[PLANNER:BE] POST /api/generate-plan - Saving plan to database", {
      planCount: plans.length,
      excludeCompleted: excludeCompletedFlag,
    });
    const success = await savePlanToDB(supabase, plans, excludeCompletedFlag);

    if (!success) {
      console.error("[PLANNER:BE] POST /api/generate-plan - Failed to save plan to database");
      return NextResponse.json(
        { success: false, error: "Failed to save plan to database" },
        { status: 500 }
      );
    }

    console.log("[PLANNER:BE] POST /api/generate-plan - Success", {
      planCount: plans.length,
    });
    return NextResponse.json({
      success: true,
      plan: plans,
    });
  } catch (error) {
    console.error("[PLANNER:BE] POST /api/generate-plan - Error generating plan", {
      error,
    });
    return NextResponse.json(
      { success: false, error: "Failed to generate plan" },
      { status: 500 }
    );
  }
}

