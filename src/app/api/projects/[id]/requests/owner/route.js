import connectDB from "@/lib/db";
import Request from "@/models/Request";
import Project from "@/models/Project";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await connectDB();
    const { userId } = await req.json();

    // 1. Find all projects owned by this user
    const myProjects = await Project.find({ owner: userId }).select('_id');
    const projectIds = myProjects.map(p => p._id);

    // 2. Find pending requests for these projects
    const requests = await Request.find({
      project: { $in: projectIds },
      status: 'pending'
    })
    .populate('applicant', 'name email experienceLevel avatarUrl')
    .populate('project', 'title')
    .sort({ createdAt: -1 });

    return NextResponse.json({ requests });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch inbox" }, { status: 500 });
  }
}