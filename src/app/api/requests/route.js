import connectDB from "@/lib/db";
import Request from "@/models/Request";
import Project from "@/models/Project";
import Notification from "@/models/Notification";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function PUT(req) {
  try {
    await connectDB();
    const { requestId, status } = await req.json();

    const updatedRequest = await Request.findByIdAndUpdate(
        requestId, 
        { status }, 
        { new: true }
    ).populate('project').populate('applicant');

    if (!updatedRequest) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (status === 'accepted') {
        await Project.findByIdAndUpdate(updatedRequest.project._id, {
            $addToSet: { team: { user: updatedRequest.applicant._id, role: 'member' } }
        });
    }

    // Optional Notification Logic
    try {
        await Notification.create({
            recipient: updatedRequest.applicant._id,
            sender: updatedRequest.project.owner,
            type: status === 'accepted' ? "REQUEST_ACCEPTED" : "REQUEST_REJECTED",
            message: `Your request was ${status}`,
            relatedId: updatedRequest.project._id
        });
    } catch (e) {}

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}