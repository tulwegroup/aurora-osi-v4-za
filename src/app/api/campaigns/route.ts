import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/campaigns - List all campaigns
export async function GET() {
  try {
    // Ensure we have a demo user
    let demoUser;
    try {
      demoUser = await db.user.findFirst({
        where: { email: 'demo-user@aurora-osi.com' }
      });
      
      if (!demoUser) {
        // Create demo user if it doesn't exist
        demoUser = await db.user.create({
          data: {
            email: 'demo-user@aurora-osi.com',
            name: 'Demo User',
            role: 'explorer'
          }
        });
        console.log('Created demo user for GET endpoint:', demoUser.id);
      }
    } catch (userError) {
      console.error('Demo user creation failed:', userError);
      return NextResponse.json(
        { error: 'Failed to initialize user system' },
        { status: 500 }
      );
    }

    const campaigns = await db.campaign.findMany({
      include: {
        _count: {
          select: {
            anomalies: true,
            predictions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ 
      campaigns,
      currentUser: {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        role: demoUser.role
      }
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// POST /api/campaigns - Create new campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      latitude,
      longitude,
      radiusKm,
      resourceType,
      geologyContext
    } = body;

    // Validate required fields
    if (!name || !latitude || !longitude || !radiusKm || !resourceType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get or create demo user in a transaction
    let userId;
    try {
      // First try to find existing demo user
      let demoUser = await db.user.findFirst({
        where: { email: 'demo-user@aurora-osi.com' }
      });
      
      if (!demoUser) {
        // Create demo user if it doesn't exist
        demoUser = await db.user.create({
          data: {
            email: 'demo-user@aurora-osi.com',
            name: 'Demo User',
            role: 'explorer'
          }
        });
        console.log('Created demo user for campaign creation:', demoUser.id);
      }
      
      userId = demoUser.id;
      
      // Verify the user exists before creating campaign
      const userExists = await db.user.findUnique({
        where: { id: userId }
      });
      
      if (!userExists) {
        throw new Error('Failed to create or retrieve user');
      }
      
    } catch (userError) {
      console.error('User creation/retrieval failed:', userError);
      return NextResponse.json(
        { error: 'Failed to authenticate user for campaign creation' },
        { status: 500 }
      );
    }

    // Create campaign with verified user ID
    const campaign = await db.campaign.create({
      data: {
        name,
        description,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radiusKm: parseFloat(radiusKm),
        resourceType,
        geologyContext,
        createdBy: userId,
        status: 'active'
      }
    });

    console.log('Successfully created campaign:', campaign.id, 'by user:', userId);
    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign', details: error.message },
      { status: 500 }
    );
  }
}