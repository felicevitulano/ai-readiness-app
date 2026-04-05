import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const assessments = await prisma.assessment.findMany({
    include: { company: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(assessments);
}

export async function POST(request: Request) {
  const body = await request.json();
  const assessment = await prisma.assessment.create({
    data: {
      companyId: body.companyId,
      activeSections: JSON.stringify(body.activeSections || []),
      status: "draft",
    },
    include: { company: true },
  });
  return NextResponse.json(assessment, { status: 201 });
}
