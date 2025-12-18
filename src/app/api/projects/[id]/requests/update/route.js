import connectDB from "@/lib/db";
import Request from "@/models/Request";
import Notification from "@/models/Notification";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function PUT(req) {
  try {
    await connectDB();
    const { requestId, status } = await req.json(); // status = 'accepted' or 'rejected'

    if (!requestId || !status) {
        return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // 1. Update the Request Status
    const updatedRequest = await Request.findByIdAndUpdate(
        requestId, 
        { status }, 
        { new: true }
    ).populate('project').populate('applicant');

    if (!updatedRequest) {
        return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // 2. Add user to Project Team if accepted
    if (status === 'accepted') {
        const Project = require("@/models/Project").default;
        await Project.findByIdAndUpdate(updatedRequest.project._id, {
            $addToSet: { team: { user: updatedRequest.applicant._id, role: 'member' } }
        });
    }

    // 3. Send Notification
    await Notification.create({
        recipient: updatedRequest.applicant._id,
        sender: updatedRequest.project.owner,
        type: status === 'accepted' ? "REQUEST_ACCEPTED" : "REQUEST_REJECTED",
        message: status === 'accepted' 
            ? `You have been accepted to join "${updatedRequest.project.title}"!`
            : `Your request for "${updatedRequest.project.title}" was declined.`,
        relatedId: updatedRequest.project._id
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}