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

export function SimulatorHowItWorksModal() {
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
          <DialogTitle>How What-If Scenario Simulator Works</DialogTitle>
          <DialogDescription>
            A guide to testing plan changes without affecting the real schedule
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Overview Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🎯 Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                The What-If Scenario Simulator allows you to test different planning scenarios before making changes to your actual plan.
                You can simulate task delays and employee unavailability to see how they would affect the overall schedule.
              </p>
              <p className="text-sm text-muted-foreground">
                Completed tasks have nothing left to simulate, so they&apos;re left out entirely - they won&apos;t appear in the task dropdown and can&apos;t be picked as a delay candidate.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  ✓ Safe Testing
                </Badge>
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  ✓ No Real Changes
                </Badge>
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  ✓ Apply When Ready
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Delayed Tasks Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">⏱️ Delayed Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold text-sm mb-1">What It Does</p>
                <p className="text-sm text-muted-foreground">
                  Simulates delaying a specific task by a certain number of days. This helps you understand how one task delay impacts the entire schedule.
                </p>
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">How To Use</p>
                <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                  <li>Select a task from the dropdown</li>
                  <li>Enter the number of days to delay (e.g., 5 days)</li>
                  <li>Click &quot;Add Delay&quot; to add it to your simulation</li>
                  <li>You can add multiple task delays</li>
                </ol>
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">What Happens</p>
                <p className="text-sm text-muted-foreground">
                  The simulator recalculates the plan, pushing the delayed task and all dependent tasks forward by the specified number of days.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Blocked Employees Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🚫 Blocked Employees</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold text-sm mb-1">What It Does</p>
                <p className="text-sm text-muted-foreground">
                  Simulates making an employee unavailable for a specific date range. Useful for testing scenarios like unexpected leave, training, or other commitments.
                </p>
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">How To Use</p>
                <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                  <li>Select an employee from the dropdown</li>
                  <li>Choose a &quot;From&quot; date (start of unavailability)</li>
                  <li>Choose a &quot;To&quot; date (end of unavailability)</li>
                  <li>Click &quot;Add Block&quot; to add it to your simulation</li>
                  <li>You can block multiple employees for different periods</li>
                </ol>
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">What Happens</p>
                <p className="text-sm text-muted-foreground">
                  The simulator reassigns affected tasks to whichever matching employee can start soonest given the block - falling back to the least-loaded employee when more than one can start on the same day. If nobody else is free, the task waits until the block period ends.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Running Simulation Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">▶️ Running Simulation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold text-sm mb-1">Step 1: Configure Scenarios</p>
                <p className="text-sm text-muted-foreground">
                  Add your desired delays and employee blocks using the forms above. You can add multiple scenarios to test complex situations.
                </p>
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">Step 2: Run Simulation</p>
                <p className="text-sm text-muted-foreground">
                  Click the &quot;Run Simulation&quot; button. The system will recalculate the entire plan with your specified changes,
                  showing you a preview of how the schedule would look.
                </p>
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">Step 3: Review Results</p>
                <p className="text-sm text-muted-foreground">
                  The simulated plan appears in a blue-bordered card below. Compare it with your current plan to see:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-2">
                  <li>New start and end dates for affected tasks</li>
                  <li>Reassigned tasks (if employees were blocked)</li>
                  <li>Overdue status changes</li>
                  <li>Overall schedule impact</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Applying Changes Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">✅ Applying Changes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold text-sm mb-1">When To Apply</p>
                <p className="text-sm text-muted-foreground">
                  After reviewing the simulation results, if you&apos;re satisfied with the changes, click &quot;Apply Changes&quot;. A confirmation dialog asks you to confirm before anything is written - so a stray click can&apos;t overwrite the real plan.
                </p>
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">What Happens</p>
                <p className="text-sm text-muted-foreground">
                  Once confirmed, the simulated plan replaces your current plan in the database. This action:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-2">
                  <li>Saves exactly the dates and assignments you previewed - nothing is recalculated again at apply time</li>
                  <li>Creates version history records for every task whose dates or assignee changed</li>
                  <li>Leaves already-completed tasks untouched, even if they were in the simulation</li>
                  <li>Converts any blocked employee date ranges into real leave records, so future plan generations keep honoring that unavailability</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-sm mb-1">Reset Option</p>
                <p className="text-sm text-muted-foreground">
                  Use the &quot;Reset&quot; button to clear all simulation scenarios and start over without affecting your real plan.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Key Points Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">💡 Key Points</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <div>
                    <p className="text-sm font-semibold">Safe Testing Environment</p>
                    <p className="text-xs text-muted-foreground">
                      Simulations don&apos;t modify your real plan until you explicitly apply changes.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <div>
                    <p className="text-sm font-semibold">Multiple Scenarios</p>
                    <p className="text-xs text-muted-foreground">
                      You can combine multiple delays and employee blocks in a single simulation.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <div>
                    <p className="text-sm font-semibold">Real-Time Preview</p>
                    <p className="text-xs text-muted-foreground">
                      See exactly how changes affect dates, assignments, and overdue status.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600 font-bold">⚠</span>
                  <div>
                    <p className="text-sm font-semibold">Apply Carefully</p>
                    <p className="text-xs text-muted-foreground">
                      Once applied, changes become permanent. Review thoroughly before applying.
                    </p>
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

