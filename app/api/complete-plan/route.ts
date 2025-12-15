import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { plan_id } = body;

    if (!plan_id) {
      return NextResponse.json(
        { success: false, error: "plan_id is required" },
        { status: 400 }
      );
    }

    // Update the plan to mark it as completed
    const { data, error } = await supabase
      .from("plans")
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq("id", plan_id)
      .select()
      .single();

    if (error) {
      console.error("Error marking plan as completed:", error);
      return NextResponse.json(
        { success: false, error: error.message || "Failed to mark plan as completed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      plan: data,
    });
  } catch (error: any) {
    console.error("Error in complete-plan API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to mark plan as completed" },
      { status: 500 }
    );
  }
}

