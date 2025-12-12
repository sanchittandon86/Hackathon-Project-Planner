import { NextResponse } from "next/server";
import { generatePlan, savePlanToDB } from "@/lib/planningEngine";

export async function POST() {
  try {
    // Generate the plan
    const plans = await generatePlan();

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

