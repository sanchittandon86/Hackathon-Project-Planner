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
                  For each task, finds employees with matching skills, selects the least-loaded employee for fairness, and skips weekends and leave days.
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
                  Replaces the old schedule with the new one and saves to the database.
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
                  Before saving new plans, compares them with existing plans. If a task's dates changed or it was reassigned, creates a version record showing old dates, new dates, and the difference in days (delta).
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
                  All changes from a single "Generate Plan" click are grouped together with a timestamp for easy review.
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

