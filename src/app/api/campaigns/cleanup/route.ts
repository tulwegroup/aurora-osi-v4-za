import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Cleanup orphaned campaigns and ensure user consistency
export async function POST() {
  try {
    console.log('Starting campaign cleanup...');
    
    // First, ensure demo user exists
    let demoUser = await db.user.findFirst({
      where: { email: 'demo-user@aurora-osi.com' }
    });
    
    if (!demoUser) {
      demoUser = await db.user.create({
        data: {
          email: 'demo-user@aurora-osi.com',
          name: 'Demo User',
          role: 'explorer'
        }
      });
      console.log('Created demo user for cleanup:', demoUser.id);
    }
    
    // Find all campaigns
    const campaigns = await db.campaign.findMany();
    console.log(`Found ${campaigns.length} campaigns to check`);
    
    // Update any campaigns with invalid user references
    let updatedCount = 0;
    for (const campaign of campaigns) {
      const userExists = await db.user.findUnique({
        where: { id: campaign.createdBy }
      });
      
      if (!userExists) {
        await db.campaign.update({
          where: { id: campaign.id },
          data: { createdBy: demoUser.id }
        });
        updatedCount++;
        console.log(`Updated campaign ${campaign.id} to use demo user`);
      }
    }
    
    return NextResponse.json({ 
      message: 'Cleanup completed successfully',
      demoUserId: demoUser.id,
      campaignsChecked: campaigns.length,
      campaignsUpdated: updatedCount
    });
    
  } catch (error) {
    console.error('Error during cleanup:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup campaigns', details: error.message },
      { status: 500 }
    );
  }
}