import { NextResponse } from 'next/server';
import { getPackageStats } from '@/lib/db';

export async function GET() {
    try {
        const stats = await getPackageStats();
        return NextResponse.json(stats);
    } catch (error) {
        console.error('Error fetching package stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
