"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function HowItWorksModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <HelpCircle className="h-4 w-4 mr-2" />
          How It Works
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>How Smart Project Planner Works</DialogTitle>
          <DialogDescription>
            A quick guide to plan generation and version tracking
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Plan Generation Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📋 Plan Generation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold text-sm mb-1">Step 1: Gather Data</p>
                <p className="text-sm text-muted-foreground">
                  Collects all employees, tasks, and leave dates from your database.
                </p>
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">Step 2: Match & Assign</p>
                <p className="text-sm text-muted-foreground">
                  For each task, finds employees with matching skills and compares who can actually start soonest - accounting for leave days and simulator blocks - breaking ties by lowest workload for fairness. Weekends and leave days are always skipped.
                </p>
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">Step 3: Calculate Schedule</p>
                <p className="text-sm text-muted-foreground">
                  Allocates 8 hours per workday sequentially. Calculates start/end dates and checks if tasks finish after their due date (marks as overdue).
                </p>
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">Step 4: Save Plan</p>
                <p className="text-sm text-muted-foreground">
                  Replaces the old schedule with the new one and saves to the database. Completed tasks are always preserved as-is - never overwritten or rescheduled.
                </p>
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">Smart Regeneration</p>
                <p className="text-sm text-muted-foreground">
                  Re-running generation doesn&apos;t blindly redo every task. An already-scheduled task is only touched again if something that actually affects it changed - its effort/designation, or a leave newly added or removed within its dates (re-checked by replaying the day-by-day schedule, not just whether a leave happens to fall in range). Everything else stays exactly where it was.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Task Completion Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">✅ Completing Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold text-sm mb-1">Marking Complete</p>
                <p className="text-sm text-muted-foreground">
                  &quot;Mark Completed&quot; is only enabled once a task&apos;s start date has arrived. Once marked, the task is locked - it&apos;s excluded from the What-If Simulator and can no longer be edited, deleted, or rescheduled.
                </p>
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">Automatic QA Handoff</p>
                <p className="text-sm text-muted-foreground">
                  Completing a task that required a Developer automatically creates a follow-up task for QA review, cloning the same client, title, effort, and due date with designation set to QA - no manual re-entry needed.
                </p>
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">No QA In Org Yet</p>
                <p className="text-sm text-muted-foreground">
                  If there&apos;s no active QA employee yet, the follow-up task is still created so the handoff isn&apos;t lost - it just waits unscheduled until a QA employee is added, and you&apos;ll see a distinct &quot;No QA in org&quot; warning instead of the normal success message.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Version History Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📊 Version History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold text-sm mb-1">Purpose</p>
                <p className="text-sm text-muted-foreground">
                  Tracks what changed between plan generations, showing delays, reassignments, and date shifts.
                </p>
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">How It Works</p>
                <p className="text-sm text-muted-foreground">
                  Before saving new plans, compares them with existing plans. If a task&apos;s dates changed or it was reassigned, creates a version record showing old dates, new dates, and the difference in days (delta).
                </p>
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">What Gets Tracked</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    ✅ Date changes
                  </Badge>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    ✅ Reassignments
                  </Badge>
                  <Badge variant="outline" className="text-gray-500 border-gray-500">
                    ❌ New tasks (first time)
                  </Badge>
                  <Badge variant="outline" className="text-gray-500 border-gray-500">
                    ❌ Unchanged tasks
                  </Badge>
                </div>
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">Generation Grouping</p>
                <p className="text-sm text-muted-foreground">
                  All changes from a single &quot;Generate Plan&quot; click are grouped together with a timestamp for easy review.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Flow Diagram */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🔄 Versioning Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg font-mono text-xs space-y-2">
                <div className="text-center font-semibold mb-3">Old Plans ──compare──&gt; New Plans</div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Same task + same employee + dates changed → Version created</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Task reassigned (different employee) → Version created</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">✗</span>
                    <span>New task (no old record) → No version</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">✗</span>
                    <span>No changes → No version</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t">
                  <div className="text-center">
                    <div>Version Record Contains:</div>
                    <div className="text-muted-foreground mt-1">
                      Old dates • New dates • Delta days • Generation ID
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Reference */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📝 Quick Reference</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold text-sm mb-2">Delta Days Meaning:</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">+5 days</Badge>
                    <span className="text-sm">Task delayed by 5 days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-600 text-xs">-3 days</Badge>
                    <span className="text-sm">Task finished 3 days earlier</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">0 days</Badge>
                    <span className="text-sm">No change in end date</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

