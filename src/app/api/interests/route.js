import { NextResponse } from 'next/server';

export async function GET() {
  const interests = [
    'Programming',
    'Cyber Security',
    'AI/ Machine Learning',
    'Information Technology',
    'Robotics',
    'Computer Science',
    'Electronics',
    'Embedded Software',
    'History of Software',
    'Human Computer Interaction',
    'Frontend Development',
    'Backend Development'
  ];
  
  return NextResponse.json(interests);
}
