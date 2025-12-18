import connectDB from "@/lib/db";
import Request from "@/models/Request";
import Project from "@/models/Project";
import Notification from "@/models/Notification"; // Optional: if you use notifications
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// ✅ GET: Fetch pending requests (Fixes the crash)
export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    if (!id) return NextResponse.json({ error: "Project ID missing" }, { status: 400 });

    const requests = await Request.find({ project: id, status: 'pending' })
        .populate('applicant', 'name email experienceLevel avatarUrl')
        .sort({ createdAt: -1 });

    // Always return a valid JSON object, even if array is empty
    return NextResponse.json({ requests: requests || [] });
  } catch (error) {
    console.error("API GET Error:", error);
    return NextResponse.json({ error: "Server Error", details: error.message }, { status: 500 });
  }
}

// ✅ POST: Handle Join Request
export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id: projectId } = await params;
    const body = await req.json();
    const { userId } = body;

    if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

    // Check if request already exists
    const existing = await Request.findOne({ project: projectId, applicant: userId });
    if (existing) return NextResponse.json({ error: "Request already sent" }, { status: 400 });

    const newRequest = await Request.create({
      project: projectId,
      applicant: userId,
      status: 'pending'
    });

    // Notify Owner (Optional)
    try {
        const project = await Project.findById(projectId).populate('owner');
        if (project?.owner) {
            await Notification.create({
                recipient: project.owner._id,
                sender: userId,
                type: "JOIN_REQUEST",
                message: `New applicant for "${project.title}"`,
                relatedId: projectId
            });
        }
    } catch (e) { console.error("Notification failed", e); }

    return NextResponse.json({ message: "Request sent", request: newRequest });
  } catch (error) {
    console.error("API POST Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}