import connectDB from "@/lib/db";
import Request from "@/models/Request";
import Project from "@/models/Project";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await connectDB();
    const { userId } = await req.json();

    if (!userId) {
        return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // 1. Find all projects owned by this user
    const myProjects = await Project.find({ owner: userId }).select('_id');
    
    if (!myProjects || myProjects.length === 0) {
        return NextResponse.json({ requests: [] });
    }

    const projectIds = myProjects.map(p => p._id);

    // 2. Find pending requests for these projects
    const requests = await Request.find({
      project: { $in: projectIds },
      status: 'pending'
    })
    .populate('applicant', 'name email experienceLevel avatarUrl') // Get applicant details
    .populate('project', 'title') // Get project title
    .sort({ createdAt: -1 });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Inbox Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch inbox" }, { status: 500 });
  }
}